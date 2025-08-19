import mongoose from 'mongoose';

const subjectSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true }, // e.g. 'cpp', 'oop'
  title: { type: String, required: true },
  modules: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Module' }]
}, { timestamps: true });

export default mongoose.model('Subject', subjectSchema);
