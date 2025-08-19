import { Router } from "express";
import verifyJWT from "../middlewares/auth.middleware.js";
import { getAttemptsByUser, getAttemptsByModule } from "../controllers/attempt.controller.js";

const router = Router();

router.get("/user/:userId", verifyJWT, getAttemptsByUser);
router.get("/module/:moduleId", verifyJWT, getAttemptsByModule);

export default router;
