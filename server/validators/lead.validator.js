import { body, param } from "express-validator";

export const createLeadValidator = [

body("alternate_mobile")
  .optional()
  .trim()
  .isLength({ min: 10, max: 15 })
  .withMessage("Alternate mobile is invalid."),

body("country")
  .optional()
  .trim()
  .isLength({ max: 100 }),

body("state")
  .optional()
  .trim()
  .isLength({ max: 100 }),

body("city")
  .optional()
  .trim()
  .isLength({ max: 100 }),

body("interested_course")
  .optional()
  .trim()
  .isLength({ max: 150 }),

body("source")
  .optional()
  .trim()
  .isLength({ max: 150 }),

body("preferred_centre")
  .optional()
  .trim()
  .isLength({ max: 150 }),

body("platform")
  .optional()
  .isIn([
    "GOOGLE",
    "META",
    "WEBSITE",
    "WHATSAPP",
    "IMPORT",
    "MANUAL",
  ])
  .withMessage("Invalid platform."),

body("landing_page_url")
  .optional()
  .isURL()
  .withMessage("Invalid landing page URL."),

body("utm_source")
  .optional()
  .trim()
  .isLength({ max: 150 }),

body("utm_medium")
  .optional()
  .trim()
  .isLength({ max: 150 }),

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

body("captured_at")
  .optional()
  .isISO8601()
  .withMessage("Invalid captured date."),

    

];

export const updateLeadValidator = [
  body("full_name").optional().trim(),
  body("mobile").optional().trim(),
  body("alternate_mobile").optional().trim(),
  body("email").optional().trim(),
  body("country").optional().trim(),
  body("state").optional().trim(),
  body("city").optional().trim(),
  body("interested_course").optional().trim(),
  body("preferred_centre").optional().trim(),
  body("platform").optional().trim(),
  body("landing_page_url").optional().trim(),
  body("utm_source").optional().trim(),
  body("utm_medium").optional().trim(),
  body("utm_campaign").optional().trim(),
  body("utm_content").optional().trim(),
  body("utm_term").optional().trim(),
  body("external_lead_id").optional().trim(),
  body("captured_at").optional(),
  body("priority").optional().trim(),
  body("status").optional().trim(),
  body("remarks").optional().trim(),
  body("feedback").optional(),
  body("academic_info").optional(),
  body("next_followup").optional(),
];

export const updateLeadStatusValidator = [

  param("id")
    .isInt()
    .withMessage("Invalid lead id."),

  body("status")
    .trim()
    .notEmpty()
    .withMessage("Status is required."),

  body("feedback")
    .optional()
    .trim()
    .isLength({ max: 5000 })
    .withMessage("Feedback cannot exceed 5000 characters."),
];

export const addLeadNoteValidator = [

  param("id")
    .isInt(),

  body("note")
    .trim()
    .notEmpty()
    .withMessage("Note is required.")
    .isLength({
      min: 3,
      max: 1000,
    }),

];

// =====================================================
// Bulk Lead Assignment Validator
// =====================================================

export const assignBulkLeadValidator = [

  body("lead_ids")
    .isArray({ min: 1 })
    .withMessage("At least one lead must be selected."),

  body("lead_ids.*")
    .isInt()
    .withMessage("Invalid lead id."),

  body("employee_id")
    .isInt()
    .withMessage("Employee is required."),

];

export const assignLeadValidator = [

  param("id")
    .isInt()
    .withMessage("Invalid lead id."),

  body("employee_id")
    .isInt()
    .withMessage("Employee id is required."),

];