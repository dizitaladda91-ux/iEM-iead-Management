import express from "express";
import {
  loginLimiter,
} from "../middleware/rateLimiter.js";
import {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
  refreshToken,
  logout,
  verifyEmail,
} from "../controllers/authController.js";

import authMiddleware from "../middleware/authMiddleware.js";

import validate from "../middleware/validate.js";

import {
  registerValidator,
  loginValidator,
  changePasswordValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
  refreshTokenValidator,
} from "../validators/authValidator.js";

const router = express.Router();

/**
 * =====================================================
 * Public Routes
 * =====================================================
 */

router.post(
  "/register",
  registerValidator,
  validate,
  register
);

router.post(
  "/login",
  loginLimiter,
  loginValidator,
  validate,
  login
);

router.post(
  "/forgot-password",
  forgotPasswordValidator,
  validate,
  forgotPassword
);

router.post(
  "/reset-password",
  resetPasswordValidator,
  validate,
  resetPassword
);

router.post(
  "/refresh-token",
  refreshTokenValidator,
  validate,
  refreshToken
);

/**
 * =====================================================
 * Protected Routes
 * =====================================================
 */

router.get(
  "/me",
  authMiddleware,
  getProfile
);

router.patch(
  "/profile",
  authMiddleware,
  updateProfile
);

router.put(
  "/profile",
  authMiddleware,
  updateProfile
);

router.patch(
  "/change-password",
  authMiddleware,
  changePasswordValidator,
  validate,
  changePassword
);

router.post(
  "/logout",
  authMiddleware,
  logout
);

router.patch(
  "/verify-email",
  authMiddleware,
  verifyEmail
);

export default router;