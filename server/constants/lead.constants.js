/**
 * ==========================================
 * Lead Module Constants
 * ==========================================
 */

export const LEAD_STATUS = Object.freeze({
  NEW: "NEW",
  INTERESTED: "INTERESTED",
  FOLLOW_UP: "FOLLOW_UP",
  VISITED: "VISITED",
  ENROLLED: "ENROLLED",
  NOT_INTERESTED: "NOT_INTERESTED",
  ADMISSION_DONE: "ENROLLED",
  CONTACTED: "CONTACTED",
  LOST: "NOT_INTERESTED",
});

export const LEAD_SOURCE = Object.freeze({
  META_ADS: "meta_ads",
  GOOGLE_ADS: "google_ads",
  WEBSITE: "website",
  WALK_IN: "walk_in",
  REFERRAL: "referral",
  PHONE_CALL: "phone_call",
  OTHER: "other",
});

export const LEAD_PRIORITY = Object.freeze({
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
});

export const ASSIGNMENT_TYPE = Object.freeze({
  NEW_ASSIGNMENT: "new_assignment",
  REASSIGNMENT: "reassignment",
  AUTO_ASSIGNMENT: "auto_assignment",
});