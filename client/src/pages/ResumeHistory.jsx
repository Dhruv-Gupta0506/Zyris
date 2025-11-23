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
        console.log("HISTORY SAMPLE:",res.data.history[0]);

        setHistory(res.data.history);
      } catch (err) {
        console.error(err);
        alert("Failed to load resume history.");
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

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
          }}
        >
          <strong>📄 {record.fileName}</strong>
          <br />
          <small>{new Date(record.createdAt).toLocaleString()}</small>

          <p><b>Target Role:</b> {record.targetRole ?? "Not specified"}</p>
          <p><b>ATS Score:</b> {record.atsScore ?? "N/A"}</p>

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
              
              {record.scoringBreakdown && (
                <>
                  <h4>Scoring Breakdown</h4>
                  <ul>
                    <li>Keyword Match: {record.scoringBreakdown.keywordMatch}</li>
                    <li>Action Verbs: {record.scoringBreakdown.actionVerbs}</li>
                    <li>Quantified Results: {record.scoringBreakdown.quantifiedResults}</li>
                    <li>Formatting Clarity: {record.scoringBreakdown.formattingClarity}</li>
                    <li>Relevance Alignment: {record.scoringBreakdown.relevanceAlignment}</li>
                  </ul>
                </>
              )}

              <h4>Skills</h4>
              <ul>{record.skills?.map((s, i) => <li key={i}>{s}</li>)}</ul>

              <h4>Strengths</h4>
              <ul>{record.strengths?.map((s, i) => <li key={i}>{s}</li>)}</ul>

              <h4>Weaknesses</h4>
              <ul>{record.weaknesses?.map((s, i) => <li key={i}>{s}</li>)}</ul>

              <h4>Missing Keywords</h4>
              <ul>{record.missingKeywords?.map((s, i) => <li key={i}>{s}</li>)}</ul>

              <h4>Suggested Roles</h4>
              <ul>{record.suggestedRoles?.map((s, i) => <li key={i}>{s}</li>)}</ul>

              <h4>Recruiter Impression</h4>
              <p>{record.recruiterImpression}</p>

              <h4>Improvement Checklist</h4>
              <ul>{record.improvementChecklist?.map((s, i) => <li key={i}>{s}</li>)}</ul>

              <h4>Summary Rewrite</h4>
              <p>{record.summaryRewrite}</p>

              <h4>Project Rewrites</h4>
              <ul>{record.projectRewrites?.map((s, i) => <li key={i}>{s}</li>)}</ul>

              <h4>Bullet Rewrites</h4>
              <ul>{record.bulletRewrites?.map((s, i) => <li key={i}>{s}</li>)}</ul>

            </div>
          )}
        </div>
      ))}
    </div>
  );
}
