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
  
  // State to handle broken image links (fallback to initials)
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
          setImgError(false); // Reset error state on new user fetch
        }
      })
      .catch((err) => console.error("NAVBAR USER ERROR:", err));
  }, [token]);

  // Determine which avatar to show
  // If user has an avatar AND there is no error loading it, use it.
  // Otherwise, use the UI Avatars generator.
  const avatarSrc =
    !imgError && user?.avatar
      ? user.avatar
      : `https://ui-avatars.com/api/?name=${user?.name || "User"}&background=6366f1&color=fff&rounded=true&size=128`;

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Smooth scroll helper
  const smoothScrollTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const smoothScroll = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      console.warn(`Element with id="${id}" not found on this page.`);
    }
  };

  // Logic for Logo click
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

  // Logic for Features/FAQ click
  const handleNavClick = (sectionId) => {
    if (location.pathname !== "/") {
      navigate("/");
      // Wait slightly longer for Landing page to mount before scrolling
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
      {/* NAVBAR */}
      <nav
        className="
          w-full fixed top-0 left-0 z-50
          backdrop-blur-xl bg-white/30
          border-b border-white/40
          shadow-[0_4px_15px_rgba(0,0,0,0.06)]
        "
      >
        <div className="max-w-[1500px] mx-auto px-4 sm:px-6 py-3 flex justify-between items-center">

          {/* LEFT SIDE: LOGO */}
          {!token ? (
            // LOGGED OUT (Landing)
            <button
              onClick={goToTop}
              className="flex items-center gap-2 group"
            >
              <img
                src="/logo.png"
                alt="Zyris Logo"
                className="h-9 w-9 object-contain"
              />
              <span
                className="
                  text-[28px] font-extrabold tracking-tight
                  bg-gradient-to-r from-sky-500 via-indigo-600 to-indigo-700
                  bg-clip-text text-transparent
                "
              >
                Zyris
              </span>
            </button>
          ) : (
            // LOGGED IN (Dashboard)
            <button onClick={goToTop} className="flex items-center gap-2 group">
               {/* Optional: Add small logo here too if you want */}
              <span
                className="
                  text-[28px] font-extrabold tracking-tight
                  bg-gradient-to-r from-emerald-800 via-teal-700 to-cyan-600
                  bg-clip-text text-transparent
                  transition group-hover:brightness-110
                "
              >
                Zyris
              </span>
            </button>
          )}

          {/* RIGHT SIDE */}
          {!token ? (
            <div className="flex items-center space-x-8 sm:space-x-12">
              <button
                onClick={() => handleNavClick("features")}
                className="text-lg font-medium text-gray-700 hover:text-indigo-600 transition"
              >
                Features
              </button>
              <button
                onClick={() => handleNavClick("faq")}
                className="text-lg font-medium text-gray-700 hover:text-indigo-600 transition"
              >
                FAQ
              </button>
            </div>
          ) : (
            <div className="relative" ref={menuRef}>
              <img
                src={avatarSrc}
                alt="avatar"
                referrerPolicy="no-referrer" // ✅ FIXED: Allows Google images on localhost
                onError={() => setImgError(true)} // ✅ FIXED: Fallback if image fails
                onClick={() => setShowMenu(!showMenu)}
                className="
                  h-11 w-11 rounded-full cursor-pointer
                  border border-gray-300 object-cover
                  hover:scale-[1.05] transition
                  bg-white
                "
              />

              {showMenu && (
                <div
                  className="
                    absolute right-0 mt-3 w-44
                    bg-white/95 backdrop-blur-xl
                    shadow-xl rounded-xl
                    border border-gray-200 overflow-hidden
                  "
                >
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      setShowProfileModal(true);
                    }}
                    className="w-full text-left px-4 py-3 hover:bg-gray-100"
                  >
                    Profile
                  </button>

                  <button
                    onClick={() => {
                      setShowMenu(false);
                      setShowLogoutModal(true);
                    }}
                    className="w-full text-left px-4 py-3 hover:bg-gray-100 text-red-500"
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
        <div
          className="
            fixed inset-0 flex items-center justify-center z-[999]
            backdrop-blur-md bg-black/40
          "
        >
          <div
            className="
              bg-white/95 backdrop-blur-xl p-8 rounded-2xl shadow-2xl
              max-w-sm w-full text-center relative
            "
          >
            <button
              onClick={() => setShowProfileModal(false)}
              className="absolute top-4 right-4 text-xl text-gray-500 hover:text-gray-800"
            >
              ✕
            </button>

            <img
              src={avatarSrc}
              referrerPolicy="no-referrer"
              onError={() => setImgError(true)}
              className="h-24 w-24 rounded-full mx-auto mb-4 shadow-md object-cover bg-gray-100"
              alt="Profile"
            />

            <h2 className="text-2xl font-bold text-gray-800">{user.name}</h2>
            <p className="text-gray-600 mt-1">{user.email}</p>
          </div>
        </div>
      )}

      {/* LOGOUT MODAL */}
      {showLogoutModal && (
        <div
          className="
            fixed inset-0 flex items-center justify-center z-[999]
            backdrop-blur-md bg-black/40
          "
        >
          <div
            className="
              bg-white/95 backdrop-blur-xl p-8 rounded-2xl shadow-2xl
              max-w-sm w-full text-center
            "
          >
            <h2 className="text-2xl font-bold mb-4 text-gray-800">
              Confirm Logout
            </h2>
            <p className="text-gray-600 mb-6">
              Are you sure you want to log out?
            </p>

            <div className="flex justify-between gap-4">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 px-6 py-2 rounded-xl border border-gray-400 hover:bg-gray-50"
              >
                Cancel
              </button>

              <button
                onClick={confirmLogout}
                className="flex-1 px-6 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600"
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