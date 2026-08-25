import pool from "../config/db.js";
import ApiError from "../utils/ApiError.js";
import auditLogger from "../utils/auditLogger.js";

import {
  getNextLeadCodeRepository,
  createLeadRepository,
  findLeadByEmailRepository,
  findLeadByMobileRepository,
  findLeadByIdRepository,
  getLeadsRepository,
  updateLeadRepository,
  deleteLeadRepository,
  restoreLeadRepository,
} from "../repositories/leadRepository.js";

import {
  getLeadStatisticsRepository,
  assignLeadRepository,
  updateLeadStatusRepository,
  assignBulkLeadsRepository,
} from "../repositories/leadRepository.js";

import {
  findEmployeeByIdRepository,
} from "../repositories/employeeRepository.js";

import {
  addLeadNoteRepository,
  getLeadNotesRepository,
  addLeadTimelineRepository,
  getLeadTimelineRepository,
} from "../repositories/leadRepository.js";

import {
  addTimelineEventService,
} from "../services/leadTimeline.service.js";

import TIMELINE_ACTIVITY from "../constants/timelineActivity.js";

/**
 * =====================================================
 * Create Lead
 * =====================================================
 */

export const createLeadService = async (
  leadData,
  currentUser,
  req
) => {

  const client = await pool.connect();

  try {

    await client.query("BEGIN");

    /* Duplicate Email */

    if (leadData.email) {

      const existingEmail =
        await findLeadByEmailRepository(
          leadData.email
        );

      if (existingEmail) {

        throw new ApiError(
          409,
          "Lead email already exists."
        );

      }

    }

    /* Duplicate Mobile */

    const existingMobile =
      await findLeadByMobileRepository(
        leadData.mobile
      );

    if (existingMobile) {

      throw new ApiError(
        409,
        "Lead mobile already exists."
      );

    }

    /* Generate Lead Code */

    const sequence =
      await getNextLeadCodeRepository(client);

    const leadCode =
      `${process.env.LEAD_CODE_PREFIX || "LEAD"}${String(sequence).padStart(6, "0")}`;

    /* Create Lead */

    const lead =
      await createLeadRepository(
        client,
        {

          ...leadData,

          lead_code: leadCode,

          created_by: currentUser.id,

        }
      );

       await addTimelineEventService({
  leadId: lead.id,
  employeeId: lead.assigned_to || null,
  activityType: TIMELINE_ACTIVITY.LEAD_CREATED,
  title: "Lead Created",
  description: `Lead ${lead.full_name} created successfully.`,
  dbClient: client,
});


    auditLogger({

      action: "LEAD_CREATED",

      module: "LEAD",

      userId: currentUser.id,

      role: currentUser.role,

      entityId: lead.id,

      requestId: req.requestId,

      ip: req.ip,

    });

    await client.query("COMMIT");

    return lead;

  } catch (error) {

    await client.query("ROLLBACK");

    throw error;

  } finally {

    client.release();

  }

 
};

/**
 * =====================================================
 * Get All Leads
 * =====================================================
 */

export const getAllLeadsService = async (
  filters
) => {

  return await getLeadsRepository(
    filters
  );

};

/**
 * =====================================================
 * Get Lead By ID
 * =====================================================
 */

export const getLeadByIdService = async (
  id
) => {

  const lead =
    await findLeadByIdRepository(id);

  if (!lead) {

    throw new ApiError(
      404,
      "Lead not found."
    );

  }

  return lead;

};

/**
 * =====================================================
 * Update Lead
 * =====================================================
 */

