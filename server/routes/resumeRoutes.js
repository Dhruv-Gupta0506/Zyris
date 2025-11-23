const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const { analyzeResume, history } = require("../controllers/resumeController");
const authMiddleware = require("../middleware/authMiddleware");

// Upload storage
const storage = multer.diskStorage({
  destination: "./uploads/",
  filename: (req, file, cb) =>
    cb(null, "resume-" + Date.now() + path.extname(file.originalname)),
});

const upload = multer({ storage });

// ROUTES
router.post(
  "/analyze",
  authMiddleware,
  upload.single("resume"),
  analyzeResume
);

router.get("/history", authMiddleware, history);

module.exports = router;
