const mongoose = require('mongoose');

const QuizSubmissionSchema = new mongoose.Schema({
  quizId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  answers: [{ questionIndex: Number, answer: mongoose.Schema.Types.Mixed }],
  score: { type: Number, required: true },
  submittedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('QuizSubmission', QuizSubmissionSchema);
