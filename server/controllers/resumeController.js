// controllers/resumeController.js
const fs = require("fs");
const path = require("path");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const ResumeAnalysis = require("../models/ResumeAnalysis");

// -------- Helper: safely parse JSON from Gemini text (robust) --------
function parseGeminiJson(text) {
  if (!text || typeof text !== "string") return null;
  try {
    const trimmed = text.trim();

    // If it's already clean JSON
    if ((trimmed.startsWith("{") && trimmed.endsWith("}")) ||
        (trimmed.startsWith("[") && trimmed.endsWith("]"))) {
      return JSON.parse(trimmed);
    }

    // Try to grab first {...} block
    let match = trimmed.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);

    // Try to grab first [...] block (rarely used)
    match = trimmed.match(/\[[\s\S]*\]/);
    if (match) return JSON.parse(match[0]);

    return null;
  } catch (err) {
    console.error("JSON PARSE ERROR from Gemini:", err.message);
    return null;
  }
}

// -------- Helpers: safe guards and sanitizers --------
function stripHtmlTags(input = "") {
  return String(input).replace(/<\/?[^>]+(>|$)/g, "").trim();
}

function isPdf(buffer) {
  if (!Buffer.isBuffer(buffer)) return false;
  // PDF files start with '%PDF'
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

// Build safeParsed object with validation and defaults
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
          keywordMatch: clampNumber(parsed.scoringBreakdown.keywordMatch, 30, 90),
          actionVerbs: clampNumber(parsed.scoringBreakdown.actionVerbs, 30, 90),
          quantifiedResults: clampNumber(parsed.scoringBreakdown.quantifiedResults, 30, 90),
          formattingClarity: clampNumber(parsed.scoringBreakdown.formattingClarity, 30, 90),
          relevanceAlignment: clampNumber(parsed.scoringBreakdown.relevanceAlignment, 30, 90),
        }
      : defaultBreakdown;

  // compute atsScore roughly as average if provided invalid
  let atsScore = clampNumber(parsed.atsScore, 45, 80);
  if (atsScore === null) {
    // compute from breakdown average if available
    const vals = Object.values(scoringBreakdown).filter((n) => typeof n === "number");
    if (vals.length > 0) {
      const avg = Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
      // clamp computed average to allowed range
      atsScore = clampNumber(avg, 45, 80);
    } else {
      atsScore = null;
    }
  }

  // Strings and arrays sanitized
  const safe = {
    atsScore,
    scoringBreakdown,
    skills: ensureArray(parsed.skills),
    strengths: ensureArray(parsed.strengths),
    weaknesses: ensureArray(parsed.weaknesses),
    missingKeywords: ensureArray(parsed.missingKeywords),
    suggestedRoles: ensureArray(parsed.suggestedRoles),
    recruiterImpression: ensureString(parsed.recruiterImpression),
    improvementChecklist: ensureArray(parsed.improvementChecklist),
    summaryRewrite: ensureString(parsed.summaryRewrite),
    projectRewrites: ensureArray(parsed.projectRewrites),
    bulletRewrites: ensureArray(parsed.bulletRewrites),
  };

  return safe;
}

