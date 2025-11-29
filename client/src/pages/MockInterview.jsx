// frontend/components/MockInterview.jsx
import { useState, useRef, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { 
  Mic, 
  Send, 
  Award, 
  ChevronDown, 
  ChevronUp, 
  Loader2, 
  ArrowLeft,
  Briefcase,
  Layers,
  Hash,
  CheckCircle2,
  AlertCircle,
  Check // Added Check icon
} from "lucide-react";

// Define API_URL directly to avoid import errors
const API_URL = "http://localhost:5000/api";

export default function MockInterview() {
  const [role, setRole] = useState("");
  const [difficulty, setDifficulty] = useState("easy");
  const [questionCount, setQuestionCount] = useState(1);

  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [parsedEvaluation, setParsedEvaluation] = useState(null);
  const [score, setScore] = useState(null);
  const [loading, setLoading] = useState(false);

  // --- SCROLL CONTROL ---
  const [scrollTarget, setScrollTarget] = useState(null); // 'questions' | 'results' | null

  const navigate = useNavigate();
  const questionsRef = useRef(null); // Ref for Questions Section
  const resultRef = useRef(null);    // Ref for Results Section

  // --- UNIFIED SCROLL EFFECT ---
  // This ensures scrolling ONLY happens when we explicitly request it via setScrollTarget
  useEffect(() => {
    if (!scrollTarget) return;

    const timer = setTimeout(() => {
      if (scrollTarget === 'questions' && questionsRef.current) {
        questionsRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
      } else if (scrollTarget === 'results' && resultRef.current) {
        resultRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
      }
      setScrollTarget(null); // Reset trigger
    }, 100); // Small delay to ensure DOM render

    return () => clearTimeout(timer);
  }, [scrollTarget, questions, parsedEvaluation]); // Depend on data to ensure DOM is ready

  // Remove numbering "1. " etc.
  const clean = (q) => q.replace(/^\s*\d+[\).\:-]?\s*/g, "").trim();

  // ------------------------------------------
  // GENERATE QUESTIONS
  // ------------------------------------------
  const generateQuestions = async () => {
    if (!role.trim()) {
      alert("Please enter a role.");
      return;
    }

    try {
      setLoading(true);
      setQuestions([]);
      setAnswers({});
      setParsedEvaluation(null);
      setScore(null);

      const token = localStorage.getItem("token");

      const res = await axios.post(
        `${API_URL}/interview/generate`,
        { role, difficulty, questionCount },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const cleaned = res.data.questions
        .map((q) => clean(q))
        .filter((q) => q.length > 2)
        .slice(0, questionCount);

      setQuestions(cleaned);
      
      // TRIGGER SCROLL TO QUESTIONS
      setScrollTarget('questions');

    } catch (err) {
      console.error(err);
      alert("Failed to generate interview questions.");
    } finally {
      setLoading(false);
    }
  };

  // ------------------------------------------
  // EVALUATE INTERVIEW
  // ------------------------------------------
  const evaluateInterview = async () => {
    if (Object.keys(answers).length !== questions.length) {
      alert("Please answer all questions before submitting.");
      return;
    }

    try {
      setLoading(true);
      // Clear previous results to force UI refresh perception
      setScore(null); 
      setParsedEvaluation(null);

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

      // TRIGGER SCROLL TO RESULTS
      setScrollTarget('results');

    } catch (err) {
      console.error(err);
      alert("Failed to evaluate interview.");
    } finally {
      setLoading(false);
    }
  };

  // ------------------------------------------
  // PARSE EVALUATION (Clean Logic)
  // ------------------------------------------
  const normalize = (content) => {
    return content.replace(/```(\w+)?\s*([\s\S]*?)```/g, (_, lang, code) => {
      const language = lang || "Code";
      return `\n${language}:\n${code.trim()}\n`;
    });
  };

  const parseEvaluation = (text) => {
    // 1. Aggressively remove "FINAL BLOCK" artifacts using a regex that catches newlines and various separator lengths
    // This regex looks for lines with === that contain "FINAL BLOCK" and removes them + content after if meant to be hidden,
    // OR just removes the separator line itself if the content is needed.
    // Assuming the user wants to keep the summary but remove the "=== FINAL BLOCK ===" delimiter line:
    let cleanText = text.replace(/={3,}\s*FINAL BLOCK\s*={3,}/gi, "");
    
    // Clean up any double newlines created
    cleanText = cleanText.trim();

    const parts = cleanText.split(/Q\d+/).slice(1);

    const sections = parts.map((block, idx) => {
      const cleaned = block
        .replace(/Overall Summary[\s\S]*/i, "") 
        .replace(/Executive Summary[\s\S]*/i, "")
        .trim();

      return {
        title: `Question ${idx + 1}`,
        content: normalize(cleaned),
        open: false,
      };
    });

    const summaryMatch = cleanText.match(/(Overall Summary|Executive Summary)[\s\S]*/i);
    let summary = summaryMatch ? normalize(summaryMatch[0]) : "Summary unavailable";
    summary = summary.replace(/^(Overall Summary|Executive Summary)[:\s-]*/i, "").trim();

    return { sections, summary };
  };

  // Toggle function purely updates state, DOES NOT trigger scroll effect
  const toggle = (i) => {
    setParsedEvaluation((prev) => ({
      ...prev,
      sections: prev.sections.map((sec, idx) =>
        idx === i ? { ...sec, open: !sec.open } : sec
      ),
    }));
  };

  // ------------------------------------------
  // RENDER
  // ------------------------------------------
  return (
    <div className="relative w-full min-h-screen text-[#111827] overflow-hidden pt-36 pb-20 px-4 sm:px-6">
      
      {/* ========================================================= */}
      {/* 1. BACKGROUND THEME */}
      {/* ========================================================= */}
      <div className="fixed inset-0 -z-30 bg-gradient-to-br from-[#f7f8ff] via-[#eef0ff] to-[#e7e9ff]" />
      <div className="fixed top-[-200px] left-1/2 -translate-x-1/2 w-[900px] h-[900px] bg-[radial-gradient(circle,rgba(150,115,255,0.15),transparent_70%)] blur-[120px] -z-20 pointer-events-none"></div>
      <div className="fixed bottom-0 left-0 w-full h-28 bg-gradient-to-b from-transparent to-[#f7f8ff] pointer-events-none z-10"></div>

      <div className="max-w-5xl mx-auto relative z-20">
        
        {/* HEADER */}
        <div className="text-center mb-12 animate-in fade-in slide-in-from-top-4 duration-700 max-w-3xl mx-auto">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-[#34245f] tracking-tight mb-4">
            AI Mock <span className="bg-gradient-to-r from-fuchsia-500 to-indigo-600 text-transparent bg-clip-text">Interview</span>
          </h1>
          <p className="text-lg text-gray-600 leading-relaxed">
            Practice answering real-world interview questions tailored to your role and get instant AI feedback.
          </p>
        </div>

        {/* SETUP CARD */}
        <div className="max-w-3xl mx-auto bg-white/80 backdrop-blur-xl rounded-[2rem] shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-white/60 p-8 mb-10 relative transition-all hover:shadow-[0_8px_40px_rgba(0,0,0,0.06)]">
          
          <div className="space-y-6">
            
            {/* Role Input */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">Target Role</label>
              <div className="relative">
                <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="e.g. Frontend Developer, SDE1, Java Developer"
                  className="w-full pl-12 pr-4 py-4 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent outline-none transition-all font-medium text-gray-800 placeholder-gray-400 shadow-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Question Count */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">Questions</label>
                <div className="relative">
                  <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <select
                    value={questionCount}
                    onChange={(e) => setQuestionCount(Number(e.target.value))}
                    className="w-full pl-12 pr-4 py-4 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent outline-none transition-all font-medium text-gray-800 shadow-sm appearance-none cursor-pointer"
                  >
                    {[1, 2, 3, 4, 5].map((n) => (
                      <option key={n} value={n}>{n} Question{n > 1 ? 's' : ''}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
                </div>
              </div>

              {/* Difficulty */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">Difficulty</label>
                <div className="relative">
                  <Layers className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent outline-none transition-all font-medium text-gray-800 shadow-sm appearance-none cursor-pointer"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Generate Button - Updated for Complete State */}
            <button
              onClick={generateQuestions}
              disabled={loading || questions.length > 0}
              className={`
                w-full py-4 rounded-xl font-bold text-lg shadow-[0_4px_20px_rgba(120,50,255,0.2)] 
                transition-all duration-300 flex items-center justify-center gap-2
                ${loading 
                  ? "bg-gray-400 cursor-not-allowed opacity-70" 
                  : questions.length > 0
                    ? "bg-gray-100 text-gray-400 border-2 border-gray-200 cursor-not-allowed shadow-none" 
                    : "bg-gradient-to-r from-fuchsia-500 to-indigo-600 text-white hover:scale-[1.01] hover:shadow-[0_6px_30px_rgba(120,50,255,0.3)]"
                }
              `}
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin w-6 h-6" /> Generating...
                </>
              ) : questions.length > 0 ? (
                <>
                  <Check className="w-6 h-6" /> Interview Generated
                </>
              ) : (
                <>
                  <Mic className="w-5 h-5" /> Start Interview
                </>
              )}
            </button>
          </div>
        </div>

        {/* QUESTIONS SECTION */}
        {questions.length > 0 && (
          <div ref={questionsRef} className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700 scroll-mt-32">
            <h3 className="text-2xl font-bold text-center text-gray-800 mb-6">Interview In Progress</h3>
            
            {questions.map((q, i) => (
              <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 hover:shadow-md transition-all">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center flex-shrink-0 font-bold text-sm">
                    {i + 1}
                  </div>
                  <p className="text-lg font-semibold text-gray-900 leading-relaxed pt-1">
                    {q}
                  </p>
                </div>

                <textarea
                  rows={5}
                  className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-gray-700 placeholder-gray-400 font-sans"
                  placeholder="Type your answer here..."
                  value={answers[i] || ""}
                  onChange={(e) => setAnswers({ ...answers, [i]: e.target.value })}
                />
              </div>
            ))}

            <div className="max-w-3xl mx-auto">
              {/* Submit Button - Updated for Complete State */}
              <button
                onClick={evaluateInterview}
                disabled={loading || parsedEvaluation}
                className={`
                  w-full py-4 rounded-xl font-bold text-lg shadow-lg
                  transition-all duration-300 flex items-center justify-center gap-2
                  ${loading 
                    ? "bg-gray-400 cursor-not-allowed" 
                    : parsedEvaluation
                      ? "bg-gray-100 text-gray-400 border-2 border-gray-200 cursor-not-allowed shadow-none" 
                      : "bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:scale-[1.01] hover:shadow-emerald-500/30"
                  }
                `}
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin w-6 h-6" /> Evaluating...
                  </>
                ) : parsedEvaluation ? (
                  <>
                    <Check className="w-5 h-5" /> Evaluation Complete
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" /> Submit Answers
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* RESULTS SECTION */}
        {parsedEvaluation && (
          <div ref={resultRef} className="mt-20 space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700 scroll-mt-32">
            
            {/* Score Card */}
            <div className="bg-white/90 backdrop-blur-xl p-8 rounded-[2.5rem] shadow-xl border border-white/50 text-center relative overflow-hidden">
               <div className="absolute top-0 left-1/2 -translate-x-1/2 -mt-10 w-64 h-64 bg-fuchsia-100 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
               
               <div className="relative z-10">
                  <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Overall Performance</h3>
                  <div className="flex items-center justify-center gap-2 mb-2">
                     <span className={`text-7xl font-extrabold tracking-tighter ${score >= 70 ? "text-emerald-500" : score >= 40 ? "text-amber-500" : "text-rose-500"}`}>
                        {score}
                     </span>
                     <span className="text-3xl text-gray-400 font-bold self-end mb-2">/100</span>
                  </div>
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-gray-100 rounded-full text-sm font-semibold text-gray-600">
                     <Award className="w-4 h-4" /> AI Evaluation
                  </div>
               </div>
            </div>

            {/* Accordion Feedback */}
            <div className="space-y-4 max-w-4xl mx-auto">
               <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">Detailed Feedback</h3>
               
               {parsedEvaluation.sections.map((sec, i) => (
                  <div key={i} className="bg-white border border-gray-200 rounded-2xl overflow-hidden transition-all hover:shadow-md">
                     <button 
                        onClick={() => toggle(i)}
                        className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50 transition-colors"
                     >
                        <div className="flex items-center gap-4">
                           <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${sec.open ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-500"}`}>
                              Q{i + 1}
                           </div>
                           <span className="font-semibold text-gray-800 text-lg">Question {i + 1} Feedback</span>
                        </div>
                        {sec.open ? <ChevronUp className="text-gray-400" /> : <ChevronDown className="text-gray-400" />}
                     </button>
                     
                     {sec.open && (
                        <div className="p-6 pt-0 bg-gray-50/50 border-t border-gray-100">
                           <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap leading-relaxed font-sans">
                              {sec.content}
                           </div>
                        </div>
                     )}
                  </div>
               ))}
            </div>

            {/* Summary Card */}
            <div className="bg-gradient-to-br from-indigo-50 to-white p-8 rounded-[2rem] border border-indigo-100 shadow-sm max-w-4xl mx-auto">
               <h3 className="text-xl font-bold text-indigo-900 mb-4 flex items-center gap-2">
                  <CheckCircle2 className="w-6 h-6 text-indigo-500" /> Executive Summary
               </h3>
               <div className="prose prose-indigo max-w-none text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {parsedEvaluation.summary}
               </div>
            </div>

          </div>
        )}

        {/* BACK BUTTON */}
        <div className="mt-20 mb-8 max-w-3xl mx-auto">
          <button
            onClick={() => navigate("/dashboard")}
            className="w-full py-4 rounded-xl font-bold text-lg text-white shadow-[0_4px_20px_rgba(120,50,255,0.2)] bg-gradient-to-r from-fuchsia-500 to-indigo-600 hover:scale-[1.01] hover:shadow-[0_6px_30px_rgba(120,50,255,0.3)] transition-all duration-300 flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Dashboard
          </button>
        </div>

      </div>
    </div>
  );
}