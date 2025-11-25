// frontend/components/MatchEngine.jsx

import { useEffect, useState } from "react";
import axios from "axios";
import API_URL from "../api/api";

export default function MatchEngine() {
  const [resumes, setResumes] = useState([]);
  const [jobs, setJobs] = useState([]);

  const [selectedResumeId, setSelectedResumeId] = useState("");
  const [selectedJobId, setSelectedJobId] = useState("");

  const [loading, setLoading] = useState(false);
  const [matchResult, setMatchResult] = useState(null);

  // Fetch history on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");

        const [resumeRes, jdRes] = await Promise.all([
          axios.get(`${API_URL}/resume/history`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${API_URL}/jd/history`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        setResumes(resumeRes.data.history || []);
        setJobs(jdRes.data.history || []);
      } catch (err) {
        console.error(err);
        alert("Failed to load resume/JD history.");
      }
    };

    fetchData();
  }, []);

  const handleCompare = async (e) => {
    e.preventDefault();

    if (!selectedResumeId || !selectedJobId) {
      alert("Please select both a Resume Analysis and a Job Description Analysis.");
      return;
    }

    try {
      setLoading(true);
      setMatchResult(null);

      const token = localStorage.getItem("token");

      const res = await axios.post(
        `${API_URL}/match/analyze`,
        { resumeId: selectedResumeId, jobId: selectedJobId },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setMatchResult(res.data.match);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to compute match.");
    } finally {
      setLoading(false);
    }
  };

  const safeNum = (n) => (typeof n === "number" ? n : "N/A");

  return (
    <div style={{ padding: "20px" }}>
      <h2>Resume ↔ Job Match Engine</h2>

      <form onSubmit={handleCompare} style={{ marginTop: "20px" }}>
        {/* Resume selector */}
        <div style={{ marginBottom: "15px" }}>
          <label style={{ display: "block", marginBottom: "5px" }}>
            Select Resume Analysis:
          </label>
          <select
            value={selectedResumeId}
            onChange={(e) => setSelectedResumeId(e.target.value)}
            style={{ padding: "8px", minWidth: "280px" }}
          >
            <option value="">-- Choose a Resume --</option>
            {resumes.map((r) => (
              <option key={r._id} value={r._id}>
                {r.fileName} | ATS: {r.atsScore ?? "N/A"} | Role:{" "}
                {r.targetRole || "Not set"}
              </option>
            ))}
          </select>
        </div>

        {/* JD selector */}
        <div style={{ marginBottom: "15px" }}>
          <label style={{ display: "block", marginBottom: "5px" }}>
            Select JD Analysis:
          </label>
          <select
            value={selectedJobId}
            onChange={(e) => setSelectedJobId(e.target.value)}
            style={{ padding: "8px", minWidth: "280px" }}
          >
            <option value="">-- Choose a Job Description --</option>
            {jobs.map((j) => (
              <option key={j._id} value={j._id}>
                {j.jobTitle || "Untitled"} | Match: {safeNum(j.matchScore)} | Verdict:{" "}
                {j.fitVerdict || "N/A"}
              </option>
            ))}
          </select>
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
          {loading ? "Comparing..." : "Compare Match"}
        </button>
      </form>

      {/* RESULTS */}
      {matchResult && (
        <div style={{ marginTop: "30px" }}>
          <h3>Match Summary</h3>

          <p>
            <b>Job Title:</b> {matchResult.jobTitle || "Not specified"}
          </p>

          <p>
            <b>Resume:</b> {matchResult.resumeFileName} (
            {matchResult.targetRole || "No target role"})
          </p>

          <p>
            <b>Role Category:</b> {matchResult.roleCategory}
          </p>

          <p>
            <b>Verdict:</b> {matchResult.verdict}
          </p>

          <p>
            <b>Overall Fit Score:</b> {safeNum(matchResult.overallScore)}%
          </p>
          <p>
            <b>Hiring Probability:</b> {safeNum(matchResult.hiringProbability)}%
          </p>

          <h4>Competency Matrix</h4>
          <table border="1" cellPadding="6" style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th>Competency</th>
                <th>Resume (0–10)</th>
                <th>JD (0–10)</th>
                <th>Gap</th>
              </tr>
            </thead>
            <tbody>
              {matchResult.competencies?.map((c, i) => (
                <tr key={i}>
                  <td>{c.name}</td>
                  <td>{safeNum(c.resumeLevel)}</td>
                  <td>{safeNum(c.jdLevel)}</td>
                  <td>{safeNum(c.gap)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <h4>Top Strengths</h4>
          <ul>
            {matchResult.strengths?.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>

          <h4>Top Weaknesses</h4>
          <ul>
            {matchResult.weaknesses?.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>

          <h4>Recruiter Objections</h4>
          <ul>
            {matchResult.recruiterObjections?.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>

          <h4>Recruiter Strengths</h4>
          <ul>
            {matchResult.recruiterStrengths?.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>

          <h4>Matching Skills</h4>
          <ul>
            {matchResult.matchingSkills?.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>

          <h4>Missing Important Skills</h4>
          <ul>
            {matchResult.missingSkills?.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>

          <h4>Score Boost Estimate</h4>
          <p>{matchResult.scoreBoostEstimate}</p>
        </div>
      )}
    </div>
  );
}
