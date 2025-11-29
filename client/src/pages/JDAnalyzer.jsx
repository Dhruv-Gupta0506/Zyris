// frontend/components/JDAnalyzer.jsx
import { useState, useRef, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  Briefcase,
  FileText,
  Search,
  CheckCircle,
  AlertTriangle,
  ArrowLeft,
  Loader2,
  Target,
  ListChecks,
  Lightbulb,
  BarChart3,
  Check // Added Check icon
} from "lucide-react";

// Define API_URL directly to avoid import errors
const API_URL = "http://localhost:5000/api";

export default function JDAnalyzer() {
  const [jobTitle, setJobTitle] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  
  const navigate = useNavigate();
  const resultsRef = useRef(null);

  // --- AUTO SCROLL EFFECT ---
  useEffect(() => {
    if (analysis && resultsRef.current) {
      setTimeout(() => {
        resultsRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    }
  }, [analysis]);

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

      const res = await axios.post(
        `${API_URL}/jd/analyze`,
        { jobTitle, jobDescription },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      setAnalysis(res.data.analysis);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Job analysis failed.");
    } finally {
      setLoading(false);
    }
  };

  // Helper for safe number display
  const safeNum = (n) => (typeof n === "number" ? n : "N/A");
  const safeArr = (a) => (Array.isArray(a) && a.length ? a : []);

  return (
    <div className="relative w-full min-h-screen text-[#111827] overflow-hidden pt-36 pb-20 px-4 sm:px-6">
      
      {/* ========================================================= */}
      {/* 1. BACKGROUND THEME */}
      {/* ========================================================= */}
      <div className="fixed inset-0 -z-30 bg-gradient-to-br from-[#f7f8ff] via-[#eef0ff] to-[#e7e9ff]" />
      <div className="fixed top-[-200px] left-1/2 -translate-x-1/2 w-[900px] h-[900px] bg-[radial-gradient(circle,rgba(150,115,255,0.15),transparent_70%)] blur-[120px] -z-20 pointer-events-none"></div>
      <div className="fixed bottom-0 left-0 w-full h-28 bg-gradient-to-b from-transparent to-[#f7f8ff] pointer-events-none z-10"></div>

      <div className="max-w-5xl mx-auto relative z-20">
        
        {/* HEADER - Constrained Width */}
        <div className="text-center mb-12 animate-in fade-in slide-in-from-top-4 duration-700 max-w-3xl mx-auto">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-[#34245f] tracking-tight mb-4">
            Job Description <span className="bg-gradient-to-r from-fuchsia-500 to-indigo-600 text-transparent bg-clip-text">Analyzer</span>
          </h1>
          <p className="text-lg text-gray-600 leading-relaxed">
            Paste a job description to understand exactly what the recruiter is looking for and check your compatibility.
          </p>
        </div>

        {/* INPUT FORM CARD - Constrained Width */}
        <div className="max-w-3xl mx-auto bg-white/80 backdrop-blur-xl rounded-[2rem] shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-white/60 p-8 mb-10 relative overflow-hidden transition-all hover:shadow-[0_8px_40px_rgba(0,0,0,0.06)]">
          <form onSubmit={handleSubmit} className="relative z-10 space-y-6">
            
            {/* Job Title Input */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">
                Job Title <span className="font-normal text-gray-400">(Optional)</span>
              </label>
              <div className="relative">
                <Briefcase className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="e.g. Junior Full Stack Developer"
                  className="w-full pl-14 pr-4 py-4 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent outline-none transition-all font-medium text-gray-800 placeholder-gray-400 shadow-sm"
                />
              </div>
            </div>

            {/* Job Description Textarea */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">
                Job Description
              </label>
              <div className="relative">
                <FileText className="absolute left-5 top-5 text-gray-400 w-5 h-5" />
                <textarea
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Paste the full job description here..."
                  rows={8}
                  className="w-full pl-14 pr-4 py-4 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent outline-none transition-all font-medium text-gray-800 placeholder-gray-400 shadow-sm resize-none"
                />
              </div>
            </div>

            {/* Submit Button - UPDATED LOGIC */}
            <button
              type="submit"
              disabled={loading || analysis}
              className={`
                w-full py-4 rounded-xl font-bold text-lg shadow-[0_4px_20px_rgba(120,50,255,0.2)] transition-all duration-300 flex items-center justify-center gap-2
                ${loading 
                  ? "bg-gray-400 cursor-not-allowed opacity-70" 
                  : analysis
                    ? "bg-gray-100 text-gray-400 border-2 border-gray-200 cursor-not-allowed shadow-none" // Completed State
                    : "bg-gradient-to-r from-fuchsia-500 to-indigo-600 text-white hover:scale-[1.01] hover:shadow-[0_6px_30px_rgba(120,50,255,0.3)]"
                }
              `}
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin w-6 h-6" /> Analyzing...
                </>
              ) : analysis ? (
                <>
                  <Check className="w-6 h-6" /> Analysis Complete
                </>
              ) : (
                <>
                  <Search className="w-5 h-5" /> Analyze Job Match
                </>
              )}
            </button>
          </form>
        </div>

        {/* RESULTS SECTION */}
        {analysis && (
          <div ref={resultsRef} className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700 scroll-mt-32">
            
            {/* OVERVIEW CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Job Title Card */}
              <div className="bg-white/80 backdrop-blur-md p-6 rounded-[2rem] shadow-sm border border-white/60 md:col-span-2 flex items-center gap-4">
                 <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 flex-shrink-0">
                   <Target className="w-7 h-7" />
                 </div>
                 <div>
                    <p className="text-gray-500 font-bold uppercase tracking-wider text-xs mb-1">Target Role</p>
                    <h3 className="text-2xl font-bold text-gray-900 leading-tight">
                      {analysis.jobTitle || "Specified Role"}
                    </h3>
                 </div>
              </div>

              {/* Match Score Card */}
              <div className="bg-white/80 backdrop-blur-md p-6 rounded-[2rem] shadow-sm border border-white/60 flex flex-col justify-center relative overflow-hidden">
                <div className="relative z-10">
                  <p className="text-gray-500 font-bold uppercase tracking-wider text-xs mb-1">Match Potential</p>
                  <p className="text-3xl font-extrabold text-indigo-900">
                    {analysis.matchScore ?? "N/A"}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">{analysis.fitVerdict ?? "N/A"}</p>
                </div>
                {/* Decorative blob */}
                <div className="absolute right-0 top-0 w-24 h-24 bg-indigo-100 rounded-full blur-2xl -mr-6 -mt-6 pointer-events-none"></div>
              </div>
            </div>

            {/* SCORE BREAKDOWN */}
            {analysis.scoreBreakdown && (
              <div className="bg-white/80 backdrop-blur-md p-8 rounded-[2rem] shadow-sm border border-white/60">
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <BarChart3 className="text-indigo-500 w-6 h-6" />
                  Score Breakdown
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                  {Object.entries(analysis.scoreBreakdown).map(([key, value]) => {
                      // Check if score is > 10 to determine if it's out of 100 or 10
                      const numVal = typeof value === 'number' ? value : 0;
                      const isOutOf100 = numVal > 10;
                      const max = isOutOf100 ? 100 : 10;
                      const percentage = (numVal / max) * 100;
                      
                      let colorClass = "bg-rose-500";
                      if (percentage >= 70) colorClass = "bg-emerald-500";
                      else if (percentage >= 40) colorClass = "bg-amber-500";

                      return (
                        <div key={key} className="bg-gray-50/80 rounded-2xl p-5 border border-gray-100">
                           <div className="flex justify-between items-end mb-2">
                              <p className="text-gray-500 text-sm font-semibold capitalize">
                                  {key.replace(/([A-Z])/g, ' $1').trim()}
                              </p>
                              <p className="text-lg font-bold text-gray-900">
                                  {numVal}<span className="text-gray-400 text-sm">/{max}</span>
                              </p>
                           </div>
                           <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                              <div 
                                  className={`h-2 rounded-full ${colorClass} transition-all duration-1000 ease-out`} 
                                  style={{ width: `${percentage}%` }}
                              ></div>
                           </div>
                        </div>
                      );
                  })}
                </div>
              </div>
            )}

            {/* REQUIREMENTS GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               {/* Explicit Requirements */}
               <div className="bg-white/80 backdrop-blur-md p-8 rounded-[2rem] shadow-sm border border-white/60">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <ListChecks className="text-indigo-500 w-5 h-5" /> Explicit Requirements
                  </h3>
                  <ul className="space-y-3">
                      {safeArr(analysis.explicitRequirements).map((req, i) => (
                         <li key={i} className="flex gap-3 text-gray-700 bg-gray-50 p-3 rounded-xl">
                            <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full mt-2 flex-shrink-0"></span>
                            <span className="text-sm leading-relaxed">{req}</span>
                         </li>
                      ))}
                  </ul>
               </div>

               {/* Implicit Requirements */}
               <div className="bg-white/80 backdrop-blur-md p-8 rounded-[2rem] shadow-sm border border-white/60">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <Lightbulb className="text-amber-500 w-5 h-5" /> Implicit Expectations
                  </h3>
                  <ul className="space-y-3">
                      {safeArr(analysis.implicitRequirements).map((req, i) => (
                         <li key={i} className="flex gap-3 text-gray-700 bg-amber-50/50 p-3 rounded-xl border border-amber-100/50">
                            <span className="w-1.5 h-1.5 bg-amber-400 rounded-full mt-2 flex-shrink-0"></span>
                            <span className="text-sm leading-relaxed">{req}</span>
                         </li>
                      ))}
                  </ul>
               </div>
            </div>

            {/* STRENGTHS & WEAKNESSES */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="bg-white/80 backdrop-blur-md p-8 rounded-[2rem] shadow-sm border border-emerald-100/50">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <CheckCircle className="text-emerald-500 w-5 h-5" /> Top Strengths
                  </h3>
                  <ul className="space-y-2">
                      {safeArr(analysis.strengthsBasedOnJD).map((s, i) => (
                         <li key={i} className="flex items-center gap-2 text-gray-700">
                            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div> {s}
                         </li>
                      ))}
                  </ul>
               </div>

               <div className="bg-white/80 backdrop-blur-md p-8 rounded-[2rem] shadow-sm border border-rose-100/50">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <AlertTriangle className="text-rose-500 w-5 h-5" /> Missing Skills
                  </h3>
                  <div className="flex flex-wrap gap-2">
                      {safeArr(analysis.missingSkills).map((s, i) => (
                         <span key={i} className="px-3 py-1.5 bg-rose-50 text-rose-700 rounded-lg text-sm font-medium border border-rose-100">
                            {s}
                         </span>
                      ))}
                  </div>
               </div>
            </div>

            {/* KEYWORDS & TIPS */}
            <div className="bg-white/80 backdrop-blur-md p-8 rounded-[2rem] shadow-sm border border-white/60 space-y-8">
               
               <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Recommended Keywords to Add</h3>
                  <div className="flex flex-wrap gap-2">
                      {safeArr(analysis.recommendedKeywords).map((k, i) => (
                         <span key={i} className="px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-medium border border-indigo-100">
                            {k}
                         </span>
                      ))}
                  </div>
               </div>

               <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-4 border-t border-gray-100">
                  <div>
                      <h3 className="text-lg font-bold text-gray-900 mb-3">Improvement Tips</h3>
                      <ul className="space-y-3">
                         {safeArr(analysis.improvementTips).map((tip, i) => (
                            <li key={i} className="flex gap-3 text-sm text-gray-600 bg-gray-50 p-3 rounded-xl">
                               <span className="font-bold text-indigo-400">{i+1}.</span> {tip}
                            </li>
                         ))}
                      </ul>
                  </div>
                  
                  <div>
                      <h3 className="text-lg font-bold text-gray-900 mb-3">Tailored Bullet Suggestions</h3>
                      <ul className="space-y-3">
                         {safeArr(analysis.tailoredBulletSuggestions).map((bullet, i) => (
                            <li key={i} className="flex gap-3 text-sm text-gray-600 bg-indigo-50/50 p-3 rounded-xl border border-indigo-50">
                               <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full mt-2 flex-shrink-0"></span> {bullet}
                            </li>
                         ))}
                      </ul>
                  </div>
               </div>
            </div>

          </div>
        )}

        {/* BACK TO DASHBOARD BUTTON */}
        <div className="mt-20 mb-8 max-w-2xl mx-auto">
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