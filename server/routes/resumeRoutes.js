// routes/resumeRoutes.js
const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const { analyzeResume, history } = require("../controllers/resumeController");
const authMiddleware = require("../middleware/authMiddleware");

// Upload storage config - put in ./uploads, unique filename
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, "resume-" + Date.now() + path.extname(file.originalname));
  },
});

// File filter - only PDFs, limit size
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== "application/pdf") {
      return cb(new Error("Only PDF files are allowed"));
    }
    cb(null, true);
  },
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB max
  },
});

router.post("/analyze", authMiddleware, upload.single("resume"), analyzeResume);
router.get("/history", authMiddleware, history);

module.exports = router;
