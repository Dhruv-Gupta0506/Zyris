const { GoogleGenerativeAI } = require("@google/generative-ai");
const ResumeAnalysis = require("../models/ResumeAnalysis");
const JobAnalysis = require("../models/JobAnalysis");
const MatchAnalysis = require("../models/MatchAnalysis");
const { tryParseJson, generateWithRetry } = require("../utils/aiHelper"); // Import helper

// ---------- Helpers ----------
function norm(s) {
  return String(s || "").toLowerCase().trim();
}

function safeArr(a) {
  return Array.isArray(a) ? a : [];
}

function clamp(n, min, max) {
  if (typeof n !== "number" || Number.isNaN(n)) return min;
  return Math.max(min, Math.min(max, n));
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

  return {
    overallScore: clamp(overallScore, 0, 100),
    hiringProbability: clamp(overallScore - 10, 0, 100),
    roleCategory: "software-engineer",
    competencies: [],
    strengths: (resume.strengths || []).slice(0, 5),
    weaknesses: (resume.weaknesses || []).slice(0, 5),
    matchingSkills,
    missingSkills: missingImportant,
    recruiterObjections: ["Resume lacks specific keywords found in JD.", "Experience depth may not match requirements."],
    recruiterStrengths: (job.strengthsBasedOnJD || []).slice(0, 5),
    scoreBoostEstimate: missingImportant.length > 0 ? "+15 to +25 if key gaps closed." : "+5 to +10 with polish.",
    verdict: overallScore >= 75 ? "Strong Fit" : overallScore >= 60 ? "Competitive" : "Weak Fit",
    jobTitle: job.jobTitle || null,
    resumeFileName: resume.fileName || null,
    targetRole: resume.targetRole || null,
    rawText: null,
  };
}

