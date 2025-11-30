const fs = require("fs");
const path = require("path");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const ResumeAnalysis = require("../models/ResumeAnalysis");

// -------- Helper: safely parse JSON from Gemini text (robust) --------
function parseGeminiJson(text) {
  if (!text || typeof text !== "string") return null;
  try {
    const trimmed = text.trim();

    if (
      (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
      (trimmed.startsWith("[") && trimmed.endsWith("]"))
    ) {
      return JSON.parse(trimmed);
    }

    let match = trimmed.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);

    match = trimmed.match(/\[[\s\S]*\]/);
    if (match) return JSON.parse(match[0]);

    return null;
  } catch (err) {
    console.error("JSON PARSE ERROR:", err.message);
    return null;
  }
}

// -------- Helpers --------
function stripHtmlTags(input = "") {
  return String(input).replace(/<\/?[^>]+(>|$)/g, "").trim();
}

function isPdf(buffer) {
  if (!Buffer.isBuffer(buffer)) return false;
  return buffer.slice(0, 4).toString() === "%PDF";
}

function clampNumber(v, min, max) {
  if (typeof v !== "number" || Number.isNaN(v)) return null;
  if (v < min) return min;
  if (v > max) return max;
  return v;
}

function ensureArray(a) {
  if (!Array.isArray(a)) return [];
  return a.map(String);
}

function ensureString(s) {
  if (s == null) return null;
  return String(s);
}

// -------- ONLY FIX YOU NEEDED --------
function normalizeRewriteArray(arr) {
  if (!Array.isArray(arr)) return [];
  return arr.map((item) => {
    if (typeof item === "string") return item;
    if (typeof item === "object" && item !== null) {
      if (item.text) return String(item.text);
      return JSON.stringify(item);
    }
    return String(item);
  });
}

// -------- Build safeParsed (ONLY REWRITE LINES CHANGED) --------
function buildSafeParsed(parsed) {
  const defaultBreakdown = {
    keywordMatch: null,
    actionVerbs: null,
    quantifiedResults: null,
    formattingClarity: null,
    relevanceAlignment: null,
  };

  const scoringBreakdown =
    parsed.scoringBreakdown && typeof parsed.scoringBreakdown === "object"
      ? {
          keywordMatch: clampNumber(parsed.scoringBreakdown.keywordMatch, 40, 100),
          actionVerbs: clampNumber(parsed.scoringBreakdown.actionVerbs, 40, 100),
          quantifiedResults: clampNumber(parsed.scoringBreakdown.quantifiedResults, 40, 100),
          formattingClarity: clampNumber(parsed.scoringBreakdown.formattingClarity, 40, 100),
          relevanceAlignment: clampNumber(parsed.scoringBreakdown.relevanceAlignment, 40, 100),
        }
      : defaultBreakdown;

  let atsScore = clampNumber(parsed.atsScore, 40, 100);
  if (atsScore === null) {
    const vals = Object.values(scoringBreakdown).filter((n) => typeof n === "number");
    atsScore = vals.length ? clampNumber(Math.round(vals.reduce((a, b) => a + b, 0) / vals.length), 40, 100) : null;
  }

  return {
    atsScore,
    scoringBreakdown,
    skills: ensureArray(parsed.skills),
    strengths: ensureArray(parsed.strengths),
    weaknesses: ensureArray(parsed.weaknesses),
    missingKeywords: ensureArray(parsed.missingKeywords),
    suggestedRoles: ensureArray(parsed.suggestedRoles),
    recruiterImpression: ensureString(parsed.recruiterImpression),
    improvementChecklist: ensureArray(parsed.improvementChecklist),

    // ⭐ ONLY CHANGED THIS PART
    summaryRewrite: ensureString(parsed.summaryRewrite),
    projectRewrites: normalizeRewriteArray(parsed.projectRewrites),
    bulletRewrites: normalizeRewriteArray(parsed.bulletRewrites),
  };
}

