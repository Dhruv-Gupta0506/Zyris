import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { 
  FileText, 
  Briefcase, 
  ChevronDown, 
  Plus, 
  Loader2, 
  PenTool, 
  Download, 
  ArrowLeft, 
  GraduationCap, 
  Lightbulb,
  Sparkles,
  Copy,
  Check,
  RefreshCw 
} from "lucide-react";

// Define API_URL directly to avoid import errors
const API_URL = "http://localhost:5000/api";

export default function TailoredResume() {
  const [resumes, setResumes] = useState([]);
  const [jobs, setJobs] = useState([]);
  
  // Store full objects for display
  const [selectedResume, setSelectedResume] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);

  // Custom Dropdown States
  const [showResumeDropdown, setShowResumeDropdown] = useState(false);
  const [showJobDropdown, setShowJobDropdown] = useState(false);

  const [loading, setLoading] = useState(false);
  const [tailored, setTailored] = useState(null);
  
  // Track parameters used for the current analysis to detect changes
  const [generatedParams, setGeneratedParams] = useState(null);

  const navigate = useNavigate();
  const resultsRef = useRef(null);
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
    if (tailored && resultsRef.current) {
      setTimeout(() => {
        resultsRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    }
  }, [tailored]);

  // --- DIRTY INPUT CHECK ---
  // Returns true if the current selections differ from what was last generated
  const isInputDirty = generatedParams && (
    generatedParams.resumeId !== selectedResume?._id ||
    generatedParams.jobId !== selectedJob?._id
  );

  // Fetch history on mount
  useEffect(() => {
    const fetch = async () => {
      try {
        const token = localStorage.getItem("token");
        const [rRes, jRes] = await Promise.all([
          axios.get(`${API_URL}/resume/history`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`${API_URL}/jd/history`, { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        setResumes(rRes.data.history || []);
        setJobs(jRes.data.history || []);
      } catch (e) {
        console.error(e);
      }
    };
    fetch();
  }, []);

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!selectedResume || !selectedJob) return alert("Select resume and JD first.");

    try {
      setLoading(true);
      setTailored(null);
      const token = localStorage.getItem("token");
      
      const res = await axios.post(
        `${API_URL}/tailor/generate`,
        { resumeId: selectedResume._id, jobId: selectedJob._id },
        { headers: { Authorization: `Bearer ${token}` }, timeout: 120000 }
      );
      
      setTailored(res.data.tailored);
      // Lock current params as "generated"
      setGeneratedParams({
        resumeId: selectedResume._id,
        jobId: selectedJob._id
      });

    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Generation failed.");
    } finally {
      setLoading(false);
    }
  };

  // --- SAVE AS PDF FUNCTIONALITY ---
  const handleSaveToPdf = () => {
    if (!tailored?.fullText) return alert("No content to save.");
    
    // Open a new window for printing
    const printWindow = window.open('', '', 'width=850,height=1100');
    if (!printWindow) return alert("Please allow popups to save as PDF.");

    // Simple HTML structure for the PDF view
    const htmlContent = `
      <html>
        <head>
          <title>Resume - ${tailored.resumeFileName || "Tailored"}</title>
          <style>
            body { 
              font-family: 'Calibri', 'Arial', sans-serif; 
              line-height: 1.5; 
              color: #000; 
              padding: 40px; 
              font-size: 11pt;
              white-space: pre-wrap; /* Preserves newlines from the AI output */
            }
            @media print {
              body { padding: 0; margin: 0.5in; }
            }
          </style>
        </head>
        <body>${tailored.fullText}</body>
      </html>
    `;
    
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    
    // Trigger the print dialog (User selects "Save as PDF")
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  };

  const copyToClipboard = () => {
    if (tailored?.fullText) {
      navigator.clipboard.writeText(tailored.fullText);
      alert("Resume content copied to clipboard!");
    }
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
        <div className="text-center mb-12 animate-in fade-in slide-in-from-top-4 duration-700 max-w-3xl mx-auto">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-[#34245f] tracking-tight mb-4">
            Tailored Resume <span className="bg-gradient-to-r from-fuchsia-500 to-indigo-600 text-transparent bg-clip-text">Generator</span>
          </h1>
          <p className="text-lg text-gray-600 leading-relaxed">
            Automatically rewrite your resume to perfectly match a specific job description using AI-driven optimization.
          </p>
        </div>

        {/* SELECTION FORM (Max-w-3xl) */}
        <div className="max-w-3xl mx-auto bg-white/80 backdrop-blur-xl rounded-[2rem] shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-white/60 p-8 mb-10 relative transition-all hover:shadow-[0_8px_40px_rgba(0,0,0,0.06)]">
          <form onSubmit={handleGenerate} className="relative z-10 space-y-6">
            
            {/* --- RESUME DROPDOWN --- */}
            <div className="relative" ref={resumeDropdownRef}>
              <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">
                Select Base Resume
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

            {/* --- JD DROPDOWN --- */}
            <div className="relative" ref={jobDropdownRef}>
              <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">
                Select Target Job Description
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
                      ? `${selectedJob.jobTitle || "Untitled"} (Match: ${selectedJob.matchScore ?? "N/A"})` 
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
                          <p className="text-xs text-gray-500">Initial Match: {j.matchScore ?? "N/A"} | Verdict: {j.fitVerdict}</p>
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

            {/* Submit Button (Updated for Re-Generate Logic) */}
            <button
              type="submit"
              disabled={loading || (tailored && !isInputDirty)}
              className={`
                w-full py-4 rounded-xl font-bold text-lg shadow-[0_4px_20px_rgba(120,50,255,0.2)] transition-all duration-300 flex items-center justify-center gap-2
                ${loading 
                  ? "bg-gray-400 cursor-not-allowed opacity-70" 
                  : (tailored && !isInputDirty)
                    ? "bg-gray-100 text-gray-400 border-2 border-gray-200 cursor-not-allowed shadow-none" 
                    : "bg-gradient-to-r from-fuchsia-500 to-indigo-600 text-white hover:scale-[1.01] hover:shadow-[0_6px_30px_rgba(120,50,255,0.3)]"
                }
              `}
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin w-6 h-6" /> Generating...
                </>
              ) : (tailored && !isInputDirty) ? (
                <>
                  <Check className="w-6 h-6" /> Generation Complete
                </>
              ) : tailored ? (
                <>
                  <RefreshCw className="w-5 h-5" /> Regenerate Resume
                </>
              ) : (
                <>
                  <PenTool className="w-5 h-5" /> Generate Tailored Resume
                </>
              )}
            </button>
          </form>
        </div>

        {/* RESULTS SECTION (Expanded Width) */}
        {tailored && (
          <div ref={resultsRef} className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700 scroll-mt-32">
            
            {/* 1. HEADLINE & SKILLS */}
            <div className="bg-white/80 backdrop-blur-md p-8 rounded-[2rem] shadow-sm border border-white/60 relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-fuchsia-100 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
               
               <div className="relative z-10">
                  <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-2">Optimized Headline</h3>
                  <p className="text-2xl font-bold text-gray-900 mb-8 leading-tight font-sans">
                    {tailored.headline}
                  </p>

                  <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-3">Reordered Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {(tailored.skillsOrdered || []).map((skill, i) => (
                      <span key={i} className="px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-medium border border-indigo-100">
                        {skill}
                      </span>
                    ))}
                  </div>
               </div>
            </div>

            {/* 2. REWRITTEN SECTIONS GRID */}
            <div className={`grid grid-cols-1 ${tailored.experienceSections?.length > 0 && tailored.projectSections?.length > 0 ? "lg:grid-cols-2" : "grid-cols-1"} gap-8`}>
               
               {/* Experience - Conditionally Rendered */}
               {tailored.experienceSections && tailored.experienceSections.length > 0 && (
                 <div className="bg-white/80 backdrop-blur-md p-8 rounded-[2rem] shadow-sm border border-white/60">
                    <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                       <Briefcase className="w-5 h-5 text-fuchsia-500" /> Experience
                    </h3>
                    <div className="space-y-6">
                      {tailored.experienceSections.map((s, idx) => (
                        <div key={idx} className="bg-fuchsia-50/50 p-5 rounded-2xl border border-fuchsia-100">
                          <h4 className="font-bold text-gray-800 mb-2 text-lg">{s.title}</h4>
                          <pre className="whitespace-pre-wrap text-sm text-gray-600 font-sans leading-relaxed">
                            {s.content}
                          </pre>
                        </div>
                      ))}
                    </div>
                 </div>
               )}

               {/* Projects - Conditionally Rendered */}
               {tailored.projectSections && tailored.projectSections.length > 0 && (
                 <div className="bg-white/80 backdrop-blur-md p-8 rounded-[2rem] shadow-sm border border-white/60">
                    <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                       <Lightbulb className="w-5 h-5 text-indigo-500" /> Projects
                    </h3>
                    <div className="space-y-6">
                      {tailored.projectSections.map((s, idx) => (
                        <div key={idx} className="bg-indigo-50/50 p-5 rounded-2xl border border-indigo-100">
                          <h4 className="font-bold text-gray-800 mb-2 text-lg">{s.title}</h4>
                          <pre className="whitespace-pre-wrap text-sm text-gray-600 font-sans leading-relaxed">
                            {s.content}
                          </pre>
                        </div>
                      ))}
                    </div>
                 </div>
               )}
            </div>

            {/* 3. EDUCATION & BOOST */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               {/* Education */}
               <div className="md:col-span-2 bg-white/80 backdrop-blur-md p-8 rounded-[2rem] shadow-sm border border-white/60">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <GraduationCap className="w-5 h-5 text-gray-500" /> Education & Extras
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {tailored.educationAndExtras?.map((s, idx) => (
                      <div key={idx} className="p-4 bg-gray-50 rounded-xl">
                        <h4 className="font-bold text-gray-800 text-sm mb-1">{s.title}</h4>
                        <p className="text-xs text-gray-500 whitespace-pre-wrap font-sans leading-relaxed">{s.content}</p>
                      </div>
                    ))}
                  </div>
               </div>

               {/* Score Boost Tips */}
               <div className="bg-indigo-600 p-8 rounded-[2rem] shadow-lg shadow-indigo-500/30 text-white relative overflow-hidden">
                  <div className="relative z-10">
                      <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                         <Sparkles className="w-5 h-5" /> Quick Wins
                      </h3>
                      <ul className="space-y-3">
                         {(tailored.scoreBoostSuggestions || []).map((t, i) => (
                            <li key={i} className="text-sm opacity-90 leading-relaxed flex gap-2">
                               <span className="font-bold">•</span> {t}
                            </li>
                         ))}
                      </ul>
                  </div>
                  <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl"></div>
               </div>
            </div>

            {/* 4. FINAL ASSEMBLED RESUME (COPY PASTE AREA) */}
            <div className="bg-white/90 backdrop-blur-xl p-8 rounded-[2rem] shadow-lg border border-gray-200">
               <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                  <div>
                      <h3 className="text-xl font-bold text-gray-900">Final Assembled Resume</h3>
                      <p className="text-sm text-gray-500">Copy this content into your resume builder or document.</p>
                  </div>
                  <div className="flex gap-3">
                      <button 
                        onClick={copyToClipboard}
                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium text-sm transition-colors flex items-center gap-2"
                      >
                          <Copy className="w-4 h-4" /> Copy
                      </button>
                      <button 
                        onClick={handleSaveToPdf}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium text-sm transition-colors flex items-center gap-2 shadow-lg shadow-indigo-500/20"
                      >
                          <Download className="w-4 h-4" /> Save as PDF
                      </button>
                  </div>
               </div>
               
               <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 overflow-auto max-h-[600px] shadow-inner">
                  <pre className="whitespace-pre-wrap font-mono text-sm text-gray-700 leading-relaxed">
                      {tailored.fullText}
                  </pre>
               </div>
            </div>

          </div>
        )}

        {/* BACK BUTTON */}
        <div className="mt-20 mb-8 max-w-2xl mx-auto">
          <button
            onClick={() => { window.scrollTo(0, 0); navigate("/dashboard")}}
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