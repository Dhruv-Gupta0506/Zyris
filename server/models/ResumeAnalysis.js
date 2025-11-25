// models/ResumeAnalysis.js
const mongoose = require("mongoose");

const ScoringBreakdownSchema = new mongoose.Schema(
  {
    keywordMatch: { type: Number, min: 30, max: 90, default: null },
    actionVerbs: { type: Number, min: 30, max: 90, default: null },
    quantifiedResults: { type: Number, min: 30, max: 90, default: null },
    formattingClarity: { type: Number, min: 30, max: 90, default: null },
    relevanceAlignment: { type: Number, min: 30, max: 90, default: null },
  },
  { _id: false }
);

const ResumeAnalysisSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    fileName: { type: String, required: true },
    targetRole: { type: String, default: null },

    // Core ATS scoring - enforce allowed band for persistence
    atsScore: {
      type: Number,
      min: 45,
      max: 80,
      default: null,
      validate: {
        validator: function (v) {
          // allow null, otherwise must be within 45-80
          return v === null || (typeof v === "number" && v >= 45 && v <= 80);
        },
        message: "atsScore must be null or between 45 and 80",
      },
    },

    scoringBreakdown: { type: ScoringBreakdownSchema, default: () => ({}) },

    // Structured insights (default to empty arrays)
    skills: { type: [String], default: [] },
    strengths: { type: [String], default: [] },
    weaknesses: { type: [String], default: [] },
    missingKeywords: { type: [String], default: [] },
    suggestedRoles: { type: [String], default: [] },

    // Rewrite engines
    summaryRewrite: { type: String, default: null },
    projectRewrites: { type: [String], default: [] },
    bulletRewrites: { type: [String], default: [] },

    // Recruiter impression
    recruiterImpression: { type: String, default: null },

    // Improvements list
    improvementChecklist: { type: [String], default: [] },

    // Raw AI dump for debugging
    rawText: { type: String, default: null },
  },
  { timestamps: true }
);

// Optional: add an index for faster history lookup
ResumeAnalysisSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model("ResumeAnalysis", ResumeAnalysisSchema);
