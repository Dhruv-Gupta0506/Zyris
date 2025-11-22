const { GoogleGenerativeAI } = require("@google/generative-ai");
const JobAnalysis = require("../models/JobAnalysis");
const ResumeAnalysis = require("../models/ResumeAnalysis");

exports.analyzeJob = async (req, res) => {
  try {
    const { jobTitle, jobDescription } = req.body;

    if (!jobDescription || jobDescription.trim().length < 20) {
      return res.status(400).json({
        message: "Job description is too short or missing",
      });
    }

    // ✅ Get latest resume analysis of this user
    const latestResume = await ResumeAnalysis.findOne({ user: req.user })
      .sort({ createdAt: -1 });

    if (!latestResume) {
      return res.status(400).json({
        message: "No resume analysis found. Please analyze your resume first.",
      });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      generationConfig: {
        temperature: 0.15,
        topP: 0.85,
        topK: 30,
      },
    });

    const prompt = `
You are an expert ATS + recruiter alignment evaluator.

You are given:
✅ Job Description
✅ Candidate Resume Analysis (skills, strengths, weaknesses, keywords)

Produce a **short, highly useful JD match evaluation** with the following sections ONLY:

1. **Match Score (0-100)** — based on skills, relevance, domain fit, and keywords
2. **Top Strengths Based on JD** — max 4 bullet points
3. **Missing / Important Skills** — max 5 bullet points
4. **Recommended Keywords to Add** — max 6, ATS-friendly
5. **Tailored Resume Bullet Suggestions** — 2 bullets the candidate can paste directly into resume
6. **Fit Verdict (Yes / Maybe / No)** — short reasoning
7. **Improvement Tips** — max 4 bullets, practical & realistic

Tone rules:
- concise
- no fluff
- no long paragraphs
- must save user time
- must feel actionable, not generic

JOB TITLE: ${jobTitle || "Not specified"}

JOB DESCRIPTION:
${jobDescription}

CANDIDATE RESUME INSIGHTS:
${latestResume.analysisText}
`;

    const result = await model.generateContent([{ text: prompt }]);
    const analysisText = result.response.text();

    // ✅ Save to DB
    const saved = await JobAnalysis.create({
      user: req.user,
      jobTitle,
      jobDescription,
      analysisText,
    });

    return res.json({
      success: true,
      analysis: analysisText,
      id: saved._id,
    });

  } catch (err) {
    console.error("JD ANALYSIS ERROR:", err);
    return res.status(500).json({
      message: "Job analysis failed",
      error: err.message,
    });
  }
};


// ✅ JD HISTORY
exports.history = async (req, res) => {
  try {
    const records = await JobAnalysis.find({ user: req.user })
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      history: records,
    });

  } catch (err) {
    console.error("JD HISTORY ERROR:", err);
    return res.status(500).json({
      message: "Failed to load JD history",
      error: err.message,
    });
  }
};
