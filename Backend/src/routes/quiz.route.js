import { Router } from "express";
import verifyJWT from "../middlewares/auth.middleware.js";
import { submitQuiz } from "../controllers/quiz.controller.js";

const router = Router();

router.post("/:moduleId/submit", verifyJWT, submitQuiz);

export default router;
