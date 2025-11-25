// frontend/components/ResumeAnalyzer.jsx
import { useState } from "react";
import axios from "axios";
import API_URL from "../api/api";

export default function ResumeAnalyzer() {
  const [file, setFile] = useState(null);
  const [targetRole, setTargetRole] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    const selected = e.target.files[0];

    if (!selected) {
      setFile(null);
      return;
    }

    if (selected.type !== "application/pdf") {
      alert("Only PDF files are allowed!");
      e.target.value = "";
      setFile(null);
      return;
    }

    // Optional: file size client-side guard (5MB)
    if (selected.size > 5 * 1024 * 1024) {
      alert("Please upload a PDF smaller than 5MB.");
      e.target.value = "";
      setFile(null);
      return;
    }

    setFile(selected);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!file) {
      alert("Please select a PDF file first.");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      alert("You are not logged in.");
      return;
    }

    setLoading(true);
    setAnalysis(null);

    try {
      const formData = new FormData();
      formData.append("resume", file);
      formData.append("targetRole", targetRole);

      const res = await axios.post(`${API_URL}/resume/analyze`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
        timeout: 120000, // 2 minutes - AI may take time
      });

      setAnalysis(res.data.analysis);
    } catch (err) {
      console.error(err);
      const message = err.response?.data?.message || "Failed to analyze resume.";
      alert(message);
    } finally {
      setLoading(false);
    }
  };

  // Safe display helpers
  const safeNum = (n) => (typeof n === "number" ? n : "N/A");
  const safeArr = (a) => (Array.isArray(a) && a.length ? a : []);

  return (
    <div style={{ padding: "20px" }}>
      <h2>Resume Analyzer</h2>

      <form onSubmit={handleSubmit} style={{ marginTop: "20px" }}>
        <div style={{ marginBottom: "15px" }}>
          <label style={{ display: "block", marginBottom: "8px", fontWeight: "bold" }}>
            Select Resume (PDF only):
          </label>

          <input type="file" accept="application/pdf" onChange={handleFileChange} />
        </div>

        <div style={{ marginBottom: "15px" }}>
          <label style={{ display: "block", marginBottom: "8px", fontWeight: "bold" }}>
            Target Role (optional but improves results):
          </label>

          <input
            type="text"
            placeholder="e.g., Frontend Developer, MERN Developer, Java Backend, etc."
            value={targetRole}
            onChange={(e) => setTargetRole(e.target.value)}
            style={{ padding: "6px", width: "60%" }}
          />
        </div>

        {file && (
          <p style={{ marginBottom: "20px", color: "green" }}>
            Selected File: <b>{file.name}</b>
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            padding: "10px 20px",
            background: loading ? "gray" : "black",
            color: "white",
            border: "none",
            cursor: "pointer",
          }}
        >
          {loading ? "Analyzing..." : "Analyze Resume"}
        </button>
      </form>

      {analysis && (
        <div style={{ marginTop: "30px" }}>
          <h3>Resume Analysis</h3>

          <p>
            <b>Target Role:</b> {analysis.targetRole ?? "Not specified"}
          </p>

          <p>
            <b>ATS Score:</b> {safeNum(analysis.atsScore)}
          </p>

          {analysis.scoringBreakdown && (
            <>
              <h4>Scoring Breakdown</h4>
              <ul>
                <li>Keyword Match: {safeNum(analysis.scoringBreakdown.keywordMatch)}</li>
                <li>Action Verbs: {safeNum(analysis.scoringBreakdown.actionVerbs)}</li>
                <li>Quantified Results: {safeNum(analysis.scoringBreakdown.quantifiedResults)}</li>
                <li>Formatting Clarity: {safeNum(analysis.scoringBreakdown.formattingClarity)}</li>
                <li>Relevance Alignment: {safeNum(analysis.scoringBreakdown.relevanceAlignment)}</li>
              </ul>
            </>
          )}

          <h4>Skills</h4>
          <ul>{safeArr(analysis.skills).map((s, i) => <li key={i}>{s}</li>)}</ul>

          <h4>Strengths</h4>
          <ul>{safeArr(analysis.strengths).map((s, i) => <li key={i}>{s}</li>)}</ul>

          <h4>Weaknesses</h4>
          <ul>{safeArr(analysis.weaknesses).map((s, i) => <li key={i}>{s}</li>)}</ul>

          <h4>Missing Keywords</h4>
          <ul>{safeArr(analysis.missingKeywords).map((s, i) => <li key={i}>{s}</li>)}</ul>

          <h4>Suggested Roles</h4>
          <ul>{safeArr(analysis.suggestedRoles).map((s, i) => <li key={i}>{s}</li>)}</ul>

          <h4>Recruiter Impression</h4>
          <p>{analysis.recruiterImpression ?? "N/A"}</p>

          <h4>Improvement Checklist</h4>
          <ul>{safeArr(analysis.improvementChecklist).map((s, i) => <li key={i}>{s}</li>)}</ul>

          <h4>Summary Rewrite</h4>
          <p>{analysis.summaryRewrite ?? "N/A"}</p>

          <h4>Project Rewrites</h4>
          <ul>{safeArr(analysis.projectRewrites).map((s, i) => <li key={i}>{s}</li>)}</ul>

          <h4>Bullet Rewrites</h4>
          <ul>{safeArr(analysis.bulletRewrites).map((s, i) => <li key={i}>{s}</li>)}</ul>
        </div>
      )}
    </div>
  );
}
