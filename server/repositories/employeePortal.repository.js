import pool from "../config/db.js";

/**
 * Dashboard Summary
 */
export const getDashboardSummaryRepository = async (employeeId) => {
  const query = `
    SELECT
      COUNT(*) FILTER (
        WHERE assigned_to = $1
        AND is_deleted = FALSE
      )::INT AS assigned_leads,

      COALESCE(
        GREATEST(
          (SELECT COUNT(*) FROM lead_followups lf WHERE lf.employee_id = $1 AND lf.status = 'PENDING' AND DATE(lf.next_followup_at) = CURRENT_DATE AND lf.is_deleted = FALSE),
          (COUNT(*) FILTER (WHERE assigned_to = $1 AND DATE(next_followup) = CURRENT_DATE AND is_deleted = FALSE))
        ),
        0
      )::INT AS today_followups,

      COUNT(*) FILTER (
        WHERE assigned_to = $1
        AND status IN ('INTERESTED', 'QUALIFIED')
        AND is_deleted = FALSE
      )::INT AS interested_leads,

      COALESCE(
        GREATEST(
          (SELECT COUNT(*) FROM admissions a WHERE (a.assigned_counsellor_id = $1 OR a.created_by = (SELECT user_id FROM employees WHERE id = $1))),
          (COUNT(*) FILTER (WHERE assigned_to = $1 AND status IN ('ENROLLED', 'ADMISSION_DONE', 'ADMITTED') AND is_deleted = FALSE))
        ),
        0
      )::INT AS admissions

    FROM leads;
  `;

  const { rows } = await pool.query(query, [employeeId]);
  return rows[0] || {
    assigned_leads: 0,
    today_followups: 0,
    interested_leads: 0,
    admissions: 0,
  };
};

/**
 * Recent Leads
 */
export const getRecentLeadsRepository = async (employeeId) => {
  const query = `
    SELECT
      id,
      lead_code,
      full_name,
      mobile,
      interested_course,
      status,
      priority,
      next_followup,
      created_at
    FROM leads
    WHERE
      assigned_to = $1
      AND is_deleted = FALSE
    ORDER BY created_at DESC
    LIMIT 6;
  `;

  const { rows } = await pool.query(query, [employeeId]);
  return rows;
};

/**
 * Today's Follow-ups
 */
export const getTodayFollowUpsRepository = async (employeeId) => {
  const query = `
    SELECT
      lf.id,
      l.id AS lead_id,
      l.lead_code,
      l.full_name,
      l.mobile,
      l.interested_course,
      l.status,
      lf.followup_type,
      lf.priority,
      lf.remarks,
      COALESCE(lf.next_followup_at, l.next_followup) AS next_followup
    FROM lead_followups lf
    JOIN leads l ON lf.lead_id = l.id
    WHERE
      lf.employee_id = $1
      AND lf.status = 'PENDING'
      AND DATE(lf.next_followup_at) = CURRENT_DATE
      AND lf.is_deleted = FALSE
    UNION
    SELECT
      l.id,
      l.id AS lead_id,
      l.lead_code,
      l.full_name,
      l.mobile,
      l.interested_course,
      l.status,
      'CALL' AS followup_type,
      l.priority,
      l.remarks,
      l.next_followup
    FROM leads l
    WHERE
      l.assigned_to = $1
      AND DATE(l.next_followup) = CURRENT_DATE
      AND l.is_deleted = FALSE
      AND l.id NOT IN (SELECT lead_id FROM lead_followups WHERE employee_id = $1 AND status = 'PENDING' AND DATE(next_followup_at) = CURRENT_DATE)
    ORDER BY next_followup ASC
    LIMIT 10;
  `;

  const { rows } = await pool.query(query, [employeeId]);
  return rows;
};

/**
 * Lead Status Analytics
 */
export const getLeadStatusRepository = async (employeeId) => {
  const query = `
    SELECT
      status,
      COUNT(*)::INT AS total
    FROM leads
    WHERE
      assigned_to = $1
      AND is_deleted = FALSE
    GROUP BY status
    ORDER BY total DESC;
  `;

  const { rows } = await pool.query(query, [employeeId]);
  return rows;
};

/**
 * Monthly Admissions
 */
export const getMonthlyAdmissionsRepository = async (userId) => {
  // TODO: Monthly admission statistics
  return [];
};