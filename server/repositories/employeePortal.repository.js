import pool from "../config/db.js";

/**
 * Dashboard Summary
 */
export const getDashboardSummaryRepository = async (userId) => {

  const query = `
    SELECT

      COUNT(*) FILTER (
        WHERE assigned_to = $1
        AND is_deleted = FALSE
      ) AS assigned_leads,

      COUNT(*) FILTER (
        WHERE assigned_to = $1
        AND DATE(next_followup) = CURRENT_DATE
        AND is_deleted = FALSE
      ) AS today_followups,

      COUNT(*) FILTER (
        WHERE assigned_to = $1
        AND status IN ('INTERESTED', 'QUALIFIED')
        AND is_deleted = FALSE
      ) AS interested_leads,

      COUNT(*) FILTER (
        WHERE assigned_to = $1
        AND status IN ('ENROLLED', 'ADMISSION_DONE', 'ADMITTED')
        AND is_deleted = FALSE
      ) AS admissions

    FROM leads;
  `;

  const { rows } = await pool.query(query, [userId]);

  return rows[0];

};

/**
 * Recent Leads
 */
export const getRecentLeadsRepository = async (userId) => {

  const query = `
    SELECT

      id,
      lead_code,
      full_name,
      mobile,
      status,
      next_followup,
      created_at

    FROM leads

    WHERE

      assigned_to = $1
      AND is_deleted = FALSE

    ORDER BY created_at DESC

    LIMIT 5;
  `;

  const { rows } = await pool.query(query, [userId]);

  return rows;

};

/**
 * Today's Follow-ups
 */
export const getTodayFollowUpsRepository = async (userId) => {

  const query = `
    SELECT

      id,
      lead_code,
      full_name,
      mobile,
      status,
      next_followup

    FROM leads

    WHERE

      assigned_to = $1

      AND DATE(next_followup)=CURRENT_DATE

      AND is_deleted = FALSE

    ORDER BY next_followup ASC;
  `;

  const { rows } = await pool.query(query, [userId]);

  return rows;

};

/**
 * Lead Status Analytics
 */
export const getLeadStatusRepository = async (userId) => {

  const query = `
    SELECT

      status,

      COUNT(*)::INT AS total

    FROM leads

    WHERE

      assigned_to = $1

      AND is_deleted = FALSE

    GROUP BY status

    ORDER BY status;
  `;

  const { rows } = await pool.query(query, [userId]);

  return rows;

};

/**
 * Monthly Admissions
 */
export const getMonthlyAdmissionsRepository = async (userId) => {
  // TODO: Monthly admission statistics
  return [];
};