export const updateLeadService = async (
  id,
  leadData,
  currentUser,
  req
) => {

  const client = await pool.connect();

  try {

    await client.query("BEGIN");

    const lead =
      await findLeadByIdRepository(id);

    if (!lead) {

      throw new ApiError(
        404,
        "Lead not found."
      );

    }

    /* Duplicate Email */

    if (
      leadData.email &&
      leadData.email !== lead.email
    ) {

      const existingEmail =
        await findLeadByEmailRepository(
          leadData.email
        );

      if (existingEmail) {

        throw new ApiError(
          409,
          "Lead email already exists."
        );

      }

    }

    /* Duplicate Mobile */

    if (
      leadData.mobile &&
      leadData.mobile !== lead.mobile
    ) {

      const existingMobile =
        await findLeadByMobileRepository(
          leadData.mobile
        );

      if (existingMobile) {

        throw new ApiError(
          409,
          "Lead mobile already exists."
        );

      }

    }

    const updatedLead =
      await updateLeadRepository(
        client,
        id,
        {
          ...lead,
          ...leadData,
          updated_by: currentUser.id,
        }
      );

    // 1. Auto-sync Timeline Activity
    if (leadData.status && leadData.status !== lead.status) {
      await addTimelineEventService({
        leadId: id,
        employeeId: updatedLead.assigned_to || null,
        activityType: TIMELINE_ACTIVITY.STATUS_CHANGED,
        title: `Status Changed to ${updatedLead.status}`,
        description: leadData.remarks || `Status updated from ${lead.status} to ${updatedLead.status}.`,
        dbClient: client,
      });
    }

    let feedbackObj = {};
    try {
      const raw = updatedLead.feedback;
      if (typeof raw === "string") {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
          feedbackObj = parsed;
        }
      } else if (raw && typeof raw === "object" && !Array.isArray(raw)) {
        feedbackObj = raw;
      }
    } catch {}

    if (!feedbackObj || typeof feedbackObj !== "object" || Array.isArray(feedbackObj)) {
      feedbackObj = {};
    }

    // 2. Auto-sync to Admissions Ledger if Enrolled
    if (["ENROLLED", "ADMISSION_DONE", "ADMITTED"].includes(updatedLead.status)) {
      const totalFee = Number(feedbackObj.total_fee || feedbackObj.fee_paid || 0);
      const paidFee = Number(feedbackObj.fee_paid || 0);
      const pendingFee = Math.max(0, totalFee - paidFee);
      const feeStatus = pendingFee === 0 && totalFee > 0 ? "FULLY_PAID" : "PARTIAL";

      const { rows: admRows } = await client.query("SELECT id FROM admissions WHERE lead_id = $1;", [updatedLead.id]);
      if (admRows.length === 0) {
        const { rows: newAdm } = await client.query(`
          INSERT INTO admissions (
            lead_id, student_name, mobile, email, course_name, centre,
            total_fee, paid_fee, pending_fee, fee_status, next_due_date,
            assigned_counsellor_id, created_by, remarks
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
          RETURNING id;
        `, [
          updatedLead.id,
          updatedLead.full_name,
          updatedLead.mobile,
          updatedLead.email,
          feedbackObj.course_enrolled || updatedLead.interested_course || "Enrolled Course",
          feedbackObj.preferred_campus || updatedLead.preferred_centre || "Main Campus",
          totalFee,
          paidFee,
          pendingFee,
          feeStatus,
          feedbackObj.next_due_date || null,
          updatedLead.assigned_to,
          currentUser.id,
          updatedLead.remarks || "Auto-enrolled from Lead status update"
        ]);

        // Record initial payment ledger entry if token fee paid
        if (paidFee > 0 && newAdm.length > 0) {
          await client.query(`
            INSERT INTO admission_payments (
              admission_id, amount, payment_mode, receipt_number, payment_date, remarks, recorded_by
            ) VALUES ($1, $2, 'INITIAL_PAYMENT', $3, CURRENT_DATE, 'Initial Token / Admission Fee', $4);
          `, [
            newAdm[0].id,
            paidFee,
            feedbackObj.receipt_number || `REC-${Date.now().toString().slice(-6)}`,
            currentUser.id
          ]);
        }
      } else {
        // Update existing admission record
        await client.query(`
          UPDATE admissions
          SET
            student_name = $1,
            mobile = $2,
            email = $3,
            course_name = $4,
            centre = $5,
            total_fee = CASE WHEN $6 > 0 THEN $6 ELSE total_fee END,
            paid_fee = CASE WHEN $7 > 0 THEN $7 ELSE paid_fee END,
            pending_fee = CASE WHEN $6 > 0 THEN GREATEST(0, $6 - CASE WHEN $7 > 0 THEN $7 ELSE paid_fee END) ELSE pending_fee END,
            fee_status = CASE 
              WHEN $6 > 0 AND ($6 - CASE WHEN $7 > 0 THEN $7 ELSE paid_fee END) <= 0 THEN 'FULLY_PAID'
              ELSE fee_status
            END,
            next_due_date = COALESCE($8, next_due_date),
            assigned_counsellor_id = COALESCE($9, assigned_counsellor_id),
            updated_at = CURRENT_TIMESTAMP
          WHERE id = $10;
        `, [
          updatedLead.full_name,
          updatedLead.mobile,
          updatedLead.email,
          feedbackObj.course_enrolled || updatedLead.interested_course || "Enrolled Course",
          feedbackObj.preferred_campus || updatedLead.preferred_centre || "Main Campus",
          totalFee,
          paidFee,
          feedbackObj.next_due_date || null,
          updatedLead.assigned_to,
          admRows[0].id
        ]);
      }

      // Automatically complete any pending followups for this enrolled student
      await client.query(`
        UPDATE lead_followups
        SET status = 'COMPLETED', outcome = 'ADMISSION_CONFIRMED', remarks = 'Enrolled into course', updated_at = CURRENT_TIMESTAMP
        WHERE lead_id = $1 AND status = 'PENDING' AND is_deleted = FALSE;
      `, [updatedLead.id]);
    }

    // 3. Auto-sync to Follow-ups Schedule if Followup Date Scheduled or Followup status
    if (updatedLead.next_followup || ["FOLLOW_UP", "FOLLOW_UP_REQUIRED"].includes(updatedLead.status)) {
      const nextDate = updatedLead.next_followup || new Date(Date.now() + 86400000);
      
      let empId = updatedLead.assigned_to;
      if (!empId) {
        const { rows: myEmp } = await client.query("SELECT id FROM employees WHERE user_id = $1;", [currentUser.id]);
        if (myEmp.length > 0) empId = myEmp[0].id;
      }

      if (empId) {
        const { rows: existingFu } = await client.query(
          "SELECT id FROM lead_followups WHERE lead_id = $1 AND status = 'PENDING' AND is_deleted = FALSE;",
          [updatedLead.id]
        );

        if (existingFu.length > 0) {
          await client.query(`
            UPDATE lead_followups
            SET next_followup_at = $1,
                followup_type = $2,
                priority = $3,
                remarks = $4,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $5;
          `, [
            nextDate,
            feedbackObj.followup_mode || "CALL",
            updatedLead.priority || "MEDIUM",
            updatedLead.remarks || "Follow-up rescheduled",
            existingFu[0].id
          ]);
        } else {
          await client.query(`
            INSERT INTO lead_followups (
              lead_id, employee_id, followup_type, status, priority, next_followup_at, remarks, created_by
            ) VALUES ($1, $2, $3, 'PENDING', $4, $5, $6, $7);
          `, [
            updatedLead.id,
            empId,
            feedbackObj.followup_mode || "CALL",
            updatedLead.priority || "MEDIUM",
            nextDate,
            updatedLead.remarks || "Scheduled from Lead Details",
            currentUser.id
          ]);
        }
      }
    }

    auditLogger({
      action: "LEAD_UPDATED",
      module: "LEAD",
      userId: currentUser.id,
      role: currentUser.role,
      entityId: id,
      requestId: req.requestId,
      ip: req.ip,
    });

    await client.query("COMMIT");

    return updatedLead;

  } catch (error) {

    await client.query("ROLLBACK");

    throw error;

  } finally {

    client.release();

  }

};

