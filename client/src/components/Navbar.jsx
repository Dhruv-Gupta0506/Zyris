import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { token, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const smoothScroll = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  const handleNavClick = (section) => {
    if (location.pathname !== "/") {
      navigate("/");
      setTimeout(() => smoothScroll(section), 200);
    } else {
      smoothScroll(section);
    }
  };

  const goToTop = () => {
    if (location.pathname !== "/") {
      navigate("/");
      setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 200);
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <nav
      className="
        w-full fixed top-0 left-0 z-50
        bg-[#eef1ff]/85 backdrop-blur-xl
        shadow-[0_3px_12px_rgba(0,0,0,0.03)]
      "
    >
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">

        {/* LOGO + BRAND */}
        <button
          onClick={goToTop}
          className="flex items-center gap-2 hover:scale-110 transition-all duration-200"
        >
          <img
            src="/logo.png"
            alt="Career Nexus Logo"
            className="h-8 w-8 object-contain"
          />
          <span
            className="
              text-xl sm:text-2xl font-bold tracking-tight
              text-indigo-600 hover:text-indigo-700
              transition-all duration-200
            "
          >
            Career Nexus
          </span>
        </button>

        {/* NAV OPTIONS */}
        {!token ? (
          <div className="flex items-center space-x-6 sm:space-x-10">

            <button
              onClick={() => handleNavClick("features")}
              className="
                text-base sm:text-lg font-medium text-gray-700
                hover:text-indigo-600
                transition-all duration-200 hover:scale-110
              "
            >
              Features
            </button>

            <button
              onClick={() => handleNavClick("faq")}
              className="
                text-base sm:text-lg font-medium text-gray-700
                hover:text-indigo-600
                transition-all duration-200 hover:scale-110
              "
            >
              FAQ
            </button>

          </div>
        ) : (
          <div className="flex items-center space-x-6 sm:space-x-10">
            <Link
              to="/dashboard"
              className="
                text-base sm:text-lg font-medium text-gray-700
                hover:text-indigo-600
                transition-all duration-200 hover:scale-110
              "
            >
              Dashboard
            </Link>

            <button
              onClick={logout}
              className="
                px-4 py-2 sm:px-5 sm:py-2.5 border border-red-500 text-red-500
                rounded-xl hover:bg-red-500 hover:text-white
                text-base sm:text-lg font-medium
                transition-all duration-200 hover:scale-110
              "
            >
              Logout
            </button>
          </div>
        )}

      </div>
    </nav>
  );
}
