const mongoose = require('mongoose');

const QuestionSchema = new mongoose.Schema({
  type: { type: String, enum: ['mcq', 'tf', 'numeric'], required: true },
  question: { type: String, required: true },
  options: [String], // for MCQ
  answer: { type: mongoose.Schema.Types.Mixed, required: true },
});

const QuizSchema = new mongoose.Schema({
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  title: { type: String, required: true },
  questions: [QuestionSchema],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  dueDate: { type: Date },
  questionTime: { type: Number, default: 30 }, // seconds per question
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Quiz', QuizSchema);
