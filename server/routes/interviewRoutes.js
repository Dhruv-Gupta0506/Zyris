const express = require("express");
const router = express.Router();

const {
  generateQuestions,
  evaluateInterview,
  history
} = require("../controllers/interviewController");

const authMiddleware = require("../middleware/authMiddleware");

// Generate interview questions
router.post("/generate", authMiddleware, generateQuestions);

// Evaluate answers and save interview
router.post("/evaluate", authMiddleware, evaluateInterview);

// Interview history
router.get("/history", authMiddleware, history);

module.exports = router;
