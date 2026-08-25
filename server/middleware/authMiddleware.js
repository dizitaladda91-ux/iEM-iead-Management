import ApiError from "../utils/ApiError.js";
import pool from "../config/db.js";

import { HTTP_STATUS } from "../constants/httpStatus.js";

import {
  verifyAccessToken,
} from "../utils/jwt.js";

import {
  findUserByIdRepository,
} from "../repositories/authRepository.js";

/**
 * =====================================================
 * Authentication Middleware
 * Project : IEM Admissions CRM
 * =====================================================
 */

const authMiddleware = async (
  req,
  res,
  next
) => {

  try {

    /**
     * ----------------------------------------
     * Authorization Header
     * ----------------------------------------
     */

    const authHeader =
      req.headers.authorization;

    if (
      !authHeader ||
      !authHeader.startsWith("Bearer ")
    ) {

      return next(
        new ApiError(
          HTTP_STATUS.UNAUTHORIZED,
          "Authorization token is required."
        )
      );

    }

    /**
     * ----------------------------------------
     * Extract Token
     * ----------------------------------------
     */

    const token =
      authHeader.split(" ")[1];

    if (!token) {

      return next(
        new ApiError(
          HTTP_STATUS.UNAUTHORIZED,
          "Authentication token is missing."
        )
      );

    }

    /**
     * ----------------------------------------
     * Verify JWT
     * ----------------------------------------
     */

    const decoded =
      verifyAccessToken(token);

    /**
     * ----------------------------------------
     * Check User Exists
     * ----------------------------------------
     */

    const user =
      await findUserByIdRepository(
        decoded.id
      );

    if (!user) {

      return next(
        new ApiError(
          HTTP_STATUS.UNAUTHORIZED,
          "User not found."
        )
      );

    }

    if (!user.is_active) {
      return next(
        new ApiError(
          HTTP_STATUS.FORBIDDEN,
          "User account is inactive."
        )
      );
    }

    /**
     * ----------------------------------------
     * Attach Safe User Object with employee_id
     * ----------------------------------------
     */
    let employeeId = null;
    try {
      const { rows: empRows } = await pool.query(
        "SELECT id FROM employees WHERE (user_id = $1 OR email = $2) AND is_deleted = FALSE LIMIT 1;",
        [user.id, user.email]
      );
      if (empRows.length > 0) {
        employeeId = empRows[0].id;
      }
    } catch (empErr) {
      console.warn("Could not attach employee_id in authMiddleware:", empErr.message);
    }

    req.user = {
      id: user.id,
      employee_id: employeeId,
      full_name: user.full_name,
      email: user.email,
      role: user.role,
    };

    next();

  } catch (error) {

    /**
     * ----------------------------------------
     * Token Expired
     * ----------------------------------------
     */

    if (
      error.name ===
      "TokenExpiredError"
    ) {

      return next(
        new ApiError(
          HTTP_STATUS.UNAUTHORIZED,
          "Token has expired."
        )
      );

    }

    /**
     * ----------------------------------------
     * Invalid JWT
     * ----------------------------------------
     */

    if (
      error.name ===
      "JsonWebTokenError"
    ) {

      return next(
        new ApiError(
          HTTP_STATUS.UNAUTHORIZED,
          "Invalid authentication token."
        )
      );

    }

    /**
     * ----------------------------------------
     * Unknown Error
     * ----------------------------------------
     */

    return next(error);

  }

};

export default authMiddleware;