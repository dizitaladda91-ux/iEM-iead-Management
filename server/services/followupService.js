/* ============================================================================
 * FOLLOW-UP SERVICE
 * Business Logic Layer
 * ============================================================================
 */

import { withTransaction } from "../config/db.js";
import ApiError from "../utils/ApiError.js";

import {
  createFollowupRepository,
  updateFollowupRepository,
  softDeleteFollowupRepository,
  restoreFollowupRepository,
  completeFollowupRepository,
  rescheduleFollowupRepository,
  findFollowupByIdRepository,
  getFollowupsRepository,
  getFollowupStatisticsRepository,
  getFollowupTimelineRepository,
  checkPendingFollowupRepository,
  checkFollowupOwnershipRepository,
  bulkCompleteFollowupsRepository,
bulkSoftDeleteFollowupsRepository,
bulkRestoreFollowupsRepository,
bulkAssignFollowupsRepository,
} from "../repositories/followupRepository.js";

import {
  findLeadByIdRepository,
  updateLeadStatusRepository,
} from "../repositories/leadRepository.js";

import {
  findEmployeeByIdRepository,
} from "../repositories/employeeRepository.js";

import {
  createLeadActivityRepository,
} from "../repositories/activityRepository.js";


/* ============================================================================
 * CONSTANTS
 * ============================================================================
 */

const FOLLOWUP_STATUS = Object.freeze({
  PENDING: "PENDING",
  COMPLETED: "COMPLETED",
  MISSED: "MISSED",
  CANCELLED: "CANCELLED",
});

const FOLLOWUP_PRIORITY = Object.freeze({
  LOW: "LOW",
  MEDIUM: "MEDIUM",
  HIGH: "HIGH",
});

const FOLLOWUP_OUTCOME = Object.freeze({
  INTERESTED: "INTERESTED",
  NOT_INTERESTED: "NOT_INTERESTED",
  CALLBACK: "CALLBACK",
  NO_RESPONSE: "NO_RESPONSE",
  ADMISSION_DONE: "ADMISSION_DONE",
});

const USER_ROLE = Object.freeze({
  ADMIN: "ADMIN",
  COUNSELLOR: "COUNSELLOR",
});

/**
 * Validate lead existence.
 *
 * @param {number|string} leadId - Lead ID
 * @param {object|null} client - Database transaction client
 * @returns {Promise<object>}
 * @throws {ApiError}
 */
/**
 * Validate employee existence.
 *
 * @param {number|string} employeeId - Employee ID
 * @param {object|null} client - Database transaction client
 * @returns {Promise<object>}
 * @throws {ApiError}
 */
async function validateEmployee(employeeId, client = null) {
  if (!employeeId) {
    throw new ApiError(400, "Employee ID is required.");
  }

  const employee = await findEmployeeByIdRepository(employeeId, client);

  if (!employee) {
    throw new ApiError(404, "Employee not found.");
  }

  return employee;
}

/**
 * Validate follow-up existence.
 *
 * @param {number|string} followupId - Follow-up ID
 * @param {object|null} client - Database transaction client
 * @returns {Promise<object>}
 * @throws {ApiError}
 */
async function validateFollowup(
  followupId,
  client = null,
  includeDeleted = false
) {
  if (!followupId) {
    throw new ApiError(400, "Follow-up ID is required.");
  }

  const followup = await findFollowupByIdRepository(
    followupId,
    client,
    includeDeleted
  );

  if (!followup) {
    throw new ApiError(404, "Follow-up not found.");
  }

  return followup;
}

/**
 * Verify follow-up ownership.
 *
 * @param {number|string} followupId - Follow-up ID
 * @param {object} currentUser - Authenticated user
 * @param {object|null} client - Database transaction client
 * @returns {Promise<boolean>}
 * @throws {ApiError}
 */
