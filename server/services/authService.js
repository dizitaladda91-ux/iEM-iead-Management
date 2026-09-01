import bcrypt from "bcryptjs";
import pool from "../config/db.js";
import crypto from "crypto";

import ApiError from "../utils/ApiError.js";

import {
  verifyRefreshToken,
  generateAccessToken,
  generateRefreshToken,
} from "../utils/jwt.js";

import {
  createPasswordResetRepository,
  findPasswordResetRepository,
  markPasswordResetUsedRepository,
  deleteUserPasswordResetRepository,
} from "../repositories/passwordResetRepository.js";

import {
  deleteAllRefreshTokensRepository,
} from "../repositories/refreshTokenRepository.js";

import {
  findRefreshTokenRepository,
  createRefreshTokenRepository,
  deleteRefreshTokenRepository,
} from "../repositories/refreshTokenRepository.js";


import {
  createUserRepository,
  findUserByEmailRepository,
  findUserByEmailWithPasswordRepository,
  updateLastLoginRepository,
  findUserByIdRepository,
  updatePasswordRepository,
  updateEmailVerificationRepository,   
} from "../repositories/authRepository.js";

import auditLogger from "../utils/auditLogger.js";
import { verifyStoredPassword } from "../utils/passwordUtils.js";

/**
 * =====================================================
 * Register User
 * =====================================================
 */
export const registerUserService = async (
  userData
) => {

  const client = await pool.connect();

  try {

    await client.query("BEGIN");

    const existingUser =
      await findUserByEmailRepository(
        userData.email
      );

    if (existingUser) {

      throw new ApiError(
        409,
        "Email already exists."
      );

    }

    const hashedPassword =
      await bcrypt.hash(
        userData.password,
        10
      );

    // Prevent privilege escalation: public registration cannot create ADMIN or MANAGER roles
    const allowedPublicRoles = ["COUNSELLOR", "EMPLOYEE"];
    const assignedRole = allowedPublicRoles.includes(userData.role?.toUpperCase())
      ? userData.role.toUpperCase()
      : "COUNSELLOR";

    const user =
      await createUserRepository(
        client,
        {
          ...userData,
          role: assignedRole,
          password: hashedPassword,
        }
      );

    await client.query("COMMIT");

    return user;

  } catch (error) {

    await client.query("ROLLBACK");

    throw error;

  } finally {

    client.release();

  }

};

/**
 * =====================================================
 * Login User
 * =====================================================
 */
export const loginUserService = async (
  email,
  password
) => {

  const user =
    await findUserByEmailWithPasswordRepository(
      email
    );

  if (!user) {

    throw new ApiError(
      401,
      "Invalid email or password."
    );

  }

  const isPasswordPlainText =
    typeof user.password === "string" &&
    !user.password.startsWith("$2");

  const isPasswordCorrect = await verifyStoredPassword(password, user.password);

  console.log("Entered Password:", password);
  console.log("Password Match:", isPasswordCorrect);
  console.log("Password Stored As Plain Text:", isPasswordPlainText);

  if (!isPasswordCorrect) {
    throw new ApiError(
      401,
      "Invalid email or password."
    );
  }

  if (isPasswordPlainText) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const hashedPassword = await bcrypt.hash(password, 10);
      await updatePasswordRepository(
        client,
        user.id,
        hashedPassword
      );
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Failed to upgrade plain-text password:", error);
    } finally {
      client.release();
    }
  }

  await updateLastLoginRepository(user.id);

  const accessToken = generateAccessToken(user);

  const refreshToken = generateRefreshToken(user);

  const expiresAt = new Date(
    Date.now() + 7 * 24 * 60 * 60 * 1000
  );

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    await createRefreshTokenRepository(
      client,
      user.id,
      refreshToken,
      expiresAt
    );

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Failed to store refresh token:", error);
    throw error;
  } finally {
    client.release();
  }

  delete user.password;

  return {
    user,
    accessToken,
    refreshToken,
  };
};
/**
 * =====================================================
 * Get Profile
 * =====================================================
 */
