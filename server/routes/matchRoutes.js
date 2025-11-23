const express = require("express");
const router = express.Router();

const { analyzeMatch } = require("../controllers/matchController");
const authMiddleware = require("../middleware/authMiddleware");

// Compare a specific resume analysis vs specific JD analysis
router.post("/analyze", authMiddleware, analyzeMatch);

module.exports = router;