// ===============================
// ANALYZE MATCH
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
      model: "gemini-2.5-flash", // Use 1.5-flash if 2.0 is unavailable
      generationConfig: { temperature: 0.15, maxOutputTokens: 2500 },
    });

    const prompt = `
    Act as a Lead Technical Recruiter at a FAANG company. 
    Compare the Candidate Resume against the Job Description (JD) below.

    CRITICAL RULES:
    1. Scores must be INTEGERS between 0 and 100. (If you calculate 0.85, output 85).
    2. "hiringProbability": A realistic estimate (0-100) of passing the resume screen.
    3. "competencies": Select the top 4-5 most critical HARD SKILLS from the JD. Rate Candidate vs JD Requirement (0-10).
    4. "recruiterObjections": Be harsh but fair.
    5. SKILL INFERENCE (VERY IMPORTANT): 
       - If Resume has "Express" or "Node.js", assume "REST API" skill is PRESENT.
       - If Resume has "React", assume "Frontend" skill is PRESENT.
       - If Resume has "MongoDB" or "SQL", assume "Database" skill is PRESENT.
       - Do not list a skill as "Missing" if a clear synonym exists.

    STRICT JSON OUTPUT SCHEMA:
    {
      "overallScore": number, // 0-100
      "hiringProbability": number, // 0-100
      "roleCategory": "frontend" | "backend" | "fullstack" | "data" | "mobile" | "software-engineer",
      "verdict": "Strong Fit" | "Competitive" | "Weak Fit" | "Not Suitable",
      
      "competencies": [
        { "name": "Skill Name", "resumeLevel": number, "jdLevel": number, "gap": number } 
      ],
      // resumeLevel & jdLevel are 0-10 integers.

      "strengths": ["text"], 
      "weaknesses": ["text"], 
      
      "matchingSkills": ["text"],
      "missingSkills": ["text"], 
      
      "recruiterObjections": ["text"],
      "recruiterStrengths": ["text"],
      
      "scoreBoostEstimate": "text" 
    }

    --- JOB DESCRIPTION ---
    Title: ${job.jobTitle}
    ${job.jobDescription}

    --- CANDIDATE RESUME ---
    Target Role: ${resume.targetRole}
    ${JSON.stringify(resume, null, 2)}
    `;

    // --- RETRY LOGIC ---
    const result = await generateWithRetry(model, prompt);
    const rawText = result.response.text();
    const parsed = tryParseJson(rawText);

    let safeOutput = null;

    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      safeOutput = deterministicFallback(resume, job);
      safeOutput.rawText = rawText || null;
    } else {
      // SCALING FIX: Ensure scores are 0-100
      let overallScore = typeof parsed.overallScore === 'number' ? parsed.overallScore : 0;
      if (overallScore <= 1 && overallScore > 0) overallScore *= 100; // Fix 0.85 -> 85 issue
      overallScore = clamp(Math.round(overallScore), 0, 100);

      let hiringProbability = typeof parsed.hiringProbability === 'number' ? parsed.hiringProbability : 0;
      if (hiringProbability <= 1 && hiringProbability > 0) hiringProbability *= 100;
      hiringProbability = clamp(Math.round(hiringProbability), 0, 100);

      const allowedRoles = ["frontend", "backend", "fullstack", "data", "ml-ai", "mobile", "software-engineer"];
      const roleCategory = allowedRoles.includes(parsed.roleCategory) ? parsed.roleCategory : "software-engineer";

      // ---------------------------------------------------------
      //  FORCE GAP RECALCULATION (Fixes the -1 Gap issue)
      // ---------------------------------------------------------
      const competencies = Array.isArray(parsed.competencies)
        ? parsed.competencies.slice(0, 6).map((c) => {
            const resumeLevel = clamp(Math.round(Number(c.resumeLevel) || 0), 0, 10);
            const jdLevel = clamp(Math.round(Number(c.jdLevel) || 0), 0, 10);
            
            // MATH FIX: 
            // Gap = Required (JD) - Actual (Resume).
            // Example 1: Req 7, Resume 8. Gap = -1. (Negative = Good/Exceeds).
            // Example 2: Req 7, Resume 5. Gap = 2. (Positive = Bad/Missing).
            const calculatedGap = jdLevel - resumeLevel;
            
            return {
              name: String(c.name || "Skill").trim(),
              resumeLevel,
              jdLevel,
              gap: calculatedGap 
            };
          })
        : [];

      // Ensure Missing Skills isn't empty if Weaknesses exist
      let missingSkills = safeArr(parsed.missingSkills).slice(0, 20);
      const weaknesses = safeArr(parsed.weaknesses).slice(0, 6);
      if (missingSkills.length === 0 && weaknesses.length > 0 && overallScore < 90) {
         // Fallback: use weaknesses as missing skills if the AI was lazy
         missingSkills = weaknesses;
      }

      // Ensure Verdict matches Score
      let verdict = parsed.verdict;
      if (overallScore >= 80) verdict = "Strong Fit";
      else if (overallScore >= 60) verdict = "Competitive";
      else if (overallScore >= 40) verdict = "Weak Fit";
      else verdict = "Not Suitable";

      safeOutput = {
        overallScore,
        hiringProbability,
        roleCategory,
        competencies,
        strengths: safeArr(parsed.strengths).slice(0, 6),
        weaknesses,
        matchingSkills: safeArr(parsed.matchingSkills).slice(0, 20),
        missingSkills,
        recruiterObjections: safeArr(parsed.recruiterObjections).slice(0, 5),
        recruiterStrengths: safeArr(parsed.recruiterStrengths).slice(0, 5),
        scoreBoostEstimate: parsed.scoreBoostEstimate ? String(parsed.scoreBoostEstimate).slice(0, 250) : "Review missing skills.",
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
    
    const message = err.message.includes("fetch failed") 
      ? "Network error connecting to AI. Please try again." 
      : "Failed to compute resume-JD match";

    return res.status(500).json({
      success: false,
      message,
      error: err.message,
    });
  }
};

// ===============================
// GET HISTORY
// ===============================
exports.getHistory = async (req, res) => {
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

// ===============================
// DELETE MATCH (New Feature)
// ===============================
exports.deleteMatch = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await MatchAnalysis.findOneAndDelete({ 
      _id: id, 
      user: req.user 
    });

    if (!deleted) {
      return res.status(404).json({ success: false, message: "Record not found or unauthorized" });
    }

    res.json({ success: true, message: "Match analysis deleted successfully" });
  } catch (error) {
    console.error("DELETE ERROR:", error);
    res.status(500).json({ success: false, message: "Delete failed" });
  }
};