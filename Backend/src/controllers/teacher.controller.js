import User from "../models/users.model.js";
import Attempt from "../models/attempt.model.js";
import StudentProgress from "../models/studentProgress.model.js";
import Subject from "../models/subject.model.js";
import Module from "../models/module.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { apiResponse } from "../utils/apiResponse.js";
import { apiError } from "../utils/apiError.js";

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

const getStudentDetails = asyncHandler(async (req, res) => {
  const { studentId } = req.params;

  // 1. Fetch student's basic info
  const student = await User.findById(studentId).select("username email").lean();
  if (!student) {
    throw new apiError(404, "Student not found");
  }

  // 2. Fetch all subjects the student is enrolled in, with module details
  const enrollments = await StudentProgress.find({ userId: studentId })
    .populate({
      path: 'subjectId',
      select: 'title modules',
      populate: {
        path: 'modules',
        select: 'title order',
        options: { sort: { order: 1 } } // Ensure modules are sorted
      }
    })
    .select('subjectId completedModules')
    .lean();

  // 3. Fetch all quiz attempts for the student
  const attempts = await Attempt.find({ userId: studentId })
    .populate({
        path: 'moduleId',
        select: 'title subjectId',
        populate: {
            path: 'subjectId',
            select: 'title'
        }
    })
    .sort({ createdAt: -1 })
    .lean();
  
  // 4. Combine the data into a single payload
  const responseData = {
    student,
    enrollments,
    attempts
  };

  return res.status(200).json(new apiResponse(200, responseData, "Student details retrieved"));
});

const getClassAnalytics = asyncHandler(async (req, res) => {
    const totalStudents = await User.countDocuments({ role: 'student' });
    const totalSubjects = await Subject.countDocuments();
    const allAttempts = await Attempt.find().lean();
    const overallAverageScore = allAttempts.length > 0 ? Math.round(allAttempts.reduce((sum, a) => sum + a.score, 0) / allAttempts.length) : 0;
    
    const performanceDistribution = {
        mastery: allAttempts.filter(a => a.score >= 90).length,
        proficient: allAttempts.filter(a => a.score >= 70 && a.score < 90).length,
        needsImprovement: allAttempts.filter(a => a.score < 70).length,
    };

    const subjects = await Subject.find().populate('modules').lean();
    const subjectPerformance = await Promise.all(subjects.map(async (subject) => {
        const moduleIds = subject.modules.map(m => m._id);
        const attempts = await Attempt.find({ moduleId: { $in: moduleIds } }).lean();
        const totalAttempts = attempts.length;
        const averageScore = totalAttempts > 0 ? Math.round(attempts.reduce((sum, a) => sum + a.score, 0) / totalAttempts) : 0;
        const passRate = totalAttempts > 0 ? Math.round((attempts.filter(a => a.passed).length / totalAttempts) * 100) : 0;
        return {
            subjectId: subject._id,
            subjectTitle: subject.title,
            averageScore,
            passRate,
            totalAttempts,
        };
    }));

    const performanceOverTime = await Attempt.aggregate([
        {
            $group: {
                _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                averageScore: { $avg: "$score" }
            }
        },
        { $sort: { _id: 1 } },
        { $project: { _id: 0, date: "$_id", averageScore: { $round: ["$averageScore", 2] } } }
    ]);

    const analyticsData = {
        kpis: {
            totalStudents,
            totalSubjects,
            totalAttempts: allAttempts.length,
            overallAverageScore,
        },
        performanceDistribution,
        subjectPerformance,
        performanceOverTime
    };

    return res.status(200).json(new apiResponse(200, analyticsData, "Class analytics retrieved successfully"));
});

const getChallengingModules = asyncHandler(async (req, res) => {
    const { subjectId } = req.query;
    
    let moduleFilter = {};
    if (subjectId && mongoose.Types.ObjectId.isValid(subjectId)) {
        const modules = await Module.find({ subjectId: subjectId }).select('_id');
        const moduleIds = modules.map(m => m._id);
        moduleFilter = { moduleId: { $in: moduleIds } };
    }

    const challengingModules = await Attempt.aggregate([
        { $match: moduleFilter },
        { $group: { _id: "$moduleId", avgScore: { $avg: "$score" }, attempts: { $sum: 1 } } },
        { $sort: { avgScore: 1 } },
        { $limit: 5 },
        { $lookup: { from: 'modules', localField: '_id', foreignField: '_id', as: 'moduleDetails' } },
        { $unwind: "$moduleDetails" },
        { $project: { _id: 0, moduleId: "$_id", title: "$moduleDetails.title", averageScore: { $round: ["$avgScore", 2] }, totalAttempts: "$attempts" } }
    ]);
    
    return res.status(200).json(new apiResponse(200, { challengingModules }, "Challenging modules retrieved"));
});


export { getStudentsProgress, getStudentDetails, getClassAnalytics, getChallengingModules };