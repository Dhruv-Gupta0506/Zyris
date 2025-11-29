import { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { token, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [showMenu, setShowMenu] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [user, setUser] = useState(null);
  
  // State to handle broken image links
  const [imgError, setImgError] = useState(false);

  const menuRef = useRef(null);

  // Fetch user data
  useEffect(() => {
    if (!token) return setUser(null);

    fetch("http://localhost:5000/api/auth/me", {
      headers: { Authorization: token },
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

  const avatarSrc =
    !imgError && user?.avatar
      ? user.avatar
      : `https://ui-avatars.com/api/?name=${user?.name || "User"}&background=6366f1&color=fff&rounded=true&size=128`;

  // Close dropdown logic
  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const smoothScrollTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const smoothScroll = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const goToTop = () => {
    if (!token) {
      smoothScrollTop();
      return;
    }
    if (location.pathname === "/dashboard") {
      smoothScrollTop();
      return;
    }
    navigate("/dashboard");
    setTimeout(() => smoothScrollTop(), 250);
  };

  const handleNavClick = (sectionId) => {
    if (location.pathname !== "/") {
      navigate("/");
      setTimeout(() => smoothScroll(sectionId), 400); 
    } else {
      smoothScroll(sectionId);
    }
  };

  const confirmLogout = () => {
    setShowLogoutModal(false);
    logout();
    navigate("/");
  };

  return (
    <>
      {/* 1. IMPORTING THE 'OUTFIT' FONT FOR THAT "COOL" CANVA LOOK */}
      <style>
        {`@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@500;700;800&display=swap');`}
      </style>

      {/* NAVBAR */}
      <nav
        className="
          w-full fixed top-0 left-0 z-50
          backdrop-blur-xl bg-[#f8f9ff]/10
          border-b border-white/20
          shadow-[0_4px_30px_rgba(0,0,0,0.03)]
          transition-all duration-300
        "
        style={{ fontFamily: "'Outfit', sans-serif" }} // Applying the font
      >
        <div className="max-w-[1500px] mx-auto px-4 sm:px-6 py-3 flex justify-between items-center">

          {/* LEFT SIDE: LOGO & BRAND */}
          {!token ? (
            // LOGGED OUT (Landing Page) -> Show Image + Text
            <button
              onClick={goToTop}
              className="flex items-center gap-3 group"
            >
              {/* ✅ LOGO IMAGE: Bigger, Visible, with hover effect */}
              <img
                src="/logo.png"
                alt="Zyris Logo"
                className="
                  h-12 w-12 object-contain 
                  drop-shadow-sm 
                  group-hover:scale-110 group-hover:rotate-3 
                  transition-transform duration-300 ease-out
                "
              />
              
              {/* ✅ TEXT: UPDATED TO MATCH DASHBOARD THEME EXACTLY */}
              <span
                className="
                  text-[32px] font-extrabold tracking-tight
                  bg-gradient-to-r from-indigo-600 to-purple-600
                  bg-clip-text text-transparent
                  group-hover:brightness-110
                  transition-all duration-300
                "
              >
                Zyris
              </span>
            </button>
          ) : (
            // LOGGED IN (Dashboard) -> Only Text (No Image)
            <button onClick={goToTop} className="flex items-center group">
              <span
                className="
                  text-[32px] font-extrabold tracking-tight
                  bg-gradient-to-r from-indigo-600 to-purple-600
                  bg-clip-text text-transparent
                  group-hover:scale-[1.02]
                  transition-transform duration-300
                "
              >
                Zyris
              </span>
            </button>
          )}

          {/* RIGHT SIDE: NAVIGATION */}
          {!token ? (
            <div className="flex items-center space-x-8 sm:space-x-12">
              <button
                onClick={() => handleNavClick("features")}
                className="
                  text-lg font-bold text-gray-600 
                  hover:text-indigo-600 hover:-translate-y-0.5
                  transition-all duration-200
                "
              >
                Features
              </button>
              <button
                onClick={() => handleNavClick("faq")}
                className="
                  text-lg font-bold text-gray-600 
                  hover:text-indigo-600 hover:-translate-y-0.5
                  transition-all duration-200
                "
              >
                FAQ
              </button>
            </div>
          ) : (
            // LOGGED IN: Profile Menu
            <div className="relative" ref={menuRef}>
              <img
                src={avatarSrc}
                alt="avatar"
                referrerPolicy="no-referrer"
                onError={() => setImgError(true)}
                onClick={() => setShowMenu(!showMenu)}
                className="
                  h-11 w-11 rounded-full cursor-pointer
                  border-2 border-white shadow-md object-cover
                  hover:scale-[1.1] hover:shadow-lg
                  transition-all duration-300
                  bg-gray-100
                "
              />

              {showMenu && (
                <div
                  className="
                    absolute right-0 mt-3 w-48
                    bg-white/95 backdrop-blur-xl
                    shadow-2xl rounded-2xl
                    border border-gray-100 overflow-hidden
                    animate-in fade-in slide-in-from-top-2 duration-200
                  "
                >
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      setShowProfileModal(true);
                    }}
                    className="w-full text-left px-5 py-3.5 hover:bg-gray-50 text-gray-700 font-medium transition-colors"
                  >
                    Profile
                  </button>

                  <div className="h-[1px] bg-gray-100 mx-2"></div>

                  <button
                    onClick={() => {
                      setShowMenu(false);
                      setShowLogoutModal(true);
                    }}
                    className="w-full text-left px-5 py-3.5 hover:bg-red-50 text-red-500 font-medium transition-colors"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </nav>

      {/* PROFILE MODAL */}
      {showProfileModal && user && (
        <div className="fixed inset-0 flex items-center justify-center z-[999] backdrop-blur-md bg-black/40">
          <div className="bg-white/95 backdrop-blur-xl p-8 rounded-3xl shadow-2xl max-w-sm w-full text-center relative font-sans">
            <button
              onClick={() => setShowProfileModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
            >
              ✕
            </button>

            <img
              src={avatarSrc}
              referrerPolicy="no-referrer"
              onError={() => setImgError(true)}
              className="h-24 w-24 rounded-full mx-auto mb-4 shadow-lg object-cover bg-gray-100 border-4 border-white"
              alt="Profile"
            />

            <h2 className="text-2xl font-bold text-gray-900">{user.name}</h2>
            <p className="text-gray-500 font-medium mt-1">{user.email}</p>
          </div>
        </div>
      )}

      {/* LOGOUT MODAL */}
      {showLogoutModal && (
        <div className="fixed inset-0 flex items-center justify-center z-[999] backdrop-blur-md bg-black/40">
          <div className="bg-white/95 backdrop-blur-xl p-8 rounded-3xl shadow-2xl max-w-sm w-full text-center font-sans">
            <h2 className="text-2xl font-bold mb-3 text-gray-900">
              Logging Out?
            </h2>
            <p className="text-gray-500 font-medium mb-8">
              We'll miss you! Come back soon to track your progress.
            </p>

            <div className="flex justify-between gap-4">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 px-6 py-3 rounded-xl border border-gray-200 font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>

              <button
                onClick={confirmLogout}
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