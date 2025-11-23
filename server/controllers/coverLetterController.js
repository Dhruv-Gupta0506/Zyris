const { GoogleGenerativeAI } = require("@google/generative-ai");
const ResumeAnalysis = require("../models/ResumeAnalysis");
const JobAnalysis = require("../models/JobAnalysis");

// Detect strongest resume focus
function detectProfile(resume) {
  const text = (
    resume.analysisText +
    " " +
    (resume.skills || []).join(" ")
  ).toLowerCase();

  const dsaKeywords = ["data structures", "algorithms", "dsa", "problem solving", "competitive programming"];
  const fullstackKeywords = ["full stack", "mern", "react", "node", "api", "frontend", "backend"];

  let dsaScore = dsaKeywords.filter(k => text.includes(k)).length;
  let fsScore = fullstackKeywords.filter(k => text.includes(k)).length;

  if (dsaScore >= fsScore && dsaScore > 1) return "dsa";
  return "fullstack";
}

function extractFirstProject(bulletRewrites = [], projectRewrites = []) {
  if (projectRewrites?.length > 0) return projectRewrites[0];
  if (bulletRewrites?.length > 0) return bulletRewrites[0];
  return null;
}

function extractCompanyName(text = "") {
  const patt = [
    /([A-Z][A-Za-z0-9 .&-]+) is hiring/i,
    /hiring for .* at ([A-Z][A-Za-z0-9 .&-]+)/i,
    /role at ([A-Z][A-Za-z0-9 .&-]+)/i
  ];
  for (const r of patt) {
    const m = text.match(r);
    if (m) return m[1].trim();
  }
  return "";
}

// Clean AI output
function sanitize(text) {
  return text
    .replace(/Fit Forge:/gi, "")
    .replace(/I am writing[^.]+/gi, "")
    .replace(/I look forward[^.]+/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

// Ensure exactly 4 sentences
function enforceStructure(text) {
  let sentences = text.split(/[.!?]\s+/).filter(Boolean);
  if (sentences.length > 4) sentences = sentences.slice(0, 4);
  while (sentences.length < 4) sentences.push("I aim to contribute to measurable engineering outcomes");
  return sentences.join(". ") + ".";
}

// Remove double punctuation
function finalClean(text) {
  return text.replace(/\.\.+/g, ".").trim();
}

// =========================================
// FINAL DYNAMIC COVER LETTER GENERATOR
// =========================================
exports.generateCoverLetter = async (req, res) => {
  try {
    const { resumeId, jobId } = req.body;

    const resume = await ResumeAnalysis.findOne({ _id: resumeId, user: req.user });
    const job = await JobAnalysis.findOne({ _id: jobId, user: req.user });

    const profileType = detectProfile(resume);
    const strongestProject = extractFirstProject(resume.bulletRewrites, resume.projectRewrites);
    const companyName = extractCompanyName(job.jobDescription);

    const intro =
      profileType === "dsa"
        ? `I am applying for the ${job.jobTitle} role ${companyName ? "at " + companyName : ""} with strengths in Data Structures, Algorithms, problem-solving, and core CS fundamentals`
        : `I am applying for the ${job.jobTitle} role ${companyName ? "at " + companyName : ""} with experience in React.js, Node.js, JavaScript, MongoDB, Python, and SQL`;

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      generationConfig: { temperature: 0.01 }
    });

    const prompt = `
Write a FIRST-PERSON cover letter using EXACTLY FOUR SENTENCES.
Sentence 1 must be:
${intro}.
Sentence 2 must rewrite this project into a natural flowing sentence with measurable impact, no colon formatting:
${strongestProject}
Sentence 3 must show alignment with role expectations WITHOUT weaknesses, apologies, learning statements, or soft language.
Sentence 4 must close confidently with strong verbs like deliver, build, contribute, engineer — NOT eager, excited, passionate, or hoping.
Tone must be confident, concise, and professional.
Output must be plain text only.
`.trim();

    const result = await model.generateContent([{ text: prompt }]);
    let output = result.response.text().trim();

    output = sanitize(output);
    output = enforceStructure(output);
    output = finalClean(output);

    return res.json({ success: true, coverLetter: output });

  } catch (err) {
    return res.status(500).json({ success: false, message: "Cover letter generation failed" });
  }
};
