// frontend/pages/TailoredResume.jsx
import { useEffect, useState } from "react";
import axios from "axios";
import API_URL from "../api/api";

export default function TailoredResume() {
  const [resumes, setResumes] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [selectedResume, setSelectedResume] = useState("");
  const [selectedJob, setSelectedJob] = useState("");
  const [loading, setLoading] = useState(false);
  const [tailored, setTailored] = useState(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const token = localStorage.getItem("token");
        const [rRes, jRes] = await Promise.all([
          axios.get(`${API_URL}/resume/history`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`${API_URL}/jd/history`, { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        setResumes(rRes.data.history || []);
        setJobs(jRes.data.history || []);
      } catch (e) {
        console.error(e);
        alert("Failed to load histories.");
      }
    };
    fetch();
  }, []);

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!selectedResume || !selectedJob) return alert("Select resume and JD first.");

    try {
      setLoading(true);
      setTailored(null);
      const token = localStorage.getItem("token");
      const res = await axios.post(
        `${API_URL}/tailor/generate`,
        { resumeId: selectedResume, jobId: selectedJob },
        { headers: { Authorization: `Bearer ${token}` }, timeout: 120000 }
      );
      setTailored(res.data.tailored);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Generation failed.");
    } finally {
      setLoading(false);
    }
  };

  const downloadTxt = () => {
    if (!tailored?.fullText) return alert("No content to download.");
    const blob = new Blob([tailored.fullText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const name = `${tailored.resumeFileName || "tailored-resume"}-${new Date(tailored.createdAt || Date.now()).toISOString().slice(0,10)}.txt`;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Tailored Resume Generator (Recruiter-Grade)</h2>

      <form onSubmit={handleGenerate} style={{ marginTop: 20 }}>
        <div style={{ marginBottom: 12 }}>
          <label>Select Resume Analysis:</label><br/>
          <select value={selectedResume} onChange={(e) => setSelectedResume(e.target.value)} style={{ padding: 8, width: 420 }}>
            <option value="">-- Choose a Resume --</option>
            {resumes.map(r => (
              <option key={r._id} value={r._id}>{r.fileName} | ATS: {r.atsScore ?? "N/A"} | Role: {r.targetRole || "Not set"}</option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label>Select JD Analysis:</label><br/>
          <select value={selectedJob} onChange={(e) => setSelectedJob(e.target.value)} style={{ padding: 8, width: 420 }}>
            <option value="">-- Choose a Job Description --</option>
            {jobs.map(j => (
              <option key={j._id} value={j._id}>{j.jobTitle || "Untitled"} | Match: {j.matchScore ?? "N/A"} | Verdict: {j.fitVerdict || "N/A"}</option>
            ))}
          </select>
        </div>

        <button disabled={loading} style={{ padding: "10px 18px", background: loading ? "gray" : "black", color: "white", border: "none", cursor: "pointer" }}>
          {loading ? "Generating..." : "Generate Tailored Resume"}
        </button>
      </form>

      {tailored && (
        <div style={{ marginTop: 24 }}>
          <h3>Tailored Resume Output</h3>

          <p><b>Headline:</b> {tailored.headline}</p>

          <h4>Skills (most relevant first)</h4>
          <p>{(tailored.skillsOrdered || []).join(", ")}</p>

          <h4>Experience Sections</h4>
          {tailored.experienceSections?.map((s, idx) => (
            <div key={idx} style={{ marginBottom: 12 }}>
              <strong>{s.title}</strong>
              <pre style={{ whiteSpace: "pre-wrap" }}>{s.content}</pre>
            </div>
          ))}

          <h4>Project Sections</h4>
          {tailored.projectSections?.map((s, idx) => (
            <div key={idx} style={{ marginBottom: 12 }}>
              <strong>{s.title}</strong>
              <pre style={{ whiteSpace: "pre-wrap" }}>{s.content}</pre>
            </div>
          ))}

          <h4>Education & Extras</h4>
          {tailored.educationAndExtras?.map((s, idx) => (
            <div key={idx}>
              <strong>{s.title}</strong>
              <pre style={{ whiteSpace: "pre-wrap" }}>{s.content}</pre>
            </div>
          ))}

          <h4>Score Boost Suggestions</h4>
          <ul>
            {(tailored.scoreBoostSuggestions || []).map((t, i) => <li key={i}>{t}</li>)}
          </ul>

          <h4>Assembled Resume (copy/paste)</h4>
          <pre style={{ whiteSpace: "pre-wrap", background: "#f6f6f6", padding: 12 }}>{tailored.fullText}</pre>

          <div style={{ marginTop: 12 }}>
            <button onClick={downloadTxt} style={{ marginRight: 10, padding: "8px 12px" }}>Download .txt</button>
          </div>
        </div>
      )}
    </div>
  );
}
