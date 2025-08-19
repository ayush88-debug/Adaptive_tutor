// Backend/src/controllers/teacher.controller.js
import User from "../models/users.model.js";
import Attempt from "../models/attempt.model.js";
import Module from "../models/module.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { apiResponse } from "../utils/apiResponse.js";

/**
 * GET /api/v1/admin/students-progress
 * Returns each student with simple progress summary:
 *   - avgScore, passedModulesCount, attemptsCount, lastAttemptAt
 */
const getStudentsProgress = asyncHandler(async (req, res) => {
  // only teacher/admin should call this route — assume verifyJWT + role-check middleware
  const students = await User.find({ role: "student" }).select("_id username email createdAt");

  const summaries = await Promise.all(students.map(async (s) => {
    const attempts = await Attempt.find({ userId: s._id });
    const attemptsCount = attempts.length;
    const avgScore = attemptsCount ? Math.round(attempts.reduce((sum,a) => sum + (a.score||0), 0) / attemptsCount) : 0;
    const passedModulesCount = await Attempt.countDocuments({ userId: s._id, passed: true });
    const lastAttemptAt = attempts.length ? attempts[0].createdAt : null;

    return {
      student: { _id: s._id, username: s.username, email: s.email, createdAt: s.createdAt },
      attemptsCount,
      avgScore,
      passedModulesCount,
      lastAttemptAt
    };
  }));

  return res.status(200).json(new apiResponse(200, { students: summaries }, "Student progress retrieved"));
});

export { getStudentsProgress };
