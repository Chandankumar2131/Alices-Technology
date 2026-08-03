const rateLimit = require("express-rate-limit");

const standardLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1500,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests. Please try again later.",
  },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many login attempts. Please try again later.",
  },
});

const writeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many write requests. Please slow down.",
  },
});

const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.AI_RATE_LIMIT || 20),
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "AI request limit reached. Please try again later.",
  },
});

module.exports = {
  standardLimiter,
  authLimiter,
  writeLimiter,
  aiLimiter,
};
