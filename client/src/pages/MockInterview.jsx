import { useState, useRef } from "react";
import axios from "axios";
import API_URL from "../api/api";

export default function MockInterview() {
  const [role, setRole] = useState("");
  const [difficulty, setDifficulty] = useState("easy");
  const [questionCount, setQuestionCount] = useState(1);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [parsedEvaluation, setParsedEvaluation] = useState(null);
  const [score, setScore] = useState(null);
  const [loading, setLoading] = useState(false);

  // ✅ Ref for auto-scroll
  const resultRef = useRef(null);

  const cleanQuestion = (q) =>
    q.replace(/^\s*\d+[\).\:-]?\s*/gm, "").trim();

  const generateQuestions = async () => {
    if (!role.trim()) {
      alert("Please enter a role first.");
      return;
    }

    try {
      setLoading(true);
      setQuestions([]);
      setParsedEvaluation(null);
      setScore(null);
      setAnswers({});

      const token = localStorage.getItem("token");

      const res = await axios.post(
        `${API_URL}/interview/generate`,
        { role, difficulty, questionCount },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const cleaned = res.data.questions
        .map((q) => cleanQuestion(q))
        .filter((q) => q.length > 3)
        .slice(0, questionCount);

      setQuestions(cleaned);
    } catch (err) {
      console.error(err);
      alert("Failed to generate interview questions.");
    } finally {
      setLoading(false);
    }
  };

  const evaluateInterview = async () => {
    if (Object.keys(answers).length !== questions.length) {
      alert("Please answer all questions before submitting.");
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      const res = await axios.post(
        `${API_URL}/interview/evaluate`,
        {
          role,
          difficulty,
          questionCount,
          questions,
          answers: Object.values(answers),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setScore(res.data.score);
      const parsed = parseEvaluation(res.data.evaluation);
      setParsedEvaluation(parsed);

      // ✅ Auto-scroll AFTER state updates
      setTimeout(() => {
        if (resultRef.current) {
          resultRef.current.scrollIntoView({ behavior: "smooth" });
        }
      }, 300);

    } catch (err) {
      console.error(err);
      alert("Failed to evaluate interview.");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Convert code segments without styling, with language label
  const normalizeCodeBlocks = (content) => {
    return content.replace(/```(\w+)?\s*([\s\S]*?)```/g, (match, lang, code) => {
      const language = lang ? lang.trim() : "Code";
      return `\n${language}:\n${code.trim()}\n`;
    });
  };

  const parseEvaluation = (text) => {
    const parts = text.split(/Q\d+/).slice(1);

    const sections = parts.map((part, index) => {
      const cleaned = part
        .replace(/Overall Summary[\s\S]*/i, "")
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

  const toggleSection = (index) => {
    setParsedEvaluation((prev) => ({
      ...prev,
      sections: prev.sections.map((sec, i) =>
        i === index ? { ...sec, open: !sec.open } : sec
      ),
    }));
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Mock Interview</h2>

      <div style={{ marginBottom: "15px" }}>
        <label>Role:</label><br />
        <input
          type="text"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          placeholder="e.g. Software Engineer Intern"
          style={{ padding: "8px", width: "300px" }}
        />
      </div>

      <div style={{ marginBottom: "15px" }}>
        <label>Number of Questions:</label><br />
        <select
          value={questionCount}
          onChange={(e) => setQuestionCount(Number(e.target.value))}
          style={{ padding: "8px", width: "200px" }}
        >
          {[1, 2, 3, 4, 5].map((num) => (
            <option key={num} value={num}>{num}</option>
          ))}
        </select>
      </div>

      <div style={{ marginBottom: "15px" }}>
        <label>Difficulty:</label><br />
        <select
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value)}
          style={{ padding: "8px", width: "200px" }}
        >
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
      </div>

      <button
        onClick={generateQuestions}
        disabled={loading}
        style={{
          padding: "10px 20px",
          background: loading ? "gray" : "black",
          color: "white",
          border: "none",
          cursor: "pointer",
        }}
      >
        {loading ? "Generating..." : "Generate Questions"}
      </button>

      {questions.length > 0 && (
        <div style={{ marginTop: "25px" }}>
          <h3>Interview Questions</h3>

          {questions.map((q, index) => (
            <div key={index} style={{ marginBottom: "25px" }}>
              <p style={{ fontWeight: "bold", marginBottom: "8px" }}>
                {index + 1}. {q}
              </p>

              <textarea
                rows={4}
                placeholder="Write your answer here..."
                value={answers[index] || ""}
                onChange={(e) =>
                  setAnswers({ ...answers, [index]: e.target.value })
                }
                style={{
                  width: "100%",
                  maxWidth: "600px",
                  padding: "10px",
                }}
              />
            </div>
          ))}

          <button
            onClick={evaluateInterview}
            disabled={loading}
            style={{
              padding: "10px 20px",
              background: loading ? "gray" : "darkred",
              color: "white",
              border: "none",
              cursor: "pointer",
              marginTop: "10px",
            }}
          >
            {loading ? "Evaluating..." : "Submit Answers for Evaluation"}
          </button>
        </div>
      )}

      {parsedEvaluation && (
        <div
          ref={resultRef}
          style={{ marginTop: "30px", whiteSpace: "pre-wrap" }}
        >
          <h3>Evaluation Result</h3>
          <p><strong>Score:</strong> {score}/100</p>

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
                    padding: "12px 16px",
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

          <h3>Overall Summary</h3>
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
        </div>
      )}
    </div>
  );
}
