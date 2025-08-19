import { Router } from "express";
import { getUser } from "../controllers/user.controller.js";
import verifyJWT from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/get-user", verifyJWT, getUser);

export default router;