/**
 * =====================================================
 * Soft Delete Lead
 * =====================================================
 */

export const deleteLeadService = async (
  id,
  currentUser,
  req
) => {

  const client = await pool.connect();

  try {

    await client.query("BEGIN");

    const lead =
      await findLeadByIdRepository(id);

    if (!lead) {

      throw new ApiError(
        404,
        "Lead not found."
      );

    }

    const deletedLead =
      await deleteLeadRepository(
        client,
        id,
        currentUser.id
      );

    auditLogger({

      action: "LEAD_DELETED",

      module: "LEAD",

      userId: currentUser.id,

      role: currentUser.role,

      entityId: id,

      requestId: req.requestId,

      ip: req.ip,

    });

    await client.query("COMMIT");

    return deletedLead;

  } catch (error) {

    await client.query("ROLLBACK");

    throw error;

  } finally {

    client.release();

  }

};

/**
 * =====================================================
 * Restore Lead
 * =====================================================
 */

export const restoreLeadService = async (
  id,
  currentUser,
  req
) => {

  const client = await pool.connect();

  try {

    await client.query("BEGIN");

    const restoredLead =
      await restoreLeadRepository(
        client,
        id,
        currentUser.id
      );

    if (!restoredLead) {

      throw new ApiError(
        404,
        "Lead not found."
      );

    }

    auditLogger({

      action: "LEAD_RESTORED",

      module: "LEAD",

      userId: currentUser.id,

      role: currentUser.role,

      entityId: id,

      requestId: req.requestId,

      ip: req.ip,

    });

    await client.query("COMMIT");

    return restoredLead;

  } catch (error) {

    await client.query("ROLLBACK");

    throw error;

  } finally {

    client.release();

  }

};

/**
 * =====================================================
 * Lead Statistics
 * =====================================================
 */

export const getLeadStatisticsService = async () => {

  return await getLeadStatisticsRepository();

};

/**
 * =====================================================
 * Assign Lead
 * =====================================================
 */

