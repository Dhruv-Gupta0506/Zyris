// frontend/components/MatchEngine.jsx

import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { 
  Search, 
  FileText, 
  Briefcase, 
  CheckCircle, 
  AlertTriangle, 
  ArrowLeft, 
  Loader2, 
  Target, 
  BarChart3, 
  TrendingUp, 
  Users, 
  XCircle,
  ChevronDown,
  Plus,
  Check // Added Check icon
} from "lucide-react";

// Define API_URL directly to avoid import errors
const API_URL = "http://localhost:5000/api";

export default function MatchEngine() {
  const [resumes, setResumes] = useState([]);
  const [jobs, setJobs] = useState([]);

  // Store full objects to display details in dropdown
  const [selectedResume, setSelectedResume] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);

  // Custom Dropdown Visibility States
  const [showResumeDropdown, setShowResumeDropdown] = useState(false);
  const [showJobDropdown, setShowJobDropdown] = useState(false);

  const [loading, setLoading] = useState(false);
  const [matchResult, setMatchResult] = useState(null);

  const navigate = useNavigate();
  const resultsRef = useRef(null);
  
  // Refs for click-outside detection
  const resumeDropdownRef = useRef(null);
  const jobDropdownRef = useRef(null);

  // --- CLICK OUTSIDE TO CLOSE DROPDOWNS ---
  useEffect(() => {
    function handleClickOutside(event) {
      if (resumeDropdownRef.current && !resumeDropdownRef.current.contains(event.target)) {
        setShowResumeDropdown(false);
      }
      if (jobDropdownRef.current && !jobDropdownRef.current.contains(event.target)) {
        setShowJobDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- AUTO SCROLL EFFECT ---
  useEffect(() => {
    if (matchResult && resultsRef.current) {
      setTimeout(() => {
        resultsRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    }
  }, [matchResult]);

  // Fetch history on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");

        const [resumeRes, jdRes] = await Promise.all([
          axios.get(`${API_URL}/resume/history`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${API_URL}/jd/history`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        setResumes(resumeRes.data.history || []);
        setJobs(jdRes.data.history || []);
      } catch (err) {
        console.error(err);
      }
    };

    fetchData();
  }, []);

  const handleCompare = async (e) => {
    e.preventDefault();

    if (!selectedResume || !selectedJob) {
      alert("Please select both a Resume Analysis and a Job Description Analysis.");
      return;
    }

    try {
      setLoading(true);
      setMatchResult(null);

      const token = localStorage.getItem("token");

      // Pass IDs to backend
      const res = await axios.post(
        `${API_URL}/match/analyze`,
        { resumeId: selectedResume._id, jobId: selectedJob._id },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setMatchResult(res.data.match);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to compute match.");
    } finally {
      setLoading(false);
    }
  };

  const safeNum = (n) => (typeof n === "number" ? n : 0);
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
        
        {/* HEADER */}
        <div className="text-center mb-12 animate-in fade-in slide-in-from-top-4 duration-700 max-w-3xl mx-auto">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-[#34245f] tracking-tight mb-4">
            Match <span className="bg-gradient-to-r from-fuchsia-500 to-indigo-600 text-transparent bg-clip-text">Engine</span>
          </h1>
          <p className="text-lg text-gray-600 leading-relaxed">
            Select an existing resume and job description to get a precise compatibility score and hiring probability.
          </p>
        </div>

        {/* SELECTION FORM */}
        <div className="max-w-3xl mx-auto bg-white/80 backdrop-blur-xl rounded-[2rem] shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-white/60 p-8 mb-10 relative transition-all hover:shadow-[0_8px_40px_rgba(0,0,0,0.06)]">
          <form onSubmit={handleCompare} className="relative z-10 space-y-6">
            
            {/* --- CUSTOM RESUME DROPDOWN --- */}
            <div className="relative" ref={resumeDropdownRef}>
              <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">
                Select Resume Analysis
              </label>
              
              <div 
                onClick={() => { setShowResumeDropdown(!showResumeDropdown); setShowJobDropdown(false); }}
                className={`
                  w-full pl-12 pr-6 py-4 bg-white border rounded-xl cursor-pointer flex items-center justify-between transition-all
                  ${showResumeDropdown ? "border-fuchsia-500 ring-2 ring-fuchsia-100" : "border-gray-200 hover:border-fuchsia-300"}
                `}
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <FileText className="text-gray-400 w-5 h-5 flex-shrink-0" />
                  <span className={`text-base font-medium truncate ${selectedResume ? "text-gray-900" : "text-gray-400"}`}>
                    {selectedResume 
                      ? `${selectedResume.fileName} (ATS: ${selectedResume.atsScore ?? "N/A"})` 
                      : "-- Choose a Resume --"}
                  </span>
                </div>
                <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${showResumeDropdown ? "rotate-180" : ""}`} />
              </div>

              {/* Dropdown List */}
              {showResumeDropdown && (
                <div className="absolute top-full left-0 w-full mt-2 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 max-h-64 flex flex-col">
                  <div className="overflow-y-auto flex-1">
                    {resumes.length === 0 ? (
                      <div className="p-4 text-center text-gray-500 text-sm">No resumes found.</div>
                    ) : (
                      resumes.map((r) => (
                        <div 
                          key={r._id}
                          onClick={() => { setSelectedResume(r); setShowResumeDropdown(false); }}
                          className="px-5 py-3 hover:bg-fuchsia-50 cursor-pointer border-b border-gray-50 last:border-0 transition-colors group"
                        >
                          <p className="font-bold text-gray-800 text-sm group-hover:text-fuchsia-700">{r.fileName}</p>
                          <p className="text-xs text-gray-500">Role: {r.targetRole || "General"} | ATS Score: {r.atsScore ?? "N/A"}</p>
                        </div>
                      ))
                    )}
                  </div>
                  {/* Create New Action */}
                  <div 
                    onClick={() => navigate("/resume")}
                    className="px-5 py-3 bg-gray-50 hover:bg-indigo-50 cursor-pointer flex items-center gap-2 text-indigo-600 font-bold text-sm border-t border-gray-100 sticky bottom-0 transition-colors"
                  >
                    <Plus className="w-4 h-4" /> Analyze New Resume
                  </div>
                </div>
              )}
            </div>

            {/* --- CUSTOM JD DROPDOWN --- */}
            <div className="relative" ref={jobDropdownRef}>
              <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">
                Select Job Description
              </label>
              
              <div 
                onClick={() => { setShowJobDropdown(!showJobDropdown); setShowResumeDropdown(false); }}
                className={`
                  w-full pl-12 pr-6 py-4 bg-white border rounded-xl cursor-pointer flex items-center justify-between transition-all
                  ${showJobDropdown ? "border-indigo-500 ring-2 ring-indigo-100" : "border-gray-200 hover:border-indigo-300"}
                `}
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <Briefcase className="text-gray-400 w-5 h-5 flex-shrink-0" />
                  <span className={`text-base font-medium truncate ${selectedJob ? "text-gray-900" : "text-gray-400"}`}>
                    {selectedJob 
                      ? `${selectedJob.jobTitle || "Untitled"} (Match: ${safeNum(selectedJob.matchScore)})` 
                      : "-- Choose a Job Description --"}
                  </span>
                </div>
                <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${showJobDropdown ? "rotate-180" : ""}`} />
              </div>

              {/* Dropdown List */}
              {showJobDropdown && (
                <div className="absolute top-full left-0 w-full mt-2 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 max-h-64 flex flex-col">
                  <div className="overflow-y-auto flex-1">
                    {jobs.length === 0 ? (
                      <div className="p-4 text-center text-gray-500 text-sm">No JDs found.</div>
                    ) : (
                      jobs.map((j) => (
                        <div 
                          key={j._id}
                          onClick={() => { setSelectedJob(j); setShowJobDropdown(false); }}
                          className="px-5 py-3 hover:bg-indigo-50 cursor-pointer border-b border-gray-50 last:border-0 transition-colors group"
                        >
                          <p className="font-bold text-gray-800 text-sm group-hover:text-indigo-700">{j.jobTitle || "Untitled Job"}</p>
                          <p className="text-xs text-gray-500">Initial Match: {safeNum(j.matchScore)} | Verdict: {j.fitVerdict}</p>
                        </div>
                      ))
                    )}
                  </div>
                  {/* Create New Action */}
                  <div 
                    onClick={() => navigate("/jd")}
                    className="px-5 py-3 bg-gray-50 hover:bg-indigo-50 cursor-pointer flex items-center gap-2 text-indigo-600 font-bold text-sm border-t border-gray-100 sticky bottom-0 transition-colors"
                  >
                    <Plus className="w-4 h-4" /> Analyze New JD
                  </div>
                </div>
              )}
            </div>

            {/* Submit Button (Completed State Added) */}
            <button
              type="submit"
              disabled={loading || matchResult}
              className={`
                w-full py-4 rounded-xl font-bold text-lg shadow-[0_4px_20px_rgba(120,50,255,0.2)] transition-all duration-300 flex items-center justify-center gap-2
                ${loading 
                  ? "bg-gray-400 cursor-not-allowed opacity-70" 
                  : matchResult
                    ? "bg-gray-100 text-gray-400 border-2 border-gray-200 cursor-not-allowed shadow-none"
                    : "bg-gradient-to-r from-fuchsia-500 to-indigo-600 text-white hover:scale-[1.01] hover:shadow-[0_6px_30px_rgba(120,50,255,0.3)]"
                }
              `}
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin w-6 h-6" /> Comparing...
                </>
              ) : matchResult ? (
                <>
                  <Check className="w-6 h-6" /> Analysis Complete
                </>
              ) : (
                <>
                  <Search className="w-5 h-5" /> Compare Match
                </>
              )}
            </button>
          </form>
        </div>

        {/* RESULTS SECTION */}
        {matchResult && (
          <div ref={resultsRef} className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700 scroll-mt-32">
            
            {/* 1. MATCH SUMMARY CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              
              {/* Verdict Card */}
              <div className="bg-white/80 backdrop-blur-md p-6 rounded-[2rem] shadow-sm border border-white/60 flex flex-col justify-center items-center text-center relative overflow-hidden group hover:shadow-md transition-all">
                <div className="relative z-10">
                  <p className="text-gray-500 font-bold uppercase tracking-wider text-xs mb-2">Overall Fit</p>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className={`text-5xl font-extrabold tracking-tighter ${safeNum(matchResult.overallScore) >= 75 ? "text-emerald-500" : "text-indigo-600"}`}>
                      {safeNum(matchResult.overallScore)}%
                    </span>
                  </div>
                  <span className="inline-block mt-2 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-semibold">
                    {matchResult.verdict}
                  </span>
                </div>
                <div className="absolute right-0 top-0 w-32 h-32 bg-indigo-100 rounded-full blur-2xl -mr-6 -mt-6 pointer-events-none"></div>
              </div>

              {/* Hiring Probability */}
              <div className="bg-white/80 backdrop-blur-md p-6 rounded-[2rem] shadow-sm border border-white/60 flex flex-col justify-center items-center text-center relative overflow-hidden group hover:shadow-md transition-all">
                <div className="relative z-10">
                  <p className="text-gray-500 font-bold uppercase tracking-wider text-xs mb-2">Hiring Probability</p>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-5xl font-extrabold tracking-tighter text-fuchsia-600">
                      {safeNum(matchResult.hiringProbability)}%
                    </span>
                  </div>
                  <span className="inline-block mt-2 px-3 py-1 bg-fuchsia-50 text-fuchsia-700 rounded-full text-sm font-semibold">
                    AI Estimation
                  </span>
                </div>
              </div>

              {/* Context Card */}
              <div className="bg-white/80 backdrop-blur-md p-6 rounded-[2rem] shadow-sm border border-white/60 flex flex-col justify-center relative group hover:shadow-md transition-all lg:col-span-1 md:col-span-2">
                 <div className="space-y-3">
                    <div>
                      <p className="text-xs font-bold text-gray-400 uppercase">Target Role</p>
                      <p className="font-bold text-gray-800 text-lg truncate">{matchResult.jobTitle || "Not specified"}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-400 uppercase">Resume Used</p>
                      <p className="font-medium text-gray-700 text-sm truncate">{matchResult.resumeFileName}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-400 uppercase">Category</p>
                      <p className="font-medium text-indigo-600 text-sm">{matchResult.roleCategory}</p>
                    </div>
                 </div>
              </div>
            </div>

            {/* 2. COMPETENCY MATRIX */}
            <div className="bg-white/80 backdrop-blur-md p-8 rounded-[2rem] shadow-sm border border-white/60">
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <BarChart3 className="text-indigo-500 w-6 h-6" />
                Competency Matrix
              </h3>
              
              <div className="space-y-4">
                {matchResult.competencies?.map((c, i) => (
                  <div key={i} className="flex flex-col sm:flex-row items-center gap-4 p-4 bg-gray-50/80 rounded-2xl border border-gray-100">
                    <div className="sm:w-1/3 w-full font-semibold text-gray-800">{c.name}</div>
                    
                    <div className="flex-1 w-full grid grid-cols-2 gap-4">
                      {/* Resume Level */}
                      <div>
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>You: {safeNum(c.resumeLevel)}/10</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-indigo-500 h-2 rounded-full transition-all duration-1000" 
                            style={{ width: `${(safeNum(c.resumeLevel) / 10) * 100}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* JD Level */}
                      <div>
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>Required: {safeNum(c.jdLevel)}/10</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-gray-400 h-2 rounded-full transition-all duration-1000" 
                            style={{ width: `${(safeNum(c.jdLevel) / 10) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>

                    <div className={`sm:w-16 w-full text-center text-sm font-bold ${safeNum(c.gap) > 0 ? "text-rose-500" : "text-emerald-500"}`}>
                      {safeNum(c.gap) > 0 ? `-${c.gap} Gap` : "✓ Match"}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. STRENGTHS & WEAKNESSES GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white/80 backdrop-blur-md p-8 rounded-[2rem] shadow-sm border border-emerald-100/50">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <CheckCircle className="text-emerald-500 w-5 h-5" /> Your Strengths
                </h3>
                <ul className="space-y-2">
                  {safeArr(matchResult.strengths).map((s, i) => (
                    <li key={i} className="flex gap-2 text-sm text-gray-700">
                      <span className="text-emerald-500 font-bold">•</span> {s}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-white/80 backdrop-blur-md p-8 rounded-[2rem] shadow-sm border border-rose-100/50">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <AlertTriangle className="text-rose-500 w-5 h-5" /> Critical Gaps
                </h3>
                <ul className="space-y-2">
                  {safeArr(matchResult.weaknesses).map((s, i) => (
                    <li key={i} className="flex gap-2 text-sm text-gray-700">
                      <span className="text-rose-500 font-bold">•</span> {s}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* 4. RECRUITER INSIGHTS */}
            <div className="bg-white/80 backdrop-blur-md p-8 rounded-[2rem] shadow-sm border border-white/60">
               <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <Users className="text-indigo-500 w-6 h-6" /> Recruiter's Perspective
               </h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                     <p className="font-bold text-gray-700 mb-3 border-b border-gray-100 pb-2">Likely Objections</p>
                     <ul className="space-y-3">
                        {safeArr(matchResult.recruiterObjections).map((obj, i) => (
                           <li key={i} className="text-sm text-gray-600 bg-gray-50 p-3 rounded-xl border-l-4 border-rose-400">
                              {obj}
                           </li>
                        ))}
                     </ul>
                  </div>
                  <div>
                     <p className="font-bold text-gray-700 mb-3 border-b border-gray-100 pb-2">Why They Might Hire You</p>
                     <ul className="space-y-3">
                        {safeArr(matchResult.recruiterStrengths).map((str, i) => (
                           <li key={i} className="text-sm text-gray-600 bg-gray-50 p-3 rounded-xl border-l-4 border-emerald-400">
                              {str}
                           </li>
                        ))}
                     </ul>
                  </div>
               </div>
            </div>

            {/* 5. SKILLS & SCORE BOOST */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               {/* Skills */}
               <div className="md:col-span-2 bg-white/80 backdrop-blur-md p-8 rounded-[2rem] shadow-sm border border-white/60">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                     <div>
                        <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2 text-sm uppercase tracking-wide">
                           <Target className="w-4 h-4 text-emerald-500" /> Matching Skills
                        </h4>
                        <div className="flex flex-wrap gap-2">
                           {safeArr(matchResult.matchingSkills).map((s, i) => (
                              <span key={i} className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-bold border border-emerald-100">
                                 {s}
                              </span>
                           ))}
                        </div>
                     </div>
                     <div>
                        <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2 text-sm uppercase tracking-wide">
                           <XCircle className="w-4 h-4 text-rose-500" /> Missing Skills
                        </h4>
                        <div className="flex flex-wrap gap-2">
                           {safeArr(matchResult.missingSkills).map((s, i) => (
                              <span key={i} className="px-3 py-1 bg-rose-50 text-rose-700 rounded-lg text-xs font-bold border border-rose-100">
                                 {s}
                              </span>
                           ))}
                        </div>
                     </div>
                  </div>
               </div>

               {/* Score Boost */}
               <div className="bg-indigo-600 p-8 rounded-[2rem] shadow-lg shadow-indigo-500/30 text-white flex flex-col justify-center relative overflow-hidden">
                  <div className="relative z-10">
                     <div className="flex items-center gap-2 mb-2 opacity-90">
                        <TrendingUp className="w-5 h-5" />
                        <span className="font-bold uppercase text-xs tracking-wider">Score Boost</span>
                     </div>
                     <p className="text-sm leading-relaxed opacity-95 font-medium">
                        {matchResult.scoreBoostEstimate}
                     </p>
                  </div>
                  {/* Decorative circles */}
                  <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl"></div>
                  <div className="absolute top-10 left-10 w-20 h-20 bg-fuchsia-500 opacity-20 rounded-full blur-xl"></div>
               </div>
            </div>

          </div>
        )}

        {/* BACK BUTTON */}
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