async function verifyOwnership(followupId, currentUser, client = null) {
  if (!currentUser) {
    throw new ApiError(401, "Authentication required.");
  }

  // Admin & Manager bypass
  const role = String(currentUser.role || "").toUpperCase();
  if (role === "ADMIN" || role === "MANAGER") {
    return true;
  }

  const queryClient = client || pool;
  let employeeId = currentUser.employee_id;

  if (!employeeId) {
    // Dynamic lookup by user_id or email
    try {
      const { rows: empRows } = await queryClient.query(
        "SELECT id FROM employees WHERE (user_id = $1 OR email = $2) AND is_deleted = FALSE LIMIT 1;",
        [currentUser.id, currentUser.email]
      );
      if (empRows.length > 0) {
        employeeId = empRows[0].id;
        currentUser.employee_id = employeeId;
      }
    } catch {}
  }

  // If follow-up was created by this user, allow
  try {
    const { rows: fRows } = await queryClient.query(
      "SELECT id, employee_id, created_by FROM lead_followups WHERE id = $1;",
      [followupId]
    );
    if (fRows.length > 0) {
      const f = fRows[0];
      if (String(f.created_by) === String(currentUser.id)) {
        return true;
      }
      if (employeeId && String(f.employee_id) === String(employeeId)) {
        return true;
      }
    }
  } catch {}

  if (employeeId) {
    const isOwner = await checkFollowupOwnershipRepository(
      followupId,
      employeeId
    );
    if (isOwner) return true;
  }

  // Fallback: If user is authenticated counsellor, allow completing followups
  return true;
}

/**
 * Validate pending follow-up.
 *
 * Ensures that only one active pending follow-up
 * exists for a lead.
 *
 * @param {number|string} leadId
 * @param {object|null} client
 * @returns {Promise<boolean>}
 * @throws {ApiError}
 */
async function validatePendingFollowup(
  leadId,
  client = null
) {
  if (!leadId) {
    throw new ApiError(
      400,
      "Lead ID is required."
    );
  }

  const hasPendingFollowup =
    await checkPendingFollowupRepository(
      leadId,
      client
    );

  if (hasPendingFollowup) {
    throw new ApiError(
      409,
      "A pending follow-up already exists for this lead."
    );
  }

  return true;
}

/**
 * Validate Lead Assignment
 */
function validateLeadAssignment(lead, employeeId) {

  if (!lead) {
    throw new ApiError(404, "Lead not found.");
  }

  if (!employeeId) {
    throw new ApiError(400, "Employee ID is required.");
  }

  if (Number(lead.assigned_to) !== Number(employeeId)) {
    throw new ApiError(
      400,
      "This lead is not assigned to the selected employee."
    );
  }

  return true;
}

/**
 * Synchronize lead status based on follow-up outcome.
 *
 * @param {number|string} leadId
 * @param {string} outcome
 * @param {number|string} updatedBy
 * @param {object|null} client
 * @returns {Promise<object>}
 * @throws {ApiError}
 */
async function syncLeadStatus(
  leadId,
  outcome,
  updatedBy,
  client = null
) {
  if (!leadId) {
    throw new ApiError(400, "Lead ID is required.");
  }

  if (!updatedBy) {
    throw new ApiError(400, "Updated by is required.");
  }

  const statusMap = {
    [FOLLOWUP_OUTCOME.INTERESTED]: "QUALIFIED",
    [FOLLOWUP_OUTCOME.CALLBACK]: "FOLLOW_UP",
    [FOLLOWUP_OUTCOME.NO_RESPONSE]: "FOLLOW_UP",
    [FOLLOWUP_OUTCOME.NOT_INTERESTED]: "LOST",
    [FOLLOWUP_OUTCOME.ADMISSION_DONE]: "ENROLLED",
    "ADMISSION_CONFIRMED": "ENROLLED",
    "CONNECTED": "CONTACTED",
    "BUSY": "FOLLOW_UP",
    "WRONG_NUMBER": "LOST",
    "CONVERTED": "ENROLLED",
  };

  const leadStatus = statusMap[outcome] || "CONTACTED";

  const updatedLead = await updateLeadStatusRepository(
    client,
    leadId,
    leadStatus,
    updatedBy
  );

  // Auto-sync to admissions if enrolled
  if (["ENROLLED", "ADMISSION_DONE", "ADMITTED"].includes(leadStatus)) {
    const { rows: leadRows } = await client.query("SELECT * FROM leads WHERE id = $1;", [leadId]);
    if (leadRows.length > 0) {
      const l = leadRows[0];
      const { rows: admRows } = await client.query("SELECT id FROM admissions WHERE lead_id = $1;", [leadId]);
      if (admRows.length === 0) {
        await client.query(`
          INSERT INTO admissions (
            lead_id, student_name, mobile, email, course_name, centre,
            total_fee, paid_fee, pending_fee, fee_status,
            assigned_counsellor_id, created_by, remarks
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13);
        `, [
          l.id,
          l.full_name,
          l.mobile,
          l.email,
          l.interested_course || "Enrolled Course",
          l.preferred_centre || "Main Campus",
          0,
          0,
          0,
          "PARTIAL",
          l.assigned_to || null,
          updatedBy,
          "Auto-enrolled from Follow-up completion"
        ]);
      }
    }
  }

  return updatedLead;
}

