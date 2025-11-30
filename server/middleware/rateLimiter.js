const rateLimit = require("express-rate-limit");

// 1. General Limiter: For standard API routes (History, Auth, etc.)
// Allows 100 requests per 15 minutes. Good for normal navigation.
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  message: { 
    success: false, 
    message: "Too many requests from this IP, please try again after 15 minutes." 
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// 2. AI Limiter: Stricter protection for expensive AI routes (Resume Analysis, etc.)
// Allows 20 AI generations per hour. Prevents abuse of your Google API quota.
const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 Hour window
  max: 60, // Limit each IP to 20 AI generations per hour
  message: { 
    success: false, 
    message: "You have reached the hourly limit for AI usage. Please wait a while before trying again." 
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { apiLimiter, aiLimiter };