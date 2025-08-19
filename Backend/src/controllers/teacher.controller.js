import User from "../models/users.model.js";
import Attempt from "../models/attempt.model.js";
import StudentProgress from "../models/studentProgress.model.js";
import Subject from "../models/subject.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { apiResponse } from "../utils/apiResponse.js";
import mongoose from "mongoose";

const getStudentsProgress = asyncHandler(async (req, res) => {
  const students = await User.find({ role: "student" }).select("_id username email").lean();

  const studentSummaries = await Promise.all(students.map(async (student) => {
    // Find all subjects this student is enrolled in
    const enrollments = await StudentProgress.find({ userId: student._id }).populate('subjectId', 'title modules').lean();

    const progressBySubject = await Promise.all(enrollments.map(async (enrollment) => {
      if (!enrollment.subjectId) return null;

      const subjectModuleIds = enrollment.subjectId.modules.map(id => id.toString());
      
      // Get all attempts for this student ONLY for modules in the current subject
      const subjectAttempts = await Attempt.find({
        userId: student._id,
        moduleId: { $in: subjectModuleIds }
      }).lean();

      const attemptsCount = subjectAttempts.length;
      const avgScore = attemptsCount > 0 
        ? Math.round(subjectAttempts.reduce((sum, a) => sum + a.score, 0) / attemptsCount) 
        : 0;
      
      return {
        subjectId: enrollment.subjectId._id,
        subjectTitle: enrollment.subjectId.title,
        passedModulesCount: enrollment.completedModules.length,
        totalModulesCount: subjectModuleIds.length,
        attemptsCount,
        avgScore
      };
    }));

    return {
      student,
      progress: progressBySubject.filter(p => p !== null) // Filter out any null results
    };
  }));

  return res.status(200).json(new apiResponse(200, { students: studentSummaries }, "Student progress retrieved"));
});

export { getStudentsProgress };