const { GoogleGenerativeAI } = require("@google/generative-ai");
const Interview = require("../models/Interview");
const crypto = require("crypto");

// ===============================
// GENERATE INTERVIEW QUESTIONS
// ===============================
exports.generateQuestions = async (req, res) => {
  try {
    const { role, difficulty, questionCount } = req.body;

    if (!role || !difficulty || !questionCount) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      generationConfig: {
        temperature:
          difficulty === "easy" ? 0.55 : difficulty === "medium" ? 0.7 : 0.85,
      },
    });

    const variationSeed = crypto.randomUUID();

    const prompt = `
Generate exactly ${questionCount} interview questions.

Candidate Role: "${role}"
Difficulty Level: ${difficulty}

STRICT OUTPUT RULES:
- MUST output EXACTLY ${questionCount} questions
- MUST number them 1, 2, 3...
- NO explanations
- NO example answers
- NO filler or intro sentences
- NO repeated structures or wording
- NO algorithm, DSA, tree, graph, DP, system design, or OS topics UNLESS the role itself naturally requires them

ROLE RELEVANCE REQUIREMENT:
ALL questions must be directly tied to the role "${role}" and its realistic interview expectations.

ROLE-BASED SCOPE LOGIC:
If the role implies a technology domain, limit questions ONLY to that domain.
Examples:
- "React developer" → hooks, state, components, performance, routing
- "Node developer" → async, event loop, Express, streams, auth, Redis
- "MERN" → MongoDB, Express, React, Node (NOT DSA)
- "Java backend" → Spring, JVM, REST, concurrency (NOT DOM)
- "Python data analyst" → pandas, NumPy, data cleaning (NOT React)

CODING QUESTION RULE:
If ${questionCount} >= 2:
- At least ${Math.ceil(questionCount * 0.4)} questions MUST be coding-style and MUST start with:
  "Write a function...", "Implement...", "Code...", "Create...", "Given input, produce..."

DIFFICULTY MAPPING:
Easy → fundamentals for THIS role
Medium → practical, applied role-specific scenarios
Hard → advanced role-specific depth (NOT general CS!)

UNIQUENESS:
Use wording variation
Avoid template phrasing
Seed: ${variationSeed}

Return ONLY the numbered list.
`;

    const result = await model.generateContent([{ text: prompt }]);

    const text = result.response.text();

    const questions = text
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 3)
      .slice(0, questionCount);

    return res.json({
      success: true,
      questions,
    });
  } catch (err) {
    console.error("GENERATE QUESTIONS ERROR:", err);
    return res.status(500).json({ message: "Failed to generate questions" });
  }
};

// ===============================
// EVALUATE USER ANSWERS
// ===============================
exports.evaluateInterview = async (req, res) => {
  try {
    const { role, difficulty, questionCount, questions, answers } = req.body;

    if (!questions || !answers) {
      return res.status(400).json({ message: "Missing questions or answers" });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      generationConfig: {
        temperature: 0.05,
      },
    });

    const prompt = `
You are an expert technical interviewer.

Determine whether each answer is:
- code-based
- theoretical
- mixed

Evaluate EACH question-answer pair in THIS EXACT FORMAT:

Q1 Evaluation:
Score: XX/100
Strengths:
- bullet
Weaknesses:
- bullet
Suggested Improved Answer:
text (clean formatting, include code only if needed)
Improvement Tip:
text

(Repeat for Q2, Q3, etc — NO missing, NO extra)

Then provide ONE FINAL SECTION ONLY:

Overall Summary:
Overall Score: XX/100
Key Strengths:
- bullet
Key Weaknesses:
- bullet
Improvement Plan:
- bullet
Encouraging Closing Remark:
text

STRICT RULES:
- Do NOT repeat questions
- Do NOT repeat user answers
- Do NOT include multiple summaries
- Do NOT include extra commentary
- Do NOT include headings like ### or ##
- Coding questions scored LOWER if answer is only theory
- Code must be formatted plainly (no markdown, no backticks)

Questions:
${questions.join("\n")}

Candidate Answers:
${answers.join("\n")}
`;

    const result = await model.generateContent([{ text: prompt }]);
    const evaluationText = result.response.text();

    const scoreMatch = evaluationText.match(/Overall Score:\s*(\d{1,3})/i);
    const score = scoreMatch ? Math.min(parseInt(scoreMatch[1]), 100) : 50;

    const saved = await Interview.create({
      user: req.user,
      role,
      difficulty,
      questionCount,
      questions,
      answers,
      evaluationText,
      score,
    });

    return res.json({
      success: true,
      evaluation: evaluationText,
      score,
      id: saved._id,
    });
  } catch (err) {
    console.error("EVALUATE INTERVIEW ERROR:", err);
    return res.status(500).json({ message: "Interview evaluation failed" });
  }
};

// ===============================
// HISTORY
// ===============================
exports.history = async (req, res) => {
  try {
    const records = await Interview.find({ user: req.user }).sort({
      createdAt: -1,
    });

    return res.json({
      success: true,
      history: records,
    });
  } catch (err) {
    console.error("INTERVIEW HISTORY ERROR:", err);
    return res.status(500).json({
      message: "Failed to load interview history",
      error: err.message,
    });
  }
};
