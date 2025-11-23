const ResumeAnalysis = require("../models/ResumeAnalysis");
const JobAnalysis = require("../models/JobAnalysis");

// Helper: normalize strings for comparison
function norm(str) {
  return String(str || "").toLowerCase().trim();
}

// Helper: detect broad role category from job title / target role
function getRoleCategory(jobTitle, targetRole) {
  const text = norm(jobTitle || "") + " " + norm(targetRole || "");

  if (text.includes("frontend") || text.includes("front-end") || text.includes("ui"))
    return "frontend";

  if (text.includes("backend") || text.includes("back-end") || text.includes("api"))
    return "backend";

  if (text.includes("full stack") || text.includes("full-stack") || text.includes("mern"))
    return "fullstack";

  if (
    text.includes("data engineer") ||
    text.includes("data analyst") ||
    text.includes("analytics")
  )
    return "data";

  if (
    text.includes("machine learning") ||
    text.includes("ml ") ||
    text.includes("ml/ai") ||
    text.includes("ai ") ||
    text.includes("data scientist")
  )
    return "ml-ai";

  if (text.includes("mobile") || text.includes("android") || text.includes("ios"))
    return "mobile";

  // default
  return "software-engineer";
}

exports.analyzeMatch = async (req, res) => {
  try {
    const { resumeId, jobId } = req.body;

    if (!resumeId || !jobId) {
      return res.status(400).json({
        success: false,
        message: "resumeId and jobId are required",
      });
    }

    // Get resume + JD, and ensure they belong to this user
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

    const roleCategory = getRoleCategory(job.jobTitle, resume.targetRole);

    const atsScore =
      typeof resume.atsScore === "number" ? resume.atsScore : null;
    const jdMatchScore =
      typeof job.matchScore === "number" ? job.matchScore : null;

    // ---------- Core skill alignment heuristic ----------
    const resumeSkills = (resume.skills || []).map(norm);
    const missingSkills = (job.missingSkills || []).map(norm);
    const recommendedKeywords = (job.recommendedKeywords || []).map(norm);

    const resumeSkillSet = new Set(resumeSkills);

    // For SWE / backend / fullstack, treat DS/Algo as critical
    const criticalKeywords = ["data structures", "algorithms", "dsa"];
    const hasCriticalOnResume = criticalKeywords.some((kw) =>
      resumeSkillSet.has(kw)
    );
    const missingCritical = criticalKeywords.filter((kw) =>
      missingSkills.includes(kw)
    );

    // Base core alignment from how many JD missing skills are already present
    let presentCount = 0;
    missingSkills.forEach((ms) => {
      if (resumeSkillSet.has(ms)) presentCount++;
    });
    const totalRelevant = missingSkills.length || 1;
    let coreAlignment = Math.round((presentCount / totalRelevant) * 100);

    // Penalize hard if SWE-type role and DS/Algo missing
    if (
      ["software-engineer", "backend", "fullstack", "ml-ai"].includes(
        roleCategory
      )
    ) {
      if (!hasCriticalOnResume) {
        coreAlignment = Math.min(coreAlignment, 50);
      }
      if (missingCritical.length > 0) {
        coreAlignment = Math.min(coreAlignment, 40);
      }
    }

    // ---------- Impact score heuristic (based on metrics in bullets) ----------
    const allBullets = [
      ...(resume.projectRewrites || []),
      ...(resume.bulletRewrites || []),
      ...(job.tailoredBulletSuggestions || []),
    ];

    let metricCount = 0;
    allBullets.forEach((b) => {
      if (/\d+%/.test(b) || /\d+\s*(users|requests|projects|tickets)/i.test(b)) {
        metricCount++;
      }
    });

    const impactScore =
      allBullets.length === 0
        ? null
        : Math.max(
            30,
            Math.min(100, Math.round((metricCount / allBullets.length) * 100))
          ); // at least 30 if there is *some* impact

    // ---------- Experience fit heuristic ----------
    // Very rough: more weaknesses = lower fit
    const weaknessesCount = (resume.weaknesses || []).length;
    let experienceFitScore = 80;
    if (weaknessesCount >= 3) experienceFitScore = 60;
    if (weaknessesCount >= 5) experienceFitScore = 45;

    // ---------- Overall Score ----------
    // weight by roleCategory a bit
    let overallScore = null;
    if (atsScore !== null && jdMatchScore !== null) {
      // base from ats + jd match
      let base = atsScore * 0.25 + jdMatchScore * 0.25;

      // add core alignment
      base += coreAlignment * 0.30;

      // add impact if available
      if (impactScore !== null) {
        base += impactScore * 0.10;
      } else {
        base += 50 * 0.10; // neutral
      }

      // add experience fit
      base += experienceFitScore * 0.10;

      overallScore = Math.round(base);
      overallScore = Math.max(0, Math.min(100, overallScore));
    }

    // ---------- Readiness level ----------
    const missingCount = (job.missingSkills || []).length;

    let readinessLevel = "Needs Improvement";

    if (overallScore === null) {
      readinessLevel = "Not Enough Data";
    } else {
      if (overallScore >= 80 && missingCount <= 1) {
        readinessLevel = "Strong Fit";
      } else if (overallScore >= 65 && missingCount <= 3) {
        readinessLevel = "Competitive but Needs Strengthening";
      } else if (overallScore >= 50) {
        readinessLevel = "Weak Fit — Skill Gaps";
      } else {
        readinessLevel = "Not Suitable for This Role Type";
      }
    }

    // ---------- Skill overlap (fixed) ----------
    // For now, don't mark your entire stack as irrelevant.
    const matchingSkills = [];
    const missingImportant = job.missingSkills || [];

    // "Irrelevant" is dangerous to guess without strong JD tech signals,
    // so for portfolio quality we simply don't label them aggressively.
    const irrelevantSkills = [];

    const improvementFocus = [
      ...(job.missingSkills || []).slice(0, 3),
      ...(job.improvementTips || []).slice(0, 2),
      ...(resume.improvementChecklist || []).slice(0, 2),
    ];

    const optimizedBullets = [
      ...(job.tailoredBulletSuggestions || []),
      ...(resume.bulletRewrites || []),
    ];

    // Rough estimate of potential score boost
    let scoreBoostEstimate = null;
    if (missingCount > 0) {
      scoreBoostEstimate = "+15 to +25 if you close key gaps and add proof (DSA, testing, metrics).";
    } else if (overallScore && overallScore < 80) {
      scoreBoostEstimate = "+5 to +10 with polish and stronger impact bullets.";
    } else {
      scoreBoostEstimate = "Already near-optimal for this JD; focus on interview prep.";
    }

    return res.json({
      success: true,
      overallScore,
      atsScore,
      jdMatchScore,
      readinessLevel,
      roleCategory,
      jobTitle: job.jobTitle,
      resumeFileName: resume.fileName,
      targetRole: resume.targetRole,
      skillOverlap: {
        matchingSkills,
        missingImportant,
        irrelevantSkills,
      },
      improvementFocus,
      optimizedBullets,
      jobFitVerdict: job.fitVerdict,
      jdMissingSkills: job.missingSkills || [],
      jdRecommendedKeywords: job.recommendedKeywords || [],
      scoreBoostEstimate,
    });
  } catch (err) {
    console.error("MATCH ANALYSIS ERROR:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to compute resume-JD match",
      error: err.message,
    });
  }
};
