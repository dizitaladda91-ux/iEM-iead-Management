import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";

import {
  registerUserService,
  loginUserService,
} from "../services/authService.js";

import {
  getProfileService,
  updateProfileService,
  changePasswordService,
} from "../services/authService.js";

import {
  forgotPasswordService,
  resetPasswordService,
  directResetPasswordService,
} from "../services/authService.js";

import {
  refreshTokenRotationService,
  logoutUserService,
  verifyEmailService,
} from "../services/authService.js";

import pool from "../config/db.js";


/**
 * =====================================================
 * Register User
 * =====================================================
 */
export const register = asyncHandler(
  async (req, res) => {

    const user =
      await registerUserService(
        req.body
      );

    return res.status(201).json(

      new ApiResponse(
        201,
        user,
        "User registered successfully."
      )

    );

  }
);

/**
 * =====================================================
 * Login User
 * =====================================================
 */
export const login = asyncHandler(
  async (req, res) => {

    const {
      email,
      password,
    } = req.body;

    const result =
      await loginUserService(
        email,
        password
      );

    return res.status(200).json(

      new ApiResponse(
        200,
        result,
        "Login successful."
      )

    );

  }
);

/**
 * =====================================================
 * Get Logged In User Profile
 * =====================================================
 */
export const getProfile = asyncHandler(
  async (req, res) => {

    const user =
      await getProfileService(
        req.user.id
      );

    return res.status(200).json(
      new ApiResponse(
        200,
        user,
        "Profile fetched successfully."
      )
    );
  }
);

/**
 * =====================================================
 * Update Logged In User Profile & Photo
 * =====================================================
 */
export const updateProfile = asyncHandler(
  async (req, res) => {
    const updatedUser =
      await updateProfileService(
        req.user.id,
        req.body
      );

    return res.status(200).json(
      new ApiResponse(
        200,
        updatedUser,
        "Profile updated successfully."
      )
    );
  }
);

/**
 * =====================================================
 * Change Password
 * =====================================================
 */
export const changePassword = asyncHandler(
  async (req, res) => {

    const currentPassword =
      req.body.currentPassword ||
      req.body.oldPassword ||
      req.body.current_password;

    const newPassword =
      req.body.newPassword ||
      req.body.new_password;

    const result =
      await changePasswordService(

        req.user.id,

        currentPassword,

        newPassword

      );

    return res.status(200).json(

      new ApiResponse(

        200,

        result,

        "Password changed successfully."

      )

    );

  }
);

/**
 * =====================================================
 * Forgot Password
 * =====================================================
 */
export const forgotPassword = asyncHandler(
  async (req, res) => {

    const { email } = req.body;

    const result =
      await forgotPasswordService(email);

    return res.status(200).json(

      new ApiResponse(

        200,

        result,

        "If the account exists, a password reset link has been sent."

      )

    );

  }
);

/**
 * =====================================================
 * Reset Password
 * =====================================================
 */
export const resetPassword = asyncHandler(
  async (req, res) => {

    const {
      token,
      newPassword,
    } = req.body;

    const result =
      await resetPasswordService(

        token,

        newPassword

      );

    return res.status(200).json(

      new ApiResponse(

        200,

        result,

        "Password reset successfully."

      )

    );

  }
);

/**
 * =====================================================
 * Refresh Access Token
 * =====================================================
 */
export const refreshToken = asyncHandler(
  async (req, res) => {

    const { refreshToken } = req.body;

    const client = await pool.connect();

    try {

      await client.query("BEGIN");

      const result =
        await refreshTokenRotationService(
          refreshToken,
          client
        );

      await client.query("COMMIT");

      return res.status(200).json(

        new ApiResponse(

          200,

          result,

          "Access token refreshed successfully."

        )

      );

    } catch (error) {

      await client.query("ROLLBACK");

      throw error;

    } finally {

      client.release();

    }

  }
);

/**
 * =====================================================
 * Logout User
 * =====================================================
 */
export const logout = asyncHandler(
  async (req, res) => {

    const refreshToken = req.body?.refreshToken;

    const client = await pool.connect();

    try {

      await client.query("BEGIN");

      const result =
        await logoutUserService(
          refreshToken,
          client,
          req.user?.id
        );

      await client.query("COMMIT");

      return res.status(200).json(

        new ApiResponse(

          200,

          result,

          "Logout successful."

        )

      );

    } catch (error) {

      await client.query("ROLLBACK");

      throw error;

    } finally {

      client.release();

    }

  }
);

/**
 * =====================================================
 * Verify Email
 * =====================================================
 */
export const verifyEmail = asyncHandler(
  async (req, res) => {

    const client =
      await pool.connect();

    try {

      await client.query("BEGIN");

      const result =
        await verifyEmailService(

          client,

          req.user.id

        );

      await client.query("COMMIT");

      return res.status(200).json(

        new ApiResponse(

          200,

          result,

          "Email verified successfully."

        )

      );

    } catch (error) {

      await client.query("ROLLBACK");

      throw error;

    } finally {

      client.release();

    }

  }
);

/**
 * =====================================================
 * Direct Reset Password Controller
 * =====================================================
 */
export const directResetPassword = asyncHandler(
  async (req, res) => {
    const { email, newPassword, password } = req.body;
    const targetPassword = newPassword || password;

    const result = await directResetPasswordService(
      email,
      targetPassword
    );

    return res.status(200).json(
      new ApiResponse(
        200,
        result,
        result.message || "Password updated successfully."
      )
    );
  }
);