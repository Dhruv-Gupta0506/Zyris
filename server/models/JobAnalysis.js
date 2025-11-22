const mongoose = require("mongoose");

const JobAnalysisSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  jobTitle: { type: String },
  jobDescription: { type: String, required: true },
  analysisText: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("JobAnalysis", JobAnalysisSchema);
