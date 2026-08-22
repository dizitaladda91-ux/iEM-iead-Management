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
      const updatedLead =
        await updateExistingLeadRepository(
          client,
          existingLead.id,
          {
            ...existingLead,
            ...payload,
            updated_by: null,
          }
        );

      await createLeadActivityRepository(
        client,
        {
          lead_id: existingLead.id,
          activity: "LEAD_UPDATED",
          description:
            "Existing lead updated from public source.",
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