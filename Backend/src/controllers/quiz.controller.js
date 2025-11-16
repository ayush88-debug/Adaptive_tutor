import Quiz from "../models/quiz.model.js";
import Module from "../models/module.model.js";
import Attempt from "../models/attempt.model.js";
import StudentProgress from '../models/studentProgress.model.js';
import Subject from '../models/subject.model.js';
import { asyncHandler } from "../utils/asyncHandler.js";
import { apiResponse } from "../utils/apiResponse.js";
import { apiError } from "../utils/apiError.js";
import * as llmService from "../services/llm.service.js";
import { runCode } from "../services/code.service.js"; // Import the new service

const submitQuiz = asyncHandler(async (req, res) => {
  const { moduleId } = req.params;
  const userId = req.user._id;
  const { answers } = req.body; 

  // **UPDATED:** Populate subjectId and key immediately
  const module = await Module.findById(moduleId).populate('subjectId', 'key');
  if (!module) throw new apiError(404, "Module not found");
  
  const languageKey = module.subjectId.key || 'cpp'; // Get language key

  const progress = await StudentProgress.findOne({ userId, subjectId: module.subjectId });
  if (!progress) throw new apiError(400, "Student is not enrolled in this subject.");

  const override = progress.moduleOverrides.find(o => o.moduleId.toString() === moduleId);
  const quizId = override ? override.quizId : module.quizId;

  const quiz = await Quiz.findById(quizId);
  if (!quiz) throw new apiError(404, "Quiz not found");

  let totalScore = 0;
  const answerRecords = [];

  // Use a for...of loop to handle async operations sequentially
  for (const answer of answers) {
    const q = quiz.questions.id(answer.questionId);
    if (!q) continue;

    let questionScore = 0;
    let isCorrect = false;
    let testCaseResults = [];
    let generatedHint = null;

    if (q.type === 'mcq') {
      const chosenIndexNum = answer.chosenIndex !== null ? parseInt(answer.chosenIndex) : null;
      isCorrect = (q.correctIndex === chosenIndexNum);
      if (isCorrect) {
        questionScore = 10;
        totalScore += 10;
      }
      answerRecords.push({ 
        questionId: q._id, 
        chosenIndex: chosenIndexNum, 
        correct: isCorrect,
        score: questionScore
      });

    } else if (q.type === 'coding') {
      let passedCases = 0;
      let firstFailedCase = null;

      for (const tc of q.testCases) {
        const executionResult = await runCode(q.language, answer.submittedCode, tc.input);
        const actualOutput = (executionResult.output || "").trim();
        const expectedOutput = (tc.expectedOutput || "").trim();
        const passed = actualOutput === expectedOutput && executionResult.status.id === 3; // 3 = "Accepted"

        if (passed) {
          passedCases++;
        } else if (!firstFailedCase) {
          // Store the first failed case to generate a hint
          firstFailedCase = {
            input: tc.input,
            expectedOutput: expectedOutput,
            actualOutput: actualOutput
          };
        }
        testCaseResults.push({
          passed: passed,
          input: tc.input,
          expectedOutput: expectedOutput,
          actualOutput: actualOutput
        });
      }

      if (q.testCases.length > 0) {
        questionScore = Math.round((passedCases / q.testCases.length) * 10);
      } else {
        questionScore = 10; // Default to full marks if no test cases? (or 0)
      }
      
      isCorrect = (passedCases === q.testCases.length);
      totalScore += questionScore;

      if (!isCorrect && firstFailedCase) {
        // If they failed, get an AI hint
        generatedHint = await llmService.generateCodingHint(
          q.problemStatement,
          answer.submittedCode,
          firstFailedCase,
          q.language
        );
      }

      answerRecords.push({
        questionId: q._id, 
        submittedCode: answer.submittedCode,
        correct: isCorrect,
        score: questionScore,
        testCaseResults: testCaseResults,
        generatedHint: generatedHint
      });
    }
  }

  // Final score out of 100
  const finalScore = (totalScore / (quiz.questions.length * 10)) * 100;
  const passed = finalScore >= 90;

  const newAttempt = await Attempt.create({ 
    userId, 
    moduleId, 
    quizId, 
    answers: answerRecords, 
    score: finalScore, 
    passed 
  });

  
  
  if (passed) {
    progress.completedModules.addToSet(moduleId);
    progress.moduleOverrides = progress.moduleOverrides.filter(o => o.moduleId.toString() !== moduleId);
  } else {
    console.log("Quiz failed. Generating personalized remedial content...");
    // **UPDATED:** Pass languageKey to remedial generators
    const remedialLesson = await llmService.generateRemedialLesson(quiz, newAttempt, module.title, languageKey);
    const newQuizData = await llmService.generateQuizFromLesson(remedialLesson, languageKey);
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
  
  return res.status(201).json(new apiResponse(201, { score: finalScore, passed, remedialAvailable: !passed, attempt: newAttempt }, "Attempt recorded and progress updated"));
});

export { submitQuiz };