import { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { 
    ChevronDown, 
    Menu, 
    X, 
    FileText, 
    Briefcase, 
    Target, 
    Mic, 
    PenTool, 
    LayoutDashboard,
    LogOut,
    User,
    History 
} from "lucide-react";

export default function Navbar() {
    const { token, logout, loading } = useAuth();
    
    // ✅ FIX: Don't render navbar if auth is loading (AppLoader handles it)
    if (loading) return null;

    const navigate = useNavigate();
    const location = useLocation();

    // --- STATE MANAGEMENT ---
    const [activeDropdown, setActiveDropdown] = useState(null); 
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [showProfileModal, setShowProfileModal] = useState(false);
    
    const [user, setUser] = useState(null);
    const [imgError, setImgError] = useState(false);

    const navRef = useRef(null);

    // --- DATA ---
    const toolsMenu = [
        { name: "Resume Analyzer", path: "/resume", icon: FileText },
        { name: "JD Analyzer", path: "/jd", icon: Briefcase },
        { name: "Match Engine", path: "/match-engine", icon: Target },
        { name: "Mock Interview", path: "/interview", icon: Mic },
        { name: "Tailored Resume", path: "/tailored-resume", icon: PenTool },
    ];

    const historyMenu = [
        { name: "Resume History", path: "/history", icon: FileText },
        { name: "JD History", path: "/jd-history", icon: Briefcase },
        { name: "Match History", path: "/match-history", icon: Target },
        { name: "Interview History", path: "/interview-history", icon: Mic },
        { name: "Tailored History", path: "/tailored-history", icon: PenTool },
    ];

    // --- FETCH USER ---
    useEffect(() => {
        if (!token) return setUser(null);

        fetch(`${import.meta.env.VITE_API_URL}/auth/me`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((res) => {
                if (res.status === 401) {
                    logout();
                    return null;
                }
                return res.json();
            })
            .then((data) => {
                if (data) {
                    setUser(data);
                    setImgError(false);
                }
            })
            .catch((err) => console.error("NAVBAR USER ERROR:", err));
    }, [token]);

    // --- CLICK OUTSIDE HANDLER ---
    useEffect(() => {
        function handleClickOutside(e) {
            if (navRef.current && !navRef.current.contains(e.target)) {
                setActiveDropdown(null);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // --- HANDLERS ---
    const handleNavigation = (path) => {
        setActiveDropdown(null);
        setIsMobileMenuOpen(false);
        navigate(path);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const toggleDropdown = (name) => {
        setActiveDropdown(activeDropdown === name ? null : name);
    };

    const smoothScroll = (id) => {
        const el = document.getElementById(id);
        if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "start" });
        }
        setIsMobileMenuOpen(false);
    };

    const goToTop = () => {
        if (!token) {
            window.scrollTo({ top: 0, behavior: "smooth" });
            return;
        }
        if (location.pathname === "/dashboard") {
            window.scrollTo({ top: 0, behavior: "smooth" });
            return;
        }
        navigate("/dashboard");
        setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 250);
    };

    const avatarSrc =
        !imgError && user?.avatar
            ? user.avatar
            : `https://ui-avatars.com/api/?name=${user?.name || "User"}&background=6366f1&color=fff&rounded=true&size=128`;

    return (
        <>
            <style>
                {`@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@500;700;800&display=swap');`}
            </style>

            <nav
                ref={navRef}
                className="
                    w-full fixed top-0 left-0 z-50
                    backdrop-blur-[20px] bg-white/40
                    border-b border-white/20
                    shadow-[0_4px_30px_rgba(0,0,0,0.03)]
                    transition-all duration-300
                "
                style={{ fontFamily: "'Outfit', sans-serif" }}
            >
                <div className="max-w-[1500px] mx-auto px-4 sm:px-6 py-3 flex justify-between items-center relative">
                    
                    {/* 1. LEFT SIDE: LOGO */}
                    <button onClick={goToTop} className="flex items-center gap-3 group z-50 relative">
                        {!token && (
                            <img
                                src="/logo.png"
                                alt="Zyris Logo"
                                className="
                                    h-10 w-10 object-contain 
                                    drop-shadow-sm 
                                    group-hover:scale-110 group-hover:rotate-3 
                                    transition-transform duration-300 ease-out
                                "
                            />
                        )}
                        <span
                            className="
                                text-[28px] sm:text-[32px] font-extrabold tracking-tight
                                bg-gradient-to-r from-indigo-600 to-purple-600
                                bg-clip-text text-transparent
                                group-hover:brightness-110
                                group-hover:scale-[1.05] origin-left
                                transition-all duration-300
                            "
                        >
                            Zyris
                        </span>
                    </button>

                    {/* 2. RIGHT SIDE CONTAINER (Desktop) */}
                    <div className="hidden lg:flex items-center gap-8">
                        
                        {/* PUBLIC LINKS */}
                        {!token && (
                            <>
                                <button
                                    onClick={() => smoothScroll("features")}
                                    className="text-lg font-bold text-gray-600 hover:text-indigo-600 hover:-translate-y-0.5 transition-all"
                                >
                                    Features
                                </button>
                                <button
                                    onClick={() => smoothScroll("faq")}
                                    className="text-lg font-bold text-gray-600 hover:text-indigo-600 hover:-translate-y-0.5 transition-all"
                                >
                                    FAQ
                                </button>
                            </>
                        )}

                        {/* LOGGED IN LINKS (TOOLS & HISTORY) */}
                        {token && (
                                <>
                                    {/* TOOLS DROPDOWN - HOVER & CLICK */}
                                    <div 
                                        className="relative"
                                        onMouseEnter={() => setActiveDropdown("tools")}
                                        onMouseLeave={() => setActiveDropdown(null)}
                                    >
                                        <button
                                            onClick={() => toggleDropdown("tools")}
                                            className={`flex items-center gap-1 text-lg font-bold tracking-wide transition-all duration-200 hover:scale-[1.1] ${
                                                activeDropdown === "tools" ? "text-indigo-600" : "text-gray-600 hover:text-indigo-600"
                                            }`}
                                        >
                                            Tools <ChevronDown className={`w-5 h-5 transition-transform ${activeDropdown === "tools" ? "rotate-180" : ""}`} />
                                        </button>

                                        {/* Dropdown Container */}
                                        {activeDropdown === "tools" && (
                                            /* ✅ FIX: Changed mt-4 to pt-4 to bridge the gap so mouse doesn't "leave" */
                                            <div className="absolute top-full right-0 pt-4 w-72 animate-in fade-in slide-in-from-top-2">
                                                <div className="bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden">
                                                    <div className="py-1">
                                                        {toolsMenu.map((item) => (
                                                            <div
                                                                key={item.path}
                                                                onClick={() => handleNavigation(item.path)}
                                                                className="flex items-center gap-3 px-5 py-3 hover:bg-indigo-50 cursor-pointer border-b border-gray-50 last:border-0 transition-colors group"
                                                            >
                                                                <item.icon className="w-5 h-5 text-gray-400 group-hover:text-indigo-600 transition-colors" />
                                                                <span className="font-bold text-gray-700 text-sm group-hover:text-indigo-700">{item.name}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* HISTORY DROPDOWN - HOVER & CLICK */}
                                    <div 
                                        className="relative"
                                        onMouseEnter={() => setActiveDropdown("history")}
                                        onMouseLeave={() => setActiveDropdown(null)}
                                    >
                                        <button
                                            onClick={() => toggleDropdown("history")}
                                            className={`flex items-center gap-1 text-lg font-bold tracking-wide transition-all duration-200 hover:scale-[1.1] ${
                                                activeDropdown === "history" ? "text-fuchsia-600" : "text-gray-600 hover:text-fuchsia-600"
                                            }`}
                                        >
                                            History <ChevronDown className={`w-5 h-5 transition-transform ${activeDropdown === "history" ? "rotate-180" : ""}`} />
                                        </button>

                                        {/* Dropdown Container */}
                                        {activeDropdown === "history" && (
                                            /* ✅ FIX: Changed mt-4 to pt-4 to bridge the gap */
                                            <div className="absolute top-full right-0 pt-4 w-72 animate-in fade-in slide-in-from-top-2">
                                                <div className="bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden">
                                                    <div className="py-1">
                                                        {historyMenu.map((item) => (
                                                            <div
                                                                key={item.path}
                                                                onClick={() => handleNavigation(item.path)}
                                                                className="flex items-center gap-3 px-5 py-3 hover:bg-fuchsia-50 cursor-pointer border-b border-gray-50 last:border-0 transition-colors group"
                                                            >
                                                                <item.icon className="w-5 h-5 text-gray-400 group-hover:text-fuchsia-600 transition-colors" />
                                                                <span className="font-bold text-gray-700 text-sm group-hover:text-fuchsia-700">{item.name}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </>
                        )}

                        {/* PROFILE AVATAR - HOVER & CLICK */}
                        {token && (
                            <div 
                                className="relative pl-2 border-l border-gray-200"
                                onMouseEnter={() => setActiveDropdown("profile")}
                                onMouseLeave={() => setActiveDropdown(null)}
                            >
                                <img
                                    src={avatarSrc}
                                    alt="avatar"
                                    onError={() => setImgError(true)}
                                    onClick={() => toggleDropdown("profile")}
                                    className="
                                        h-12 w-12 rounded-full cursor-pointer
                                        border-2 border-white shadow-md object-cover
                                        hover:scale-[1.1] hover:shadow-lg
                                        transition-all duration-300
                                        bg-gray-100
                                    "
                                />
                                
                                {/* Dropdown Container */}
                                {activeDropdown === "profile" && (
                                    /* ✅ FIX: Added pt-4 here to bridge the gap and kept original inner styling */
                                    <div className="absolute top-full right-0 pt-4 w-48 animate-in fade-in slide-in-from-top-2">
                                        <div className="bg-white/95 backdrop-blur-xl shadow-2xl rounded-2xl border border-gray-100 overflow-hidden">
                                            <button
                                                onClick={() => { setActiveDropdown(null); setShowProfileModal(true); }}
                                                className="w-full text-left px-5 py-3.5 hover:bg-gray-50 text-gray-700 font-medium transition-colors flex items-center gap-2"
                                            >
                                                <User className="w-4 h-4" /> Profile
                                            </button>
                                            <div className="h-[1px] bg-gray-100 mx-2"></div>
                                            <button
                                                onClick={() => { setActiveDropdown(null); setShowLogoutModal(true); }}
                                                className="w-full text-left px-5 py-3.5 hover:bg-red-50 text-red-500 font-medium transition-colors flex items-center gap-2"
                                            >
                                                <LogOut className="w-4 h-4" /> Logout
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* 3. MOBILE MENU BUTTON */}
                    {token && (
                        <div className="lg:hidden z-50">
                            <button 
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                className="p-2 text-gray-600 hover:text-indigo-600 transition-colors"
                            >
                                {isMobileMenuOpen ? <X className="w-8 h-8" /> : <Menu className="w-8 h-8" />}
                            </button>
                        </div>
                    )}
                </div>

                {/* 4. MOBILE DROPDOWN OVERLAY */}
                {isMobileMenuOpen && (
                    <div className="lg:hidden absolute top-full left-0 w-full bg-white/95 backdrop-blur-xl border-b border-gray-100 shadow-xl animate-in slide-in-from-top-5 duration-300 h-[calc(100vh-70px)] overflow-y-auto">
                        <div className="px-6 pt-6 pb-20 space-y-6">
                            
                    

                            {token && (
                                <>
                                    {/* NEW: USER INFO (Top priority for authenticated users) */}
                                    <div className="flex items-center gap-4 py-2">
                                        <img src={avatarSrc} alt="profile" className="w-12 h-12 rounded-full border border-gray-200" />
                                        <div>
                                            <p className="font-bold text-gray-900">{user?.name}</p>
                                            <p className="text-xs text-gray-500">{user?.email}</p>
                                        </div>
                                    </div>

                                    {/* NEW: PROFILE/LOGOUT BUTTONS (Next priority) */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <button 
                                            onClick={() => { setIsMobileMenuOpen(false); setShowProfileModal(true); }}
                                            className="py-3 rounded-xl border border-gray-200 font-bold text-gray-600 text-center hover:bg-gray-50 transition-colors"
                                        >
                                            View Profile
                                        </button>
                                        <button 
                                            onClick={() => { setIsMobileMenuOpen(false); setShowLogoutModal(true); }}
                                            className="py-3 rounded-xl bg-red-50 text-red-500 font-bold text-center hover:bg-red-100 transition-colors"
                                        >
                                            Logout
                                        </button>
                                    </div>
                                    <div className="h-[1px] bg-gray-100"></div> {/* Separator */}
                                    
                                    {/* TOOLS LIST (Moved down) */}
                                    <div>
                                        <p className="text-xs font-extrabold text-gray-400 uppercase tracking-wider mb-3">Tools</p>
                                        <div className="grid grid-cols-1 gap-2">
                                            {toolsMenu.map((item) => (
                                                <button 
                                                    key={item.path}
                                                    onClick={() => handleNavigation(item.path)}
                                                    className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-indigo-50 text-gray-700 font-bold"
                                                >
                                                    <item.icon className="w-5 h-5 text-indigo-500" />
                                                    {item.name}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="h-[1px] bg-gray-100"></div> {/* Separator */}

                                    {/* HISTORY LIST (Moved down) */}
                                    <div>
                                        <p className="text-xs font-extrabold text-gray-400 uppercase tracking-wider mb-3">History</p>
                                        <div className="grid grid-cols-1 gap-2">
                                            {historyMenu.map((item) => (
                                                <button 
                                                    key={item.path}
                                                    onClick={() => handleNavigation(item.path)}
                                                    className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-fuchsia-50 text-gray-700 font-bold"
                                                >
                                                    <item.icon className="w-5 h-5 text-fuchsia-500" />
                                                    {item.name}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    
                                </>
                            )}
                        </div>
                    </div>
                )}
            </nav>

            {/* --- MODALS --- */}
            {showProfileModal && user && (
                <div className="fixed inset-0 flex items-center justify-center z-[999] backdrop-blur-md bg-black/40 animate-in fade-in duration-200">
                    <div className="bg-white/95 backdrop-blur-xl p-8 rounded-3xl shadow-2xl max-w-sm w-full text-center relative font-sans border border-white/50">
                        <button
                            onClick={() => setShowProfileModal(false)}
                            className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                        <img
                            src={avatarSrc}
                            onError={() => setImgError(true)}
                            className="h-24 w-24 rounded-full mx-auto mb-4 shadow-xl object-cover bg-gray-100 border-4 border-white"
                            alt="Profile"
                        />
                        <h2 className="text-2xl font-bold text-gray-900">{user.name}</h2>
                        <p className="text-gray-500 font-medium mt-1">{user.email}</p>
                    </div>
                </div>
            )}

            {showLogoutModal && (
                <div className="fixed inset-0 flex items-center justify-center z-[999] backdrop-blur-md bg-black/40 animate-in fade-in duration-200">
                    <div className="bg-white/95 backdrop-blur-xl p-8 rounded-3xl shadow-2xl max-w-sm w-full text-center font-sans border border-white/50">
                        <h2 className="text-2xl font-bold mb-3 text-gray-900">Logging Out?</h2>
                        <p className="text-gray-500 font-medium mb-8">
                            We'll miss you! Come back soon.
                        </p>
                        <div className="flex justify-between gap-4">
                            <button
                                onClick={() => setShowLogoutModal(false)}
                                className="flex-1 px-6 py-3 rounded-xl border border-gray-200 font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => { setShowLogoutModal(false); logout(); navigate("/"); }}
                                className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-red-500 to-pink-600 text-white font-semibold shadow-lg hover:shadow-red-500/30 hover:scale-[1.02] transition-all"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}