export const getProfileService = async (
  userId
) => {
  const user =
    await findUserByIdRepository(userId);

  if (!user) {
    throw new ApiError(
      404,
      "User not found."
    );
  }

  if (user.is_deleted) {
    throw new ApiError(
      403,
      "User account has been deleted."
    );
  }

  if (!user.is_active) {
    throw new ApiError(
      403,
      "User account is inactive."
    );
  }

  delete user.password;

  // Enrich with employee profile details if available
  try {
    const { rows } = await pool.query(
      "SELECT id AS employee_id, employee_code, mobile, designation, department_id, profile_image, address, emergency_contact, emergency_contact_name, joining_date FROM employees WHERE (user_id = $1 OR email = $2) AND is_deleted = FALSE LIMIT 1;",
      [user.id, user.email]
    );
    if (rows.length > 0) {
      return {
        ...user,
        ...rows[0],
      };
    }
  } catch (err) {
    console.warn("Could not enrich employee profile:", err.message);
  }

  return user;
};

/**
 * =====================================================
 * Update Profile & Photo
 * =====================================================
 */
export const updateProfileService = async (
  userId,
  payload
) => {
  const {
    profile_image,
    full_name,
    mobile,
    address,
    emergency_contact,
    emergency_contact_name,
  } = payload;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    if (full_name) {
      await client.query(
        "UPDATE users SET full_name = $1, updated_at = NOW() WHERE id = $2;",
        [full_name, userId]
      );
    }

    const { rows: empRows } = await client.query(
      `UPDATE employees 
       SET 
         profile_image = COALESCE($1, profile_image),
         full_name = COALESCE($2, full_name),
         mobile = COALESCE($3, mobile),
         address = COALESCE($4, address),
         emergency_contact = COALESCE($5, emergency_contact),
         emergency_contact_name = COALESCE($6, emergency_contact_name),
         updated_at = NOW()
       WHERE (user_id = $7 OR email = (SELECT email FROM users WHERE id = $7))
       RETURNING *;`,
      [
        profile_image !== undefined ? profile_image : null,
        full_name || null,
        mobile || null,
        address || null,
        emergency_contact || null,
        emergency_contact_name || null,
        userId,
      ]
    );

    await client.query("COMMIT");

    const updatedUser = await findUserByIdRepository(userId);
    delete updatedUser.password;
    const employee = empRows[0] || {};

    return {
      ...updatedUser,
      profile_image: employee.profile_image || profile_image || null,
      mobile: employee.mobile || updatedUser.mobile || null,
      employee_code: employee.employee_code || null,
      designation: employee.designation || null,
    };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

/**
 * =====================================================
 * Change Password
 * =====================================================
 */
export const changePasswordService = async (
  userId,
  currentPassword,
  newPassword
) => {

  const client =
    await pool.connect();

  try {

    await client.query("BEGIN");

    const user =
      await findUserByIdRepository(userId);

    if (!user) {

      throw new ApiError(
        404,
        "User not found."
      );

    }

    const loginUser =
      await findUserByEmailWithPasswordRepository(
        user.email
      );

    const isPasswordCorrect = await verifyStoredPassword(
      currentPassword,
      loginUser.password
    );

    if (!isPasswordCorrect) {

      throw new ApiError(
        401,
        "Current password is incorrect."
      );

    }

    const isSamePassword = await verifyStoredPassword(
      newPassword,
      loginUser.password
    );

    if (isSamePassword) {

      throw new ApiError(
        400,
        "New password cannot be the same as the current password."
      );

    }

    const hashedPassword =
      await bcrypt.hash(
        newPassword,
        10
      );

    const updatedUser =
      await updatePasswordRepository(
        client,
        userId,
        hashedPassword
      );

    await client.query("COMMIT");

    return updatedUser;

  } catch (error) {

    await client.query("ROLLBACK");

    throw error;

  } finally {

    client.release();

  }

};

/**
 * =====================================================
 * Forgot Password
 * =====================================================
 */
export const forgotPasswordService = async (
  email
) => {

  const client = await pool.connect();

  try {

    await client.query("BEGIN");

    const user =
      await findUserByEmailRepository(email);

    /**
     * Security:
     * Never reveal whether the email exists.
     */

    if (!user) {

      await client.query("COMMIT");

      return {
        message:
          "If an account exists, a password reset link has been sent."
      };

    }

    await deleteUserPasswordResetRepository(
      client,
      user.id
    );

    const plainToken =
      crypto.randomBytes(32).toString("hex");

    const hashedToken =
      crypto
        .createHash("sha256")
        .update(plainToken)
        .digest("hex");

    const expiresAt =
      new Date(
        Date.now() + 15 * 60 * 1000
      );

    await createPasswordResetRepository(

      client,

      user.id,

      hashedToken,

      expiresAt

    );

    await client.query("COMMIT");

    return {
      message:
        "If an account exists, a password reset link has been sent.",
      ...(process.env.NODE_ENV === "test"
        ? { resetToken: plainToken, expiresAt }
        : {}),
    };

  } catch (error) {

    await client.query("ROLLBACK");

    throw error;

  } finally {

    client.release();

  }

};

/**
 * =====================================================
 * Reset Password
 * =====================================================
 */
export const resetPasswordService = async (

  token,

  newPassword

) => {

  const client =
    await pool.connect();

  try {

    await client.query("BEGIN");

    const hashedToken =
      crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");

    const reset =
      await findPasswordResetRepository(
        hashedToken
      );

    if (!reset) {

      throw new ApiError(
        400,
        "Invalid reset token."
      );

    }

    if (
      new Date(reset.expires_at) <
      new Date()
    ) {

      throw new ApiError(
        400,
        "Reset token has expired."
      );

    }

    const hashedPassword =
      await bcrypt.hash(
        newPassword,
        10
      );

    await updatePasswordRepository(

      client,

      reset.user_id,

      hashedPassword

    );

    await markPasswordResetUsedRepository(

      client,

      reset.id

    );

    await deleteAllRefreshTokensRepository(

      client,

      reset.user_id

    );

    await client.query("COMMIT");

    return {

      success: true,

      message:
        "Password reset successfully.",

    };

  } catch (error) {

    await client.query("ROLLBACK");

    throw error;

  } finally {

    client.release();

  }

};

/**
 * =====================================================
 * Logout User
 * =====================================================
 */
export const logoutUserService = async (
  refreshToken,
  client,
  userId = null
) => {

  if (refreshToken) {
    const token =
      await findRefreshTokenRepository(
        refreshToken
      );

    if (!token) {
      return {
        success: true,
        message: "User logged out successfully.",
      };
    }

    await deleteRefreshTokenRepository(
      client,
      refreshToken
    );

    return {
      success: true,
      message: "Logout successful.",
    };
  }

  if (userId) {
    await deleteAllRefreshTokensRepository(
      client,
      userId
    );

    return {
      success: true,
      message: "Logout successful.",
    };
  }

  return {
    success: true,
    message: "Logout successful.",
  };

};

/**
 * =====================================================
 * Refresh Token Rotation
 * =====================================================
 */
export const refreshTokenRotationService =
async (
  refreshToken,
  client
) => {

  const storedToken =
    await findRefreshTokenRepository(
      refreshToken
    );

  if (!storedToken) {

    throw new ApiError(
      401,
      "Invalid refresh token."
    );

  }

  const decoded =
    verifyRefreshToken(
      refreshToken
    );

  const user =
    await findUserByIdRepository(
      decoded.id
    );

  if (!user) {

    throw new ApiError(
      401,
      "User not found."
    );

  }

  await deleteRefreshTokenRepository(
    client,
    refreshToken
  );

  const newAccessToken =
    generateAccessToken(user);

  const newRefreshToken =
    generateRefreshToken(user);

  const expiresAt =
    new Date(
      Date.now() +
      7 * 24 * 60 * 60 * 1000
    );

  await createRefreshTokenRepository(

    client,

    user.id,

    newRefreshToken,

    expiresAt

  );

  return {

    accessToken:
      newAccessToken,

    refreshToken:
      newRefreshToken,

  };

};

/**
 * =====================================================
 * Verify Email
 * =====================================================
 */
export const verifyEmailService =
async (
  client,
  userId
) => {

  const user =
    await findUserByIdRepository(
      userId
    );

  if (!user) {

    throw new ApiError(
      404,
      "User not found."
    );

  }

  if (user.email_verified) {

    return {

      success: true,

      message:
        "Email already verified.",

    };

  }

  await updateEmailVerificationRepository(

    client,

    userId

  );

  return {

    success: true,

    message:
      "Email verified successfully.",

  };

};