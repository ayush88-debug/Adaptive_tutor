import { Router } from "express";
import verifyJWT from "../middlewares/auth.middleware.js";
import { getModule } from "../controllers/module.controller.js";

const router = Router();

router.get("/:id", verifyJWT, getModule);

export default router;
