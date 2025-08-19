import { Router } from "express";
import verifyJWT from "../middlewares/auth.middleware.js";
import requireRole from "../middlewares/role.middleware.js";
import { generateStudentReport, getReportsByUser } from "../controllers/report.controller.js";

const router = Router();

// A teacher can generate a report for any student
router.post("/generate", verifyJWT, requireRole('teacher'), generateStudentReport);

// A teacher or the student themselves can view reports
router.get("/user/:userId", verifyJWT, getReportsByUser);

export default router;