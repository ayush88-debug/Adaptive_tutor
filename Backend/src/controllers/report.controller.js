import Report from '../models/report.model.js';
import Attempt from '../models/attempt.model.js';
import Subject from '../models/subject.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { apiResponse } from '../utils/apiResponse.js';
import { apiError } from '../utils/apiError.js';
import * as llmService from '../services/llm.service.js';
import mongoose from 'mongoose';

/**
 * POST /api/v1/reports/generate
 * Body: { userId, subjectId }
 * Generates and saves a performance report for a student for a specific subject.
 */
const generateStudentReport = asyncHandler(async (req, res) => {
    const { userId, subjectId } = req.body;

    if (!userId || !subjectId) {
        throw new apiError(400, "User ID and Subject ID are required.");
    }

    // Find all modules for the given subject
    const subject = await Subject.findById(subjectId).select('modules');
    if (!subject) {
        throw new apiError(404, "Subject not found");
    }
    const moduleIds = subject.modules;

    // Fetch all attempts by the user for the modules in this subject
    const attempts = await Attempt.find({
        userId: new mongoose.Types.ObjectId(userId),
        moduleId: { $in: moduleIds }
    }).populate('moduleId', 'title');

    if (attempts.length === 0) {
        throw new apiError(404, "No attempts found for this student in this subject. Cannot generate report.");
    }

    // Call the LLM service to generate the report content
    const reportContent = await llmService.generateReport(req.user, attempts);

    // Save the new report to the database
    const newReport = await Report.create({
        userId,
        subjectId,
        generatedContent: reportContent
    });

    return res.status(201).json(new apiResponse(201, { report: newReport }, "Report generated successfully"));
});

/**
 * GET /api/v1/reports/user/:userId
 * Fetches all reports for a specific user.
 */
const getReportsByUser = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const reports = await Report.find({ userId }).populate('subjectId', 'title').sort({ createdAt: -1 });

    return res.status(200).json(new apiResponse(200, { reports }, "Reports retrieved successfully"));
});


export { generateStudentReport, getReportsByUser };