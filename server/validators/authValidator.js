import { body } from "express-validator";

/**
 * =====================================================
 * Register Validator
 * =====================================================
 */

export const registerValidator = [

  body("full_name")
    .trim()
    .notEmpty()
    .withMessage("Full name is required.")
    .isLength({ min: 3, max: 100 })
    .withMessage(
      "Full name must be between 3 and 100 characters."
    ),

  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required.")
    .isEmail()
    .withMessage("Invalid email address.")
    .normalizeEmail(),

  body("password")
    .notEmpty()
    .withMessage("Password is required.")
    .isLength({ min: 8 })
    .withMessage(
      "Password must be at least 8 characters."
    )
    .matches(/[A-Z]/)
    .withMessage(
      "Password must contain at least one uppercase letter."
    )
    .matches(/[a-z]/)
    .withMessage(
      "Password must contain at least one lowercase letter."
    )
    .matches(/[0-9]/)
    .withMessage(
      "Password must contain at least one number."
    )
    .matches(/[!@#$%^&*]/)
    .withMessage(
      "Password must contain at least one special character."
    ),

  body("role")
    .notEmpty()
    .withMessage("Role is required.")
    .isIn([
      "ADMIN",
      "MANAGER",
      "COUNSELLOR",
    ])
    .withMessage("Invalid role.")

];

export const loginValidator = [

  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required.")
    .isEmail()
    .withMessage("Invalid email address.")
    .normalizeEmail(),

  body("password")
    .notEmpty()
    .withMessage("Password is required.")

];

export const changePasswordValidator = [

  body("currentPassword")
    .notEmpty()
    .withMessage("Current password is required."),

  body("newPassword")
    .notEmpty()
    .withMessage("New password is required.")
    .isLength({ min: 8 })
    .withMessage(
      "Password must be at least 8 characters."
    )

];

export const forgotPasswordValidator = [

  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required.")
    .isEmail()
    .withMessage("Invalid email.")

];

export const resetPasswordValidator = [

  body("token")
    .notEmpty()
    .withMessage("Reset token is required."),

  body("newPassword")
    .notEmpty()
    .withMessage("New password is required.")
    .isLength({ min: 8 })
    .withMessage(
      "Password must be at least 8 characters."
    )

];

export const refreshTokenValidator = [

  body("refreshToken")
    .notEmpty()
    .withMessage("Refresh token is required."),

];

