import pool from "../config/db.js";
import ApiError from "../utils/ApiError.js";
import auditLogger from "../utils/auditLogger.js";
import {
  getAllAdmissionsRepository,
  getAdmissionsCountRepository,
  getCounsellorAdmissionsRepository,
  getAdmissionStatsRepository,
  findAdmissionByIdRepository,
  createAdmissionRepository,
  updateAdmissionFeeRepository,
  addPaymentTransactionRepository,
  getAdmissionPaymentsRepository,
} from "../repositories/admissionRepository.js";

/**
 * Get all admissions (Admin)
 */
export const getAllAdmissionsService = async (queryParams) => {
  const page = parseInt(queryParams.page, 10) || 1;
  const limit = parseInt(queryParams.limit, 10) || 10;
  const search = queryParams.search || "";
  const centre = queryParams.centre || null;
  const course = queryParams.course || null;
  const feeStatus = queryParams.feeStatus || null;
  const counsellorId = queryParams.counsellorId ? parseInt(queryParams.counsellorId, 10) : null;
  const isOverdue = queryParams.isOverdue === "true";

  const admissions = await getAllAdmissionsRepository({
    page,
    limit,
    search,
    centre,
    course,
    feeStatus,
    counsellorId,
    isOverdue,
  });

  const totalRecords = await getAdmissionsCountRepository({
    search,
    centre,
    course,
    feeStatus,
    counsellorId,
    isOverdue,
  });

  return {
    admissions,
    pagination: {
      page,
      limit,
      totalRecords,
      totalPages: Math.ceil(totalRecords / limit) || 1,
    },
  };
};

/**
 * Get counsellor's own admissions
 */
export const getCounsellorAdmissionsService = async (currentUser, search = "") => {
  const client = await pool.connect();
  let employeeId = null;
  try {
    // Find employee ID from user ID
    const { rows } = await client.query("SELECT id FROM employees WHERE user_id = $1 AND is_deleted = FALSE;", [currentUser.id]);
    if (rows.length > 0) {
      employeeId = rows[0].id;
    }
  } finally {
    client.release();
  }

  if (!employeeId && currentUser.role !== "ADMIN") {
    return { admissions: [] };
  }

  const admissions = employeeId 
    ? await getCounsellorAdmissionsRepository(employeeId, search)
    : await getAllAdmissionsRepository({ page: 1, limit: 100, search });

  return { admissions };
};

/**
 * Get Admission Stats
 */
export const getAdmissionStatsService = async (currentUser) => {
  let counsellorId = null;
  if (currentUser.role === "COUNSELLOR") {
    const client = await pool.connect();
    try {
      const { rows } = await client.query("SELECT id FROM employees WHERE user_id = $1;", [currentUser.id]);
      if (rows.length > 0) counsellorId = rows[0].id;
    } finally {
      client.release();
    }
  }

  return await getAdmissionStatsRepository(counsellorId);
};

/**
 * Get single admission with full payment history
 */
export const getAdmissionDetailsService = async (id) => {
  const admission = await findAdmissionByIdRepository(id);
  if (!admission) {
    throw new ApiError(404, "Admission record not found.");
  }

  const payments = await getAdmissionPaymentsRepository(id);
  return {
    ...admission,
    payments,
  };
};

/**
 * Create new admission
 */
export const createAdmissionService = async (data, currentUser, req) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const admission = await createAdmissionRepository(client, {
      ...data,
      created_by: currentUser.id,
    });

    // If initial token fee is paid, add payment transaction
    if (Number(data.paid_fee) > 0) {
      await addPaymentTransactionRepository(client, {
        admission_id: admission.id,
        amount: data.paid_fee,
        payment_mode: data.payment_mode || "UPI",
        receipt_number: data.receipt_number || `REC-${new Date().getFullYear()}-${admission.id}`,
        payment_date: data.payment_date || new Date().toISOString().slice(0, 10),
        remarks: data.remarks || "Initial Admission Token Fee",
        recorded_by: currentUser.id,
      });
    }

    auditLogger({
      action: "ADMISSION_CREATED",
      module: "ADMISSION",
      userId: currentUser.id,
      role: currentUser.role,
      entityId: admission.id,
      requestId: req?.requestId,
      ip: req?.ip,
    });

    await client.query("COMMIT");
    return admission;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

