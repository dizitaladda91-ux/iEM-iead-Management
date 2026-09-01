import pool from "../config/db.js";

import ApiError from "../utils/ApiError.js";
import auditLogger from "../utils/auditLogger.js";

import {
  getNextLeadCodeRepository,
  findLeadByMobileOrEmailRepository,
  createPublicLeadRepository,
  updateExistingLeadRepository,
  createLeadActivityRepository,
} from "../repositories/leadCaptureRepository.js";

import {
  findCampaignByIdRepository,
} from "../repositories/campaignRepository.js";

/**
 * =====================================================
 * Capture Public Lead
 * =====================================================
 */

export const capturePublicLeadService = async (

  leadData,

  req

) => {

  const client = await pool.connect();

  try {

    await client.query("BEGIN");

    /**
     * Optional Campaign Validation
     */
    if (leadData.campaign_id) {
      const campaign = await findCampaignByIdRepository(leadData.campaign_id);
      if (!campaign) {
        // If invalid id, keep as null rather than hard failing public capture
        leadData.campaign_id = null;
      }
    }

    const payload = {
      ...leadData,
      source: leadData.source || "WEBSITE",
      platform: leadData.platform || leadData.source || "WEBSITE",
    };

    /**
     * Duplicate Check
     */

    const existingLead =
      await findLeadByMobileOrEmailRepository(

        payload.mobile,

        payload.email

      );

    /**
     * Duplicate Lead
     */

    if (existingLead) {
      // Preserve critical CRM fields from being wiped by public form submissions
      const mergedLeadData = {
        ...existingLead,
        full_name: payload.full_name || existingLead.full_name,
        email: payload.email || existingLead.email,
        mobile: payload.mobile || existingLead.mobile,
        alternate_mobile: payload.alternate_mobile || existingLead.alternate_mobile,
        city: payload.city || existingLead.city,
        state: payload.state || existingLead.state,
        interested_course: payload.interested_course || existingLead.interested_course,
        preferred_centre: payload.preferred_centre || existingLead.preferred_centre,
        campaign_id: payload.campaign_id || existingLead.campaign_id,
        // STRICTLY PRESERVE internal workflow status, assignment, and notes
        status: existingLead.status || "NEW",
        assigned_to: existingLead.assigned_to,
        priority: existingLead.priority || "MEDIUM",
        feedback: existingLead.feedback,
        remarks: existingLead.remarks,
        updated_by: null,
      };

      const updatedLead =
        await updateExistingLeadRepository(
          client,
          existingLead.id,
          mergedLeadData
        );

      await createLeadActivityRepository(
        client,
        {
          lead_id: existingLead.id,
          activity: "LEAD_RESUBMITTED",
          description:
            `Lead re-submitted enquiry from ${payload.source || "Website"}. Existing status (${existingLead.status}) and counsellor assignment preserved.`,
          performed_by: null,
        }
      );

      await client.query("COMMIT");

      return {
        type: "UPDATED",
        lead: updatedLead,
      };
    }

    /**
     * Generate Lead Code
     */
    const sequence =
      await getNextLeadCodeRepository(client);

    const leadCode =
      `${process.env.LEAD_CODE_PREFIX || "LEAD"}${String(sequence).padStart(6, "0")}`;

    /**
     * Create Lead
     */
    const lead =
      await createPublicLeadRepository(
        client,
        {
          ...payload,
          lead_code: leadCode,
          captured_at: new Date(),
          created_by: null,
        }
      );

    /**
     * Activity Log
     */

    await createLeadActivityRepository(

      client,

      {

        lead_id: lead.id,

        activity: "LEAD_CREATED",

        description:
          "Lead captured from public source.",

        performed_by: null,

      }

    );

    /**
     * Audit Log
     */

    auditLogger({

      action: "PUBLIC_LEAD_CAPTURE",

      module: "LEAD",

      role: "PUBLIC",

      userId: null,

      entityId: lead.id,

      requestId: req.requestId,

      ip: req.ip,

    });

    await client.query("COMMIT");

    return {

      type: "CREATED",

      lead,

    };

  } catch (error) {

    await client.query("ROLLBACK");

    throw error;

  } finally {

    client.release();

  }

};