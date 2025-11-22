const express = require("express");
const router = express.Router();

const { analyzeJob, history } = require("../controllers/jdController");
const authMiddleware = require("../middleware/authMiddleware");

// Analyze JD against user's resume
router.post("/analyze", authMiddleware, analyzeJob);

// Get JD analysis history
router.get("/history", authMiddleware, history);

module.exports = router;
