import Module from "../models/module.model.js";
import Quiz from "../models/quiz.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { apiResponse } from "../utils/apiResponse.js";
import { apiError } from "../utils/apiError.js";
import * as llmService from "../services/llm.service.js";

/**
 * GET /api/v1/modules/:id
 * Returns module; if content not generated, call LLM to generate content + quiz
 */
const getModule = asyncHandler(async (req, res) => {
  const { id } = req.params;

  let module = await Module.findById(id);
  if (!module) {
    throw new apiError(404, "Module not found");
  }

  // A more robust check to see if content needs to be generated.
  const isContentMissing = !module.content || (Array.isArray(module.content) && module.content.length === 0);

  if (isContentMissing) {
    console.log("Content is missing. Generating new lesson and quiz...");
    
    // 1. Generate lesson
    const lesson = await llmService.generateLesson(module.seedTopic, { user: req.user });
    
    // 2. Generate quiz from the new lesson
    // --- THIS LINE IS CORRECTED ---
    const quizData = await llmService.generateQuizFromLesson(lesson, module._id); 
    const newQuiz = await Quiz.create({
        moduleId: module._id,
        questions: quizData.questions
    });

    // 3. Assign the new content AND the new quizId to the module
    module.content = lesson;
    module.quizId = newQuiz._id;
    
    // 4. Save the module ONCE with all updates
    await module.save();
    console.log("Module updated with new content and quiz.");
  }

  // 5. Fetch the fully populated module to send in the response
  const populatedModule = await Module.findById(id).populate("quizId");
  
  return res.status(200).json(new apiResponse(200, { module: populatedModule }, "Module retrieved successfully"));
});

export { getModule };