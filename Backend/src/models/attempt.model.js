import mongoose from 'mongoose';

const answerSchema = new mongoose.Schema({
  questionId: { 
    type: mongoose.Schema.Types.ObjectId,
    required: true 
  },
  chosenIndex: Number,
  submittedCode: String,
  correct: Boolean,
}, { _id: false });

const attemptSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  moduleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Module', required: true },
  quizId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true },
  answers: [answerSchema],
  score: Number, 
  passed: Boolean
}, { timestamps: true });

export default mongoose.model('Attempt', attemptSchema);
