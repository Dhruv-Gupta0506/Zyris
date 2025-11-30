// frontend/pages/InterviewHistory.jsx
import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { 
  Mic, 
  Trash2, 
  Calendar, 
  Award, 
  ChevronDown, 
  ChevronUp, 
  ArrowLeft, 
  Loader2,
  CheckCircle2,
  Filter,
  ArrowUpDown,
  Layers,
  HelpCircle,
  MessageSquare
} from "lucide-react";

// Define API_URL directly to avoid import errors
const API_URL = "http://localhost:5000/api";

export default function InterviewHistory() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState({}); // For expanding the main history card
  const [innerExpanded, setInnerExpanded] = useState({}); // For expanding specific questions inside a card
  const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'desc' });
  
  const navigate = useNavigate();

  // --- FETCH HISTORY ---
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${API_URL}/interview/history`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setHistory(res.data.history || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  // --- TOGGLE MAIN CARD EXPAND ---
  const toggleExpand = (id) => {
    setExpanded((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // --- TOGGLE INNER QUESTION EXPAND ---
  const toggleInnerExpand = (recordId, index) => {
    const key = `${recordId}-${index}`;
    setInnerExpanded((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // --- DELETE HANDLER (Connected to Backend) ---
  const handleDelete = async (e, id) => {
    e.stopPropagation(); // Prevent toggling expansion
    
    if (!window.confirm("Are you sure you want to delete this interview record? This cannot be undone.")) return;
    
    try {
      const token = localStorage.getItem("token");
      
      // Call Backend to delete from Database
      await axios.delete(`${API_URL}/interview/history/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Update UI state to remove the item immediately
      setHistory((prev) => prev.filter((item) => item._id !== id));
      
    } catch (err) {
      console.error("Delete failed:", err);
      alert(err.response?.data?.message || "Failed to delete record.");
    }
  };

  // --- SORTING LOGIC ---
  const handleSort = (key) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  const sortedHistory = [...history].sort((a, b) => {
    if (sortConfig.key === 'score') {
      const scoreA = a.score || 0;
      const scoreB = b.score || 0;
      return sortConfig.direction === 'asc' ? scoreA - scoreB : scoreB - scoreA;
    }
    // Default: Date
    return sortConfig.direction === 'asc' 
      ? new Date(a.createdAt) - new Date(b.createdAt) 
      : new Date(b.createdAt) - new Date(a.createdAt);
  });

  // --- PARSING LOGIC ---
  const normalize = (content) => {
    if (!content) return "";
    return content.replace(/```(\w+)?\s*([\s\S]*?)```/g, (_, lang, code) => {
      const language = lang || "Code";
      return `\n${language}:\n${code.trim()}\n`;
    });
  };

  const parseEvaluation = (text) => {
    if (!text) return { sections: [], summary: "No evaluation available." };

    let cleanText = text.replace(/={3,}\s*FINAL BLOCK\s*={3,}/gi, "").trim();
    
    const parts = cleanText.split(/Q\d+/).slice(1);

    const sections = parts.map((block, idx) => {
      const cleaned = block
        .replace(/Overall Summary[\s\S]*/i, "") 
        .replace(/Executive Summary[\s\S]*/i, "")
        .trim();

      return {
        title: `Question ${idx + 1}`,
        content: normalize(cleaned),
      };
    });

    const summaryMatch = cleanText.match(/(Overall Summary|Executive Summary)[\s\S]*/i);
    let summary = summaryMatch ? normalize(summaryMatch[0]) : "";
    summary = summary.replace(/^(Overall Summary|Executive Summary)[:\s-]*/i, "").trim();

    return { sections, summary };
  };

  // --- HELPERS ---
  const safeNum = (n) => (typeof n === "number" ? n : 0);
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

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
        <div className="text-center mb-10 animate-in fade-in slide-in-from-top-4 duration-700">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-[#34245f] tracking-tight mb-4">
            Interview <span className="bg-gradient-to-r from-fuchsia-500 to-indigo-600 text-transparent bg-clip-text">History</span>
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Review your questions, answers, and detailed AI feedback from past mock interviews.
          </p>
        </div>

        {/* CONTROLS BAR */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8 max-w-4xl mx-auto bg-white/60 backdrop-blur-md p-4 rounded-2xl border border-white/60 shadow-sm">
          <div className="flex items-center gap-2 text-gray-500 font-medium">
             <Filter className="w-4 h-4" />
             <span className="text-sm">Sort By:</span>
          </div>
          
          <div className="flex gap-3">
             <button 
                onClick={() => handleSort('createdAt')}
                className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all ${sortConfig.key === 'createdAt' ? 'bg-indigo-100 text-indigo-700' : 'bg-transparent text-gray-600 hover:bg-gray-100'}`}
             >
                <Calendar className="w-4 h-4" /> Date
                {sortConfig.key === 'createdAt' && <ArrowUpDown className="w-3 h-3 opacity-50" />}
             </button>
             
             <button 
                onClick={() => handleSort('score')}
                className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all ${sortConfig.key === 'score' ? 'bg-indigo-100 text-indigo-700' : 'bg-transparent text-gray-600 hover:bg-gray-100'}`}
             >
                <Award className="w-4 h-4" /> Score
                {sortConfig.key === 'score' && <ArrowUpDown className="w-3 h-3 opacity-50" />}
             </button>
          </div>
        </div>

        {/* LIST SECTION */}
        {loading ? (
          <div className="flex justify-center py-20">
             <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-20 bg-white/50 rounded-[2rem] border border-white/60">
             <p className="text-gray-500 text-lg">No interview history found.</p>
             <button onClick={() => navigate("/interview")} className="mt-4 text-indigo-600 font-bold hover:underline">
                Start your first Mock Interview
             </button>
          </div>
        ) : (
          <div className="space-y-6 max-w-4xl mx-auto">
            {sortedHistory.map((record) => {
               const isExpanded = expanded[record._id];
               const score = safeNum(record.score);
               // Color logic for score
               let scoreColor = "text-rose-500";
               let scoreBg = "bg-rose-50";
               if (score >= 70) { scoreColor = "text-emerald-500"; scoreBg = "bg-emerald-50"; }
               else if (score >= 40) { scoreColor = "text-amber-500"; scoreBg = "bg-amber-50"; }

               const parsedData = isExpanded ? parseEvaluation(record.evaluationText) : null;
                const hasDetailedFeedback = parsedData && parsedData.sections && parsedData.sections.length > 0;
                const hasSummary = parsedData && parsedData.summary && parsedData.summary.length > 0;

               return (
                  <div 
                    key={record._id} 
                    className={`bg-white/80 backdrop-blur-xl rounded-[2rem] border border-white/60 shadow-sm overflow-hidden transition-all duration-500 ${isExpanded ? 'ring-2 ring-indigo-100 shadow-md' : 'hover:shadow-md'}`}
                  >
                     {/* SUMMARY HEADER (Always Visible) */}
                     <div 
                        onClick={() => toggleExpand(record._id)}
                        className="p-6 cursor-pointer hover:bg-gray-50/50 transition-colors flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
                     >
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                           <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 flex-shrink-0">
                              <Mic className="w-6 h-6" />
                           </div>
                           <div className="min-w-0">
                              <h3 className="text-lg font-bold text-gray-900 truncate">{record.role || "Untitled Role"}</h3>
                              <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 mt-1">
                                 <span className="flex items-center gap-1 capitalize"><Layers className="w-3 h-3" /> {record.difficulty}</span>
                                 <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                                 <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {formatDate(record.createdAt)}</span>
                              </div>
                           </div>
                        </div>

                        <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end">
                           <div className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold ${scoreBg} ${scoreColor}`}>
                              <Award className="w-5 h-5" />
                              <span>{score}/100</span>
                           </div>
                           
                           <div className="flex items-center gap-2">
                              <button 
                                 onClick={(e) => handleDelete(e, record._id)}
                                 className="p-2 text-gray-400 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-colors"
                                 title="Delete Analysis"
                              >
                                 <Trash2 className="w-5 h-5" />
                              </button>
                              <div className={`p-2 rounded-full transition-transform duration-300 ${isExpanded ? 'rotate-180 bg-gray-100' : ''}`}>
                                 <ChevronDown className="w-5 h-5 text-gray-400" />
                              </div>
                           </div>
                        </div>
                     </div>

                     {/* EXPANDED CONTENT */}
                     {isExpanded && parsedData && (
                        <div className="border-t border-gray-100 p-6 md:p-8 bg-gray-50/30 animate-in slide-in-from-top-2 duration-300">
                           
                           {/* 1. SCORE CARD (Always shown if expanded) */}
                           <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-white/50 text-center relative overflow-hidden mb-8">
                              <div className="absolute top-0 left-1/2 -translate-x-1/2 -mt-10 w-64 h-64 bg-fuchsia-100 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
                              <div className="relative z-10">
                                 <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Overall Performance</h3>
                                 <div className="flex items-center justify-center gap-2 mb-2">
                                    <span className={`text-6xl font-extrabold tracking-tighter ${scoreColor}`}>
                                       {score}
                                    </span>
                                    <span className="text-3xl text-gray-400 font-bold self-end mb-2">/100</span>
                                 </div>
                                 <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-gray-100 rounded-full text-sm font-semibold text-gray-600">
                                    <Award className="w-4 h-4" /> AI Evaluation
                                 </div>
                              </div>
                           </div>

                           {/* 2. DETAILED Q&A + FEEDBACK ACCORDION - RENDERED CONDITIONALLY */}
                            {hasDetailedFeedback && (
                              <div className="space-y-4 max-w-4xl mx-auto mb-8">
                                  <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">Review Q&A</h3>
                                  
                                  {parsedData.sections.map((sec, i) => {
                                     const innerKey = `${record._id}-${i}`;
                                     const isOpen = innerExpanded[innerKey];

                                     return (
                                        <div key={i} className="bg-white border border-gray-200 rounded-2xl overflow-hidden transition-all hover:shadow-md">
                                           <button 
                                              onClick={() => toggleInnerExpand(record._id, i)}
                                              className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50 transition-colors"
                                           >
                                              <div className="flex items-center gap-4">
                                                 <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${isOpen ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-500"}`}>
                                                    Q{i + 1}
                                                 </div>
                                                 <span className="font-semibold text-gray-800 text-lg">Question {i + 1} Analysis</span>
                                              </div>
                                              {isOpen ? <ChevronUp className="text-gray-400" /> : <ChevronDown className="text-gray-400" />}
                                           </button>
                                           
                                           {isOpen && (
                                              <div className="p-6 bg-gray-50/50 border-t border-gray-100 flex flex-col gap-6">
                                                 
                                                {/* Question */}
                                                <div className="flex gap-4">
                                                   <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-1">
                                                      <HelpCircle className="w-4 h-4 text-blue-600" />
                                                   </div>
                                                   <div className="flex-1">
                                                      <h4 className="text-sm font-bold text-gray-900 mb-1">Question</h4>
                                                      <p className="text-gray-700 leading-relaxed font-medium">
                                                         {record.questions?.[i] || "Question text not available in history."}
                                                      </p>
                                                   </div>
                                                </div>

                                                {/* Answer */}
                                                <div className="flex gap-4">
                                                   <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0 mt-1">
                                                      <MessageSquare className="w-4 h-4 text-indigo-600" />
                                                   </div>
                                                   <div className="flex-1">
                                                      <h4 className="text-sm font-bold text-gray-900 mb-1">Your Answer</h4>
                                                      <p className="text-gray-700 leading-relaxed whitespace-pre-wrap bg-white p-4 rounded-xl border border-gray-200">
                                                         {record.answers?.[i] || "No answer recorded."}
                                                      </p>
                                                   </div>
                                                </div>

                                                {/* Feedback */}
                                                <div className="pl-12">
                                                   <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm relative overflow-hidden">
                                                      <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-fuchsia-500 to-indigo-600"></div>
                                                      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">AI Feedback</h4>
                                                      <div className="prose prose-sm max-w-none text-gray-600 leading-relaxed">
                                                         {sec.content}
                                                      </div>
                                                </div>
                                                </div>

                                              </div>
                                           )}
                                        </div>
                                     );
                                  })}
                              </div>
                            )}

                           {/* 3. EXECUTIVE SUMMARY - RENDERED CONDITIONALLY */}
                            {hasSummary && (
                              <div className="bg-gradient-to-br from-indigo-50 to-white p-8 rounded-[2rem] border border-indigo-100 shadow-sm max-w-4xl mx-auto">
                                  <h3 className="text-xl font-bold text-indigo-900 mb-4 flex items-center gap-2">
                                      <CheckCircle2 className="w-6 h-6 text-indigo-500" /> Executive Summary
                                  </h3>
                                  <div className="prose prose-indigo max-w-none text-gray-700 leading-relaxed whitespace-pre-wrap">
                                      {parsedData.summary}
                                  </div>
                              </div>
                            )}

                        </div>
                     )}
                  </div>
               );
            })}
          </div>
        )}

        {/* BACK TO DASHBOARD BUTTON */}
        <div className="mt-16 mb-8 max-w-2xl mx-auto">
          <button
            onClick={() => { window.scrollTo(0, 0); navigate("/dashboard"); }}
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