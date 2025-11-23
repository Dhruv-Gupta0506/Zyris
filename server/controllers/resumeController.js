const fs = require("fs");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const ResumeAnalysis = require("../models/ResumeAnalysis");

// -------- Helper: safely parse JSON from Gemini text --------
function parseGeminiJson(text) {
  if (!text) return null;

  try {
    const trimmed = text.trim();

    // If it's already clean JSON
    if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
      return JSON.parse(trimmed);
    }

    // Try to grab the first {...} block
    const match = trimmed.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);

    return null;
  } catch (err) {
    console.error("JSON PARSE ERROR from Gemini:", err.message);
    return null;
  }
}

// -------- Detect evaluation mode from targetRole --------
function detectRoleMode(roleRaw) {
  if (!roleRaw) return "balanced";
  const role = roleRaw.toLowerCase();

  if (
    role.includes("sde") ||
    role.includes("software engineer") ||
    role.includes("software developer") ||
    role.includes("backend engineer")
  ) {
    return "sde";
  }

  if (
    role.includes("full stack") ||
    role.includes("fullstack") ||
    role.includes("mern") ||
    role.includes("web developer")
  ) {
    return "fullstack";
  }

  if (
    role.includes("frontend") ||
    role.includes("front end") ||
    role.includes("react") ||
    role.includes("ui")
  ) {
    return "frontend";
  }

  if (
    role.includes("backend") ||
    role.includes("back end") ||
    role.includes("node") ||
    role.includes("api")
  ) {
    return "backend";
  }

  return "balanced";
}

// -------- Build extra instructions based on roleMode --------
function buildModeGuidelines(roleMode, role) {
  switch (roleMode) {
    case "sde":
      return `
ROLE MODE: SDE / Software Engineer

- Emphasize computer science fundamentals: Data Structures, Algorithms, Problem Solving, Complexity.
- Penalize resumes that do NOT mention DSA, algorithms, or problem-solving.
- "missingKeywords" should likely include DSA / Algorithms / Problem Solving if absent.
- "suggestedRoles" should lean toward: "SDE Intern", "Software Engineer Intern", "Backend Developer Intern".
- "weaknesses" should call out shallow project complexity or tutorial-level projects if true.
`;
    case "fullstack":
      return `
ROLE MODE: FULL-STACK / MERN

- Focus on React, Node, Express, MongoDB, REST APIs, authentication, deployment.
- Penalize resumes that do NOT clearly show end-to-end ownership (frontend + backend).
- "missingKeywords" may include: REST APIs, Authentication, Deployment, Testing, CI/CD.
- "suggestedRoles" should lean toward: "Full Stack Developer Intern", "MERN Developer", "Junior Full Stack Developer".
`;
    case "frontend":
      return `
ROLE MODE: FRONTEND

- Focus on React, UI, responsiveness, state management, performance.
- Penalize resumes that lack detail about UI challenges, responsiveness, or component architecture.
- "missingKeywords" may include: Accessibility, Performance Optimization, Component Patterns, Design Systems.
- "suggestedRoles" should lean toward: "Frontend Developer Intern", "React Developer Intern".
`;
    case "backend":
      return `
ROLE MODE: BACKEND

- Focus on Node, Express, databases, REST APIs, security, scalability.
- Penalize resumes that do NOT clarify backend responsibilities, data flow, or DB schema.
- "missingKeywords" may include: REST APIs, Caching, Indexing, Transactions, Authentication/Authorization, Testing.
- "suggestedRoles" should lean toward: "Backend Developer Intern", "Node.js Developer Intern".
`;
    default:
      return `
ROLE MODE: BALANCED

- Mix fundamentals + web development.
- Be realistic in both strengths and weaknesses, not extreme in either direction.
`;
  }
}

