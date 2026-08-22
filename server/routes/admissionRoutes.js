import express from "express";
import authenticate from "../middleware/authMiddleware.js";
import authorizeRoles from "../middleware/roleMiddleware.js";
import validate from "../middleware/validate.js";
import { ROLES } from "../config/roles.js";
import {
  createAdmissionValidator,
  addPaymentValidator,
} from "../validators/admission.validator.js";
import {
  getAllAdmissions,
  getMyAdmissions,
  getAdmissionStats,
  getAdmissionDetails,
  createAdmission,
  addAdmissionPayment,
  getWhatsAppReminder,
} from "../controllers/admissionController.js";

const router = express.Router();

// Protect all admission routes
router.use(authenticate);

// 1. Stats overview
router.get("/stats", getAdmissionStats);

// 2. Counsellor's own admissions
router.get("/my-admissions", getMyAdmissions);

// 3. WhatsApp reminder link generator
router.get("/:id/whatsapp-reminder", getWhatsAppReminder);

// 4. Single admission ledger details
router.get("/:id", getAdmissionDetails);

// 5. Add fee payment / installment (Counsellor & Admin)
router.post("/:id/payments", addPaymentValidator, validate, addAdmissionPayment);

// 6. Admin get all admissions
router.get("/", authorizeRoles(ROLES.ADMIN, ROLES.COUNSELLOR), getAllAdmissions);

// 7. Create new admission
router.post("/", createAdmissionValidator, validate, createAdmission);

export default router;
