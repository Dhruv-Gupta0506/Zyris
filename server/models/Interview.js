const mongoose = require("mongoose");

const InterviewSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  role: { type: String, required: true },
  difficulty: { type: String, required: true },
  questionCount: { type: Number, required: true },

  // ✅ store questions as array
  questions: {
    type: [String],
    required: true
  },

  // ✅ store answers as array
  answers: {
    type: [String],
    required: true
  },

  evaluationText: { type: String, required: true },
  score: { type: Number, required: true },

  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Interview", InterviewSchema);