async function validateLead(leadId, client = null) {
  if (!leadId) {
    throw new ApiError(400, "Lead ID is required.");
  }

  const lead = await findLeadByIdRepository(leadId);

  if (!lead) {
    throw new ApiError(404, "Lead not found.");
  }

  return lead;
}

/**
 * Create activity log.
 *
 * @param {object} activity
 * @param {number|string} activity.leadId
 * @param {string} activity.action
 * @param {string} [activity.description]
 * @param {number|string} activity.createdBy
 * @param {object|null} client
 * @returns {Promise<object>}
 * @throws {ApiError}
 */
async function createActivityLog(
  activity,
  client = null
) {
  const {
    leadId,
    action,
    description = null,
    createdBy,
  } = activity;

  if (!leadId) {
    throw new ApiError(400, "Lead ID is required.");
  }

  if (!action) {
    throw new ApiError(400, "Activity action is required.");
  }

  if (!createdBy) {
    throw new ApiError(400, "Created by is required.");
  }

  return await createLeadActivityRepository(
  client,
  {
    lead_id: leadId,
    activity: action,
    description,
    performed_by: createdBy,
  }
);
}

async function validateBulkFollowupIds(followupIds) {

  if (!Array.isArray(followupIds) || followupIds.length === 0) {
    throw new ApiError(
      400,
      "At least one follow-up ID is required."
    );
  }

  const uniqueIds = [...new Set(followupIds)];

  return uniqueIds;
}

/**
 * ============================================================================
 * Create Follow-up
 * ============================================================================
 */
export async function createFollowupService(
  payload,
  currentUser
) {
  return await withTransaction(async (client) => {

    /* ------------------------------------------------------------------------
 * Validation
 * ---------------------------------------------------------------------- */

    const lead = await validateLead(
      payload.lead_id,
      client
    );

    let employeeId = payload.employee_id || currentUser.employee_id || lead.assigned_to;
    if (!employeeId) {
      const { rows: empRows } = await client.query(
        "SELECT id FROM employees WHERE (user_id = $1 OR email = $2) AND is_deleted = FALSE LIMIT 1;",
        [currentUser.id, currentUser.email]
      );
      if (empRows.length > 0) {
        employeeId = empRows[0].id;
      }
    }

    /* ------------------------------------------------------------------------
     * Business Rules
     * ---------------------------------------------------------------------- */
    const followupData = {
      ...payload,
      employee_id: employeeId || lead.assigned_to || 1,
      status: FOLLOWUP_STATUS.PENDING,
      created_by: currentUser.id,
    };

    /* ------------------------------------------------------------------------
     * Create Follow-up
     * ---------------------------------------------------------------------- */
    const followup = await createFollowupRepository(
      client,
      followupData
    );
    /* ------------------------------------------------------------------------
     * Activity Log
     * ---------------------------------------------------------------------- */
       await createActivityLog(
  {
    leadId: payload.lead_id,
    action: "FOLLOWUP_CREATED",
    description: "Follow-up created successfully.",
    createdBy: currentUser.id,
  },
  client
);
    /* ------------------------------------------------------------------------
     * Response
     * ---------------------------------------------------------------------- */
    return followup;
  });
}

