import { Router } from "express";
import verifyJWT from "../middlewares/auth.middleware.js";
import { getStudentsProgress, getStudentDetails, getClassAnalytics, getChallengingModules } from "../controllers/teacher.controller.js";
import requireRole from "../middlewares/role.middleware.js";

const router = Router();

router.get("/students-progress", verifyJWT, requireRole('teacher'), getStudentsProgress);

router.get("/student/:studentId", verifyJWT, requireRole('teacher'), getStudentDetails);

router.get("/class-analytics", verifyJWT, requireRole('teacher'), getClassAnalytics);
router.get("/analytics/challenging-modules", verifyJWT, requireRole('teacher'), getChallengingModules);

export default router;