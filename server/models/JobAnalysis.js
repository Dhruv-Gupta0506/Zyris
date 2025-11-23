const mongoose = require("mongoose");

const JobAnalysisSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    jobTitle: { type: String },
    jobDescription: { type: String, required: true },

    // Match Scoring
    matchScore: { type: Number, min: 0, max: 100 },

    fitVerdict: { type: String }, // Yes / Maybe / No

    // Structured insights
    strengthsBasedOnJD: [String],
    missingSkills: [String],
    recommendedKeywords: [String],
    tailoredBulletSuggestions: [String],
    improvementTips: [String],

    // Cross-analysis metadata
    comparedResumeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ResumeAnalysis",
    },

    // raw AI dump for debugging
    rawText: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("JobAnalysis", JobAnalysisSchema);
