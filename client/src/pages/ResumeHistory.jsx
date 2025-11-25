import { useEffect, useState } from "react";
import axios from "axios";
import API_URL from "../api/api";

export default function ResumeHistory() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState({});

  const toggleExpand = (id) => {
    setExpanded((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const token = localStorage.getItem("token");

        const res = await axios.get(`${API_URL}/resume/history`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setHistory(res.data.history || []);
      } catch (err) {
        console.error(err);
        alert("Failed to load resume history.");
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  const safeArr = (a) => (Array.isArray(a) ? a : []);
  const safeNum = (n) => (typeof n === "number" ? n : "N/A");

  return (
    <div style={{ padding: "20px" }}>
      <h2>Resume Analysis History</h2>

      {loading && <p>Loading...</p>}

      {!loading && history.length === 0 && <p>No history found.</p>}

      {history.map((record) => (
        <div
          key={record._id}
          style={{
            marginTop: "20px",
            padding: "12px",
            border: "1px solid #ccc",
            borderRadius: "4px",
          }}
        >
          <strong>📄 {record.fileName}</strong>
          <br />
          <small>{new Date(record.createdAt).toLocaleString()}</small>

          <p>
            <b>Target Role:</b> {record.targetRole ?? "Not specified"}
          </p>

          <p>
            <b>ATS Score:</b> {safeNum(record.atsScore)}
          </p>

          <button
            onClick={() => toggleExpand(record._id)}
            style={{
              marginTop: "10px",
              padding: "6px 12px",
              cursor: "pointer",
              background: expanded[record._id] ? "#444" : "#000",
              color: "white",
              border: "none",
              borderRadius: "4px",
            }}
          >
            {expanded[record._id] ? "Hide Details ▲" : "Show Details ▼"}
          </button>

          {/* ---------- DETAILS ---------- */}
          {expanded[record._id] && (
            <div style={{ marginTop: "15px" }}>

              {/* --- Scoring Breakdown --- */}
              {record.scoringBreakdown && (
                <>
                  <h4>Scoring Breakdown</h4>
                  <ul>
                    <li>
                      Keyword Match:{" "}
                      {safeNum(record.scoringBreakdown.keywordMatch)}
                    </li>
                    <li>
                      Action Verbs:{" "}
                      {safeNum(record.scoringBreakdown.actionVerbs)}
                    </li>
                    <li>
                      Quantified Results:{" "}
                      {safeNum(record.scoringBreakdown.quantifiedResults)}
                    </li>
                    <li>
                      Formatting Clarity:{" "}
                      {safeNum(record.scoringBreakdown.formattingClarity)}
                    </li>
                    <li>
                      Relevance Alignment:{" "}
                      {safeNum(record.scoringBreakdown.relevanceAlignment)}
                    </li>
                  </ul>
                </>
              )}

              {/* --- Skills --- */}
              <h4>Skills</h4>
              <ul>
                {safeArr(record.skills).map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>

              {/* --- Strengths --- */}
              <h4>Strengths</h4>
              <ul>
                {safeArr(record.strengths).map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>

              {/* --- Weaknesses --- */}
              <h4>Weaknesses</h4>
              <ul>
                {safeArr(record.weaknesses).map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>

              {/* --- Missing Keywords --- */}
              <h4>Missing Keywords</h4>
              <ul>
                {safeArr(record.missingKeywords).map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>

              {/* --- Suggested roles --- */}
              <h4>Suggested Roles</h4>
              <ul>
                {safeArr(record.suggestedRoles).map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>

              {/* --- Recruiter Impression --- */}
              <h4>Recruiter Impression</h4>
              <p>{record.recruiterImpression ?? "N/A"}</p>

              {/* --- Improvement Checklist --- */}
              <h4>Improvement Checklist</h4>
              <ul>
                {safeArr(record.improvementChecklist).map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>

              {/* --- Summary Rewrite --- */}
              <h4>Summary Rewrite</h4>
              <p>{record.summaryRewrite ?? "N/A"}</p>

              {/* --- Project Rewrites --- */}
              <h4>Project Rewrites</h4>
              <ul>
                {safeArr(record.projectRewrites).map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>

              {/* --- Bullet Rewrites --- */}
              <h4>Bullet Rewrites</h4>
              <ul>
                {safeArr(record.bulletRewrites).map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