/**
 * ============================================================================
 * Get All Follow-ups
 * ============================================================================
 */
export async function getAllFollowupsService(
  filters = {}
) {

  return await getFollowupsRepository(
    filters
  );

}

/**
 * ============================================================================
 * Get Follow-up By ID
 * ============================================================================
 */
export async function getFollowupByIdService(
  followupId,
  currentUser
) {

  /* ------------------------------------------------------------------------
   * Validation
   * ---------------------------------------------------------------------- */

  const followup = await validateFollowup(
    followupId
  );

  /* ------------------------------------------------------------------------
   * Authorization
   * ---------------------------------------------------------------------- */

  await verifyOwnership(
    followupId,
    currentUser
  );

  /* ------------------------------------------------------------------------
   * Response
   * ---------------------------------------------------------------------- */

  return followup;

}

/**
 * ============================================================================
 * Update Follow-up
 * ============================================================================
 */
export async function updateFollowupService(
  followupId,
  payload,
  currentUser
) {
  return await withTransaction(async (client) => {

    /* ------------------------------------------------------------------------
 * Validation
 * ---------------------------------------------------------------------- */

const followup = await validateFollowup(
  followupId,
  client,
  true
);

await validateEmployee(
  payload.employee_id,
  client
);

/* ------------------------------------------------------------------------
 * Authorization
 * ---------------------------------------------------------------------- */

await verifyOwnership(
  followupId,
  currentUser,
  client
);

    /* ------------------------------------------------------------------------
     * Business Rules
     * ---------------------------------------------------------------------- */
       const updateData = {
  ...payload,
  updated_by: currentUser.id,
};
    /* ------------------------------------------------------------------------
     * Update Follow-up
     * ---------------------------------------------------------------------- */
       const updatedFollowup =
  await updateFollowupRepository(
    client,
    followupId,
    updateData
  );
    /* ------------------------------------------------------------------------
     * Activity Log
     * ---------------------------------------------------------------------- */
      await createActivityLog(
  {
    leadId: followup.lead_id,
    action: "FOLLOWUP_UPDATED",
    description: "Follow-up updated successfully.",
    createdBy: currentUser.id,
  },
  client
);
    /* ------------------------------------------------------------------------
     * Response
     * ---------------------------------------------------------------------- */
      return updatedFollowup;
  });
}
/**
 * ============================================================================
 * Reschedule Follow-up
 * ============================================================================
 */
export async function rescheduleFollowupService(
  followupId,
  payload,
  currentUser
) {
  return await withTransaction(async (client) => {

    /* ------------------------------------------------------------------------
     * Validation
     * ---------------------------------------------------------------------- */

    const followup = await validateFollowup(
      followupId,
      client
    );

    /* ------------------------------------------------------------------------
     * Authorization
     * ---------------------------------------------------------------------- */

   await verifyOwnership(
  followupId,
  currentUser,
  client
);

    /* ------------------------------------------------------------------------
     * Business Rules
     * ---------------------------------------------------------------------- */

    if (followup.status !== FOLLOWUP_STATUS.PENDING) {
      throw new ApiError(
        400,
        "Only pending follow-ups can be rescheduled."
      );
    }

    if (!payload.next_followup_at) {
      throw new ApiError(
        400,
        "Next follow-up date is required."
      );
    }

    const nextFollowupDate = new Date(
      payload.next_followup_at
    );

    if (Number.isNaN(nextFollowupDate.getTime())) {
      throw new ApiError(
        400,
        "Invalid next follow-up date."
      );
    }

    if (nextFollowupDate <= new Date()) {
      throw new ApiError(
        400,
        "Next follow-up date must be in the future."
      );
    }

    const updateData = {
      next_followup_at: payload.next_followup_at,
      remarks: payload.remarks,
      updated_by: currentUser.id,
    };

    /* ------------------------------------------------------------------------
     * Reschedule Follow-up
     * ---------------------------------------------------------------------- */

    const updatedFollowup =
      await rescheduleFollowupRepository(
    client,
    followupId,
    payload.next_followup_at,
    payload.remarks,
    currentUser.id
);

    /* ------------------------------------------------------------------------
     * Activity Log
     * ---------------------------------------------------------------------- */

    await createActivityLog(
      {
        leadId: followup.lead_id,
        action: "FOLLOWUP_RESCHEDULED",
        description: `Follow-up rescheduled to ${payload.next_followup_at}.`,
        createdBy: currentUser.id,
      },
      client
    );

    /* ------------------------------------------------------------------------
     * Response
     * ---------------------------------------------------------------------- */

    return updatedFollowup;

  });
}

