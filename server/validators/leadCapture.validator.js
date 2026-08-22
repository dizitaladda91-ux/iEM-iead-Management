import { body } from "express-validator";

export const capturePublicLeadValidator = [
  body("full_name")
    .trim()
    .notEmpty()
    .withMessage("Full name is required.")
    .isLength({ min: 2, max: 100 })
    .withMessage("Full name must be between 2 and 100 characters."),

  body("mobile")
    .trim()
    .notEmpty()
    .withMessage("Mobile number is required.")
    .matches(/^[0-9+ ]{10,15}$/)
    .withMessage("Invalid mobile number format."),

  body("email")
    .optional({ nullable: true, checkFalsy: true })
    .isEmail()
    .withMessage("Invalid email address.")
    .normalizeEmail(),

  body("interested_course")
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 150 }),

  body("preferred_centre")
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 150 }),

  body("campaign_id")
    .optional({ nullable: true, checkFalsy: true }),

  body("source")
    .optional({ nullable: true, checkFalsy: true })
    .trim(),

  body("platform")
    .optional({ nullable: true, checkFalsy: true })
    .trim(),

  body("utm_source")
    .optional()
    .trim()
    .isLength({ max: 100 }),

  body("utm_medium")
    .optional()
    .trim()
    .isLength({ max: 100 }),

  body("utm_campaign")
    .optional()
    .trim()
    .isLength({ max: 150 }),

  body("utm_content")
    .optional()
    .trim()
    .isLength({ max: 150 }),

  body("utm_term")
    .optional()
    .trim()
    .isLength({ max: 150 }),

  body("external_lead_id")
    .optional()
    .trim()
    .isLength({ max: 255 }),
];