import express from "express";
import cors from "cors";
import validate from "../middleware/validate.js";

import {
  capturePublicLeadValidator,
} from "../validators/leadCapture.validator.js";

import {
  capturePublicLead,
} from "../controllers/leadCaptureController.js";

const router = express.Router();

// Allow public submissions from any website / landing page without CORS blocking
router.use(cors({ origin: true, credentials: true }));

/**
 * Middleware to normalize common form field aliases
 * (e.g. fullName -> full_name, phoneNumber -> mobile, course -> interested_course, centre -> preferred_centre)
 */
const normalizePublicLeadPayload = (req, res, next) => {
  if (req.body) {
    if (!req.body.full_name && req.body.fullName) {
      req.body.full_name = req.body.fullName;
    }
    if (!req.body.mobile && (req.body.phoneNumber || req.body.phone)) {
      req.body.mobile = req.body.phoneNumber || req.body.phone;
    }
    if (!req.body.interested_course && (req.body.course || req.body.course_name)) {
      req.body.interested_course = req.body.course || req.body.course_name;
    }
    if (!req.body.preferred_centre && (req.body.centre || req.body.center)) {
      req.body.preferred_centre = req.body.centre || req.body.center;
    }
    if (!req.body.source) {
      req.body.source = "Website";
    }
  }
  next();
};

/**
 * =====================================================
 * Public Lead Capture Endpoint
 * POST /api/public/leads
 * =====================================================
 */
router.post(
  "/leads",
  normalizePublicLeadPayload,
  capturePublicLeadValidator,
  validate,
  capturePublicLead
);

export default router;