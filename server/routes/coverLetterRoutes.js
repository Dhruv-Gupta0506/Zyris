const express = require("express");
const router = express.Router();

const { generateCoverLetter } = require("../controllers/coverLetterController");
const authMiddleware = require("../middleware/authMiddleware");

router.post("/generate", authMiddleware, generateCoverLetter);

module.exports = router;
