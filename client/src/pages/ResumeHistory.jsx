import { useEffect, useState } from "react";
import axios from "axios";
import API_URL from "../api/api";

export default function ResumeHistory() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const parseAnalysis = (text) => {
    if (!text) return null;

    const sections = [
      "ATS Score",
      "Key Skills Extracted",
      "Strengths",
      "Weaknesses",
      "Missing Keywords",
      "Suggested Job Roles",
      "Recruiter Impression",
      "Resume Improvement Checklist",
    ];

    const parsedSections = [];
    let remaining = text;

    sections.forEach((title, index) => {
      const start = remaining.indexOf(title);
      if (start === -1) return;

      const end =
        index + 1 < sections.length
          ? remaining.indexOf(sections[index + 1])
          : remaining.length;

      let content = remaining.slice(start + title.length, end).trim();

      // ✅ APPLY SAME CLEANUP AS ResumeAnalyzer
      content = content
        .replace(/^\d+[\).\:\-]?\s*/gm, "")     // numbering
        .replace(/^\:\s*/gm, "")                // leading colon
        .replace(/^\(\d.*?\)\:?\s*/gm, "")      // (0-100):
        .replace(/^\s*\*\s*/gm, "• ")           // normalize bullets
        .trim();

      parsedSections.push({
        title,
        content,
        open: false,
      });

      remaining = remaining.slice(end);
    });

    return parsedSections;
  };

  const toggleSection = (recordIndex, sectionIndex) => {
    setHistory((prev) =>
      prev.map((record, rIdx) =>
        rIdx === recordIndex
          ? {
              ...record,
              parsed: record.parsed.map((sec, sIdx) =>
                sIdx === sectionIndex ? { ...sec, open: !sec.open } : sec
              ),
            }
          : record
      )
    );
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

        const formatted = res.data.history.map((item) => ({
          ...item,
          parsed: parseAnalysis(item.analysisText),
        }));

        setHistory(formatted);
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

      {history.map((record, index) => (
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

          {record.parsed && (
            <div style={{ marginTop: "12px" }}>
              {record.parsed.map((section, sIdx) => (
                <div key={sIdx} style={{ marginBottom: "10px" }}>
                  <div
                    onClick={() => toggleSection(index, sIdx)}
                    style={{
                      cursor: "pointer",
                      fontWeight: "bold",
                      padding: "6px",
                      background: "#eee",
                    }}
                  >
                    {section.title} {section.open ? "▲" : "▼"}
                  </div>

                  {section.open && (
                    <div
                      style={{
                        padding: "12px 16px",
                        border: "1px solid #ddd",
                        borderTop: "none",
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      {section.content}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
