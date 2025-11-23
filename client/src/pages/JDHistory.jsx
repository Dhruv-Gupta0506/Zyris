import { useEffect, useState } from "react";
import axios from "axios";
import API_URL from "../api/api";

export default function JDHistory() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState({});

  const toggleExpand = (id) =>
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const token = localStorage.getItem("token");

        const res = await axios.get(`${API_URL}/jd/history`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setHistory(res.data.history);
      } catch (err) {
        console.error(err);
        alert("Failed to load JD history.");
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  return (
    <div style={{ padding: "20px" }}>
      <h2>JD Analysis History</h2>

      {loading && <p>Loading...</p>}

      {!loading && history.length === 0 && <p>No JD history found.</p>}

      {history.map((record) => (
        <div
          key={record._id}
          style={{
            marginTop: "20px",
            padding: "12px",
            border: "1px solid #ccc",
          }}
        >
          <strong>🧾 {record.jobTitle || "Untitled Role"}</strong>
          <br />
          <small>{new Date(record.createdAt).toLocaleString()}</small>

          <p><b>Match Score:</b> {record.matchScore ?? "N/A"}</p>
          <p><b>Fit Verdict:</b> {record.fitVerdict ?? "N/A"}</p>

          <button
            onClick={() => toggleExpand(record._id)}
            style={{
              marginTop: "10px",
              padding: "6px 12px",
              cursor: "pointer",
              background: expanded[record._id] ? "#444" : "#000",
              color: "white",
              border: "none",
            }}
          >
            {expanded[record._id] ? "Hide Details ▲" : "Show Details ▼"}
          </button>

          {expanded[record._id] && (
            <div style={{ marginTop: "15px" }}>
              <h4>Top Strengths Based on JD</h4>
              <ul>{record.strengthsBasedOnJD?.map((s, i) => <li key={i}>{s}</li>)}</ul>

              <h4>Missing Skills</h4>
              <ul>{record.missingSkills?.map((s, i) => <li key={i}>{s}</li>)}</ul>

              <h4>Recommended Keywords</h4>
              <ul>{record.recommendedKeywords?.map((s, i) => <li key={i}>{s}</li>)}</ul>

              <h4>Tailored Bullet Suggestions</h4>
              <ul>{record.tailoredBulletSuggestions?.map((s, i) => <li key={i}>{s}</li>)}</ul>

              <h4>Improvement Tips</h4>
              <ul>{record.improvementTips?.map((s, i) => <li key={i}>{s}</li>)}</ul>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
