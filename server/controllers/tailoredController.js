const { GoogleGenerativeAI } = require("@google/generative-ai");
const ResumeAnalysis = require("../models/ResumeAnalysis");
const JobAnalysis = require("../models/JobAnalysis");
const MatchAnalysis = require("../models/MatchAnalysis");
const TailoredResume = require("../models/TailoredResume");
const { tryParseJson, generateWithRetry } = require("../utils/aiHelper"); // Import helper

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
You are an Elite Technical Resume Writer for FAANG (Google, Meta, Amazon). 
Your goal is to rewrite a candidate's resume to target a specific Job Description (JD).

--- CRITICAL RULES (VIOLATIONS = FAILURE) ---
1. **BAN GENERIC FILLER:** NEVER use phrases like "Showcased skills in...", "Demonstrated ability to...", "Responsible for...", "Worked on...", "Good communication skills".
2. **HARD SKILLS ONLY:** Every bullet point MUST mention a specific technology, language, or tool (e.g., React, Node.js, AWS, MongoDB).
3. **METRIC-DRIVEN:** If the resume lacks numbers, INFER realistic engineering metrics based on the scope. 
   - *Bad:* "Improved performance."
   - *Good:* "Reduced API latency by ~30% through Redis caching and query optimization."
4. **NO SOFT SKILLS ALONE:** Do not list "Teamwork" or "Communication" as bullet points. Instead, show it: "Collaborated with 3 backend engineers to integrate RESTful APIs..."
5. **KEYWORD INJECTION:** Naturally weave in these high-value keywords from the JD: ${job.recommendedKeywords?.join(", ") || "relevant tech stack"}.

--- JSON OUTPUT SCHEMA ---
Return ONLY raw JSON. No markdown formatting.

{
  "headline": "A punchy, role-specific headline (e.g., 'Full Stack Engineer | React & Node.js Specialist')",
  "skillsOrdered": ["Most Critical Skill for JD", "Skill 2", "Skill 3", "...", "Skill N"],
  "experienceSections": [
    { 
      "title": "Role — Company", 
      "content": "• [Strong Verb] [What you did] using [Tech Stack], resulting in [Quantifiable Outcome].\n• [Strong Verb] [Another technical achievement]." 
    }
  ],
  "projectSections": [
    { 
      "title": "Project Name", 
      "content": "Stack: [List main tech]\n• Engineered a [System/App] using [Tech], handling [Scale/Features].\n• Implemented [Complex Feature] which improved [Metric] by ~[Number]%." 
    }
  ],
  "educationAndExtras": [
    { "title": "Education / Certifications", "content": "Degree, University, Year" }
  ],
  "scoreBoostSuggestions": ["Add a link to...", "Deploy the project to...", "Add unit tests for..."],
  "fullText": "The complete, formatted text of the resume for copy-pasting."
}

--- INPUT DATA ---
JOB TITLE: ${job.jobTitle || "Software Engineer"}
JOB DESCRIPTION SUMMARY: ${(job.jobDescription || "").slice(0, 1500)}

CANDIDATE RESUME:
${JSON.stringify(resume, null, 2)}
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
      return res.status(404).json({ success: false, message: "Resume analysis not found" });

    if (!job)
      return res.status(404).json({ success: false, message: "Job analysis not found" });

    // Gemini config
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash", // Use 1.5-flash if 2.0 unavailable
      generationConfig: { temperature: 0.1, maxOutputTokens: 4000 },
    });

    const prompt = buildPrompt({ resume, job, match });

    // --- RETRY LOGIC ---
    const result = await generateWithRetry(model, prompt);
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
    
    const message = err.message.includes("fetch failed") 
      ? "Network error connecting to AI. Please try again." 
      : "Tailored resume generation failed";

    return res.status(500).json({
      success: false,
      message,
      error: err.message,
    });
  }
};

// --------------------------------------------------
// GET HISTORY
// --------------------------------------------------
exports.getHistory = async (req, res) => {
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

// --------------------------------------------------
// DELETE TAILORED RESUME (New Feature)
// --------------------------------------------------
exports.deleteTailoredResume = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await TailoredResume.findOneAndDelete({ 
      _id: id, 
      user: req.user 
    });

    if (!deleted) {
      return res.status(404).json({ success: false, message: "Record not found or unauthorized" });
    }

    res.json({ success: true, message: "Tailored resume deleted successfully" });
  } catch (error) {
    console.error("DELETE ERROR:", error);
    res.status(500).json({ success: false, message: "Delete failed" });
  }
};