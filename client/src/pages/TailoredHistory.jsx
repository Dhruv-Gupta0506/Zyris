// frontend/pages/TailoredHistory.jsx
import { useEffect, useState } from "react";
import axios from "axios";
import API_URL from "../api/api";

export default function TailoredHistory() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState({});

  useEffect(() => {
    const fetch = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${API_URL}/tailor/history`, { headers: { Authorization: `Bearer ${token}` } });
        setHistory(res.data.history || []);
      } catch (err) {
        console.error(err);
        alert("Failed to load tailored resume history.");
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const toggle = (id) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

  if (loading) return <p>Loading...</p>;

  return (
    <div style={{ padding: 20 }}>
      <h2>Tailored Resume History</h2>

      {history.length === 0 && <p>No tailored resumes generated yet.</p>}

      {history.map(record => (
        <div key={record._id} style={{ border: "1px solid #ddd", padding: 12, marginBottom: 12, borderRadius: 6 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <strong>{record.jobTitle || "Untitled Job"}</strong>
              <div style={{ fontSize: 12, opacity: 0.7 }}>{record.resumeFileName || "Resume"} • {new Date(record.createdAt).toLocaleString()}</div>
            </div>
            <div>
              <button onClick={() => toggle(record._id)} style={{ padding: "6px 10px", cursor: "pointer" }}>
                {expanded[record._id] ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          {expanded[record._id] && (
            <div style={{ marginTop: 12 }}>
              <p><b>Headline:</b> {record.headline}</p>
              <p><b>Skills:</b> {record.skillsOrdered?.join(", ")}</p>

              <h4>Experience</h4>
              {record.experienceSections?.map((s, i) => (
                <div key={i}><strong>{s.title}</strong><pre style={{ whiteSpace: "pre-wrap" }}>{s.content}</pre></div>
              ))}

              <h4>Projects</h4>
              {record.projectSections?.map((s, i) => (
                <div key={i}><strong>{s.title}</strong><pre style={{ whiteSpace: "pre-wrap" }}>{s.content}</pre></div>
              ))}

              <h4>Score Boost Suggestions</h4>
              <ul>{(record.scoreBoostSuggestions || []).map((x, idx) => <li key={idx}>{x}</li>)}</ul>

              <h4>Assembled Resume</h4>
              <pre style={{ whiteSpace: "pre-wrap", background: "#f6f6f6", padding: 8 }}>{record.fullText}</pre>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
