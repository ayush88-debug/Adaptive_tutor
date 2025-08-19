import { Router } from "express";
import verifyJWT from "../middlewares/auth.middleware.js";
import { getStudentsProgress, getStudentDetails } from "../controllers/teacher.controller.js";
import requireRole from "../middlewares/role.middleware.js";

const router = Router();

router.get("/students-progress", verifyJWT, requireRole('teacher'), getStudentsProgress);

router.get("/student/:studentId", verifyJWT, requireRole('teacher'), getStudentDetails);

export default router;