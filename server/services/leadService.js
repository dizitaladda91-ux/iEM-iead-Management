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

