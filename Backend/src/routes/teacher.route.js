import { Router } from "express";
import verifyJWT from "../middlewares/auth.middleware.js";
import { getStudentsProgress } from "../controllers/teacher.controller.js";
import requireRole from "../middlewares/role.middleware.js";

const router = Router();

router.get("/students-progress", verifyJWT, requireRole('teacher'), getStudentsProgress);

export default router;