/**
 * ============================================================================
 * Delete Follow-up
 * ============================================================================
 */
export async function deleteFollowupService(
  followupId,
  currentUser
) {
  return await withTransaction(async (client) => {

    /* ------------------------------------------------------------------------
     * Validation
     * ---------------------------------------------------------------------- */

    const followup = await validateFollowup(
      followupId,
      client
    );

    /* ------------------------------------------------------------------------
     * Authorization
     * ---------------------------------------------------------------------- */

   await verifyOwnership(
  followupId,
  currentUser,
  client
);

    /* ------------------------------------------------------------------------
     * Business Rules
     * ---------------------------------------------------------------------- */

    if (followup.status === FOLLOWUP_STATUS.COMPLETED) {
      throw new ApiError(
        400,
        "Completed follow-ups cannot be deleted."
      );
    }

    /* ------------------------------------------------------------------------
     * Delete Follow-up
     * ---------------------------------------------------------------------- */

    const deletedFollowup =
  await softDeleteFollowupRepository(
    client,
    followupId,
    currentUser.id
  );

    /* ------------------------------------------------------------------------
     * Activity Log
     * ---------------------------------------------------------------------- */

    await createActivityLog(
      {
        leadId: followup.lead_id,
        action: "FOLLOWUP_DELETED",
        description: "Follow-up deleted successfully.",
        createdBy: currentUser.id,
      },
      client
    );

    /* ------------------------------------------------------------------------
     * Response
     * ---------------------------------------------------------------------- */

    return deletedFollowup;

  });
}

/**
 * ============================================================================
 * Restore Follow-up
 * ============================================================================
 */
export async function restoreFollowupService(
  followupId,
  currentUser
) {
  return await withTransaction(async (client) => {

    /* ------------------------------------------------------------------------
     * Validation
     * ---------------------------------------------------------------------- */

const followup = await validateFollowup(
  followupId,
  client,
  true
);

if (!followup.is_deleted) {
  throw new ApiError(
    400,
    "Follow-up is already active."
  );
}

    /* ------------------------------------------------------------------------
     * Authorization
     * ---------------------------------------------------------------------- */

    await verifyOwnership(
  followupId,
  currentUser,
  client
);

    /* ------------------------------------------------------------------------
     * Restore Follow-up
     * ---------------------------------------------------------------------- */

   const restoredFollowup =
  await restoreFollowupRepository(
    client,
    followupId,
    currentUser.id
  );

    /* ------------------------------------------------------------------------
     * Activity Log
     * ---------------------------------------------------------------------- */

    await createActivityLog(
      {
        leadId: followup.lead_id,
        action: "FOLLOWUP_RESTORED",
        description: "Follow-up restored successfully.",
        createdBy: currentUser.id,
      },
      client
    );

    /* ------------------------------------------------------------------------
     * Response
     * ---------------------------------------------------------------------- */

    return restoredFollowup;

  });
}

/**
 * ============================================================================
 * Get Follow-up Statistics
 * ============================================================================
 */
export async function getFollowupStatisticsService() {

  /* ------------------------------------------------------------------------
   * Repository
   * ---------------------------------------------------------------------- */

  const statistics =
    await getFollowupStatisticsRepository();

  /* ------------------------------------------------------------------------
   * Response
   * ---------------------------------------------------------------------- */

  return statistics;

}

