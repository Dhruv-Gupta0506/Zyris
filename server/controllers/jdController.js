const { GoogleGenerativeAI } = require("@google/generative-ai");
const JobAnalysis = require("../models/JobAnalysis");
const ResumeAnalysis = require("../models/ResumeAnalysis");

// ---- helper to parse JSON safely ----
function parseGeminiJson(text) {
  if (!text) return null;
  try {
    const trimmed = text.trim();

    // Raw JSON
    if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
      return JSON.parse(trimmed);
    }

    // Extract first JSON object block
    const match = trimmed.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);

    return null;
  } catch (err) {
    console.error("JD JSON PARSE ERROR:", err.message);
    return null;
  }
}

// ===============================
// ANALYZE JD – ULTRA FINAL VERSION
// ===============================
exports.analyzeJob = async (req, res) => {
  try {
    const { jobTitle, jobDescription } = req.body;

    if (!jobDescription || jobDescription.trim().length < 20) {
      return res.status(400).json({
        message: "Job description is too short or missing",
      });
    }

    // Get latest resume analysis for this user
    const latestResume = await ResumeAnalysis.findOne({ user: req.user }).sort({ createdAt: -1 });

    if (!latestResume) {
      return res.status(400).json({
        message: "No resume analysis found. Analyze resume first.",
      });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      generationConfig: { temperature: 0.1 },
    });

    // VERSION 2 – ULTIMATE FAANG-GRADE JD ANALYSIS PROMPT
    const prompt = `
You are an elite ATS system, FAANG hiring manager, and senior recruiter.
Analyze the JOB DESCRIPTION and evaluate the candidate using the resume analysis.

Return ONLY valid JSON. No explanations. No commentary.

STRICT JSON FORMAT (DO NOT BREAK):

{
  "matchScore": number,
  "fitVerdict": "Yes" | "Maybe" | "No",

  "scoreBreakdown": {
    "technicalSkills": number,
    "fundamentalsAndDSA": number,
    "projectRelevance": number,
    "softwareEngineeringPractices": number,
    "atsKeywordMatch": number
  },

  "explicitRequirements": [ "text" ],
  "implicitRequirements": [ "text" ],

  "strengthsBasedOnJD": [ "text" ],
  "missingSkills": [ "text" ],
  "recommendedKeywords": [ "text" ],

  "tailoredBulletSuggestions": [ "text" ],

  "improvementTips": [ "text" ]
}

SCORING RULES:
- technicalSkills: match of required tech stack.
- fundamentalsAndDSA: DSA, OOP, system design, complexity analysis.
- projectRelevance: depth, complexity, real-world engineering.
- softwareEngineeringPractices: testing, CI/CD, architecture, clean code.
- atsKeywordMatch: coverage of required & related keywords.

GUIDELINES:
- Extract explicit (written) requirements AND implicit (unstated but expected) requirements.
- Identify gaps: fundamentals, coding strength, system design, academic expectations.
- Improvements must be measurable and actionable.
- Bullet rewrites must be short, powerful, and resume-ready.
- No generic filler content.

JOB TITLE:
${jobTitle || "Not specified"}

JOB DESCRIPTION:
${jobDescription}

CANDIDATE RESUME DATA:
${JSON.stringify(latestResume, null, 2)}
`;

    const result = await model.generateContent([{ text: prompt }]);

    const rawText = result.response.text();
    const parsed = parseGeminiJson(rawText) || {};

    // Normalize parsed output to expected schema shapes
    const safeParsed = {
      matchScore: typeof parsed.matchScore === "number" ? parsed.matchScore : null,
      fitVerdict: parsed.fitVerdict || null,
      scoreBreakdown: parsed.scoreBreakdown || {
        technicalSkills: null,
        fundamentalsAndDSA: null,
        projectRelevance: null,
        softwareEngineeringPractices: null,
        atsKeywordMatch: null,
      },
      explicitRequirements: Array.isArray(parsed.explicitRequirements) ? parsed.explicitRequirements : [],
      implicitRequirements: Array.isArray(parsed.implicitRequirements) ? parsed.implicitRequirements : [],
      strengthsBasedOnJD: Array.isArray(parsed.strengthsBasedOnJD) ? parsed.strengthsBasedOnJD : [],
      missingSkills: Array.isArray(parsed.missingSkills) ? parsed.missingSkills : [],
      recommendedKeywords: Array.isArray(parsed.recommendedKeywords) ? parsed.recommendedKeywords : [],
      tailoredBulletSuggestions: Array.isArray(parsed.tailoredBulletSuggestions) ? parsed.tailoredBulletSuggestions : [],
      improvementTips: Array.isArray(parsed.improvementTips) ? parsed.improvementTips : [],
    };

    // Save to DB
    const saved = await JobAnalysis.create({
      user: req.user,
      jobTitle,
      jobDescription,

      matchScore: safeParsed.matchScore,
      fitVerdict: safeParsed.fitVerdict,

      scoreBreakdown: safeParsed.scoreBreakdown,

      explicitRequirements: safeParsed.explicitRequirements,
      implicitRequirements: safeParsed.implicitRequirements,

      strengthsBasedOnJD: safeParsed.strengthsBasedOnJD,
      missingSkills: safeParsed.missingSkills,
      recommendedKeywords: safeParsed.recommendedKeywords,

      tailoredBulletSuggestions: safeParsed.tailoredBulletSuggestions,
      improvementTips: safeParsed.improvementTips,

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
