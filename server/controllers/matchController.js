// controllers/matchController.js
const { GoogleGenerativeAI } = require("@google/generative-ai");
const ResumeAnalysis = require("../models/ResumeAnalysis");
const JobAnalysis = require("../models/JobAnalysis");
const MatchAnalysis = require("../models/MatchAnalysis");

// ---------- Helpers ----------
function norm(s) {
  return String(s || "").toLowerCase().trim();
}

function safeArr(a) {
  return Array.isArray(a) ? a : [];
}

function clamp(n, min, max) {
  if (typeof n !== "number" || Number.isNaN(n)) return null;
  return Math.max(min, Math.min(max, n));
}

// robust JSON extraction from model text
function parseGeminiJson(text) {
  if (!text || typeof text !== "string") return null;
  try {
    const t = text.trim();
    if ((t.startsWith("{") && t.endsWith("}")) || (t.startsWith("[") && t.endsWith("]"))) {
      return JSON.parse(t);
    }
    const objMatch = t.match(/\{[\s\S]*\}/);
    if (objMatch) return JSON.parse(objMatch[0]);
    const arrMatch = t.match(/\[[\s\S]*\]/);
    if (arrMatch) return JSON.parse(arrMatch[0]);
    return null;
  } catch (err) {
    console.error("PARSE GEMINI JSON ERROR:", err.message);
    return null;
  }
}

// fallback deterministic heuristic when AI output invalid
function deterministicFallback(resume, job) {
  const resumeSkills = new Set((resume.skills || []).map((s) => norm(s)));
  const jdMissing = (job.missingSkills || []).map((s) => norm(s));

  let present = 0;
  jdMissing.forEach((ms) => {
    if (resumeSkills.has(ms)) present++;
  });
  const coreAlignment = Math.round((present / (jdMissing.length || 1)) * 100);

  const recommended = (job.recommendedKeywords || []).slice(0, 8).map((s) => String(s));
  const matchingSkills = (resume.skills || []).filter((s) =>
    recommended.map(norm).includes(norm(s))
  );

  const missingImportant = (job.missingSkills || []).slice(0, 8);

  const overallScore = Math.round(
    ((resume.atsScore || 50) * 0.3) +
    ((job.matchScore || 50) * 0.2) +
    (coreAlignment * 0.3) +
    (50 * 0.2)
  );

  const hiringProbability = Math.max(0, Math.min(100, overallScore - 5));

  return {
    overallScore,
    hiringProbability,
    roleCategory: "software-engineer",
    competencies: [],
    strengths: (resume.strengths || []).slice(0, 5),
    weaknesses: (resume.weaknesses || []).slice(0, 5),
    matchingSkills,
    missingSkills: missingImportant,
    recruiterObjections: ["Not enough evidence of fundamentals or system design."],
    recruiterStrengths: (job.strengthsBasedOnJD || []).slice(0, 5),
    scoreBoostEstimate: missingImportant.length > 0 ? "+15 to +25 if key gaps closed." : "+5 to +10 with polish.",
    verdict:
      overallScore >= 75
        ? "Strong Fit"
        : overallScore >= 60
        ? "Competitive"
        : overallScore >= 45
        ? "Weak Fit"
        : "Not Suitable",
    jobTitle: job.jobTitle || null,
    resumeFileName: resume.fileName || null,
    targetRole: resume.targetRole || null,
    rawText: null,
  };
}