// ===============================
// ANALYZE RESUME (ROLE-AWARE + HONEST)
// ===============================
exports.analyzeResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No PDF uploaded" });
    }

    const { targetRole } = req.body;
    const role = targetRole && targetRole.trim().length > 0
      ? targetRole.trim()
      : "Software Engineer";

    const roleMode = detectRoleMode(role);
    const modeGuidelines = buildModeGuidelines(roleMode, role);

    const buffer = fs.readFileSync(req.file.path);

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      generationConfig: { temperature: 0.08 },
    });

    const prompt = `
You are an ATS scoring engine + experienced technical recruiter.

Analyze a student's resume PDF for the target role: "${role}".

OUTPUT REQUIREMENTS:
- Be honest, practical, and direct.
- No sugarcoating. No motivational fluff.
- No fake praise.
- No invented companies, internships, hackathons, or technologies.
- KEEP PROJECT NAMES AND DOMAINS EXACT — do NOT rename projects or change what they are about.
- Do NOT hallucinate achievements.
- You may only add light, reasonable metrics if they are strongly implied by the text.

${modeGuidelines}

You MUST return ONLY VALID JSON in EXACTLY this structure (no extra keys, no comments, no markdown):

{
  "atsScore": number,
  "scoringBreakdown": {
    "keywordMatch": number,
    "actionVerbs": number,
    "quantifiedResults": number,
    "formattingClarity": number,
    "relevanceAlignment": number
  },
  "skills": [ "skill1", "skill2", "skill3" ],
  "strengths": [ "strength1", "strength2" ],
  "weaknesses": [ "weakness1", "weakness2" ],
  "missingKeywords": [ "keyword1", "keyword2" ],
  "suggestedRoles": [ "role1", "role2" ],
  "recruiterImpression": "short, realistic, 2–3 sentences max",
  "improvementChecklist": [ "fix1", "fix2" ],
  "summaryRewrite": "short rewritten summary aligned to ${role}",
  "projectRewrites": [ "rewrite1", "rewrite2" ],
  "bulletRewrites": [ "Old: ... New: ..." ]
}

SCORING RULES (Honest Recruiter Mode):
- "atsScore" must be between 45 and 80.
- "scoringBreakdown" sub-scores must each be between 30 and 90.
- "atsScore" should roughly match the average of the breakdown scores.
- Weak resumes (vague bullets, no metrics, no fundamentals for ${role}) → 45–55.
- Average student resumes → 56–68.
- Strong student resumes with clear metrics and good alignment → 69–80.

FIELD RULES:

- "skills":
  - ONLY list skills, languages, frameworks, tools that clearly appear in the resume.
  - Do NOT hallucinate skills like "AWS", "Kubernetes", "Docker" unless present.

- "strengths":
  - 3–6 items max.
  - Each must be concrete and tied to the actual resume (e.g. "Has shipped 2 MERN projects end-to-end", "Shows hands-on experience with React + Node").

- "weaknesses":
  - 3–7 items.
  - Must be specific and tied to the target role "${role}" and ${roleMode.toUpperCase()} mode.
  - Examples: "No mention of Data Structures or Algorithms", "No metrics for project impact", "Project descriptions feel tutorial-level".

- "missingKeywords":
  - From the perspective of "${role}" and the selected mode.
  - Do NOT repeat things that are already clearly present.
  - Examples for SDE: "Data Structures", "Algorithms", "Problem Solving", "Time Complexity", "Unit Testing".

- "suggestedRoles":
  - Realistic roles based on the current resume, not dreams or senior positions.
  - E.g. "SDE Intern", "Software Engineer Intern", "Frontend Developer Intern", "Full Stack Developer Intern".

- "recruiterImpression":
  - 2–3 sentences.
  - Tone: honest recruiter, not career coach.
  - Call out both potential AND gaps.

- "improvementChecklist":
  - 5–8 sharp, actionable, concrete items.
  - No vague lines like "improve your resume".
  - Examples: "Add 2–3 quantified metrics to each project", "Add a separate skills section with DSA and OOP", "Clarify your role and ownership within each project".

- "summaryRewrite":
  - A short summary (2–4 lines) tailored to "${role}".
  - Mention stack + type of work + 1–2 strengths + a hint of impact.
  - Do NOT use words like "enthusiastic", "passionate", "eager to learn".
  - Do NOT invent competitions or hackathons.

- "projectRewrites":
  - 1–3 project descriptions rewritten to be clearer and more impact-focused.
  - KEEP ORIGINAL PROJECT NAMES AND DOMAINS.
  - Include stack + what you built + realistic impact.

- "bulletRewrites":
  - 2–4 weak bullets rewritten.
  - Use the format: "Old: <original>. New: <improved with stronger verbs + metrics>."
  - Do NOT invent companies or fake numbers.
  - You may slightly estimate metrics ONLY if implied (e.g. "improved performance" → "improved performance by ~15%" is acceptable).

FINAL RULE:
Return ONLY the JSON object matching the schema above.
No backticks.
No "Here is the JSON".
No text outside the JSON.
`.trim();

    const result = await model.generateContent([
      { text: prompt },
      {
        inlineData: {
          data: buffer.toString("base64"),
          mimeType: "application/pdf",
        },
      },
    ]);

    const rawText = result.response.text();
    const parsed = parseGeminiJson(rawText) || {};

    const doc = await ResumeAnalysis.create({
      user: req.user,
      fileName: req.file.originalname,
      targetRole: role,
      atsScore: parsed.atsScore ?? null,
      scoringBreakdown: parsed.scoringBreakdown ?? {},
      skills: parsed.skills ?? [],
      strengths: parsed.strengths ?? [],
      weaknesses: parsed.weaknesses ?? [],
      missingKeywords: parsed.missingKeywords ?? [],
      suggestedRoles: parsed.suggestedRoles ?? [],
      recruiterImpression: parsed.recruiterImpression ?? null,
      improvementChecklist: parsed.improvementChecklist ?? [],
      summaryRewrite: parsed.summaryRewrite ?? null,
      projectRewrites: parsed.projectRewrites ?? [],
      bulletRewrites: parsed.bulletRewrites ?? [],
      rawText,
    });

    // Cleanup temp PDF
    try {
      fs.unlinkSync(req.file.path);
    } catch (e) {
      // ignore
    }

    return res.json({
      success: true,
      analysis: doc,
    });

  } catch (err) {
    console.error("RESUME ANALYSIS ERROR:", err);
    return res.status(500).json({
      success: false,
      message: "Resume analysis failed",
      error: err.message,
    });
  }
};


// ===============================
// HISTORY (STRUCTURED, CLEAN)
// ===============================
exports.history = async (req, res) => {
  try {
    const records = await ResumeAnalysis.find({ user: req.user })
      .sort({ createdAt: -1 })
      .select("-rawText -__v")
      .lean();

    return res.json({
      success: true,
      count: records.length,
      history: records,
    });

  } catch (err) {
    console.error("HISTORY ERROR:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to load resume history",
      error: err.message,
    });
  }
};
