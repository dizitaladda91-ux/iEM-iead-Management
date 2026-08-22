import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import {
  getAllAdmissionsService,
  getCounsellorAdmissionsService,
  getAdmissionStatsService,
  getAdmissionDetailsService,
  createAdmissionService,
  addAdmissionPaymentService,
  getWhatsAppReminderDetailsService,
} from "../services/admissionService.js";

/**
 * Get all admissions (Admin / All)
 */
export const getAllAdmissions = asyncHandler(async (req, res) => {
  const result = await getAllAdmissionsService(req.query);
  return res.status(200).json(new ApiResponse(200, result, "Admissions fetched successfully."));
});

/**
 * Get counsellor's own admissions
 */
export const getMyAdmissions = asyncHandler(async (req, res) => {
  const search = req.query.search || "";
  const result = await getCounsellorAdmissionsService(req.user, search);
  return res.status(200).json(new ApiResponse(200, result, "My admissions fetched successfully."));
});

/**
 * Get Admission & Fee Stats
 */
export const getAdmissionStats = asyncHandler(async (req, res) => {
  const stats = await getAdmissionStatsService(req.user);
  return res.status(200).json(new ApiResponse(200, stats, "Admission stats fetched successfully."));
});

/**
 * Get Single Admission with Payment Ledger
 */
export const getAdmissionDetails = asyncHandler(async (req, res) => {
  const admission = await getAdmissionDetailsService(req.params.id);
  return res.status(200).json(new ApiResponse(200, admission, "Admission details fetched successfully."));
});

/**
 * Create New Admission
 */
export const createAdmission = asyncHandler(async (req, res) => {
  const admission = await createAdmissionService(req.body, req.user, req);
  return res.status(201).json(new ApiResponse(201, admission, "Admission created successfully."));
});

/**
 * Add Payment Installment (Counsellor / Admin)
 */
export const addAdmissionPayment = asyncHandler(async (req, res) => {
  const result = await addAdmissionPaymentService(req.params.id, req.body, req.user, req);
  return res.status(200).json(new ApiResponse(200, result, "Payment collected and balance updated successfully."));
});

/**
 * Generate WhatsApp Reminder Link
 */
export const getWhatsAppReminder = asyncHandler(async (req, res) => {
  const reminder = await getWhatsAppReminderDetailsService(req.params.id);
  return res.status(200).json(new ApiResponse(200, reminder, "WhatsApp reminder generated successfully."));
});
