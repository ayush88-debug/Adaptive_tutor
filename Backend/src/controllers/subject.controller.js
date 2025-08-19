import Subject from "../models/subject.model.js";
import Module from "../models/module.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { apiResponse } from "../utils/apiResponse.js";
import { apiError } from "../utils/apiError.js";

/**
 * GET /api/v1/subjects
 */
const getSubjects = asyncHandler(async (req, res) => {
  const subjects = await Subject.find().populate({
    path: "modules",
    select: "title order seedTopic"
  }).sort({ createdAt: 1 });

  return res.status(200).json(new apiResponse(200, { subjects }, "Subjects retrieved"));
});

/**
 * GET /api/v1/subjects/:id
 */
const getSubjectById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const subject = await Subject.findById(id).populate({
    path: "modules",
    options: { sort: { order: 1 } }
  });

  if (!subject) {
    throw new apiError(404, "Subject not found");
  }

  return res.status(200).json(new apiResponse(200, { subject }, "Subject retrieved"));
});

/**
 * POST /api/v1/subjects/seed
 * Seed sample subjects & modules for C++ and OOP. Run once.
 */
const seedSubjects = asyncHandler(async (req, res) => {
  // Delete existing seeded data? For safety we just create if not exists.
  const existing = await Subject.findOne({ key: "cpp" });
  if (existing) {
    return res.status(200).json(new apiResponse(200, { subject: existing }, "Seed already exists"));
  }

  // Define roadmap (simple MVP)
  const cppModules = [
    { order: 1, title: "Intro to C++", seedTopic: "History & setup, structure of a C++ program" },
    { order: 2, title: "Variables & Types", seedTopic: "Primitive types, variables, constants" },
    { order: 3, title: "Control Flow", seedTopic: "if/else, loops, switch" },
    { order: 4, title: "Functions", seedTopic: "Function declaration, parameters, return" },
    { order: 5, title: "Pointers", seedTopic: "Pointers, references, basics of memory" },
    { order: 6, title: "OOP Basics", seedTopic: "Classes, objects, encapsulation" }
  ];

  // Create Modules and Subject
  const createdModules = [];
  for (const m of cppModules) {
    const modDoc = await Module.create({
      subjectId: null, // temporary; we'll update after subject created
      order: m.order,
      title: m.title,
      seedTopic: m.seedTopic
    });
    createdModules.push(modDoc);
  }

  const cppSubject = await Subject.create({
    key: "cpp",
    title: "C++ Programming",
    modules: createdModules.map(m => m._id)
  });

  // update subjectId on each module
  await Module.updateMany({ _id: { $in: createdModules.map(m => m._id) } }, { subjectId: cppSubject._id });

  return res.status(201).json(new apiResponse(201, { subject: cppSubject }, "Seed created"));
});

export { getSubjects, getSubjectById, seedSubjects };
