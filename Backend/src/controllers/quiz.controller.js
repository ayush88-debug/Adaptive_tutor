import Quiz from "../models/quiz.model.js";
import Module from "../models/module.model.js";
import Attempt from "../models/attempt.model.js";
import StudentProgress from '../models/studentProgress.model.js';
import Subject from '../models/subject.model.js';
import { asyncHandler } from "../utils/asyncHandler.js";
import { apiResponse } from "../utils/apiResponse.js";
import { apiError } from "../utils/apiError.js";
import * as llmService from "../services/llm.service.js";

const submitQuiz = asyncHandler(async (req, res) => {
  const { moduleId } = req.params;
  const userId = req.user._id;
  const { answers } = req.body; 

  const module = await Module.findById(moduleId);
  if (!module) throw new apiError(404, "Module not found");

  const progress = await StudentProgress.findOne({ userId, subjectId: module.subjectId });
  if (!progress) throw new apiError(400, "Student is not enrolled in this subject.");

  const override = progress.moduleOverrides.find(o => o.moduleId.toString() === moduleId);
  const quizId = override ? override.quizId : module.quizId;

  const quiz = await Quiz.findById(quizId);
  if (!quiz) throw new apiError(404, "Quiz not found");

  let correctMcqCount = 0;
  const mcqQuestions = quiz.questions.filter(q => q.type === 'mcq');
  const totalMcqCount = mcqQuestions.length;

  const answerRecords = answers.map(a => {
    const q = quiz.questions.id(a.questionId);
    if (!q) return null; 

    if (q.type === 'mcq') {
      const chosenIndexNum = parseInt(a.chosenIndex);
      const correct = q.correctIndex === chosenIndexNum;
      if (correct) correctMcqCount++;
      return { 
        questionId: a.questionId, 
        chosenIndex: chosenIndexNum, 
        correct: correct 
      };
    } else if (q.type === 'coding') {
      
      return { 
        questionId: a.questionId, 
        submittedCode: a.submittedCode, 
        correct: false 
      };
    }
    return null;
  }).filter(Boolean); 

  
  const score = totalMcqCount > 0 ? Math.round((correctMcqCount / totalMcqCount) * 100) : 100; 
  
  
  
  const passed = score >= 90;

  const newAttempt = await Attempt.create({ 
    userId, 
    moduleId, 
    quizId, 
    answers: answerRecords, 
    score, 
    passed 
  });

  
  
  if (passed) {
    progress.completedModules.addToSet(moduleId);
    progress.moduleOverrides = progress.moduleOverrides.filter(o => o.moduleId.toString() !== moduleId);
  } else {
    console.log("Quiz failed. Generating personalized remedial content...");
    const remedialLesson = await llmService.generateRemedialLesson(quiz, newAttempt, module.title);
    const newQuizData = await llmService.generateQuizFromLesson(remedialLesson);
    const newQuiz = await Quiz.create({ moduleId, questions: newQuizData.questions });

    const newOverride = {
        moduleId,
        content: remedialLesson,
        quizId: newQuiz._id,
    };
    
    const overrideIndex = progress.moduleOverrides.findIndex(o => o.moduleId.toString() === moduleId);
    if (overrideIndex > -1) {
        progress.moduleOverrides[overrideIndex] = newOverride;
    } else {
        progress.moduleOverrides.push(newOverride);
    }
  }
  
  await progress.save();
  
  return res.status(201).json(new apiResponse(201, { score, passed, remedialAvailable: !passed, attempt: newAttempt }, "Attempt recorded and progress updated"));
});

export { submitQuiz };