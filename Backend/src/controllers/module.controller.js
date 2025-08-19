import mongoose from "mongoose";
import Module from "../models/module.model.js";
import Quiz from "../models/quiz.model.js";
import StudentProgress from '../models/studentProgress.model.js';
import { asyncHandler } from "../utils/asyncHandler.js";
import { apiResponse } from "../utils/apiResponse.js";
import { apiError } from "../utils/apiError.js";
import * as llmService from "../services/llm.service.js";

const getModuleForStudent = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user._id;

    const module = await Module.findById(id).populate('subjectId', 'title');
    if (!module) {
        throw new apiError(404, "Module not found. Please ensure you are using a valid ID.");
    }

    const progress = await StudentProgress.findOne({ userId, subjectId: module.subjectId._id });
    if (!progress) {
        throw new apiError(400, "Student must be enrolled in the subject to access modules.");
    }

    // --- NEW: Check if the module is already completed by the user ---
    const isCompleted = progress.completedModules.some(moduleId => moduleId.toString() === id);

    const override = progress.moduleOverrides.find(o => o.moduleId.toString() === id);
    if (override) {
        console.log(`Serving personalized remedial content for module ${id} to user ${userId}`);
        const quiz = await Quiz.findById(override.quizId);
        const personalizedModule = { 
            ...module.toObject(), 
            content: override.content, 
            quizId: quiz,
            isCompleted // --- NEW: Add completion status
        };
        return res.status(200).json(new apiResponse(200, { module: personalizedModule }, "Remedial module content retrieved"));
    }

    if (!module.content || Object.keys(module.content).length === 0 || !module.quizId) {
        console.log(`Master content for module ${id} is missing. Generating it now...`);
        
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            const lesson = await llmService.generateLesson(module.seedTopic);
            const quizData = await llmService.generateQuizFromLesson(lesson);
            const newQuiz = await Quiz.create([{ moduleId: module._id, questions: quizData.questions }], { session });

            module.content = lesson;
            module.quizId = newQuiz[0]._id;
            
            await module.save({ session });
            await session.commitTransaction();
            console.log("Master content generated and saved successfully.");
        } catch (error) {
            await session.abortTransaction();
            console.error("Error during master content generation:", error);
            throw new apiError(500, "Failed to generate module content. Please try again.");
        } finally {
            session.endSession();
        }
    }
    
    console.log(`Serving standard content for module ${id} to user ${userId}`);
    const populatedModule = await Module.findById(id).populate("quizId").populate("subjectId", "title");
    
    // --- NEW: Add the isCompleted flag to the final module object ---
    const finalModuleData = {
        ...populatedModule.toObject(),
        isCompleted
    };

    return res.status(200).json(new apiResponse(200, { module: finalModuleData }, "Standard module content retrieved"));
});

export { getModuleForStudent as getModule };