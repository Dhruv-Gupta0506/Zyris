import { useEffect, useState } from "react";
import axios from "axios";
import API_URL from "../api/api";

export default function CoverLetter() {
  const [resumes, setResumes] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [selectedResumeId, setSelectedResumeId] = useState("");
  const [selectedJobId, setSelectedJobId] = useState("");
  const [loading, setLoading] = useState(false);
  const [coverLetter, setCoverLetter] = useState("");

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
        alert("Failed to load resume or JD history.");
      }
    };

    fetchData();
  }, []);

  const handleGenerate = async () => {
    if (!selectedResumeId || !selectedJobId) {
      alert("Select both Resume & JD Analysis first.");
      return;
    }

    try {
      setLoading(true);
      setCoverLetter("");

      const token = localStorage.getItem("token");

      const res = await axios.post(
        `${API_URL}/cover-letter/generate`,
        {
          resumeId: selectedResumeId,
          jobId: selectedJobId,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setCoverLetter(res.data.coverLetter);
    } catch (err) {
      console.error(err);
      alert("Cover letter generation failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Cover Letter Generator (Short & Recruiter-Friendly)</h2>

      {/* Resume Selector */}
      <div style={{ marginTop: "20px" }}>
        <label>Select Resume Analysis:</label>
        <select
          value={selectedResumeId}
          onChange={(e) => setSelectedResumeId(e.target.value)}
          style={{ padding: "8px", marginLeft: "10px" }}
        >
          <option value="">-- choose --</option>
          {resumes.map((r) => (
            <option key={r._id} value={r._id}>
              {r.fileName} | ATS {r.atsScore}
            </option>
          ))}
        </select>
      </div>

      {/* JD Selector */}
      <div style={{ marginTop: "20px" }}>
        <label>Select JD Analysis:</label>
        <select
          value={selectedJobId}
          onChange={(e) => setSelectedJobId(e.target.value)}
          style={{ padding: "8px", marginLeft: "10px" }}
        >
          <option value="">-- choose --</option>
          {jobs.map((j) => (
            <option key={j._id} value={j._id}>
              {j.jobTitle} | Match {j.matchScore}
            </option>
          ))}
        </select>
      </div>

      {/* Generate Button */}
      <button
        onClick={handleGenerate}
        disabled={loading}
        style={{
          marginTop: "20px",
          padding: "10px 20px",
          background: loading ? "gray" : "black",
          color: "white",
          border: "none",
          cursor: "pointer",
        }}
      >
        {loading ? "Generating..." : "Generate Cover Letter"}
      </button>

      {/* Result */}
      {coverLetter && (
        <div
          style={{
            marginTop: "30px",
            whiteSpace: "pre-wrap",
            padding: "16px",
            border: "1px solid #ccc",
          }}
        >
          <h3>Generated Cover Letter</h3>
          {coverLetter}
        </div>
      )}
    </div>
  );
}
