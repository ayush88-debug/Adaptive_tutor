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
    // Using Promise.all to run seed operations in parallel for efficiency
    await Promise.all([
        seedCppSubject(),
        seedOopSubject()
    ]);

    const allSubjects = await Subject.find().populate('modules');
    return res.status(201).json(new apiResponse(201, { subjects: allSubjects }, "Seed completed successfully"));
});

// Helper function to seed the C++ subject
async function seedCppSubject() {
    const existing = await Subject.findOne({ key: "cpp" });
    if (existing) {
        console.log("C++ subject already exists. Skipping.");
        return;
    }

    const subject = await Subject.create({ key: "cpp", title: "C++ Programming", modules: [] });
    const moduleData = [
        { order: 1, title: "Intro to C++", seedTopic: "History & setup, structure of a C++ program", subjectId: subject._id },
        { order: 2, title: "Variables & Types", seedTopic: "Primitive types, variables, constants in C++", subjectId: subject._id },
        { order: 3, title: "Control Flow", seedTopic: "if/else, loops, switch statements in C++", subjectId: subject._id },
        { order: 4, title: "Functions", seedTopic: "Function declaration, parameters, return values in C++", subjectId: subject._id },
        { order: 5, title: "Pointers", seedTopic: "Pointers, references, and basics of memory management in C++", subjectId: subject._id },
    ];
    const createdModules = await Module.insertMany(moduleData);
    subject.modules = createdModules.map(m => m._id);
    await subject.save();
    console.log("C++ subject seeded successfully.");
}

// Helper function to seed the OOP subject
async function seedOopSubject() {
    const existing = await Subject.findOne({ key: "oop" });
    if (existing) {
        console.log("OOP subject already exists. Skipping.");
        return;
    }

    const subject = await Subject.create({ key: "oop", title: "Object-Oriented Programming", modules: [] });
    const moduleData = [
        { order: 1, title: "Core OOP Concepts", seedTopic: "Introduction to Encapsulation, Abstraction, Inheritance, and Polymorphism", subjectId: subject._id },
        { order: 2, title: "Classes and Objects", seedTopic: "Defining classes, creating objects, constructors, and destructors", subjectId: subject._id },
        { order: 3, title: "Inheritance", seedTopic: "Types of inheritance, base and derived classes, access control", subjectId: subject._id },
        { order: 4, title: "Polymorphism", seedTopic: "Function overloading, virtual functions, and runtime polymorphism", subjectId: subject._id },
    ];
    const createdModules = await Module.insertMany(moduleData);
    subject.modules = createdModules.map(m => m._id);
    await subject.save();
    console.log("OOP subject seeded successfully.");
}


export { getSubjects, getSubjectById, seedSubjects };