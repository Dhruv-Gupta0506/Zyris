const { GoogleGenerativeAI } = require("@google/generative-ai");
const JobAnalysis = require("../models/JobAnalysis");
const ResumeAnalysis = require("../models/ResumeAnalysis");
const { tryParseJson, generateWithRetry } = require("../utils/aiHelper"); // Import helper

// ===============================
// ANALYZE JD – FIXED SCALING & PROMPT
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
    // IMPORTANT: Ensure your ResumeAnalysis model actually saves the full 'rawText' or detailed 'skills' 
    // so the AI has enough context to compare against the JD.
    const latestResume = await ResumeAnalysis.findOne({ user: req.user }).sort({ createdAt: -1 });

    if (!latestResume) {
      return res.status(400).json({
        message: "No resume analysis found. Please upload a resume first.",
      });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash", // or "gemini-1.5-flash" if 2.0 isn't available yet
      generationConfig: { temperature: 0.2 },
    });

    // --- IMPROVED PROMPT ---
    const prompt = `
    You are an expert Technical Recruiter and ATS Analyst. 
    Your task is to calculate the compatibility between a CANDIDATE RESUME and a JOB DESCRIPTION (JD).

    CRITICAL INSTRUCTION: 
    - Output scores as INTEGERS from 0 to 100. (e.g., 85, 90, 70). Do NOT use decimals (0.8) or ratios.
    - "fitVerdict" must be human-readable: "High Match", "Good Match", "Average Match", "Low Match".
    
    SPECIFIC RULES FOR FIELDS:
    1. "missingSkills": IDENTIFY GAPS. If the score is < 100, this array CANNOT be empty. Look for specific tools (e.g., Docker, Redux, AWS) in the JD that are missing in the Resume.
    2. "recommendedKeywords": DO NOT use generic words like "Coding", "Hardworking", "Programming". Use specific technical terms, frameworks, or industry standards found in the JD (e.g., "Microservices", "CI/CD", "Agile", "REST API").
    3. "improvementTips": Provide actionable, specific advice to bridge the gap.

    STRICT JSON OUTPUT FORMAT:
    {
      "matchScore": number, // Overall compatibility (0-100)
      "fitVerdict": string, // e.g. "High Match"

      "scoreBreakdown": {
        "technicalSkills": number, // 0-100
        "fundamentalsAndDSA": number, // 0-100
        "projectRelevance": number, // 0-100
        "softwareEngineeringPractices": number, // 0-100
        "atsKeywordMatch": number // 0-100
      },

      "explicitRequirements": ["req1", "req2"], // 3-5 hard requirements extracted from JD
      "implicitRequirements": ["req1", "req2"], // 3-5 soft/implied expectations
      
      "strengthsBasedOnJD": ["strength1", "strength2"], // 3 specific strengths of the candidate relative to this JD
      "missingSkills": ["skill1", "skill2"], // Critical skills found in JD but missing in Resume
      "recommendedKeywords": ["kw1", "kw2"], // Specific keywords to add to improve ATS score

      "tailoredBulletSuggestions": ["bullet1", "bullet2"], // 2-3 Rewrite suggestions for resume bullets to match JD
      "improvementTips": ["tip1", "tip2"] // 2-3 actionable tips
    }

    --- INPUT DATA ---
    JOB TITLE: ${jobTitle || "Not specified"}
    
    JOB DESCRIPTION:
    ${jobDescription}

    CANDIDATE RESUME PROFILE:
    ${JSON.stringify(latestResume, null, 2)}
    `;

    // --- RETRY LOGIC (Handling Network Errors) ---
    const result = await generateWithRetry(model, prompt);
    const rawText = result.response.text();
    const parsed = tryParseJson(rawText) || {};

    // Default values if AI fails to return structure
    const safeParsed = {
      matchScore: typeof parsed.matchScore === "number" ? parsed.matchScore : 0,
      fitVerdict: parsed.fitVerdict || "Unknown",
      scoreBreakdown: {
        technicalSkills: parsed.scoreBreakdown?.technicalSkills || 0,
        fundamentalsAndDSA: parsed.scoreBreakdown?.fundamentalsAndDSA || 0,
        projectRelevance: parsed.scoreBreakdown?.projectRelevance || 0,
        softwareEngineeringPractices: parsed.scoreBreakdown?.softwareEngineeringPractices || 0,
        atsKeywordMatch: parsed.scoreBreakdown?.atsKeywordMatch || 0,
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
    
    // Friendly error message for network issues
    const message = err.message.includes("fetch failed") 
      ? "Network error connecting to AI. Please try again." 
      : "Job analysis failed";

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

// ===============================
// DELETE JOB ANALYSIS (New Feature)
// ===============================
exports.deleteJob = async (req, res) => {
  try {
    const { id } = req.params;

    // Use findOneAndDelete with 'user' to ensure users can only delete THEIR OWN data
    const deleted = await JobAnalysis.findOneAndDelete({ 
      _id: id, 
      user: req.user 
    });

    if (!deleted) {
      return res.status(404).json({ success: false, message: "Record not found or unauthorized" });
    }

    res.json({ success: true, message: "Job analysis deleted successfully" });
  } catch (error) {
    console.error("DELETE ERROR:", error);
    res.status(500).json({ success: false, message: "Delete failed" });
  }
};