import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
  text: String,
  options: [String],
  correctIndex: Number,
  explanation: String
}, { _id: true });

const quizSchema = new mongoose.Schema({
  moduleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Module', required: true },
  questions: [questionSchema]
}, { timestamps: true });

export default mongoose.model('Quiz', quizSchema);
