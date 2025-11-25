// routes/matchRoutes.js
const express = require("express");
const router = express.Router();

const { analyzeMatch, matchHistory } = require("../controllers/matchController");
const authMiddleware = require("../middleware/authMiddleware");

// Run Match Analysis
router.post("/analyze", authMiddleware, analyzeMatch);

// Get Match Analysis History
router.get("/history", authMiddleware, matchHistory);

module.exports = router;
