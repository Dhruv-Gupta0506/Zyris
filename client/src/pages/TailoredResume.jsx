import { useEffect, useState } from "react";
import axios from "axios";
import API_URL from "../api/api";

export default function TailoredResume() {
  const [resumes, setResumes] = useState([]);
  const [jobs, setJobs] = useState([]);

  const [selectedResumeId, setSelectedResumeId] = useState("");
  const [selectedJobId, setSelectedJobId] = useState("");

  const [loading, setLoading] = useState(false);
  const [tailored, setTailored] = useState(null);

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

  const handleGenerate = async (e) => {
    e.preventDefault();

    if (!selectedResumeId || !selectedJobId) {
      alert("Please select both a Resume Analysis and a JD Analysis.");
      return;
    }

    try {
      setLoading(true);
      setTailored(null);

      const token = localStorage.getItem("token");

      const res = await axios.post(
        `${API_URL}/tailor/generate`,
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

      setTailored(res.data.tailored);
    } catch (err) {
      console.error(err);
      alert(
        err.response?.data?.message ||
          "Failed to generate tailored resume content."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Tailored Resume Generator (Recruiter-Style Cutting)</h2>

      <form onSubmit={handleGenerate} style={{ marginTop: "20px" }}>
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
          {loading ? "Generating..." : "Generate Tailored Resume Content"}
        </button>
      </form>

      {/* RESULT */}
      {tailored && (
        <div style={{ marginTop: "30px" }}>
          <h3>Tailored Resume Output</h3>

          <h4>Improved Summary</h4>
          <p>{tailored.improvedSummary || "No summary generated."}</p>

          <h4>Improved Skills Section (Most Relevant First)</h4>
          <ul>
            {tailored.improvedSkillsSection?.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>

          <h4>Kept & Rewritten Bullets</h4>
          <ul>
            {tailored.keptAndRewrittenBullets?.map((b, i) => (
              <li key={i}>{b}</li>
            ))}
          </ul>

          {tailored.removedBulletsWithReasons &&
            tailored.removedBulletsWithReasons.length > 0 && (
              <>
                <h4>Removed Bullets (with Recruiter Reasons)</h4>
                <ul>
                  {tailored.removedBulletsWithReasons.map((item, i) => (
                    <li key={i}>
                      <b>Removed:</b> {item.original} <br />
                      <b>Reason:</b> {item.reason}
                    </li>
                  ))}
                </ul>
              </>
            )}

          <h4>Notes From Recruiter Perspective</h4>
          <ul>
            {tailored.notesForCandidate?.map((n, i) => (
              <li key={i}>{n}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
