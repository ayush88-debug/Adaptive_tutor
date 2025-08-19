import { Router } from "express";
import verifyJWT from "../middlewares/auth.middleware.js";
import { enrollInSubject, getStudentProgress } from "../controllers/progress.controller.js";

const router = Router();

router.use(verifyJWT); // Apply authentication to all routes in this file

router.post("/enroll/:subjectId", enrollInSubject);
router.get("/subject/:subjectId", getStudentProgress);

export default router;