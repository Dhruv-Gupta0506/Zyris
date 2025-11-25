import { Link } from "react-router-dom";

export default function Navbar() {
  const token = localStorage.getItem("token");

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  return (
    <div
      style={{
        padding: "15px",
        borderBottom: "1px solid #ddd",
        marginBottom: "20px",
      }}
    >
      {/* Always visible */}
      <Link to="/" style={{ marginRight: "20px" }}>Home</Link>

      {/* When NOT logged in */}
      {!token && (
        <>
          <Link to="/login" style={{ marginRight: "20px" }}>Login</Link>
          <Link to="/register">Register</Link>
        </>
      )}

      {/* When logged in */}
      {token && (
        <>
          <Link to="/dashboard" style={{ marginRight: "20px" }}>Dashboard</Link>
          <Link to="/resume" style={{ marginRight: "20px" }}>Resume Analyzer</Link>
          <Link to="/history" style={{ marginRight: "20px" }}>Resume History</Link>
          <Link to="/jd" style={{ marginRight: "20px" }}>JD Analyzer</Link>
          <Link to="/jd-history" style={{ marginRight: "20px" }}>JD History</Link>
          <Link to="/match-engine" style={{ marginRight: "20px" }}>Match Engine</Link>
          <Link to="/match-history" style={{ marginRight: "20px" }}>Match history</Link>
          <Link to="/tailored-resume" style={{ marginRight: "20px" }}>Tailored Resume</Link>
          <Link to="/tailored-history" style={{ marginRight: "20px" }}>Tailored History</Link>
          <Link to="/interview" style={{ marginRight: "20px" }}>Mock Interview</Link>
          <Link to="/interview-history" style={{ marginRight: "20px" }}>Interview History</Link>


          <button
            onClick={handleLogout}
            style={{
              cursor: "pointer",
              background: "none",
              border: "none",
              color: "red",
              fontWeight: "bold",
            }}
          >
            Logout
          </button>
        </>
      )}
    </div>
  );
}
