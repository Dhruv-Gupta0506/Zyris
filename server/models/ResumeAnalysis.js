const mongoose = require("mongoose");

const ResumeAnalysisSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  fileName: { type: String, required: true },
  analysisText: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("ResumeAnalysis", ResumeAnalysisSchema);
