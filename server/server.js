const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");

dotenv.config();
connectDB();

const app = express();
app.use(express.json());
app.use(cors());

// AUTH ROUTES
app.use("/api/auth", require("./routes/authRoutes"));

// RESUME ROUTES
app.use("/api/resume", require("./routes/resumeRoutes"));

// JD ROUTES
app.use("/api/jd", require("./routes/jdRoutes"));

// MOCK INTERVIEW ROUTE
app.use("/api/interview", require("./routes/interviewRoutes"));


app.get("/", (req, res) => {
  res.json({ message: "CareerNexus API Running" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