// ===============================
// ANALYZE MATCH - FAANG-GRADE
// ===============================
exports.analyzeMatch = async (req, res) => {
  try {
    const { resumeId, jobId } = req.body;
    if (!resumeId || !jobId) {
      return res.status(400).json({ success: false, message: "resumeId and jobId are required" });
    }

    const [resume, job] = await Promise.all([
      ResumeAnalysis.findOne({ _id: resumeId, user: req.user }).lean(),
      JobAnalysis.findOne({ _id: jobId, user: req.user }).lean(),
    ]);

    if (!resume) return res.status(404).json({ success: false, message: "Resume analysis not found" });
    if (!job) return res.status(404).json({ success: false, message: "Job analysis not found" });

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      generationConfig: { temperature: 0.12, maxOutputTokens: 2500 },
    });

    const prompt = `
You are a FAANG-level hiring analyst...

STRICT OUTPUT SCHEMA:
{
  "overallScore": number,
  "hiringProbability": number,
  "roleCategory": "frontend"|"backend"|"fullstack"|"data"|"ml-ai"|"mobile"|"software-engineer",
  "competencies": [
    { "name": "React.js", "resumeLevel": number, "jdLevel": number, "gap": number }
  ],
  "strengths": [ "text" ],
  "weaknesses": [ "text" ],
  "matchingSkills": [ "text" ],
  "missingSkills": [ "text" ],
  "recruiterObjections": [ "text" ],
  "recruiterStrengths": [ "text" ],
  "scoreBoostEstimate": "text",
  "verdict": "Strong Fit" | "Competitive" | "Weak Fit" | "Not Suitable",
  "jobTitle": "text or null",
  "resumeFileName": "text or null",
  "targetRole": "text or null"
}

Return JSON only.
`;

    const result = await model.generateContent([{ text: prompt }]);
    const rawText = result.response.text();
    const parsed = parseGeminiJson(rawText);

    let safeOutput = null;

    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      safeOutput = deterministicFallback(resume, job);
      safeOutput.rawText = rawText || null;
    } else {
      const overallScore = clamp(parsed.overallScore, 0, 100);
      const hiringProbability = clamp(parsed.hiringProbability, 0, 100);

      const allowedRoles = ["frontend", "backend", "fullstack", "data", "ml-ai", "mobile", "software-engineer"];
      const roleCategory = allowedRoles.includes(parsed.roleCategory)
        ? parsed.roleCategory
        : "software-engineer";

      const competencies = Array.isArray(parsed.competencies)
        ? parsed.competencies.slice(0, 12).map((c) => ({
            name: String(c.name || "").trim(),
            resumeLevel: clamp(Number(c.resumeLevel), 0, 10),
            jdLevel: clamp(Number(c.jdLevel), 0, 10),
            gap:
              typeof c.gap === "number"
                ? clamp(Number(c.gap), -10, 10)
                : clamp(Number(c.jdLevel) - Number(c.resumeLevel), -10, 10),
          }))
        : [];

      const strengths = safeArr(parsed.strengths).slice(0, 8);
      const weaknesses = safeArr(parsed.weaknesses).slice(0, 8);
      const matchingSkills = safeArr(parsed.matchingSkills).slice(0, 40);
      const missingSkills = safeArr(parsed.missingSkills).slice(0, 40);
      const recruiterObjections = safeArr(parsed.recruiterObjections).slice(0, 8);
      const recruiterStrengths = safeArr(parsed.recruiterStrengths).slice(0, 8);
      const scoreBoostEstimate = parsed.scoreBoostEstimate
        ? String(parsed.scoreBoostEstimate).slice(0, 200)
        : null;

      const verdict = ["Strong Fit", "Competitive", "Weak Fit", "Not Suitable"].includes(parsed.verdict)
        ? parsed.verdict
        : overallScore >= 75
        ? "Strong Fit"
        : overallScore >= 60
        ? "Competitive"
        : overallScore >= 45
        ? "Weak Fit"
        : "Not Suitable";

      safeOutput = {
        overallScore,
        hiringProbability,
        roleCategory,
        competencies,
        strengths,
        weaknesses,
        matchingSkills,
        missingSkills,
        recruiterObjections,
        recruiterStrengths,
        scoreBoostEstimate,
        verdict,
        jobTitle: parsed.jobTitle || job.jobTitle || null,
        resumeFileName: parsed.resumeFileName || resume.fileName || null,
        targetRole: parsed.targetRole || resume.targetRole || null,
        rawText,
      };
    }

    const matchDoc = await MatchAnalysis.create({
      user: req.user,
      resumeId: resume._id,
      jobId: job._id,
      ...safeOutput,
    });

    return res.json({
      success: true,
      match: {
        id: matchDoc._id,
        ...safeOutput,
      },
    });
  } catch (err) {
    console.error("MATCH ANALYSIS ERROR:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to compute resume-JD match",
      error: err.message,
    });
  }
};

// ===============================
// MATCH ANALYSIS HISTORY (NEW)
// ===============================
exports.matchHistory = async (req, res) => {
  try {
    const records = await MatchAnalysis.find({ user: req.user })
      .sort({ createdAt: -1 })
      .select("-rawText -__v")
      .lean();

    return res.json({
      success: true,
      count: records.length,
      history: records,
    });
  } catch (err) {
    console.error("MATCH HISTORY ERROR:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to load match history",
      error: err.message,
    });
  }
};
