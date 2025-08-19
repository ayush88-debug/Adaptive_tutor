import Quiz from "../models/quiz.model.js";
import Module from "../models/module.model.js";
import Attempt from "../models/attempt.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { apiResponse } from "../utils/apiResponse.js";
import { apiError } from "../utils/apiError.js";
import * as llmService from "../services/llm.service.js";


// ... imports ...

const submitQuiz = asyncHandler(async (req, res) => {
  const { moduleId } = req.params;
  const userId = req.user._id;
  const { answers } = req.body;

  if (!Array.isArray(answers)) {
    throw new apiError(400, "answers must be an array");
  }

  const module = await Module.findById(moduleId);
  if (!module) throw new apiError(404, "Module not found");

  const quiz = await Quiz.findById(module.quizId);
  if (!quiz) throw new apiError(404, "Quiz not found for this module");

  let correctCount = 0;
  const answerRecords = answers.map(a => {
    const q = quiz.questions.id(a.questionId);
    const correct = q ? (q.correctIndex === parseInt(a.chosenIndex)) : false;
    if (correct) correctCount++;
    return {
      questionId: a.questionId,
      chosenIndex: a.chosenIndex,
      correct
    };
  });

  const totalQuestions = quiz.questions.length;
  const score = Math.round((correctCount / totalQuestions) * 100);
  const passed = score >= 90;

  const attempt = await Attempt.create({
    userId,
    moduleId,
    quizId: quiz._id,
    answers: answerRecords,
    score,
    passed
  });

  if (!passed) {
    console.log("Quiz failed. Generating remedial lesson and new quiz...");
    
    // Pass the module.title to the service function
    const remedialLesson = await llmService.generateRemedialLesson(quiz, attempt, module.title);
    
    const newQuizData = await llmService.generateQuizFromLesson(remedialLesson, module._id);
    const newQuiz = await Quiz.create({
        moduleId: module._id,
        questions: newQuizData.questions,
    });

    module.content = remedialLesson;
    module.quizId = newQuiz._id;

    await module.save();
    console.log("Module updated with remedial content.");
  }

  return res.status(201).json(new apiResponse(201, { attempt, score, passed, remedialAvailable: !passed }, "Attempt recorded"));
});

export { submitQuiz };