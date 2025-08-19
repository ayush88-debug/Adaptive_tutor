import StudentProgress from '../models/studentProgress.model.js';
import Subject from '../models/subject.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { apiResponse } from '../utils/apiResponse.js';
import { apiError } from '../utils/apiError.js';

/**
 * POST /api/v1/progress/enroll/:subjectId
 * Enrolls a student in a subject, creating their progress document.
 */
const enrollInSubject = asyncHandler(async (req, res) => {
    const { subjectId } = req.params;
    const userId = req.user._id;

    const subject = await Subject.findById(subjectId);
    if (!subject) {
        throw new apiError(404, "Subject not found");
    }

    // Check if progress already exists
    let progress = await StudentProgress.findOne({ userId, subjectId });

    if (!progress) {
        progress = await StudentProgress.create({
            userId,
            subjectId,
            completedModules: [],
            moduleOverrides: [],
        });
    }

    return res.status(201).json(new apiResponse(201, { progress }, "Student enrolled successfully"));
});

/**
 * GET /api/v1/progress/subject/:subjectId
 * Gets a student's progress for a specific subject.
 */
const getStudentProgress = asyncHandler(async (req, res) => {
    const { subjectId } = req.params;
    const userId = req.user._id;

    const progress = await StudentProgress.findOne({ userId, subjectId }).populate('completedModules', 'title order');
    
    if (!progress) {
        throw new apiError(404, "Student has not started this subject yet.");
    }

    return res.status(200).json(new apiResponse(200, { progress }, "Progress retrieved successfully"));
});

export { enrollInSubject, getStudentProgress };