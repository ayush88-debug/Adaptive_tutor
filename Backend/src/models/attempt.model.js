import mongoose from 'mongoose';

// New sub-schema for individual test case results
const testCaseResultSchema = new mongoose.Schema({
  passed: { type: Boolean, required: true },
  input: String,
  expectedOutput: String,
  actualOutput: String,
}, { _id: false });

const answerSchema = new mongoose.Schema({
  questionId: { 
    type: mongoose.Schema.Types.ObjectId,
    required: true 
  },
  // --- Field for MCQ answers ---
  chosenIndex: Number,
  // --- Field for Coding answers ---
  submittedCode: String,
  // --- Fields for Grading (Both types) ---
  correct: Boolean, // Final pass/fail for the question
  score: { type: Number, default: 0 }, // Score for this single question (0-10)
  testCaseResults: [testCaseResultSchema], // For coding questions
  generatedHint: String, // For failed coding questions
  
}, { _id: false });

const attemptSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  moduleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Module', required: true },
  quizId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true },
  answers: [answerSchema],
  score: Number, // This will now be the total score out of 100
  passed: Boolean
}, { timestamps: true });

export default mongoose.model('Attempt', attemptSchema);
