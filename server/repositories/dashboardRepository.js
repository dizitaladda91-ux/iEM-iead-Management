import pool from "../config/db.js";

/**
 * =====================================================
 * Dashboard Summary
 * =====================================================
 */

export const getDashboardSummaryRepository = async () => {
  const query = `
    SELECT
      (SELECT COUNT(*) FROM campaigns WHERE is_deleted = FALSE) AS total_campaigns,
      (SELECT COUNT(*) FROM leads WHERE is_deleted = FALSE) AS total_leads,
      (
        SELECT COUNT(*)
        FROM leads
        WHERE DATE(created_at) = CURRENT_DATE
          AND is_deleted = FALSE
      ) AS today_leads,
      (
        SELECT COUNT(*)
        FROM leads
        WHERE assigned_to IS NOT NULL
          AND is_deleted = FALSE
      ) AS assigned_leads,
      (SELECT COUNT(*) FROM employees WHERE is_deleted = FALSE) AS total_employees,
      (SELECT COUNT(*) FROM admissions) AS total_admissions,
      (SELECT COALESCE(SUM(paid_fee), 0) FROM admissions) AS total_fees_collected,
      (SELECT COUNT(*) FROM admissions WHERE fee_status = 'OVERDUE' OR (pending_fee > 0 AND next_due_date < CURRENT_DATE)) AS overdue_admissions;
  `;

  const result = await pool.query(query);
  return result.rows[0];
};

/**
 * =====================================================
 * Recent Leads
 * =====================================================
 */

export const getRecentLeadsRepository = async () => {

  const query = `

    SELECT

      lead_code,

      full_name,

      mobile,

      status,

      source,

      created_at

    FROM leads

    WHERE is_deleted = FALSE

    ORDER BY created_at DESC

    LIMIT 10;

  `;

  const result = await pool.query(query);

  return result.rows;

};

/**
 * =====================================================
 * Running Campaigns
 * =====================================================
 */

export const getRunningCampaignsRepository = async () => {

  const query = `

    SELECT

      campaign_code,

      campaign_name,

      platform,

      budget,

      status,

      start_date,

      end_date

    FROM campaigns

    WHERE

      is_deleted = FALSE

      AND status = 'ACTIVE'

    ORDER BY created_at DESC

    LIMIT 10;

  `;

  const result = await pool.query(query);

  return result.rows;

};

/**
 * =====================================================
 * Upcoming Follow-ups
 * =====================================================
 */

export const getUpcomingFollowUpsRepository = async () => {

  const query = `

    SELECT

      lead_code,

      full_name,

      mobile,

      next_followup,

      assigned_to,

      status

    FROM leads

    WHERE

      is_deleted = FALSE

      AND next_followup IS NOT NULL

      AND next_followup >= CURRENT_TIMESTAMP

    ORDER BY next_followup ASC

    LIMIT 10;

  `;

  const result = await pool.query(query);

  return result.rows;

};

/**
 * =====================================================
 * Recent Activities
 * =====================================================
 */

export const getRecentActivitiesRepository = async () => {

  const query = `

    SELECT

      activity,

      description,

      performed_by,

      created_at

    FROM lead_activity_logs

    ORDER BY created_at DESC

    LIMIT 10;

  `;

  const result = await pool.query(query);

  return result.rows;

};

/**
 * =====================================================
 * Lead Analytics
 * =====================================================
 */

/**
 * =====================================================
 * Lead Analytics
 * =====================================================
 */

export const getLeadAnalyticsRepository = async () => {

    const query = `

        SELECT

            COUNT(*) FILTER (
                WHERE status = 'NEW'
                AND is_deleted = FALSE
            ) AS new_leads,

            COUNT(*) FILTER (
                WHERE status = 'CONTACTED'
                AND is_deleted = FALSE
            ) AS contacted,

            COUNT(*) FILTER (
                WHERE status = 'QUALIFIED'
                AND is_deleted = FALSE
            ) AS qualified,

            COUNT(*) FILTER (
                WHERE status = 'FOLLOW_UP'
                AND is_deleted = FALSE
            ) AS follow_up,

            COUNT(*) FILTER (
                WHERE status = 'ADMISSION'
                AND is_deleted = FALSE
            ) AS admissions,

            COUNT(*) FILTER (
                WHERE status = 'LOST'
                AND is_deleted = FALSE
            ) AS lost,

            COUNT(*) FILTER (
                WHERE is_deleted = FALSE
            ) AS total

        FROM leads;

    `;

    const { rows } = await pool.query(query);

    return rows[0];

};