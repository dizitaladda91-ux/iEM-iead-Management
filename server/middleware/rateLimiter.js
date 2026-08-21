import rateLimit from "express-rate-limit";

/**
 * =====================================================
 * Global API Rate Limiter
 * =====================================================
 */

export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 Minutes
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
  message: {
    success: false,
    message: "Too many requests. Please try again later.",
  },
});

/**
 * =====================================================
 * Login Rate Limiter
 * =====================================================
 */

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30, // 30 attempts per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
  message: {
    success: false,
    message: "Too many login attempts. Please try again after 15 minutes.",
  },
});