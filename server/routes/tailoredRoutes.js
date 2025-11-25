// routes/tailoredRoutes.js
const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const { generateTailored, history, getById } = require("../controllers/tailoredController");

// POST /api/tailor/generate -> { resumeId, jobId }
router.post("/generate", authMiddleware, generateTailored);

// GET /api/tailor/history
router.get("/history", authMiddleware, history);

// GET /api/tailor/:id
router.get("/:id", authMiddleware, getById);

module.exports = router;