// ===============================
// ANALYZE RESUME (ROLE-AWARE + HONEST) - Hardened Version
// ===============================
exports.analyzeResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No PDF uploaded" });
    }

    // Sanitize target role to prevent XSS / weird input
    const rawRole = (req.body && req.body.targetRole) ? String(req.body.targetRole) : "";
    const targetRole = stripHtmlTags(rawRole).slice(0, 150) || "Software Engineer";

    // Read file buffer
    const filePath = req.file.path;
    const buffer = fs.readFileSync(filePath);

    // Validate PDF content
    if (!isPdf(buffer)) {
      // Clean up uploaded file
      try { fs.unlinkSync(filePath); } catch (e) {}
      return res.status(400).json({ message: "Uploaded file is not a valid PDF." });
    }

    // Prepare model
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      generationConfig: {
        temperature: 0.08,
        maxOutputTokens: 2000,
      },
    });

    // Use the same high-quality prompt you already designed (role-aware)
    const prompt = `
You are an ATS scoring engine + experienced technical recruiter.

Analyze a student's resume PDF for the target role: "${targetRole}".

OUTPUT REQUIREMENTS:
- Be honest, practical, and direct.
- No sugarcoating. No motivational fluff.
- No fake praise.
- No invented companies, internships, hackathons, or technologies.
- KEEP PROJECT NAMES AND DOMAINS EXACT — do NOT rename projects or change what they are about.
- Do NOT hallucinate achievements.
- If metrics are NOT explicitly present, do NOT invent them.
- If a metric is strongly implied and safe to estimate, prefix it with "~" to indicate it is estimated.

ROLE GUIDELINES:
- Provide role-aware guidance (SDE / Fullstack / Frontend / Backend) based on target role string.

You MUST return ONLY VALID JSON in EXACTLY this structure (no extra keys, no comments, no markdown):

{
  "atsScore": number,
  "scoringBreakdown": {
    "keywordMatch": number,
    "actionVerbs": number,
    "quantifiedResults": number,
    "formattingClarity": number,
    "relevanceAlignment": number
  },
  "skills": [ "skill1", "skill2", "skill3" ],
  "strengths": [ "strength1", "strength2" ],
  "weaknesses": [ "weakness1", "weakness2" ],
  "missingKeywords": [ "keyword1", "keyword2" ],
  "suggestedRoles": [ "role1", "role2" ],
  "recruiterImpression": "short, realistic, 2–3 sentences max",
  "improvementChecklist": [ "fix1", "fix2" ],
  "summaryRewrite": "short rewritten summary aligned to ${targetRole}",
  "projectRewrites": [ "rewrite1", "rewrite2" ],
  "bulletRewrites": [ "Old: ... New: ..." ]
}

SCORING RULES (Honest Recruiter Mode):
- "atsScore" must be between 45 and 80.
- "scoringBreakdown" subs must each be between 30 and 90.
- "atsScore" should roughly match the average of the breakdown scores.
- Weak resumes -> 45–55; Average -> 56–68; Strong student resumes -> 69–80.

FINAL RULE:
Return ONLY the JSON object matching the schema above.
`;

    // Send prompt + PDF inline
    const result = await model.generateContent([
      { text: prompt },
      {
        inlineData: {
          data: buffer.toString("base64"),
          mimeType: "application/pdf",
        },
      },
    ]);

    const rawText = result.response.text();
    const parsed = parseGeminiJson(rawText);

    if (!parsed) {
      // Save rawText for debugging, but don't save an invalid structured doc
      try {
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
      } catch (e) {
        // ignore save errors for fallback
      }

      // Clean up uploaded file
      try { fs.unlinkSync(filePath); } catch (e) {}
      return res.status(502).json({ message: "AI returned invalid/ unparsable response. Raw output saved for debugging." });
    }

    // Build sanitized, validated parsed object
    const safeParsed = buildSafeParsed(parsed);

    // Create DB document using safe values
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
      summaryRewrite: safeParsed.summaryRewrite,
      projectRewrites: safeParsed.projectRewrites,
      bulletRewrites: safeParsed.bulletRewrites,
      rawText,
    });

    // Cleanup temp PDF
    try { fs.unlinkSync(filePath); } catch (e) { /* ignore */ }

    return res.json({
      success: true,
      analysis: doc,
    });
  } catch (err) {
    console.error("RESUME ANALYSIS ERROR:", err);
    // attempt to cleanup upload if present
    try { if (req.file && req.file.path) fs.unlinkSync(req.file.path); } catch (e) {}
    return res.status(500).json({
      success: false,
      message: "Resume analysis failed",
      error: err.message,
    });
  }
};

// ===============================
// HISTORY (STRUCTURED, CLEAN)
// ===============================
exports.history = async (req, res) => {
  try {
    const records = await ResumeAnalysis.find({ user: req.user })
      .sort({ createdAt: -1 })
      .select("-rawText -__v")
      .lean();

    return res.json({
      success: true,
      count: records.length,
      history: records,
    });
  } catch (err) {
    console.error("HISTORY ERROR:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to load resume history",
      error: err.message,
    });
  }
};