/**
 * Record fee installment payment (Counsellor / Admin)
 */
export const addAdmissionPaymentService = async (admissionId, paymentData, currentUser, req) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const admission = await findAdmissionByIdRepository(admissionId);
    if (!admission) {
      throw new ApiError(404, "Admission record not found.");
    }

    const payAmount = Number(paymentData.amount);
    if (isNaN(payAmount) || payAmount <= 0) {
      throw new ApiError(400, "Payment amount must be greater than zero.");
    }

    const currentPaid = Number(admission.paid_fee || 0);
    const totalFee = Number(admission.total_fee || 0);
    const newPaid = currentPaid + payAmount;
    const newPending = Math.max(0, totalFee - newPaid);

    let newStatus = "PARTIAL";
    if (newPending === 0) {
      newStatus = "FULLY_PAID";
    } else if (paymentData.next_due_date && new Date(paymentData.next_due_date) < new Date()) {
      newStatus = "OVERDUE";
    }

    // 1. Add payment transaction
    const payment = await addPaymentTransactionRepository(client, {
      admission_id: admissionId,
      amount: payAmount,
      payment_mode: paymentData.payment_mode || "UPI",
      receipt_number: paymentData.receipt_number || `REC-${Date.now().toString().slice(-6)}`,
      payment_date: paymentData.payment_date || new Date().toISOString().slice(0, 10),
      remarks: paymentData.remarks || "Installment fee payment",
      recorded_by: currentUser.id,
    });

    // 2. Update admission balance
    const updatedAdmission = await updateAdmissionFeeRepository(client, admissionId, {
      paidFee: newPaid,
      pendingFee: newPending,
      feeStatus: newStatus,
      nextDueDate: newPending > 0 ? (paymentData.next_due_date || admission.next_due_date) : null,
      remarks: paymentData.remarks || admission.remarks,
    });

    auditLogger({
      action: "ADMISSION_PAYMENT_COLLECTED",
      module: "ADMISSION",
      userId: currentUser.id,
      role: currentUser.role,
      entityId: admissionId,
      details: { amount: payAmount, receipt: payment.receipt_number, newPending },
      requestId: req?.requestId,
      ip: req?.ip,
    });

    await client.query("COMMIT");

    return {
      payment,
      admission: updatedAdmission,
    };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

/**
 * Generate formatted WhatsApp Reminder message & link
 */
export const getWhatsAppReminderDetailsService = async (admissionId) => {
  const admission = await findAdmissionByIdRepository(admissionId);
  if (!admission) {
    throw new ApiError(404, "Admission record not found.");
  }

  const cleanMobile = String(admission.mobile || "").replace(/[^0-9]/g, "");
  const formattedMobile = cleanMobile.length === 10 ? `91${cleanMobile}` : cleanMobile;

  const dueDateStr = admission.next_due_date 
    ? new Date(admission.next_due_date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
    : "at the earliest";

  const message = `Dear ${admission.student_name},\n\nThis is a gentle reminder from Institute of Event Management (IEM) regarding your admission in *${admission.course_name}*.\n\n?? *Pending Balance Amount:* ?${Number(admission.pending_fee || 0).toLocaleString("en-IN")}\n?? *Due Date:* ${dueDateStr}\n\nKindly clear the remaining installment on or before the due date to avoid any late processing.\n\nFor any query, contact your admission coordinator.\n\nWarm regards,\n*IEM Admissions Team*`;

  const whatsappUrl = `https://wa.me/${formattedMobile}?text=${encodeURIComponent(message)}`;

  return {
    student_name: admission.student_name,
    mobile: admission.mobile,
    pending_fee: admission.pending_fee,
    next_due_date: admission.next_due_date,
    message,
    whatsappUrl,
  };
};
