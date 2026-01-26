const { GoogleGenerativeAI } = require("@google/generative-ai");
const Interview = require("../models/Interview");
const crypto = require("crypto");
const { generateWithRetry } = require("../utils/aiHelper");

// =========================================================
// ROLE CATEGORY CLASSIFIER
// =========================================================
function detectCategory(role) {
  const r = role.toLowerCase();
  if (r.includes("frontend") || r.includes("react") || r.includes("ui") || r.includes("vue") || r.includes("angular")) return "frontend";
  if (r.includes("backend") || r.includes("node") || r.includes("java") || r.includes("spring") || r.includes("django") || r.includes("golang")) return "backend";
  if (r.includes("fullstack") || r.includes("full stack") || r.includes("mern")) return "fullstack";
  if (r.includes("ios") || r.includes("android") || r.includes("mobile") || r.includes("react native") || r.includes("flutter")) return "mobile";
  if (r.includes("data") || r.includes("ml") || r.includes("ai") || r.includes("analyst")) return "data";
  if (r.includes("devops") || r.includes("cloud") || r.includes("aws") || r.includes("gcp") || r.includes("azure")) return "devops";
  if (r.includes("game") || r.includes("unity") || r.includes("unreal")) return "game";
  if (r.includes("sde") || r.includes("software engineer") || r.includes("developer")) return "sde";
  return "generic";
}

// =========================================================
// GENERATE QUESTIONS
// =========================================================
exports.generateQuestions = async (req, res) => {
  try {
    const { role, difficulty, questionCount } = req.body;
    if (!role || !difficulty || !questionCount)
      return res.status(400).json({ message: "Missing required fields" });

    const category = detectCategory(role);
    const seed = crypto.randomUUID();
    
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: { 
        temperature: difficulty === "easy" ? 0.7 : difficulty === "medium" ? 0.85 : 1.0 
      }
    });

    const prompt = `
    Generate exactly ${questionCount} interview questions for a ${role} position.
    
    CONTEXT:
    - Role: ${role}
    - Difficulty: ${difficulty}
    - Random Seed: ${seed}

    GUIDELINES:
    1. PRACTICALITY: Prefer scenario-based or conceptual questions.
    2. CODE SNIPPETS: If asking to debug/refactor, INCLUDE THE CODE in the text.
    
    STRICT OUTPUT FORMAT:
    - Return a raw JSON ARRAY of strings.
    - Example: ["Question 1 text", "Question 2 text"]
    - Do NOT number the questions inside the strings.
    - Do NOT use markdown formatting.
    `;

    // --- GENERATE ---
    const result = await generateWithRetry(model, prompt);
    let raw = result.response.text();

    // --- ROBUST CLEANUP (The Fix) ---
    // 1. Strip Markdown wrappers
    raw = raw.replace(/```json/g, "").replace(/```/g, "");

    // 2. Extract strictly the JSON array [ ... ]
    const firstBracket = raw.indexOf('[');
    const lastBracket = raw.lastIndexOf(']');
    
    let questions = [];

    if (firstBracket !== -1 && lastBracket !== -1) {
        try {
            const jsonString = raw.substring(firstBracket, lastBracket + 1);
            questions = JSON.parse(jsonString);
        } catch (e) {
            console.warn("JSON extraction failed, attempting fallback split");
        }
    }

    // 3. Fallback: If JSON failed, split by lines and filter garbage
    if (!Array.isArray(questions) || questions.length === 0) {
        questions = raw.split("\n")
            .map(q => q.trim())
            .filter(q => q.length > 10) // Filter out short garbage
            .filter(q => !q.startsWith("[") && !q.startsWith("]")); // Filter out standalone brackets
    }

    // 4. Final String Sanitization (Remove "1.", quotes, etc.)
    const finalQuestions = questions
      .slice(0, questionCount)
      .map(q => {
          if (typeof q !== 'string') return "";
          // Remove leading numbers (e.g. "1. ", "1)")
          let clean = q.replace(/^\s*\d+[\.\)\:\-]?\s*/, "");
          // Remove surrounding quotes if double quoted
          clean = clean.replace(/^["'](.*)["']$/, '$1');
          return clean.trim();
      });

    return res.json({ success: true, questions: finalQuestions });

  } catch (err) {
    console.error("QUESTION GEN ERROR:", err);
    return res.status(500).json({ 
        message: "Failed to generate questions", 
        error: err.message 
    });
  }
};

// =========================================================
// EVALUATE ANSWERS
// =========================================================
exports.evaluateInterview = async (req, res) => {
  try {
    const { role, difficulty, questionCount, questions, answers } = req.body;
    if (!questions || !answers) return res.status(400).json({ message: "Missing data" });

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: { temperature: 0.15 }
    });

    const prompt = `
    Act as a Senior Technical Interviewer. Evaluate these answers for ${role} (${difficulty}).

    QUESTIONS: ${JSON.stringify(questions)}
    ANSWERS: ${JSON.stringify(answers)}

    OUTPUT FORMAT (Strict Template):
    Q1 Feedback:
    Score: XX/100
    Strengths:
    - ...
    Weaknesses:
    - ...
    Suggested Answer:
    ...

    (Repeat for all questions)

    Overall Summary:
    Overall Score: XX/100
    Key Strengths: ...
    Key Weaknesses: ...
    Improvement Plan: ...
    Encouraging Closing Remark: ...

    IMPORTANT: Do NOT use markdown bolding (asterisks like **text**) in the output. Keep it clean plain text.
    `;

    const result = await generateWithRetry(model, prompt);
    const evaluationText = result.response.text();

    const scoreMatch = evaluationText.match(/Overall Score:\s*(\d{1,3})/i);
    let score = scoreMatch ? parseInt(scoreMatch[1]) : 0;
    score = Math.min(Math.max(score, 0), 100);

    const saved = await Interview.create({
      user: req.user,
      role,
      difficulty,
      questionCount,
      questions,
      answers,
      evaluationText,
      score
    });

    return res.json({ 
        success: true, 
        evaluation: evaluationText, 
        score, 
        id: saved._id 
    });

  } catch (err) {
    console.error("EVALUATION ERROR:", err);
    return res.status(500).json({ 
        message: "Evaluation failed", 
        error: err.message 
    });
  }
};

// =========================================================
// HISTORY & DELETE
// =========================================================
exports.getHistory = async (req, res) => {
  try {
    const records = await Interview.find({ user: req.user }).sort({ createdAt: -1 });
    return res.json({ success: true, history: records });
  } catch (err) {
    return res.status(500).json({ message: "Failed to load history", error: err.message });
  }
};

exports.deleteInterview = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Interview.findOneAndDelete({ _id: id, user: req.user });
    if (!deleted) return res.status(404).json({ success: false, message: "Not found" });
    res.json({ success: true, message: "Deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Delete failed" });
  }
};