const { GoogleGenerativeAI } = require("@google/generative-ai");
const JobAnalysis = require("../models/JobAnalysis");
const ResumeAnalysis = require("../models/ResumeAnalysis");

// ---- helper to parse JSON safely ----
function parseGeminiJson(text) {
  if (!text) return null;

  try {
    const trimmed = text.trim();
    if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
      return JSON.parse(trimmed);
    }
    const match = trimmed.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    return null;
  } catch (err) {
    console.error("JD JSON PARSE ERROR:", err.message);
    return null;
  }
}

// ===============================
// ANALYZE JD (Portfolio Killer Level)
// ===============================
exports.analyzeJob = async (req, res) => {
  try {
    const { jobTitle, jobDescription } = req.body;

    if (!jobDescription || jobDescription.trim().length < 20) {
      return res.status(400).json({
        message: "Job description is too short or missing",
      });
    }

    // ✅ get latest resume analysis for the user
    const latestResume = await ResumeAnalysis.findOne({ user: req.user })
      .sort({ createdAt: -1 });

    if (!latestResume) {
      return res.status(400).json({
        message: "No resume analysis found. Analyze resume first.",
      });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      generationConfig: { temperature: 0.15 },
    });

    // 🔥 OPTION-C PROMPT
    const prompt = `
You are an ATS match engine and senior recruiter.
Compare this JOB DESCRIPTION against this CANDIDATE RESUME ANALYSIS.

RETURN ONLY VALID JSON with this EXACT structure:

{
  "matchScore": number,
  "fitVerdict": "Yes" | "Maybe" | "No",
  "strengthsBasedOnJD": [ "point1", "point2", ... ],
  "missingSkills": [ "skill1", "skill2", ... ],
  "recommendedKeywords": [ "keyword1", "keyword2", ... ],
  "tailoredBulletSuggestions": [ "bullet1", "bullet2", ... ],
  "improvementTips": [ "tip1", "tip2", ... ]
}

Evaluation rules:
- matchScore must reflect real alignment, not generic keywords
- reward relevance, domain fit, demonstrated experience
- penalize missing core competencies
- bullet rewrites must be copy-paste ready
- missing skills must be realistic, not random
- recommended keywords must be ATS-optimized
- verdict must be honest, not encouraging

JOB TITLE:
${jobTitle || "Not specified"}

JOB DESCRIPTION:
${jobDescription}

CANDIDATE RESUME DATA:
${JSON.stringify(latestResume, null, 2)}
`.trim();

    const result = await model.generateContent([{ text: prompt }]);

    const rawText = result.response.text();
    const parsed = parseGeminiJson(rawText) || {};

    // ✅ save structured record
    const saved = await JobAnalysis.create({
      user: req.user,
      jobTitle,
      jobDescription,
      matchScore: parsed.matchScore ?? null,
      fitVerdict: parsed.fitVerdict ?? null,
      strengthsBasedOnJD: parsed.strengthsBasedOnJD ?? [],
      missingSkills: parsed.missingSkills ?? [],
      recommendedKeywords: parsed.recommendedKeywords ?? [],
      tailoredBulletSuggestions: parsed.tailoredBulletSuggestions ?? [],
      improvementTips: parsed.improvementTips ?? [],
      comparedResumeId: latestResume._id,
      rawText,
    });

    return res.json({
      success: true,
      analysis: saved,
    });

  } catch (err) {
    console.error("JD ANALYSIS ERROR:", err);
    return res.status(500).json({
      success: false,
      message: "Job analysis failed",
      error: err.message,
    });
  }
};

// ===============================
// HISTORY
// ===============================
exports.history = async (req, res) => {
  try {
    const records = await JobAnalysis.find({ user: req.user })
      .sort({ createdAt: -1 })
      .select("-rawText -__v")
      .lean();

    return res.json({
      success: true,
      count: records.length,
      history: records,
    });

  } catch (err) {
    console.error("JD HISTORY ERROR:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to load JD history",
      error: err.message,
    });
  }
};
