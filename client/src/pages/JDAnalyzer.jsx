import { useState } from "react";
import axios from "axios";
import API_URL from "../api/api";

export default function JDAnalyzer() {
  const [jobTitle, setJobTitle] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [parsed, setParsed] = useState(null);

  const sectionTitles = [
    "Match Score",
    "Top Strengths Based on JD",
    "Missing / Important Skills",
    "Recommended Keywords to Add",
    "Tailored Resume Bullet Suggestions",
    "Fit Verdict",
    "Improvement Tips",
  ];

  const parseAnalysis = (text) => {
    if (!text) return null;

    const parsedSections = [];
    let remaining = text;

    sectionTitles.forEach((title, index) => {
      const start = remaining.indexOf(title);
      if (start === -1) return;

      const end =
        index + 1 < sectionTitles.length
          ? remaining.indexOf(sectionTitles[index + 1])
          : remaining.length;

      let content = remaining.slice(start + title.length, end).trim();

      // ✅ CLEAN FORMATTING SAME AS RESUME PAGES
      content = content
        .replace(/^\d+[\).\:\-]?\s*/gm, "")     // numbering
        .replace(/^\:\s*/gm, "")                // remove leading colon
        .replace(/^\*\*\s*/gm, "")              // remove "**"
        .replace(/^\(\d.*?\)\:?\s*/gm, "")      // remove (0-100):
        .replace(/^\s*\*\s*/gm, "• ")           // normalize bullets
        .trim();

      parsedSections.push({
        title,
        content,
        open: index === 0,
      });

      remaining = remaining.slice(end);
    });

    return parsedSections;
  };

  const toggleSection = (index) => {
    setParsed((prev) =>
      prev.map((sec, i) =>
        i === index ? { ...sec, open: !sec.open } : sec
      )
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!jobDescription || jobDescription.trim().length < 20) {
      alert("Please paste a proper job description (at least a few lines).");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      alert("You are not logged in.");
      return;
    }

    try {
      setLoading(true);
      setAnalysis(null);
      setParsed(null);

      const res = await axios.post(
        `${API_URL}/jd/analyze`,
        { jobTitle, jobDescription },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setAnalysis(res.data.analysis);

      const parsedResult = parseAnalysis(res.data.analysis);
      setParsed(parsedResult);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Job analysis failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Job Description Analyzer</h2>

      <form onSubmit={handleSubmit} style={{ marginTop: "20px" }}>

        {/* JOB TITLE */}
        <div style={{ marginBottom: "15px" }}>
          <label style={{ display: "block", marginBottom: "5px" }}>
            Job Title (optional):
          </label>
          <input
            type="text"
            value={jobTitle}
            onChange={(e) => setJobTitle(e.target.value)}
            placeholder="e.g. Junior Full Stack Developer"
            style={{ padding: "8px", width: "100%", maxWidth: "400px" }}
          />
        </div>

        {/* JOB DESCRIPTION */}
        <div style={{ marginBottom: "15px" }}>
          <label style={{ display: "block", marginBottom: "5px" }}>
            Job Description:
          </label>
          <textarea
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            placeholder="Paste the full job description here..."
            rows={8}
            style={{ padding: "8px", width: "100%", maxWidth: "600px" }}
          />
        </div>

        {/* SUBMIT BUTTON */}
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
          {loading ? "Analyzing..." : "Analyze Job Match"}
        </button>
      </form>

      {/* RESULTS */}
      {parsed && (
        <div style={{ marginTop: "30px", whiteSpace: "pre-wrap" }}>
          <h3>Job Match Analysis</h3>

          {parsed.map((section, index) => (
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
  );
}
