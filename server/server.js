const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");

dotenv.config();
connectDB();

const app = express();

// -----------------------------------------------------------------------------
// CORS (Google Popup + Vercel + Local Dev)
// -----------------------------------------------------------------------------
app.use(
  cors({
    origin: [
      "http://localhost:5173",          // Local Vite frontend
      process.env.FRONTEND_URL || "",   // Production frontend (Vercel)
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// JSON parser
app.use(express.json());

// -----------------------------------------------------------------------------
// ROUTES
// -----------------------------------------------------------------------------

// AUTH (Google login + /me)
app.use("/api/auth", require("./routes/authRoutes"));

// Resume Analyzer
app.use("/api/resume", require("./routes/resumeRoutes"));

// Job Description Analyzer
app.use("/api/jd", require("./routes/jdRoutes"));

// Mock Interview
app.use("/api/interview", require("./routes/interviewRoutes"));

// Job Match Engine
app.use("/api/match", require("./routes/matchRoutes"));

// Tailored Resume
app.use("/api/tailor", require("./routes/tailoredRoutes"));

// -----------------------------------------------------------------------------
// HEALTH CHECKS
// -----------------------------------------------------------------------------
app.get("/", (req, res) => {
  res.json({ message: "Zyris API Running 🚀" });
});

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

// -----------------------------------------------------------------------------
// START SERVER
// -----------------------------------------------------------------------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