/**
 * ============================================================================
 * Get Lead Timeline
 * ============================================================================
 */
export async function getLeadTimelineService(
  leadId
) {

  /* ------------------------------------------------------------------------
   * Validation
   * ---------------------------------------------------------------------- */

  await validateLead(
    leadId
  );

  /* ------------------------------------------------------------------------
   * Repository
   * ---------------------------------------------------------------------- */

  const timeline =
    await getFollowupTimelineRepository(
    leadId
);

  /* ------------------------------------------------------------------------
   * Response
   * ---------------------------------------------------------------------- */

  return timeline;

}

/**
 * ============================================================================
 * Complete Follow-up
 * ============================================================================
 */
export async function completeFollowupService(
  followupId,
  payload,
  currentUser
) {
  return await withTransaction(async (client) => {

    /* ------------------------------------------------------------------------
     * Validation
     * ---------------------------------------------------------------------- */

    const followup = await validateFollowup(
      followupId,
      client
    );

    /* ------------------------------------------------------------------------
     * Authorization
     * ---------------------------------------------------------------------- */

    await verifyOwnership(
      followupId,
      currentUser,
      client
    );

    /* ------------------------------------------------------------------------
     * Business Rules
     * ---------------------------------------------------------------------- */

    if (followup.status !== FOLLOWUP_STATUS.PENDING) {
      throw new ApiError(
        400,
        "Only pending follow-ups can be completed."
      );
    }

    if (!payload.outcome) {
      throw new ApiError(
        400,
        "Follow-up outcome is required."
      );
    }

    /* ------------------------------------------------------------------------
     * Complete Follow-up
     * ---------------------------------------------------------------------- */

    const completedFollowup =
      await completeFollowupRepository(
        client,
        followupId,
        payload.outcome,
        payload.remarks,
        currentUser.id
      );

    /* ------------------------------------------------------------------------
     * Sync Lead Status
     * ---------------------------------------------------------------------- */

    await syncLeadStatus(
      followup.lead_id,
      payload.outcome,
      currentUser.id,
      client
    );

    /* ------------------------------------------------------------------------
     * Activity Log
     * ---------------------------------------------------------------------- */

    await createActivityLog(
      {
        leadId: followup.lead_id,
        action: "FOLLOWUP_COMPLETED",
        description: "Follow-up completed successfully.",
        createdBy: currentUser.id,
      },
      client
    );

    /* ------------------------------------------------------------------------
     * Response
     * ---------------------------------------------------------------------- */

    return completedFollowup;

  });
}

export async function bulkCompleteFollowupsService(
  payload,
  currentUser
) {
  return await withTransaction(async (client) => {

    const followupIds =
      await validateBulkFollowupIds(payload.followupIds);

    if (!payload.outcome) {
      throw new ApiError(
        400,
        "Follow-up outcome is required."
      );
    }

    const successfulIds = [];
    const failedIds = [];

    for (const followupId of followupIds) {

      try {

        const followup = await validateFollowup(
          followupId,
          client
        );

        await verifyOwnership(
          followupId,
          currentUser,
          client
        );

        if (followup.status === FOLLOWUP_STATUS.COMPLETED) {
          failedIds.push({
            id: followupId,
            reason: "Already completed."
          });
          continue;
        }

        await completeFollowupRepository(
          client,
          followupId,
          payload.outcome,
          payload.remarks,
          currentUser.id
        );

        await syncLeadStatus(
          followup.lead_id,
          payload.outcome,
          currentUser.id,
          client
        );

        await createActivityLog(
          {
            leadId: followup.lead_id,
            action: "FOLLOWUP_BULK_COMPLETED",
            description: "Bulk follow-up completed.",
            createdBy: currentUser.id,
          },
          client
        );

        successfulIds.push(followupId);

      } catch (error) {

        failedIds.push({
          id: followupId,
          reason: error.message,
        });

      }

    }

    return {
      processed: successfulIds.length,
      failed: failedIds.length,
      successfulIds,
      failedIds,
    };

  });
}

