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
// ... other functions (getSubjects, getSubjectById) remain the same ...

/**
 * POST /api/v1/subjects/seed
 * Seed sample subjects & modules for C++ and OOP. Run once.
 */
const seedSubjects = asyncHandler(async (req, res) => {
  // Check if seed data already exists to prevent duplicates
  const existing = await Subject.findOne({ key: "cpp" });
  if (existing) {
    return res.status(200).json(new apiResponse(200, { subject: existing }, "Seed data already exists"));
  }

  // 1. Create the Subject first
  const cppSubject = await Subject.create({
    key: "cpp",
    title: "C++ Programming",
    modules: [] // Start with an empty array
  });

  // 2. Define the modules with the new subjectId
  const cppModuleData = [
    { order: 1, title: "Intro to C++", seedTopic: "History & setup, structure of a C++ program", subjectId: cppSubject._id },
    { order: 2, title: "Variables & Types", seedTopic: "Primitive types, variables, constants", subjectId: cppSubject._id },
    { order: 3, title: "Control Flow", seedTopic: "if/else, loops, switch", subjectId: cppSubject._id },
    { order: 4, title: "Functions", seedTopic: "Function declaration, parameters, return", subjectId: cppSubject._id },
    { order: 5, title: "Pointers", seedTopic: "Pointers, references, basics of memory", subjectId: cppSubject._id },
    { order: 6, title: "OOP Basics", seedTopic: "Classes, objects, encapsulation", subjectId: cppSubject._id }
  ];

  // 3. Create all modules at once
  const createdModules = await Module.insertMany(cppModuleData);

  // 4. Update the subject with the newly created module IDs
  cppSubject.modules = createdModules.map(m => m._id);
  await cppSubject.save();

  const finalSubject = await Subject.findById(cppSubject._id).populate('modules');

  return res.status(201).json(new apiResponse(201, { subject: finalSubject }, "Seed created successfully"));
});

export { getSubjects, getSubjectById, seedSubjects };
