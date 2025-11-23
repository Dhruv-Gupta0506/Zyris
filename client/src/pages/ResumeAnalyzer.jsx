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

    if (selected && selected.type !== "application/pdf") {
      alert("Only PDF files are allowed!");
      e.target.value = "";
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

    try {
      setLoading(true);
      setAnalysis(null);

      const token = localStorage.getItem("token");

      const formData = new FormData();
      formData.append("resume", file);
      formData.append("targetRole", targetRole);

      const res = await axios.post(`${API_URL}/resume/analyze`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      setAnalysis(res.data.analysis);

    } catch (err) {
      console.error(err);
      alert("Failed to analyze resume.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Resume Analyzer</h2>

      <form onSubmit={handleSubmit} style={{ marginTop: "20px" }}>
        <div style={{ marginBottom: "15px" }}>
          <label style={{ display: "block", marginBottom: "8px", fontWeight: "bold" }}>
            Select Resume (PDF only):
          </label>

          <input
            type="file"
            accept="application/pdf"
            onChange={handleFileChange}
            style={{ padding: "5px" }}
          />
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

          <p><b>Target Role:</b> {analysis.targetRole ?? "Not specified"}</p>

          <p><b>ATS Score:</b> {analysis.atsScore ?? "N/A"}</p>

          {analysis.scoringBreakdown && (
            <>
              <h4>Scoring Breakdown</h4>
              <ul>
                <li>Keyword Match: {analysis.scoringBreakdown.keywordMatch}</li>
                <li>Action Verbs: {analysis.scoringBreakdown.actionVerbs}</li>
                <li>Quantified Results: {analysis.scoringBreakdown.quantifiedResults}</li>
                <li>Formatting Clarity: {analysis.scoringBreakdown.formattingClarity}</li>
                <li>Relevance Alignment: {analysis.scoringBreakdown.relevanceAlignment}</li>
              </ul>
            </>
          )}

          <h4>Skills</h4>
          <ul>{analysis.skills?.map((s, i) => <li key={i}>{s}</li>)}</ul>

          <h4>Strengths</h4>
          <ul>{analysis.strengths?.map((s, i) => <li key={i}>{s}</li>)}</ul>

          <h4>Weaknesses</h4>
          <ul>{analysis.weaknesses?.map((s, i) => <li key={i}>{s}</li>)}</ul>

          <h4>Missing Keywords</h4>
          <ul>{analysis.missingKeywords?.map((s, i) => <li key={i}>{s}</li>)}</ul>

          <h4>Suggested Roles</h4>
          <ul>{analysis.suggestedRoles?.map((s, i) => <li key={i}>{s}</li>)}</ul>

          <h4>Recruiter Impression</h4>
          <p>{analysis.recruiterImpression}</p>

          <h4>Improvement Checklist</h4>
          <ul>{analysis.improvementChecklist?.map((s, i) => <li key={i}>{s}</li>)}</ul>

          <h4>Summary Rewrite</h4>
          <p>{analysis.summaryRewrite}</p>

          <h4>Project Rewrites</h4>
          <ul>{analysis.projectRewrites?.map((s, i) => <li key={i}>{s}</li>)}</ul>

          <h4>Bullet Rewrites</h4>
          <ul>{analysis.bulletRewrites?.map((s, i) => <li key={i}>{s}</li>)}</ul>
        </div>
      )}
    </div>
  );
}
