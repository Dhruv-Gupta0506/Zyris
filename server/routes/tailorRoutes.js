const express = require("express");
const router = express.Router();

const { generateTailoredResume } = require("../controllers/tailorController");
const authMiddleware = require("../middleware/authMiddleware");

// Generate tailored resume content from a given resume analysis + JD analysis
router.post("/generate", authMiddleware, generateTailoredResume);

module.exports = router;
