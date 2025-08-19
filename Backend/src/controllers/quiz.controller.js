// Backend/src/controllers/quiz.controller.js
import Quiz from "../models/quiz.model.js";
import Module from "../models/module.model.js";
import Attempt from "../models/attempt.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { apiResponse } from "../utils/apiResponse.js";
import { apiError } from "../utils/apiError.js";
import * as llmService from "../services/llm.service.js";

/**
 * POST /api/v1/quizzes/:moduleId/submit
 * Body: { answers: [{ questionId, chosenIndex }, ...] }
 */
const submitQuiz = asyncHandler(async (req, res) => {
  const { moduleId } = req.params;
  const userId = req.user._id;
  const { answers } = req.body;

  // Basic validation
  if (!Array.isArray(answers)) {
    throw new apiError(400, "answers must be an array");
  }

  const module = await Module.findById(moduleId);
  if (!module) throw new apiError(404, "Module not found");

  const quiz = await Quiz.findById(module.quizId);
  if (!quiz) throw new apiError(404, "Quiz not found for this module");

  // grade
  let correctCount = 0;
  const answerRecords = answers.map(a => {
    const q = quiz.questions.id(a.questionId); // mongoose subdocument lookup
    const correct = q ? (q.correctIndex === a.chosenIndex) : false;
    if (correct) correctCount++;
    return {
      questionId: a.questionId,
      chosenIndex: a.chosenIndex,
      correct
    };
  });

  const totalQuestions = quiz.questions.length || answerRecords.length || 10;
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

  // If failed -> generate remedial lesson + new quiz and attach to module
  let remedial = null;
  if (!passed) {
    remedial = await llmService.generateRemedialLesson(quiz, attempt);
    module.content = remedial;
    await module.save();

    const newQuizPayload = await llmService.generateQuizFromLesson(remedial, module._id);
    const newQuiz = await Quiz.create({ moduleId: module._id, questions: newQuizPayload.questions });
    module.quizId = newQuiz._id;
    await module.save();
  }

  return res.status(201).json(new apiResponse(201, { attempt, score, passed, remedialAvailable: !passed }, "Attempt recorded"));
});

export { submitQuiz };