export const assignLeadService = async (
  leadId,
  employeeId,
  currentUser,
  req
) => {

  const client = await pool.connect();

  try {

    await client.query("BEGIN");

    const lead =
      await findLeadByIdRepository(leadId);

    if (!lead) {

      throw new ApiError(
        404,
        "Lead not found."
      );

    }

    const employee =
      await findEmployeeByIdRepository(employeeId);

    if (!employee) {

      throw new ApiError(
        404,
        "Employee not found."
      );

    }

    const updatedLead =
      await assignLeadRepository(

        client,

        leadId,

        employeeId,

        currentUser.id

      );


      await addTimelineEventService({
  leadId,
  employeeId,
  activityType: TIMELINE_ACTIVITY.LEAD_ASSIGNED,
  title: "Lead Assigned",
  description: `Lead assigned to ${employee.full_name}.`,
});

    auditLogger({

      action: "LEAD_ASSIGNED",

      module: "LEAD",

      userId: currentUser.id,

      role: currentUser.role,

      entityId: leadId,

      requestId: req.requestId,

      ip: req.ip,

    });

    await client.query("COMMIT");

    return updatedLead;

  } catch (error) {

    await client.query("ROLLBACK");

    throw error;

  } finally {

    client.release();

  }

};

/**
 * =====================================================
 * Update Lead Status
 * =====================================================
 */

export const updateLeadStatusService = async (
  leadId,
  status,
  feedback,
  currentUser,
  req
) => {

  const client = await pool.connect();

  try {

    await client.query("BEGIN");

    const lead =
      await findLeadByIdRepository(leadId);

    if (!lead) {

      throw new ApiError(
        404,
        "Lead not found."
      );

    }

    if (
  status === "REJECTED" &&
  (!feedback || !feedback.trim())
) {
  throw new ApiError(
    400,
    "Feedback is required when rejecting a lead."
  );
}

    const updatedLead =
  await updateLeadStatusRepository(
    client,
    leadId,
    status,
    feedback,
    currentUser.id
  );

      await addTimelineEventService({
  leadId,
  employeeId: lead.assigned_to,
  activityType: TIMELINE_ACTIVITY.STATUS_CHANGED,
  title: "Lead Status Updated",
  description:
  status === "REJECTED"
    ? `Lead rejected. Reason: ${feedback}`
    : `Status changed from ${lead.status} to ${status}.`,
  oldValue: lead.status,
  newValue: status,
});

    auditLogger({

      action: "LEAD_STATUS_UPDATED",

      module: "LEAD",

      userId: currentUser.id,

      role: currentUser.role,

      entityId: leadId,

      requestId: req.requestId,

      ip: req.ip,

    });

    await client.query("COMMIT");

    return updatedLead;

  } catch (error) {

    await client.query("ROLLBACK");

    throw error;

  } finally {

    client.release();

  }

};

/**
 * =====================================================
 * Add Lead Note
 * =====================================================
 */

export const addLeadNoteService = async (
  leadId,
  note,
  currentUser,
  req
) => {

  const client = await pool.connect();

  try {

    await client.query("BEGIN");

    const lead =
      await findLeadByIdRepository(leadId);

    if (!lead) {

      throw new ApiError(
        404,
        "Lead not found."
      );

    }

    const newNote =
      await addLeadNoteRepository(

        client,

        leadId,

        note,

        currentUser.id

      );

    await addTimelineEventService({
  leadId,
  employeeId: currentUser.id,
  activityType: TIMELINE_ACTIVITY.NOTE_ADDED,
  title: "Lead Note Added",
  description: note,
});

    auditLogger({

      action: "LEAD_NOTE_ADDED",

      module: "LEAD",

      userId: currentUser.id,

      role: currentUser.role,

      entityId: leadId,

      requestId: req.requestId,

      ip: req.ip,

    });

    await client.query("COMMIT");

    return newNote;

  } catch (error) {

    await client.query("ROLLBACK");

    throw error;

  } finally {

    client.release();

  }

};

/**
 * =====================================================
 * Get Lead Notes
 * =====================================================
 */

export const getLeadNotesService = async (
  leadId
) => {

  const lead =
    await findLeadByIdRepository(leadId);

  if (!lead) {

    throw new ApiError(
      404,
      "Lead not found."
    );

  }

  return await getLeadNotesRepository(
    leadId
  );

};

/**
 * =====================================================
 * Get Lead Timeline
 * =====================================================
 */

export const getLeadTimelineService = async (
  leadId
) => {

  const lead =
    await findLeadByIdRepository(
      leadId
    );

  if (!lead) {

    throw new ApiError(
      404,
      "Lead not found."
    );

  }

  return await getLeadTimelineRepository(
    leadId
  );

};

// =====================================================
// Bulk Assign Leads Service
// =====================================================

export const assignBulkLeadsService = async (

  payload,

  currentUser

) => {

  const client = await pool.connect();

  try {

    await client.query("BEGIN");

    const {

      lead_ids,

      employee_id,

    } = payload;

    const result = await assignBulkLeadsRepository(

      client,

      {

        lead_ids,

        employee_id,

        updated_by: currentUser.id,

      }

    );

    await client.query("COMMIT");

    return result;

  } catch (error) {

    await client.query("ROLLBACK");

    throw error;

  } finally {

    client.release();

  }

};

