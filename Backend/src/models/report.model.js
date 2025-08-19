import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  generatedContent: { type: mongoose.Schema.Types.Mixed }, // The JSON report from the LLM
  generatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.model('Report', reportSchema);