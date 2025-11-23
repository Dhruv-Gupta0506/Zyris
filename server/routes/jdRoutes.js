const express = require("express");
const router = express.Router();

const { analyzeJob, history } = require("../controllers/jdController");
const authMiddleware = require("../middleware/authMiddleware");

router.post("/analyze", authMiddleware, analyzeJob);
router.get("/history", authMiddleware, history);

module.exports = router;
