// models/TailoredResume.js
const mongoose = require("mongoose");

const SectionSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    content: { type: String, default: null },
  },
  { _id: false }
);

const TailoredResumeSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    resumeId: { type: mongoose.Schema.Types.ObjectId, ref: "ResumeAnalysis", required: true },
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: "JobAnalysis", required: true },

    headline: { type: String, default: null },
    skillsOrdered: { type: [String], default: [] },
    experienceSections: { type: [SectionSchema], default: [] },
    projectSections: { type: [SectionSchema], default: [] },
    educationAndExtras: { type: [SectionSchema], default: [] },

    fullText: { type: String, default: null },

    scoreBoostSuggestions: { type: [String], default: [] },
    rawText: { type: String, default: null },
  },
  { timestamps: true }
);

TailoredResumeSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model("TailoredResume", TailoredResumeSchema);
