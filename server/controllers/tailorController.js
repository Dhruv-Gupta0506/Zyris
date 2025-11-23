const { GoogleGenerativeAI } = require("@google/generative-ai");
const ResumeAnalysis = require("../models/ResumeAnalysis");
const JobAnalysis = require("../models/JobAnalysis");

// ---- helper to parse JSON safely from Gemini ----
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
    console.error("TAILOR JSON PARSE ERROR:", err.message);
    return null;
  }
}

// ===============================
// GENERATE TAILORED RESUME (Mode 3 – Recruiter-Style Cutting)
// ===============================
exports.generateTailoredResume = async (req, res) => {
  try {
    const { resumeId, jobId } = req.body;

    if (!resumeId || !jobId) {
      return res.status(400).json({
        success: false,
        message: "resumeId and jobId are required",
      });
    }

    // Fetch resume + JD, ensure they belong to this user
    const [resume, job] = await Promise.all([
      ResumeAnalysis.findOne({ _id: resumeId, user: req.user }),
      JobAnalysis.findOne({ _id: jobId, user: req.user }),
    ]);

    if (!resume) {
      return res.status(404).json({
        success: false,
        message: "Resume analysis not found for this user",
      });
    }

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job analysis not found for this user",
      });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      generationConfig: { temperature: 0.15 },
    });

    // Prepare compact structured data for prompt
    const resumeData = {
      targetRole: resume.targetRole,
      atsScore: resume.atsScore,
      skills: resume.skills,
      strengths: resume.strengths,
      weaknesses: resume.weaknesses,
      improvementChecklist: resume.improvementChecklist,
      summaryRewrite: resume.summaryRewrite,
      projectRewrites: resume.projectRewrites,
      bulletRewrites: resume.bulletRewrites,
    };

    const jdData = {
      jobTitle: job.jobTitle,
      jobDescription: job.jobDescription,
      matchScore: job.matchScore,
      fitVerdict: job.fitVerdict,
      strengthsBasedOnJD: job.strengthsBasedOnJD,
      missingSkills: job.missingSkills,
      recommendedKeywords: job.recommendedKeywords,
      improvementTips: job.improvementTips,
    };

    const prompt = `
You are acting as a strict, experienced tech recruiter.

You are given:
1) A candidate's RESUME ANALYSIS (skills, strengths, weaknesses, bullets, summary).
2) A JOB DESCRIPTION ANALYSIS (missing skills, recommended keywords, fit verdict).

Your job is to create a TAILORED resume content for THIS JOB by:
- CUTTING weak or generic bullets.
- REWRITING existing bullets to be more impactful, concise, and aligned to the JD.
- IMPROVING the summary to be sharp and relevant.
- REORDERING skills so the most relevant to the JD come first.

CRITICAL RULES:
- DO NOT invent fake experience, projects, companies, or technologies that are not present in the resume data.
- You may rephrase and improve, but you cannot fabricate.
- You may drop weak, vague, or redundant bullets entirely.
- You must think like a recruiter: remove fluff, keep what would actually impress.
- Focus on impact, relevance, and clarity, not just keyword stuffing.

RETURN ONLY VALID JSON in this EXACT STRUCTURE (no markdown, no commentary, no backticks):

{
  "improvedSummary": "string",
  "improvedSkillsSection": ["skill1", "skill2", "..."],
  "keptAndRewrittenBullets": ["bullet1", "bullet2", "..."],
  "removedBulletsWithReasons": [
    {
      "original": "original bullet text",
      "reason": "why it was removed or merged"
    }
  ],
  "notesForCandidate": [
    "short practical note 1",
    "short practical note 2",
    "..."
  ]
}

- improvedSummary: a single strong summary paragraph, tailored to the given job.
- improvedSkillsSection: ordered list of skills (most relevant to JD first).
- keptAndRewrittenBullets: only strong, JD-relevant bullets the candidate should keep/paste.
- removedBulletsWithReasons: bullets that were discarded, with a short honest reason.
- notesForCandidate: practical recruiter-style insights (no fluff, no motivation quotes).

Remember: you are optimizing an existing resume for THIS role, without lying.

RESUME ANALYSIS:
${JSON.stringify(resumeData, null, 2)}

JOB ANALYSIS:
${JSON.stringify(jdData, null, 2)}
`.trim();

    const result = await model.generateContent([{ text: prompt }]);
    const rawText = result.response.text();
    const parsed = parseGeminiJson(rawText);

    if (!parsed) {
      return res.status(500).json({
        success: false,
        message: "AI response could not be parsed as JSON.",
        raw: rawText,
      });
    }

    const tailored = {
      improvedSummary: parsed.improvedSummary || null,
      improvedSkillsSection: Array.isArray(parsed.improvedSkillsSection)
        ? parsed.improvedSkillsSection
        : [],
      keptAndRewrittenBullets: Array.isArray(parsed.keptAndRewrittenBullets)
        ? parsed.keptAndRewrittenBullets
        : [],
      removedBulletsWithReasons: Array.isArray(parsed.removedBulletsWithReasons)
        ? parsed.removedBulletsWithReasons
        : [],
      notesForCandidate: Array.isArray(parsed.notesForCandidate)
        ? parsed.notesForCandidate
        : [],
    };

    return res.json({
      success: true,
      tailored,
    });
  } catch (err) {
    console.error("TAILORED RESUME ERROR:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to generate tailored resume content",
      error: err.message,
    });
  }
};
