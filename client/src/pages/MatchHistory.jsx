import { useEffect, useState } from "react";
import axios from "axios";
import API_URL from "../api/api";

export default function MatchHistory() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState({});

  const toggleExpand = (id) =>
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const token = localStorage.getItem("token");

        const res = await axios.get(`${API_URL}/match/history`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        setHistory(res.data.history || []);
      } catch (err) {
        console.error(err);
        alert("Failed to load match history.");
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  const safeNum = (n) => (typeof n === "number" ? n : "N/A");

  if (loading) return <p style={{ padding: "20px" }}>Loading...</p>;

  return (
    <div style={{ padding: "20px" }}>
      <h2>Match Engine History</h2>

      {history.length === 0 && <p>No match records found.</p>}

      {history.map((match) => (
        <div
          key={match._id}
          style={{
            border: "1px solid #ccc",
            padding: "15px",
            borderRadius: "6px",
            marginTop: "20px",
          }}
        >
          <strong>📝 {match.jobTitle || "Untitled Job"}</strong>
          <br />
          <small>{new Date(match.createdAt).toLocaleString()}</small>

          <p>
            <b>Resume:</b> {match.resumeFileName}{" "}
            ({match.targetRole || "No target role"})
          </p>

          <p>
            <b>Verdict:</b> {match.verdict}
          </p>

          <p>
            <b>Overall Fit Score:</b> {safeNum(match.overallScore)}%
          </p>

          <p>
            <b>Hiring Probability:</b> {safeNum(match.hiringProbability)}%
          </p>

          <p>
            <b>Role Category:</b> {match.roleCategory}
          </p>

          <button
            onClick={() => toggleExpand(match._id)}
            style={{
              marginTop: "10px",
              padding: "6px 12px",
              cursor: "pointer",
              background: expanded[match._id] ? "#444" : "#000",
              color: "white",
              border: "none",
              borderRadius: "4px",
            }}
          >
            {expanded[match._id] ? "Hide Details ▲" : "Show Details ▼"}
          </button>

          {expanded[match._id] && (
            <div style={{ marginTop: "15px" }}>
              {/* ------------------- COMPETENCIES ------------------- */}
              <h4>Competency Matrix</h4>
              <table
                border="1"
                cellPadding="6"
                style={{ borderCollapse: "collapse", width: "100%" }}
              >
                <thead>
                  <tr>
                    <th>Competency</th>
                    <th>Resume (0–10)</th>
                    <th>JD (0–10)</th>
                    <th>Gap</th>
                  </tr>
                </thead>
                <tbody>
                  {match.competencies?.map((c, i) => (
                    <tr key={i}>
                      <td>{c.name}</td>
                      <td>{safeNum(c.resumeLevel)}</td>
                      <td>{safeNum(c.jdLevel)}</td>
                      <td>{safeNum(c.gap)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* ------------------- STRENGTHS ------------------- */}
              <h4>Top Strengths</h4>
              <ul>
                {match.strengths?.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>

              {/* ------------------- WEAKNESSES ------------------- */}
              <h4>Top Weaknesses</h4>
              <ul>
                {match.weaknesses?.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>

              {/* ------------------- OBJECTIONS ------------------- */}
              <h4>Recruiter Objections</h4>
              <ul>
                {match.recruiterObjections?.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>

              {/* ------------------- STRENGTHS FROM JD ------------------- */}
              <h4>Recruiter Strengths</h4>
              <ul>
                {match.recruiterStrengths?.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>

              {/* ------------------- SKILLS ------------------- */}
              <h4>Matching Skills</h4>
              <ul>
                {match.matchingSkills?.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>

              <h4>Missing Important Skills</h4>
              <ul>
                {match.missingSkills?.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>

              {/* ------------------- BOOST ------------------- */}
              <h4>Score Boost Estimate</h4>
              <p>{match.scoreBoostEstimate}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