// ===============================
// ANALYZE RESUME (UNCHANGED)
// ===============================
exports.analyzeResume = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No PDF uploaded" });

    const rawRole = req.body?.targetRole ? String(req.body.targetRole) : "";
    const targetRole = stripHtmlTags(rawRole).slice(0, 150) || "Software Engineer";

    const filePath = req.file.path;
    const buffer = fs.readFileSync(filePath);

    if (!isPdf(buffer)) {
      try { fs.unlinkSync(filePath); } catch {}
      return res.status(400).json({ message: "Uploaded file is not a valid PDF." });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      generationConfig: { temperature: 0.08, maxOutputTokens: 2000 },
    });

    // ⭐ YOUR ORIGINAL PROMPT RESTORED EXACTLY
    const prompt = `
You are an ATS scoring engine + experienced technical recruiter.

Analyze the resume for the target role: "${targetRole}".

SCORING RULES:
- atsScore must be between 40 and 100.
- breakdown values between 40 and 100.

Distribution:
- 90–100 = amazing resume
- 80–89 = strong resume
- 70–79 = good resume
- 60–69 = average resume
- 50–59 = weak resume
- 40–49 = poor resume

STRICT RULES:
- Do NOT invent achievements.
- Do NOT rename projects.
- No fake metrics.
- Use only what appears in the resume.

Return ONLY valid JSON:
{
  "atsScore": number,
  "scoringBreakdown": {
    "keywordMatch": number,
    "actionVerbs": number,
    "quantifiedResults": number,
    "formattingClarity": number,
    "relevanceAlignment": number
  },
  "skills": [],
  "strengths": [],
  "weaknesses": [],
  "missingKeywords": [],
  "suggestedRoles": [],
  "recruiterImpression": "",
  "improvementChecklist": [],
  "summaryRewrite": "",
  "projectRewrites": [],
  "bulletRewrites": []
}
`;

    // Retry logic (unchanged)
    let result;
    let retryCount = 0;
    const maxRetries = 3;

    const parts = [
      { text: prompt },
      { inlineData: { data: buffer.toString("base64"), mimeType: "application/pdf" } },
    ];

    while (retryCount < maxRetries) {
      try {
        result = await model.generateContent(parts);
        break;
      } catch {
        retryCount++;
        if (retryCount === maxRetries) throw err;
        await new Promise((r) => setTimeout(r, 2000));
      }
    }

    const rawText = result.response.text();
    const parsed = parseGeminiJson(rawText);

    if (!parsed) {
      await ResumeAnalysis.create({
        user: req.user,
        fileName: req.file.originalname,
        targetRole,
        atsScore: null,
        scoringBreakdown: {},
        skills: [],
        strengths: [],
        weaknesses: [],
        missingKeywords: [],
        suggestedRoles: [],
        recruiterImpression: null,
        improvementChecklist: [],
        summaryRewrite: null,
        projectRewrites: [],
        bulletRewrites: [],
        rawText,
      });

      try { fs.unlinkSync(filePath); } catch {}
      return res.status(502).json({ message: "AI returned invalid structured output. Raw saved." });
    }

    const safeParsed = buildSafeParsed(parsed);

    const doc = await ResumeAnalysis.create({
      user: req.user,
      fileName: req.file.originalname,
      targetRole,
      atsScore: safeParsed.atsScore,
      scoringBreakdown: safeParsed.scoringBreakdown,
      skills: safeParsed.skills,
      strengths: safeParsed.strengths,
      weaknesses: safeParsed.weaknesses,
      missingKeywords: safeParsed.missingKeywords,
      suggestedRoles: safeParsed.suggestedRoles,
      recruiterImpression: safeParsed.recruiterImpression,
      improvementChecklist: safeParsed.improvementChecklist,

      // ⭐ FIXED ONLY THIS PART
      summaryRewrite: safeParsed.summaryRewrite,
      projectRewrites: safeParsed.projectRewrites,
      bulletRewrites: safeParsed.bulletRewrites,

      rawText,
    });

    try { fs.unlinkSync(filePath); } catch {}

    return res.json({ success: true, analysis: doc });

  } catch (err) {
    try { if (req.file?.path) fs.unlinkSync(req.file.path); } catch {}
    return res.status(500).json({
      success: false,
      message: err.message.includes("fetch failed")
        ? "Network error connecting to AI. Please try again."
        : "Resume analysis failed.",
      error: err.message,
    });
  }
};

// ===============================
// HISTORY (unchanged)
// ===============================
exports.getHistory = async (req, res) => {
  try {
    const records = await ResumeAnalysis.find({ user: req.user })
      .sort({ createdAt: -1 })
      .select("-rawText -__v")
      .lean();

    return res.json({ success: true, count: records.length, history: records });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Failed to load resume history", error: err.message });
  }
};

// ===============================
exports.deleteResume = async (req, res) => {
  try {
    const deleted = await ResumeAnalysis.findOneAndDelete({
      _id: req.params.id,
      user: req.user,
    });

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Record not found or unauthorized",
      });
    }

    res.json({ success: true, message: "Analysis deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Delete failed" });
  }
};
