const fs = require("fs");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const ResumeAnalysis = require("../models/ResumeAnalysis");

// ===============================
// ANALYZE RESUME
// ===============================
exports.analyzeResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No PDF uploaded" });
    }

    const buffer = fs.readFileSync(req.file.path);

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      generationConfig: { temperature: 0.1 },
    });

    const prompt = `
You are an ATS resume evaluation expert.
Analyze the resume and provide a SHORT, CONCISE report.

RETURN THE RESULTS IN THIS EXACT STRUCTURE:

1. ATS Score (0-100)

2. Key Skills Extracted (bullet points)

3. Strengths (bullet points)

4. Weaknesses (bullet points)

5. Missing Keywords (bullet points)

6. Suggested Job Roles (bullet points)

7. Recruiter Impression (2–3 sentences max)

8. Resume Improvement Checklist (5–8 bullets, actionable, no fluff)

Rules:
- Do NOT write long paragraphs
- Do NOT repeat the same point
- Do NOT include irrelevant commentary
- Keep everything tight, useful, and time-efficient
- User should understand exactly what to fix quickly
`;

    const result = await model.generateContent([
      { text: prompt },
      {
        inlineData: {
          data: buffer.toString("base64"),
          mimeType: "application/pdf",
        },
      },
    ]);

    const analysisText = result.response.text();

    await ResumeAnalysis.create({
      user: req.user,
      fileName: req.file.originalname,
      analysisText,
    });

    fs.unlinkSync(req.file.path);

    return res.json({
      success: true,
      analysis: analysisText,
    });

  } catch (err) {
    console.error("RESUME ANALYSIS ERROR:", err);
    return res.status(500).json({
      message: "Resume analysis failed",
      error: err.message
    });
  }
};


// ===============================
// HISTORY
// ===============================
exports.history = async (req, res) => {
  try {
    const records = await ResumeAnalysis.find({ user: req.user })
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      history: records
    });

  } catch (err) {
    console.error("HISTORY ERROR:", err);
    return res.status(500).json({
      message: "Failed to load history",
      error: err.message
    });
  }
};
