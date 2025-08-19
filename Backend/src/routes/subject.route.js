import { Router } from "express";
import verifyJWT from "../middlewares/auth.middleware.js";
import { getSubjects, getSubjectById, seedSubjects } from "../controllers/subject.controller.js";

const router = Router();

router.get("/", verifyJWT, getSubjects);
router.get("/:id", verifyJWT, getSubjectById);

// seed endpoint, run once to create roadmap; protect in production
router.post("/seed", seedSubjects);

export default router;
