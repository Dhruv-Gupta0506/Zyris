const mongoose = require("mongoose");

const ResumeAnalysisSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    fileName: { type: String, required: true },

    targetRole: { type: String, default: null },

    // Core ATS scoring
    atsScore: { type: Number, min: 0, max: 100 },

    // Detailed scoring breakdown
    scoringBreakdown: {
      keywordMatch: Number,
      actionVerbs: Number,
      quantifiedResults: Number,
      formattingClarity: Number,
      relevanceAlignment: Number,
    },

    // Structured insights
    skills: [String],
    strengths: [String],
    weaknesses: [String],
    missingKeywords: [String],
    suggestedRoles: [String],

    // Rewrite engines
    summaryRewrite: String,
    projectRewrites: [String],
    bulletRewrites: [String],

    // Recruiter impression
    recruiterImpression: String,

    // Improvements list
    improvementChecklist: [String],

    // Raw AI dump for debugging
    rawText: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ResumeAnalysis", ResumeAnalysisSchema);
