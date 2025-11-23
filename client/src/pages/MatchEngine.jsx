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

  // Fetch resume + JD history on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          alert("You are not logged in.");
          return;
        }

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
      alert("Please select both a Resume Analysis and a JD Analysis.");
      return;
    }

    try {
      setLoading(true);
      setMatchResult(null);

      const token = localStorage.getItem("token");
      const res = await axios.post(
        `${API_URL}/match/analyze`,
        {
          resumeId: selectedResumeId,
          jobId: selectedJobId,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setMatchResult(res.data);
    } catch (err) {
      console.error(err);
      alert(
        err.response?.data?.message ||
          "Failed to compute resume-JD match."
      );
    } finally {
      setLoading(false);
    }
  };

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
                {j.jobTitle || "Untitled Role"} | Match:{" "}
                {j.matchScore ?? "N/A"} | Verdict: {j.fitVerdict || "N/A"}
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
      {matchResult && matchResult.success && (
        <div style={{ marginTop: "30px" }}>
          <h3>Match Summary</h3>

          <p>
            <b>Role Category:</b> {matchResult.roleCategory}
          </p>

          <p>
            <b>Resume:</b> {matchResult.resumeFileName} (
            {matchResult.targetRole || "No target role"})
          </p>
          <p>
            <b>Job Title:</b> {matchResult.jobTitle || "Not specified"}
          </p>

          <p>
            <b>ATS Score:</b> {matchResult.atsScore ?? "N/A"}
          </p>
          <p>
            <b>JD Match Score:</b> {matchResult.jdMatchScore ?? "N/A"}
          </p>
          <p>
            <b>Overall Fit Score:</b> {matchResult.overallScore ?? "N/A"}
          </p>
          <p>
            <b>Readiness Level:</b> {matchResult.readinessLevel}
          </p>
          <p>
            <b>Job Fit Verdict (from JD):</b>{" "}
            {matchResult.jobFitVerdict || "N/A"}
          </p>
          <p>
            <b>Score Boost Estimate:</b>{" "}
            {matchResult.scoreBoostEstimate || "N/A"}
          </p>

          {/* Skill overlap */}
          <div style={{ marginTop: "20px" }}>
            <h4>Skill Gaps for This JD</h4>

            <p><b>Missing Important Skills:</b></p>
            <ul>
              {matchResult.skillOverlap?.missingImportant?.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>

            {matchResult.skillOverlap?.matchingSkills &&
              matchResult.skillOverlap.matchingSkills.length > 0 && (
                <>
                  <p><b>Skills Already Aligned:</b></p>
                  <ul>
                    {matchResult.skillOverlap.matchingSkills.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </>
              )}
          </div>

          {/* Improvement focus */}
          <div style={{ marginTop: "20px" }}>
            <h4>Improvement Focus</h4>
            <ul>
              {matchResult.improvementFocus?.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </div>

          {/* Optimized bullets */}
          <div style={{ marginTop: "20px" }}>
            <h4>Optimized Bullet Suggestions</h4>
            <ul>
              {matchResult.optimizedBullets?.map((b, i) => (
                <li key={i}>{b}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
