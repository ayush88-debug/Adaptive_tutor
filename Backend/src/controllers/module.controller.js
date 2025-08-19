import Module from "../models/module.model.js";
import Quiz from "../models/quiz.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { apiResponse } from "../utils/apiResponse.js";
import { apiError } from "../utils/apiError.js";
import * as llmService from "../services/llm.service.js";

/**
 * GET /api/v1/modules/:id
 * Returns module; if content not generated, call LLM stub to generate content + quiz
 */
const getModule = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const module = await Module.findById(id);
  if (!module) throw new apiError(404, "Module not found");

  if (!module.content) {
    // generate lesson
    const lesson = await llmService.generateLesson(module.seedTopic, { user: req.user });
    module.content = lesson;
    await module.save();

    // generate quiz
    const quiz = await llmService.generateQuizFromLesson(lesson, module._id);
    await Quiz.create({ moduleId: module._id, questions: quiz.questions }).then(q => {
      module.quizId = q._id;
      module.save();
    });
  }

  const populated = await Module.findById(id).populate("quizId");
  return res.status(200).json(new apiResponse(200, { module: populated }, "Module retrieved"));
});

export { getModule };
