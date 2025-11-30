import { useState, useRef, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import API_URL from "../api/api";
import { 
  UploadCloud, 
  FileText, 
  CheckCircle, 
  AlertTriangle, 
  Award, 
  Target, 
  Briefcase, 
  Loader2, 
  ChevronRight, 
  BarChart3, 
  ArrowLeft, 
  Check,
  RefreshCw // Added Refresh icon
} from "lucide-react";

export default function ResumeAnalyzer() {
  const [file, setFile] = useState(null);
  const [targetRole, setTargetRole] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Track parameters used for the current analysis to detect changes
  const [analyzedParams, setAnalyzedParams] = useState(null);

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

  // --- DIRTY INPUT CHECK ---
  // Returns true if the current inputs differ from what was last analyzed
  const isInputDirty = analyzedParams && (
    analyzedParams.targetRole !== targetRole ||
    !file || // If file is removed, strictly distinct from analyzed state
    analyzedParams.fileName !== file.name || 
    analyzedParams.fileLastModified !== file.lastModified
  );

  // --- LOGIC ---
  const handleFileChange = (e) => {
    const selected = e.target.files[0];

    if (!selected) {
      setFile(null);
      return;
    }

    if (selected.type !== "application/pdf") {
      alert("Only PDF files are allowed!");
      e.target.value = "";
      setFile(null);
      return;
    }

    if (selected.size > 5 * 1024 * 1024) {
      alert("Please upload a PDF smaller than 5MB.");
      e.target.value = "";
      setFile(null);
      return;
    }

    setFile(selected);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!file) {
      alert("Please select a PDF file first.");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      alert("You are not logged in.");
      return;
    }

    setLoading(true);
    setAnalysis(null);

    try {
      const formData = new FormData();
      formData.append("resume", file);
      formData.append("targetRole", targetRole);

      const res = await axios.post(`${API_URL}/resume/analyze`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
        timeout: 120000, 
      });

      setAnalysis(res.data.analysis);
      // Lock current params as "analyzed"
      setAnalyzedParams({
        targetRole: targetRole,
        fileName: file.name,
        fileLastModified: file.lastModified
      });

    } catch (err) {
      console.error(err);
      const message = err.response?.data?.message || "Failed to analyze resume.";
      alert(message);
    } finally {
      setLoading(false);
    }
  };

  const safeNum = (n) => (typeof n === "number" ? n : 0);
  const safeArr = (a) => (Array.isArray(a) && a.length ? a : []);

  // --- RENDER ---
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
        <div className="text-center mb-12 animate-in fade-in slide-in-from-top-4 duration-700">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-[#34245f] tracking-tight mb-4">
            AI Resume <span className="bg-gradient-to-r from-fuchsia-500 to-indigo-600 text-transparent bg-clip-text">Analyzer</span>
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Upload your resume and get instant, detailed feedback on how to improve your ATS score and impress recruiters.
          </p>
        </div>

        {/* FORM CARD */}
        <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-white/60 p-8 mb-10 relative overflow-hidden transition-all hover:shadow-[0_8px_40px_rgba(0,0,0,0.06)]">
            
          <form onSubmit={handleSubmit} className="relative z-10 space-y-8">
            
            {/* 1. FILE UPLOAD AREA */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">
                Upload Resume (PDF)
              </label>
              
              <div className="relative group">
                <input 
                  type="file" 
                  id="resume-upload"
                  accept="application/pdf" 
                  onChange={handleFileChange} 
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                />
                <div className={`
                  border-2 border-dashed rounded-2xl p-10 transition-all duration-300 flex flex-col items-center justify-center text-center
                  ${file 
                    ? "border-fuchsia-500 bg-fuchsia-50/30" 
                    : "border-gray-300 bg-white/50 hover:bg-white hover:border-fuchsia-400 hover:shadow-lg hover:shadow-fuchsia-500/10"
                  }
                `}>
                  {file ? (
                    <>
                      <div className="w-14 h-14 bg-gradient-to-br from-fuchsia-500 to-indigo-600 text-white rounded-2xl flex items-center justify-center mb-4 shadow-md">
                        <FileText className="w-7 h-7" />
                      </div>
                      <p className="text-indigo-900 font-bold text-lg">{file.name}</p>
                      <p className="text-indigo-500 text-sm mt-1 font-medium">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    </>
                  ) : (
                    <>
                      <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
                        <UploadCloud className="w-7 h-7" />
                      </div>
                      <p className="text-gray-900 font-bold text-xl">Click or Drag to Upload Resume</p>
                      <p className="text-gray-500 text-sm mt-2">PDF Only (Max 5MB)</p>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* 2. TARGET ROLE INPUT */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">
                Target Role <span className="font-normal text-gray-400">(Optional)</span>
              </label>
              <div className="relative">
                <Briefcase className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="e.g. Frontend Developer, Data Analyst..."
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  className="w-full pl-14 pr-4 py-4 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent outline-none transition-all font-medium text-gray-800 placeholder-gray-400 shadow-sm"
                />
              </div>
            </div>

            {/* 3. SUBMIT BUTTON */}
            {/* Logic: Disabled if loading OR if results exist AND inputs are unchanged */}
            <button
              type="submit"
              disabled={loading || (analysis && !isInputDirty)}
              className={`
                w-full py-4 rounded-xl font-bold text-lg shadow-[0_4px_20px_rgba(120,50,255,0.2)] transition-all duration-300 flex items-center justify-center gap-2
                ${loading 
                  ? "bg-gray-400 cursor-not-allowed opacity-70" 
                  : (analysis && !isInputDirty)
                    ? "bg-gray-100 text-gray-400 border-2 border-gray-200 cursor-not-allowed shadow-none" 
                    : "bg-gradient-to-r from-fuchsia-500 to-indigo-600 text-white hover:scale-[1.01] hover:shadow-[0_6px_30px_rgba(120,50,255,0.3)]"
                }
              `}
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin w-6 h-6" /> Analyzing...
                </>
              ) : (analysis && !isInputDirty) ? (
                <>
                  <Check className="w-6 h-6" /> Analysis Complete
                </>
              ) : analysis ? ( // analysis exists but inputs are dirty -> Show Re-analyze
                <>
                  <RefreshCw className="w-5 h-5" /> Re-Analyze Resume
                </>
              ) : (
                "Analyze Resume"
              )}
            </button>
          </form>
        </div>

        {/* RESULTS SECTION */}
        {analysis && (
          <div ref={resultsRef} className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700 scroll-mt-32">
            
            {/* OVERVIEW CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Score Card */}
              <div className="bg-white/80 backdrop-blur-md p-8 rounded-[2rem] shadow-sm border border-white/60 flex items-center justify-between relative overflow-hidden group hover:shadow-md transition-all">
                <div className="relative z-10">
                  <p className="text-gray-500 font-bold uppercase tracking-wider text-xs mb-2">ATS Compatibility Score</p>
                  <div className="flex items-baseline gap-1">
                    <span className={`text-6xl font-extrabold tracking-tighter ${safeNum(analysis.atsScore) >= 70 ? "text-emerald-500" : safeNum(analysis.atsScore) >= 50 ? "text-amber-500" : "text-rose-500"}`}>
                      {safeNum(analysis.atsScore)}
                    </span>
                    <span className="text-2xl text-gray-400 font-bold">/ 100</span>
                  </div>
                </div>
                <div className="relative z-10 w-16 h-16 rounded-full bg-fuchsia-50 flex items-center justify-center text-fuchsia-600 shadow-inner">
                  <Award className="w-8 h-8" />
                </div>
                <div className={`absolute right-0 top-0 w-40 h-40 rounded-full blur-[60px] opacity-20 -mr-10 -mt-10 pointer-events-none ${safeNum(analysis.atsScore) >= 70 ? "bg-emerald-400" : "bg-rose-400"}`}></div>
              </div>

              {/* Role Card */}
              <div className="bg-white/80 backdrop-blur-md p-8 rounded-[2rem] shadow-sm border border-white/60 flex items-center justify-between group hover:shadow-md transition-all">
                 <div>
                    <p className="text-gray-500 font-bold uppercase tracking-wider text-xs mb-2">Analyzing For</p>
                    <h3 className="text-2xl font-bold text-gray-900 leading-tight">
                      {analysis.targetRole || "General Resume"}
                    </h3>
                 </div>
                 <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-inner">
                   <Target className="w-7 h-7" />
                 </div>
              </div>
            </div>

            {/* SCORING BREAKDOWN */}
            {analysis.scoringBreakdown && (
              <div className="bg-white/80 backdrop-blur-md p-8 rounded-[2rem] shadow-sm border border-white/60">
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <BarChart3 className="text-indigo-500 w-6 h-6" />
                  Detailed Breakdown
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                  {Object.entries(analysis.scoringBreakdown).map(([key, value]) => {
                    const score = safeNum(value);
                    const isOutOf100 = score > 10; 
                    const max = isOutOf100 ? 100 : 10;
                    const percentage = (score / max) * 100;
                    
                    let colorClass = "bg-rose-500";
                    if (percentage >= 70) colorClass = "bg-emerald-500";
                    else if (percentage >= 40) colorClass = "bg-amber-500";

                    return (
                      <div key={key} className="bg-gray-50/80 rounded-2xl p-5 border border-gray-100 hover:border-indigo-100 transition-colors">
                        <div className="flex justify-between items-end mb-2">
                            <p className="text-gray-500 text-sm font-semibold capitalize">
                                {key.replace(/([A-Z])/g, ' $1').trim()}
                            </p>
                            <p className="text-lg font-bold text-gray-900">
                                {score}<span className="text-gray-400 text-sm">/{max}</span>
                            </p>
                        </div>
                        
                        <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                            <div 
                                className={`h-2.5 rounded-full ${colorClass} transition-all duration-1000 ease-out`} 
                                style={{ width: `${percentage}%` }}
                            ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* STRENGTHS & WEAKNESSES GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white/80 backdrop-blur-md p-8 rounded-[2rem] shadow-sm border border-emerald-100/50 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-400/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2 relative z-10">
                  <CheckCircle className="text-emerald-500 w-6 h-6" />
                  Key Strengths
                </h3>
                <ul className="space-y-3 relative z-10">
                  {safeArr(analysis.strengths).map((s, i) => (
                    <li key={i} className="flex items-start gap-3 p-3 rounded-xl bg-emerald-50/60 border border-emerald-100/50">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0"></span>
                      <span className="text-gray-700 leading-relaxed font-medium">{s}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-white/80 backdrop-blur-md p-8 rounded-[2rem] shadow-sm border border-rose-100/50 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-rose-400/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2 relative z-10">
                  <AlertTriangle className="text-rose-500 w-6 h-6" />
                  Areas for Improvement
                </h3>
                <ul className="space-y-3 relative z-10">
                  {safeArr(analysis.weaknesses).map((s, i) => (
                    <li key={i} className="flex items-start gap-3 p-3 rounded-xl bg-rose-50/60 border border-rose-100/50">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-rose-500 flex-shrink-0"></span>
                      <span className="text-gray-700 leading-relaxed font-medium">{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* SKILLS & KEYWORDS */}
            <div className="bg-white/80 backdrop-blur-md p-8 rounded-[2rem] shadow-sm border border-white/60">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-indigo-500"></span> Detected Skills
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {safeArr(analysis.skills).map((s, i) => (
                        <span key={i} className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-full text-sm font-semibold border border-indigo-100 hover:bg-indigo-100 transition-colors cursor-default">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-rose-500"></span> Missing Keywords
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {safeArr(analysis.missingKeywords).map((s, i) => (
                        <span key={i} className="px-4 py-2 bg-rose-50 text-rose-700 rounded-full text-sm font-semibold border border-rose-100 opacity-90 hover:opacity-100 transition-opacity cursor-default">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
               </div>
            </div>

            {/* DETAILED ADVICE */}
            <div className="bg-white/80 backdrop-blur-md p-8 rounded-[2rem] shadow-sm border border-white/60 space-y-12">
              
              {/* Recruiter Impression */}
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Recruiter's Impression</h3>
                <div className="p-6 bg-gradient-to-r from-fuchsia-50 to-indigo-50 rounded-2xl text-gray-800 italic border-l-4 border-fuchsia-400 shadow-sm leading-relaxed text-lg">
                   "{analysis.recruiterImpression ?? "N/A"}"
                </div>
              </div>

              {/* Improvement Checklist */}
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Improvement Checklist</h3>
                <div className="grid grid-cols-1 gap-3">
                  {safeArr(analysis.improvementChecklist).map((item, i) => (
                    <div key={i} className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                       <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center flex-shrink-0 font-bold text-xs">
                          {i + 1}
                       </div>
                       <p className="text-gray-700 font-medium">{item}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Rewrites Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="bg-fuchsia-50/50 p-6 rounded-2xl border border-fuchsia-100">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Summary Rewrite</h3>
                    <div className="text-gray-700 text-sm leading-relaxed">
                       {analysis.summaryRewrite ?? "N/A"}
                    </div>
                  </div>
                  
                  <div className="bg-indigo-50/50 p-6 rounded-2xl border border-indigo-100">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Bullet Point Enhancements</h3>
                      <ul className="space-y-3">
                        {safeArr(analysis.bulletRewrites).slice(0, 3).map((item, i) => (
                           <li key={i} className="flex gap-3 text-sm text-gray-700">
                              <ChevronRight className="w-5 h-5 text-indigo-500 flex-shrink-0" />
                              <span className="leading-relaxed">{item}</span>
                           </li>
                        ))}
                      </ul>
                  </div>
              </div>
            </div>

          </div>
        )}

        {/* BACK BUTTON */}
        <div className="mt-20 mb-8 max-w-3xl mx-auto">
          <button
            onClick={() =>{ window.scrollTo(0, 0); navigate("/dashboard")}}
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