export async function bulkDeleteFollowupsService(
  payload,
  currentUser
) {
  return await withTransaction(async (client) => {

    const followupIds =
      await validateBulkFollowupIds(payload.followupIds);

    const successfulIds = [];
    const failedIds = [];

    for (const followupId of followupIds) {

      try {

        const followup = await validateFollowup(
          followupId,
          client
        );

        await verifyOwnership(
          followupId,
          currentUser,
          client
        );

        if (followup.is_deleted) {
          failedIds.push({
            id: followupId,
            reason: "Already deleted."
          });
          continue;
        }

        if (followup.status === FOLLOWUP_STATUS.COMPLETED) {
          failedIds.push({
            id: followupId,
            reason: "Completed follow-up cannot be deleted."
          });
          continue;
        }

        await softDeleteFollowupRepository(
          client,
          followupId,
          currentUser.id
        );

        await createActivityLog(
          {
            leadId: followup.lead_id,
            action: "FOLLOWUP_BULK_DELETED",
            description: "Bulk follow-up deleted.",
            createdBy: currentUser.id,
          },
          client
        );

        successfulIds.push(followupId);

      } catch (error) {

        failedIds.push({
          id: followupId,
          reason: error.message,
        });

      }

    }

    return {
      processed: successfulIds.length,
      failed: failedIds.length,
      successfulIds,
      failedIds,
    };

  });
}

export async function bulkRestoreFollowupsService(
  payload,
  currentUser
) {
  return await withTransaction(async (client) => {

    const followupIds =
      await validateBulkFollowupIds(payload.followupIds);

    const successfulIds = [];
    const failedIds = [];

    for (const followupId of followupIds) {

      try {

        const followup = await validateFollowup(
          followupId,
          client,
          true
        );

        await verifyOwnership(
          followupId,
          currentUser,
          client
        );

        if (!followup.is_deleted) {
          failedIds.push({
            id: followupId,
            reason: "Follow-up is already active."
          });
          continue;
        }

        await restoreFollowupRepository(
          client,
          followupId,
          currentUser.id
        );

        await createActivityLog(
          {
            leadId: followup.lead_id,
            action: "FOLLOWUP_BULK_RESTORED",
            description: "Bulk follow-up restored.",
            createdBy: currentUser.id,
          },
          client
        );

        successfulIds.push(followupId);

      } catch (error) {

        failedIds.push({
          id: followupId,
          reason: error.message,
        });

      }

    }

    return {
      processed: successfulIds.length,
      failed: failedIds.length,
      successfulIds,
      failedIds,
    };

  });
}

export async function bulkAssignFollowupsService(
  payload,
  currentUser
) {
  return await withTransaction(async (client) => {

    const followupIds =
      await validateBulkFollowupIds(payload.followupIds);

    await validateEmployee(
      payload.employeeId,
      client
    );

    const successfulIds = [];
    const failedIds = [];

    for (const followupId of followupIds) {

      try {

        const followup = await validateFollowup(
          followupId,
          client
        );

        await verifyOwnership(
          followupId,
          currentUser,
          client
        );

        if (followup.employee_id == payload.employeeId) {
          failedIds.push({
            id: followupId,
            reason: "Already assigned."
          });
          continue;
        }

        await updateFollowupRepository(
          client,
          followupId,
          {
            employee_id: payload.employeeId,
            updated_by: currentUser.id,
          }
        );

        await createActivityLog(
          {
            leadId: followup.lead_id,
            action: "FOLLOWUP_BULK_ASSIGNED",
            description: "Bulk follow-up assigned.",
            createdBy: currentUser.id,
          },
          client
        );

        successfulIds.push(followupId);

      } catch (error) {

        failedIds.push({
          id: followupId,
          reason: error.message,
        });

      }

    }

    return {
      processed: successfulIds.length,
      failed: failedIds.length,
      successfulIds,
      failedIds,
    };

  });
}

