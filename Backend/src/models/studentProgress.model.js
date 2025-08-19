import mongoose from 'mongoose';

const moduleOverrideSchema = new mongoose.Schema({
  moduleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Module', required: true },
  content: { type: mongoose.Schema.Types.Mixed, required: true }, // Personalized lesson
  quizId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true }, // Personalized quiz
}, { _id: false });

const studentProgressSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  
  // Tracks which modules have been successfully completed
  completedModules: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Module' }],
  
  // Stores personalized, remedial content for a student if they fail a module
  moduleOverrides: [moduleOverrideSchema],

}, { timestamps: true });

// Ensure a student can only have one progress document per subject
studentProgressSchema.index({ userId: 1, subjectId: 1 }, { unique: true });

export default mongoose.model('StudentProgress', studentProgressSchema);