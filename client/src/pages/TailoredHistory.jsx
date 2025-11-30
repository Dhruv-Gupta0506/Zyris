import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { 
  FileText, 
  Trash2, 
  Calendar, 
  Briefcase, 
  ChevronDown, 
  ArrowLeft, 
  Loader2, 
  PenTool, 
  Sparkles, 
  GraduationCap, 
  Lightbulb, 
  Copy, 
  Download,
  Filter,
  ArrowUpDown
} from "lucide-react";

// Define API_URL directly to avoid import errors
const API_URL = "http://localhost:5000/api";

export default function TailoredHistory() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState({});
  const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'desc' });
  
  const navigate = useNavigate();

  // --- FETCH HISTORY ---
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${API_URL}/tailor/history`, {
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

  // --- TOGGLE EXPAND ---
  const toggleExpand = (id) => {
    setExpanded((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // --- DELETE HANDLER (Connected to Backend) ---
  const handleDelete = async (e, id) => {
    e.stopPropagation(); // Prevent toggling expansion
    
    if (!window.confirm("Are you sure you want to delete this tailored resume? This cannot be undone.")) return;

    try {
      const token = localStorage.getItem("token");
      
      // Call Backend to delete from Database
      await axios.delete(`${API_URL}/tailor/history/${id}`, {
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
    // Default: Date sorting
    return sortConfig.direction === 'asc' 
      ? new Date(a.createdAt) - new Date(b.createdAt) 
      : new Date(b.createdAt) - new Date(a.createdAt);
  });

  // --- ACTIONS ---
  const copyToClipboard = (text) => {
    if (text) {
      navigator.clipboard.writeText(text);
      alert("Resume content copied to clipboard!");
    }
  };

  // --- SAVE AS PDF FUNCTIONALITY ---
  const handleSaveToPdf = (record) => {
    if (!record.fullText) return alert("No content to save.");
    
    // Open a new window for printing
    const printWindow = window.open('', '', 'width=850,height=1100');
    if (!printWindow) return alert("Please allow popups to save as PDF.");

    // Simple HTML structure for the PDF view
    const htmlContent = `
      <html>
        <head>
          <title>Resume - ${record.resumeFileName || "Tailored"}</title>
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
        <body>${record.fullText}</body>
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

  // --- HELPERS ---
  const safeArr = (a) => (Array.isArray(a) && a.length ? a : []);
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
            Tailored Resume <span className="bg-gradient-to-r from-fuchsia-500 to-indigo-600 text-transparent bg-clip-text">History</span>
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Access your previously generated resumes, targeted for specific job descriptions.
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
          </div>
        </div>

        {/* LIST SECTION */}
        {loading ? (
          <div className="flex justify-center py-20">
             <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-20 bg-white/50 rounded-[2rem] border border-white/60">
             <p className="text-gray-500 text-lg">No tailored resumes found.</p>
             <button onClick={() => navigate("/tailor")} className="mt-4 text-indigo-600 font-bold hover:underline">
                Generate your first Tailored Resume
             </button>
          </div>
        ) : (
          <div className="space-y-6 max-w-4xl mx-auto">
            {sortedHistory.map((record) => {
               const isExpanded = expanded[record._id];

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
                              <PenTool className="w-6 h-6" />
                           </div>
                           <div className="min-w-0">
                              <h3 className="text-lg font-bold text-gray-900 truncate">{record.jobTitle || "Untitled Job"}</h3>
                              <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 mt-1">
                                 <span className="flex items-center gap-1"><FileText className="w-3 h-3" /> {record.resumeFileName || "Resume"}</span>
                                 <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                                 <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {formatDate(record.createdAt)}</span>
                              </div>
                           </div>
                        </div>

                        <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end">
                           <div className="flex items-center gap-2">
                              <button 
                                 onClick={(e) => handleDelete(e, record._id)}
                                 className="p-2 text-gray-400 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-colors"
                                 title="Delete"
                              >
                                 <Trash2 className="w-5 h-5" />
                              </button>
                              <div className={`p-2 rounded-full transition-transform duration-300 ${isExpanded ? 'rotate-180 bg-gray-100' : ''}`}>
                                 <ChevronDown className="w-5 h-5 text-gray-400" />
                              </div>
                           </div>
                        </div>
                     </div>

                     {/* EXPANDED CONTENT (Replicating TailoredResume.jsx UI) */}
                     {isExpanded && (
                        <div className="border-t border-gray-100 p-6 md:p-8 bg-gray-50/30 animate-in slide-in-from-top-2 duration-300">
                           
                           {/* 1. HEADLINE & SKILLS */}
                           <div className="bg-white/80 backdrop-blur-md p-8 rounded-[2rem] shadow-sm border border-white/60 relative overflow-hidden mb-8">
                              <div className="absolute top-0 right-0 w-32 h-32 bg-fuchsia-100 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
                              <div className="relative z-10">
                                 <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-2">Optimized Headline</h3>
                                 <p className="text-xl font-bold text-gray-900 mb-6 leading-tight font-sans">
                                    {record.headline}
                                 </p>

                                 <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-3">Reordered Skills</h3>
                                 <div className="flex flex-wrap gap-2">
                                    {safeArr(record.skillsOrdered).map((skill, i) => (
                                       <span key={i} className="px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-medium border border-indigo-100">
                                          {skill}
                                       </span>
                                    ))}
                                 </div>
                              </div>
                           </div>

                           {/* 2. REWRITTEN SECTIONS */}
                           <div className={`grid grid-cols-1 ${safeArr(record.experienceSections).length > 0 && safeArr(record.projectSections).length > 0 ? "lg:grid-cols-2" : "grid-cols-1"} gap-8 mb-8`}>
                              
                              {/* Experience */}
                              {safeArr(record.experienceSections).length > 0 && (
                                 <div className="bg-white/80 backdrop-blur-md p-8 rounded-[2rem] shadow-sm border border-white/60">
                                    <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                                       <Briefcase className="w-5 h-5 text-fuchsia-500" /> Experience
                                    </h3>
                                    <div className="space-y-6">
                                       {record.experienceSections.map((s, idx) => (
                                          <div key={idx} className="bg-fuchsia-50/50 p-5 rounded-2xl border border-fuchsia-100">
                                             <h4 className="font-bold text-gray-800 mb-2 text-base">{s.title}</h4>
                                             <pre className="whitespace-pre-wrap text-xs text-gray-600 font-sans leading-relaxed">
                                                {s.content}
                                             </pre>
                                          </div>
                                       ))}
                                    </div>
                                 </div>
                              )}

                              {/* Projects */}
                              {safeArr(record.projectSections).length > 0 && (
                                 <div className="bg-white/80 backdrop-blur-md p-8 rounded-[2rem] shadow-sm border border-white/60">
                                    <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                                       <Lightbulb className="w-5 h-5 text-indigo-500" /> Projects
                                    </h3>
                                    <div className="space-y-6">
                                       {record.projectSections.map((s, idx) => (
                                          <div key={idx} className="bg-indigo-50/50 p-5 rounded-2xl border border-indigo-100">
                                             <h4 className="font-bold text-gray-800 mb-2 text-base">{s.title}</h4>
                                             <pre className="whitespace-pre-wrap text-xs text-gray-600 font-sans leading-relaxed">
                                                {s.content}
                                             </pre>
                                          </div>
                                       ))}
                                    </div>
                                 </div>
                              )}
                           </div>

                           {/* 3. EDUCATION & BOOST */}
                           <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                              {/* Education */}
                              <div className="md:col-span-2 bg-white/80 backdrop-blur-md p-8 rounded-[2rem] shadow-sm border border-white/60">
                                 <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <GraduationCap className="w-5 h-5 text-gray-500" /> Education & Extras
                                 </h3>
                                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {safeArr(record.educationAndExtras).map((s, idx) => (
                                       <div key={idx} className="p-4 bg-gray-50 rounded-xl">
                                          <h4 className="font-bold text-gray-800 text-sm mb-1">{s.title}</h4>
                                          <p className="text-xs text-gray-500 whitespace-pre-wrap font-sans leading-relaxed">{s.content}</p>
                                       </div>
                                    ))}
                                 </div>
                              </div>

                              {/* Score Boost */}
                              <div className="bg-indigo-600 p-8 rounded-[2rem] shadow-lg shadow-indigo-500/30 text-white relative overflow-hidden">
                                 <div className="relative z-10">
                                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                       <Sparkles className="w-5 h-5" /> Quick Wins
                                    </h3>
                                    <ul className="space-y-3">
                                       {safeArr(record.scoreBoostSuggestions).map((t, i) => (
                                          <li key={i} className="text-sm opacity-90 leading-relaxed flex gap-2">
                                             <span className="font-bold">•</span> {t}
                                          </li>
                                       ))}
                                    </ul>
                                 </div>
                                 <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl"></div>
                              </div>
                           </div>

                           {/* 4. FINAL RESUME ACTIONS */}
                           <div className="bg-white/90 backdrop-blur-xl p-8 rounded-[2rem] shadow-lg border border-gray-200">
                              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                                 <div>
                                    <h3 className="text-xl font-bold text-gray-900">Assembled Resume</h3>
                                    <p className="text-sm text-gray-500">Copy this content into your resume builder.</p>
                                 </div>
                                 <div className="flex gap-3">
                                    <button 
                                       onClick={() => copyToClipboard(record.fullText)}
                                       className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium text-sm transition-colors flex items-center gap-2"
                                    >
                                       <Copy className="w-4 h-4" /> Copy
                                    </button>
                                    <button 
                                       onClick={() => handleSaveToPdf(record)}
                                       className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium text-sm transition-colors flex items-center gap-2 shadow-lg shadow-indigo-500/20"
                                    >
                                       <Download className="w-4 h-4" /> Save as PDF
                                    </button>
                                 </div>
                              </div>
                              <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 overflow-auto max-h-[300px] shadow-inner scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
                                 <pre className="whitespace-pre-wrap font-mono text-xs text-gray-700 leading-relaxed">
                                    {record.fullText}
                                 </pre>
                              </div>
                           </div>

                        </div>
                     )}
                  </div>
               );
            })}
          </div>
        )}

        {/* BACK BUTTON */}
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