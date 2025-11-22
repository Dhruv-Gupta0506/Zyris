import { useEffect, useState, useRef } from "react";
import axios from "axios";
import API_URL from "../api/api";

export default function InterviewHistory() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [parsedEvaluation, setParsedEvaluation] = useState(null);

  // ✅ for auto scroll
  const resultRef = useRef(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const token = localStorage.getItem("token");

        const res = await axios.get(`${API_URL}/interview/history`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setHistory(res.data.history);
      } catch (err) {
        console.error(err);
        alert("Failed to load interview history");
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  // ✅ same parsing behavior as MockInterview
  const normalizeCodeBlocks = (content) => {
    return content.replace(/```(\w+)?\s*([\s\S]*?)```/g, (match, lang, code) => {
      const language = lang ? lang.trim() : "Code";
      return `\n${language}:\n${code.trim()}\n`;
    });
  };

  const parseEvaluation = (text) => {
    if (!text) {
      return { sections: [], summary: "No evaluation available" };
    }

    const parts = text.split(/Q\d+/).slice(1);

    const sections = parts.map((part, index) => {
      const cleaned = part
        .replace(/Overall Summary[\s\S]*/i, "") // remove summary from last block
        .trim();

      return {
        title: `Question ${index + 1}`,
        content: normalizeCodeBlocks(cleaned),
        open: false,
      };
    });

    const summaryMatch = text.match(/Overall Summary[\s\S]*/i);
    const summary = summaryMatch
      ? normalizeCodeBlocks(summaryMatch[0])
      : "Summary unavailable";

    return { sections, summary };
  };

  const handleSelect = (item) => {
    setSelected(item);
    const parsed = parseEvaluation(item.evaluationText);
    setParsedEvaluation(parsed);

    // ✅ auto scroll into view
    setTimeout(() => {
      if (resultRef.current) {
        resultRef.current.scrollIntoView({ behavior: "smooth" });
      }
    }, 200);
  };

  const toggleSection = (index) => {
    if (!parsedEvaluation) return;
    setParsedEvaluation((prev) => ({
      ...prev,
      sections: prev.sections.map((sec, i) =>
        i === index ? { ...sec, open: !sec.open } : sec
      ),
    }));
  };

  if (loading) {
    return <p style={{ padding: "20px" }}>Loading...</p>;
  }

  return (
    <div style={{ padding: "20px" }}>
      <h2>Interview History</h2>

      {history.length === 0 ? (
        <p>No interview history found.</p>
      ) : (
        <ul style={{ marginBottom: "20px" }}>
          {history.map((item) => (
            <li
              key={item._id}
              style={{
                margin: "8px 0",
                cursor: "pointer",
                color: selected && selected._id === item._id ? "darkblue" : "blue",
                textDecoration: "underline",
              }}
              onClick={() => handleSelect(item)}
            >
              🎤 {item.role} — {item.difficulty.toUpperCase()} — Score: {item.score}/100 —{" "}
              {new Date(item.createdAt).toLocaleString()}
            </li>
          ))}
        </ul>
      )}

      {selected && parsedEvaluation && (
        <div
          ref={resultRef}
          style={{ marginTop: "20px", whiteSpace: "pre-wrap" }}
        >
          <h3>Interview Details</h3>
          <p><strong>Role:</strong> {selected.role}</p>
          <p><strong>Difficulty:</strong> {selected.difficulty}</p>
          <p><strong>Score:</strong> {selected.score}/100</p>
          <p><strong>Date:</strong> {new Date(selected.createdAt).toLocaleString()}</p>

          <h3 style={{ marginTop: "20px" }}>Per Question Feedback</h3>

          {parsedEvaluation.sections.map((section, index) => (
            <div key={index} style={{ marginBottom: "12px" }}>
              <div
                onClick={() => toggleSection(index)}
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
                    padding: "8px",
                    border: "1px solid #ddd",
                    borderTop: "none",
                    background: "white",
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {section.content}
                </div>
              )}
            </div>
          ))}

          <h3 style={{ marginTop: "20px" }}>Overall Summary</h3>
          <div
            style={{
              padding: "12px 16px",
              border: "1px solid #ccc",
              background: "#fafafa",
              whiteSpace: "pre-wrap",
            }}
          >
            {parsedEvaluation.summary}
          </div>

          <button
            onClick={() => {
              setSelected(null);
              setParsedEvaluation(null);
            }}
            style={{ marginTop: "15px", padding: "8px 12px" }}
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
}
