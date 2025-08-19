import mongoose from 'mongoose';

const moduleSchema = new mongoose.Schema({
  subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  order: { type: Number, required: true },
  title: { type: String, required: true },
  seedTopic: { type: String, required: true },
  content: { type: mongoose.Schema.Types.Mixed }, // generated lesson JSON
  quizId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz' }
}, { timestamps: true });

export default mongoose.model('Module', moduleSchema);
