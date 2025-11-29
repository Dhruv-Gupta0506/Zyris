const { GoogleGenerativeAI } = require("@google/generative-ai");
const Interview = require("../models/Interview");
const crypto = require("crypto");

// ---- Helper to parse JSON safely ----
function parseGeminiJson(text) {
  if (!text) return null;
  try {
    const trimmed = text.trim();
    // Handle markdown code blocks
    const cleanText = trimmed.replace(/```json|```/g, "").trim();
    
    // Raw JSON array
    if (cleanText.startsWith("[") && cleanText.endsWith("]")) {
      return JSON.parse(cleanText);
    }
    
    // Extract JSON array block
    const match = cleanText.match(/\[[\s\S]*\]/);
    if (match) return JSON.parse(match[0]);

    return null;
  } catch (err) {
    console.error("INTERVIEW JSON PARSE ERROR:", err.message);
    return null;
  }
}

// =========================================================
// ROLE CATEGORY CLASSIFIER
// =========================================================
function detectCategory(role) {
  const r = role.toLowerCase();

  if (r.includes("frontend") || r.includes("react") || r.includes("ui") || r.includes("vue") || r.includes("angular"))
    return "frontend";

  if (r.includes("backend") || r.includes("node") || r.includes("java") || r.includes("spring") || r.includes("django") || r.includes("golang"))
    return "backend";

  if (r.includes("fullstack") || r.includes("full stack") || r.includes("mern"))
    return "fullstack";

  if (r.includes("ios") || r.includes("android") || r.includes("mobile") || r.includes("react native") || r.includes("flutter"))
    return "mobile";

  if (r.includes("data") || r.includes("ml") || r.includes("ai") || r.includes("analyst"))
    return "data";

  if (r.includes("devops") || r.includes("cloud") || r.includes("aws") || r.includes("gcp") || r.includes("azure"))
    return "devops";

  if (r.includes("game") || r.includes("unity") || r.includes("unreal"))
    return "game";

  if (r.includes("sde") || r.includes("software engineer") || r.includes("developer"))
    return "sde";

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
    const timestamp = Date.now();

    const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
      .getGenerativeModel({
        model: "gemini-2.0-flash",
        generationConfig: {
          temperature: difficulty === "easy" ? 0.7 : 
                       difficulty === "medium" ? 0.85 : 1.0 
        }
      });

    const prompt = `
    Generate exactly ${questionCount} interview questions for a ${role} position.
    
    CONTEXT:
    - Role: ${role}
    - Category: ${category}
    - Difficulty: ${difficulty}
    - Random Seed: ${seed}-${timestamp}

    QUALITY GUIDELINES:
    1. PRACTICALITY: Prefer scenario-based or conceptual questions over generic "What is X?".
    2. CODE SNIPPETS: If asking to debug, refactor, or analyze code, YOU MUST INCLUDE THE CODE SNIPPET in the question text.
    3. VARIETY: Mix theoretical, practical, and (if applicable) system design questions.

    STRICT OUTPUT FORMAT:
    - Return a raw JSON ARRAY of strings.
    - Example: ["Question 1 text", "Question 2 text including code snippet:\nfunction x() {...}"]
    - Do NOT number the questions in the strings.
    
    Return ONLY valid JSON.
    `;

    const response = await ai.generateContent([{ text: prompt }]);
    const raw = response.response.text();
    
    let questions = parseGeminiJson(raw);

    if (!questions || !Array.isArray(questions)) {
      console.warn("Gemini returned non-JSON, falling back to split");
      questions = raw.split("\n")
        .map(q => q.replace(/^\d+[\.\)\-]\s*/, "").trim())
        .filter(q => q.length > 5);
    }

    const finalQuestions = questions.slice(0, questionCount);

    return res.json({ success: true, questions: finalQuestions });

  } catch (err) {
    console.error("QUESTION GEN ERROR:", err);
    return res.status(500).json({ message: "Failed to generate questions" });
  }
};

// =========================================================
// EVALUATE ANSWERS (OPTIMIZED FOR BEST ANALYSIS)
// =========================================================
exports.evaluateInterview = async (req, res) => {
  try {
    const { role, difficulty, questionCount, questions, answers } = req.body;

    if (!questions || !answers)
      return res.status(400).json({ message: "Missing data" });

    const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
      .getGenerativeModel({
        model: "gemini-2.0-flash",
        generationConfig: { temperature: 0.15 } // Lower temp for strict grading
      });

    const prompt = `
    Act as a "Bar Raiser" / Senior Technical Interviewer at a top-tier tech company (FAANG).
    Evaluate the candidate's answers for the role: ${role} (${difficulty} level).

    --- INTERVIEW DATA ---
    QUESTIONS: ${JSON.stringify(questions)}
    CANDIDATE ANSWERS: ${JSON.stringify(answers)}

    --- EVALUATION CRITERIA ---
    1. **Accuracy**: Is the technical solution correct?
    2. **Efficiency**: Did they use optimal Time/Space complexity (Big O)? (CRITICAL for coding).
    3. **Clarity**: Is the explanation clear, concise, and structured?
    4. **Completeness**: Did they handle edge cases and null checks?

    --- RESPONSE FORMAT (STRICT) ---
    Follow this template exactly. Do NOT use markdown code blocks (like \`\`\`).

    Q1 Feedback:
    Score: XX/100
    Strengths:
    - [Point 1]
    Weaknesses:
    - [Point 1]
    Suggested Improved Answer:
    [Provide the ideal 10/10 answer. For coding questions, YOU MUST INCLUDE Time & Space Complexity.]
    
    Q2 Feedback:
    ... (Repeat for all questions) ...

    Overall Summary:
    Overall Score: XX/100
    Key Strengths:
    - [Bullet point]
    Key Weaknesses:
    - [Bullet point]
    Improvement Plan:
    - [Actionable advice, e.g. "Practice Dynamic Programming", "Read System Design Primer"]
    Encouraging Closing Remark:
    [Short, motivating sentence]
    `;

    const response = await ai.generateContent([{ text: prompt }]);
    const evaluationText = response.response.text();

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
    return res.status(500).json({ message: "Interview evaluation failed" });
  }
};

// =========================================================
// HISTORY
// =========================================================
exports.history = async (req, res) => {
  try {
    const records = await Interview.find({ user: req.user })
      .sort({ createdAt: -1 });

    return res.json({ success: true, history: records });

  } catch (err) {
    return res.status(500).json({
      message: "Failed to load history",
      error: err.message
    });
  }
};