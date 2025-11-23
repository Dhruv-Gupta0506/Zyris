import { useState } from "react";
import axios from "axios";
import API_URL from "../api/api";

export default function JDAnalyzer() {
  const [jobTitle, setJobTitle] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!jobDescription || jobDescription.trim().length < 20) {
      alert("Please paste a proper job description (at least a few lines).");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      alert("You are not logged in.");
      return;
    }

    try {
      setLoading(true);
      setAnalysis(null);

      const res = await axios.post(
        `${API_URL}/jd/analyze`,
        { jobTitle, jobDescription },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setAnalysis(res.data.analysis);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Job analysis failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Job Description Analyzer</h2>

      <form onSubmit={handleSubmit} style={{ marginTop: "20px" }}>

        <div style={{ marginBottom: "15px" }}>
          <label style={{ display: "block", marginBottom: "5px" }}>
            Job Title (optional):
          </label>
          <input
            type="text"
            value={jobTitle}
            onChange={(e) => setJobTitle(e.target.value)}
            placeholder="e.g. Junior Full Stack Developer"
            style={{ padding: "8px", width: "100%", maxWidth: "400px" }}
          />
        </div>

        <div style={{ marginBottom: "15px" }}>
          <label style={{ display: "block", marginBottom: "5px" }}>
            Job Description:
          </label>
          <textarea
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            placeholder="Paste the full job description here..."
            rows={8}
            style={{ padding: "8px", width: "100%", maxWidth: "600px" }}
          />
        </div>

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
          {loading ? "Analyzing..." : "Analyze Job Match"}
        </button>
      </form>

      {analysis && (
        <div style={{ marginTop: "30px" }}>
          <h3>Job Match Analysis</h3>

          <p><b>Job Title:</b> {analysis.jobTitle ?? "Not specified"}</p>
          <p><b>Match Score:</b> {analysis.matchScore ?? "N/A"}</p>
          <p><b>Fit Verdict:</b> {analysis.fitVerdict ?? "N/A"}</p>

          <h4>Top Strengths Based on JD</h4>
          <ul>{analysis.strengthsBasedOnJD?.map((s, i) => <li key={i}>{s}</li>)}</ul>

          <h4>Missing Skills</h4>
          <ul>{analysis.missingSkills?.map((s, i) => <li key={i}>{s}</li>)}</ul>

          <h4>Recommended Keywords to Add</h4>
          <ul>{analysis.recommendedKeywords?.map((s, i) => <li key={i}>{s}</li>)}</ul>

          <h4>Tailored Resume Bullet Suggestions</h4>
          <ul>{analysis.tailoredBulletSuggestions?.map((s, i) => <li key={i}>{s}</li>)}</ul>

          <h4>Improvement Tips</h4>
          <ul>{analysis.improvementTips?.map((s, i) => <li key={i}>{s}</li>)}</ul>
        </div>
      )}
    </div>
  );
}
