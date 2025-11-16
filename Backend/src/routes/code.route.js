import { Router } from "express";
import verifyJWT from "../middlewares/auth.middleware.js";
import { executeCode } from "../controllers/code.controller.js";

const router = Router();

// Protected route
router.post("/execute", verifyJWT, executeCode);

export default router;