// controllers/tailoredController.js
const { GoogleGenerativeAI } = require("@google/generative-ai");
const ResumeAnalysis = require("../models/ResumeAnalysis");
const JobAnalysis = require("../models/JobAnalysis");
const MatchAnalysis = require("../models/MatchAnalysis");
const TailoredResume = require("../models/TailoredResume");

// --------------------------------------------------
// SAFE JSON PARSER
// --------------------------------------------------
function tryParseJson(text) {
  if (!text || typeof text !== "string") return null;

  try {
    const t = text.trim();

    // Standard valid JSON
    if (
      (t.startsWith("{") && t.endsWith("}")) ||
      (t.startsWith("[") && t.endsWith("]"))
    ) {
      return JSON.parse(t);
    }

    // Extract JSON from within text
    const matchObj = t.match(/\{[\s\S]*\}/);
    if (matchObj) return JSON.parse(matchObj[0]);

    return null;
  } catch (err) {
    console.error("JSON PARSE ERROR (tailoredController):", err.message);
    return null;
  }
}

// --------------------------------------------------
// SANITIZERS
// --------------------------------------------------
function sanitizeString(s) {
  if (s == null) return null;
  return String(s).replace(/\r\n/g, "\n").trim();
}

function sanitizeSectionArray(arr) {
  if (!Array.isArray(arr)) return [];
  return arr.map((s) => ({
    title: sanitizeString(s.title),
    content: sanitizeString(s.content),
  }));
}

// --------------------------------------------------
// BUILD FAANG-LEVEL PROMPT
// --------------------------------------------------
function buildPrompt({ resume, job, match }) {
  return `
You are a FAANG-level recruiter + resume writer. Produce a recruiter-ready, ATS-optimized tailored resume.

RETURN ONLY VALID JSON.

SCHEMA:
{
  "headline": "One-line resume headline (2–12 words)",
  "skillsOrdered": ["skill1","skill2","..."],
  "experienceSections": [
    { "title": "Role — Org (if present)", "content": "bullet1\\nbullet2" }
  ],
  "projectSections": [
    { "title": "Project Name", "content": "Stack: ...\\nbullet1\\nbullet2" }
  ],
  "educationAndExtras": [
    { "title": "Education / Certifications", "content": "line1\\nline2" }
  ],
  "scoreBoostSuggestions": ["improvement1","improvement2"],
  "fullText": "Complete assembled resume in text/markdown"
}

RULES:
- Do NOT invent companies, dates, or employment not in ResumeAnalysis.
- You MAY infer metrics only when implied; prefix estimates with "~".
- Inject job.recommendedKeywords and job.missingSkills ONLY where truthful.
- Keep bullets crisp, measurable, technical, recruiter-focused.
- fullText ORDER: HEADLINE, CONTACT (blank), SUMMARY, SKILLS, EXPERIENCE, PROJECTS, EDUCATION/EXTRAS.
- NO commentary. NO explanation. ONLY JSON.

RESUME JSON:
${JSON.stringify(resume, null, 2)}

JOB JSON:
${JSON.stringify(job, null, 2)}

MATCH JSON (optional):
${JSON.stringify(match || {}, null, 2)}

JOB TITLE: ${job.jobTitle || "Not given"}
JOB DESCRIPTION (truncated):
${(job.jobDescription || "").slice(0, 1200)}
`.trim();
}

// --------------------------------------------------
// GENERATE TAILORED RESUME
// --------------------------------------------------
exports.generateTailored = async (req, res) => {
  try {
    const { resumeId, jobId } = req.body;
    if (!resumeId || !jobId) {
      return res.status(400).json({
        success: false,
        message: "resumeId and jobId are required",
      });
    }

    // Load required analysis
    const [resume, job, match] = await Promise.all([
      ResumeAnalysis.findOne({ _id: resumeId, user: req.user }).lean(),
      JobAnalysis.findOne({ _id: jobId, user: req.user }).lean(),
      MatchAnalysis.findOne({ resumeId, jobId, user: req.user }).lean().catch(() => null),
    ]);

    if (!resume)
      return res.status(404).json({
        success: false,
        message: "Resume analysis not found",
      });

    if (!job)
      return res.status(404).json({
        success: false,
        message: "Job analysis not found",
      });

    // Gemini config
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      generationConfig: { temperature: 0.06, maxOutputTokens: 3000 },
    });

    const prompt = buildPrompt({ resume, job, match });

    const result = await model.generateContent([{ text: prompt }]);
    const rawText = result.response.text();

    // Parse JSON
    const parsed = tryParseJson(rawText);

    if (!parsed) {
      await TailoredResume.create({
        user: req.user,
        resumeId: resume._id,
        jobId: job._id,
        rawText,
      });

      return res.status(502).json({
        success: false,
        message: "AI returned invalid JSON. Raw output saved.",
        rawTextPreview: rawText ? rawText.slice(0, 600) : null,
      });
    }

    // Build database doc
    const docBody = {
      user: req.user,
      resumeId: resume._id,
      jobId: job._id,
      headline: sanitizeString(parsed.headline),
      skillsOrdered: Array.isArray(parsed.skillsOrdered)
        ? parsed.skillsOrdered.map(String)
        : [],
      experienceSections: sanitizeSectionArray(parsed.experienceSections),
      projectSections: sanitizeSectionArray(parsed.projectSections),
      educationAndExtras: sanitizeSectionArray(parsed.educationAndExtras),
      scoreBoostSuggestions: Array.isArray(parsed.scoreBoostSuggestions)
        ? parsed.scoreBoostSuggestions.map(String)
        : [],
      fullText: sanitizeString(parsed.fullText),
      rawText,
    };

    const saved = await TailoredResume.create(docBody);

    return res.json({
      success: true,
      tailored: saved,
    });
  } catch (err) {
    console.error("TAILORED RESUME ERROR:", err);
    return res.status(500).json({
      success: false,
      message: "Tailored resume generation failed",
      error: err.message,
    });
  }
};

// --------------------------------------------------
// HISTORY
// --------------------------------------------------
exports.history = async (req, res) => {
  try {
    const records = await TailoredResume.find({ user: req.user })
      .sort({ createdAt: -1 })
      .lean();

    return res.json({
      success: true,
      count: records.length,
      history: records,
    });
  } catch (err) {
    console.error("TAILORED HISTORY ERROR:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to load tailored resume history",
      error: err.message,
    });
  }
};

// --------------------------------------------------
// GET BY ID
// --------------------------------------------------
exports.getById = async (req, res) => {
  try {
    const id = req.params.id;

    const rec = await TailoredResume.findOne({
      _id: id,
      user: req.user,
    }).lean();

    if (!rec)
      return res.status(404).json({
        success: false,
        message: "Tailored resume not found",
      });

    return res.json({ success: true, tailored: rec });
  } catch (err) {
    console.error("TAILORED GET ERROR:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch tailored resume",
      error: err.message,
    });
  }
};
