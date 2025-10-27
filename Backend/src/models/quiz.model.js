import mongoose from 'mongoose';

const testCaseSchema = new mongoose.Schema({
  input: { type: String, default: '' },
  expectedOutput: { type: String, required: true }
}, { _id: false });

const questionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['mcq', 'coding'],
    default: 'mcq',
    required: true
  },
  text: String,
  options: {
    type: [String],
    required: function() { return this.type === 'mcq'; }
  },
  correctIndex: {
    type: Number,
    required: function() { return this.type === 'mcq'; }
  },
  explanation: String,

  // --- Fields specifically for Coding ---
  problemStatement: {
    type: String,
    required: function() { return this.type === 'coding'; }
  },
  starterCode: {
    type: String,
    default: ''
  },
  language: {
    type: String,
    enum: ['cpp', 'java', 'python'],
    required: function() { return this.type === 'coding'; }
  },
  testCases: {
    type: [testCaseSchema],
    default: undefined,
    required: function() { return this.type === 'coding'; }
  }
}, { _id: true });

const quizSchema = new mongoose.Schema({
  moduleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Module', required: true },
  questions: [questionSchema]
}, { timestamps: true });

export default mongoose.model('Quiz', quizSchema);
