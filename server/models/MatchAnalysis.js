// models/MatchAnalysis.js
const mongoose = require("mongoose");

const CompetencySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    resumeLevel: { type: Number, min: 0, max: 10, default: null }, // 0–10
    jdLevel: { type: Number, min: 0, max: 10, default: null },     // 0–10
    gap: { type: Number, min: -10, max: 10, default: null },       // jdLevel - resumeLevel
  },
  { _id: false }
);

const MatchAnalysisSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    resumeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ResumeAnalysis",
      required: true,
    },
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "JobAnalysis",
      required: true,
    },

    overallScore: { type: Number, min: 0, max: 100, default: null },
    hiringProbability: { type: Number, min: 0, max: 100, default: null },

    roleCategory: { type: String, default: null },

    // FAANG-style structured outputs
    competencies: { type: [CompetencySchema], default: [] },

    strengths: { type: [String], default: [] },
    weaknesses: { type: [String], default: [] },

    matchingSkills: { type: [String], default: [] },
    missingSkills: { type: [String], default: [] },

    recruiterObjections: { type: [String], default: [] },
    recruiterStrengths: { type: [String], default: [] },

    scoreBoostEstimate: { type: String, default: null },
    verdict: { type: String, default: null }, // "Strong Fit", "Competitive", "Weak Fit", ...

    // friendly metadata for UI
    jobTitle: { type: String, default: null },
    resumeFileName: { type: String, default: null },
    targetRole: { type: String, default: null },

    // raw AI dump for debugging
    rawText: { type: String, default: null },
  },
  { timestamps: true }
);

// Index for quick lookups / history
MatchAnalysisSchema.index({ user: 1, createdAt: -1 });
MatchAnalysisSchema.index({ resumeId: 1, jobId: 1 });

module.exports = mongoose.model("MatchAnalysis", MatchAnalysisSchema);
