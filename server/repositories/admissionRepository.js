import pool from "../config/db.js";

/**
 * Get all admissions with pagination and filters (Admin)
 */
export const getAllAdmissionsRepository = async ({
  page = 1,
  limit = 10,
  search = "",
  centre = null,
  course = null,
  feeStatus = null,
  counsellorId = null,
  isOverdue = false,
}) => {
  let query = `
    SELECT 
      a.*,
      e.full_name AS counsellor_name,
      e.employee_code AS counsellor_code,
      COUNT(p.id) AS payments_count
    FROM admissions a
    LEFT JOIN employees e ON a.assigned_counsellor_id = e.id
    LEFT JOIN admission_payments p ON a.id = p.admission_id
    WHERE 1=1
  `;

  const values = [];
  let index = 1;

  if (search) {
    query += ` AND (
      a.student_name ILIKE $${index} OR 
      a.mobile ILIKE $${index} OR 
      a.email ILIKE $${index} OR
      a.course_name ILIKE $${index}
    )`;
    values.push(`%${search}%`);
    index++;
  }

  if (centre) {
    query += ` AND a.centre = $${index}`;
    values.push(centre);
    index++;
  }

  if (course) {
    query += ` AND a.course_name = $${index}`;
    values.push(course);
    index++;
  }

  if (feeStatus) {
    query += ` AND a.fee_status = $${index}`;
    values.push(feeStatus);
    index++;
  }

  if (counsellorId) {
    query += ` AND a.assigned_counsellor_id = $${index}`;
    values.push(counsellorId);
    index++;
  }

  if (isOverdue) {
    query += ` AND a.fee_status = 'OVERDUE' OR (a.pending_fee > 0 AND a.next_due_date < CURRENT_DATE)`;
  }

  query += `
    GROUP BY a.id, e.full_name, e.employee_code
    ORDER BY a.created_at DESC
    LIMIT $${index} OFFSET $${index + 1};
  `;

  values.push(limit);
  values.push((page - 1) * limit);

  const { rows } = await pool.query(query, values);
  return rows;
};

/**
 * Get admission count for pagination
 */
export const getAdmissionsCountRepository = async ({
  search = "",
  centre = null,
  course = null,
  feeStatus = null,
  counsellorId = null,
  isOverdue = false,
}) => {
  let query = `SELECT COUNT(*) AS total FROM admissions a WHERE 1=1`;
  const values = [];
  let index = 1;

  if (search) {
    query += ` AND (
      a.student_name ILIKE $${index} OR 
      a.mobile ILIKE $${index} OR 
      a.email ILIKE $${index} OR
      a.course_name ILIKE $${index}
    )`;
    values.push(`%${search}%`);
    index++;
  }

  if (centre) {
    query += ` AND a.centre = $${index}`;
    values.push(centre);
    index++;
  }

  if (course) {
    query += ` AND a.course_name = $${index}`;
    values.push(course);
    index++;
  }

  if (feeStatus) {
    query += ` AND a.fee_status = $${index}`;
    values.push(feeStatus);
    index++;
  }

  if (counsellorId) {
    query += ` AND a.assigned_counsellor_id = $${index}`;
    values.push(counsellorId);
    index++;
  }

  if (isOverdue) {
    query += ` AND (a.fee_status = 'OVERDUE' OR (a.pending_fee > 0 AND a.next_due_date < CURRENT_DATE))`;
  }

  const { rows } = await pool.query(query, values);
  return parseInt(rows[0].total, 10);
};

/**
 * Get admissions assigned to specific counsellor
 */
export const getCounsellorAdmissionsRepository = async (employeeId, search = "") => {
  let query = `
    SELECT 
      a.*,
      COUNT(p.id) AS payments_count
    FROM admissions a
    LEFT JOIN admission_payments p ON a.id = p.admission_id
    WHERE (a.assigned_counsellor_id = $1 OR a.created_by = (SELECT user_id FROM employees WHERE id = $1))
  `;
  const values = [employeeId];

  if (search) {
    query += ` AND (
      a.student_name ILIKE $2 OR 
      a.mobile ILIKE $2 OR 
      a.course_name ILIKE $2
    )`;
    values.push(`%${search}%`);
  }

  query += `
    GROUP BY a.id
    ORDER BY 
      CASE WHEN a.fee_status = 'OVERDUE' THEN 1 WHEN a.fee_status = 'PARTIAL' THEN 2 ELSE 3 END,
      a.next_due_date ASC NULLS LAST;
  `;

  const { rows } = await pool.query(query, values);
  return rows;
};

/**
 * Get overall financial stats
 */
export const getAdmissionStatsRepository = async (counsellorId = null, userId = null) => {
  let query = `
    SELECT 
      COUNT(*) AS total_admissions,
      COALESCE(SUM(total_fee), 0) AS total_revenue,
      COALESCE(SUM(paid_fee), 0) AS total_collected,
      COALESCE(SUM(pending_fee), 0) AS total_pending,
      COUNT(CASE WHEN fee_status = 'FULLY_PAID' THEN 1 END) AS fully_paid_count,
      COUNT(CASE WHEN fee_status = 'PARTIAL' THEN 1 END) AS partial_count,
      COUNT(CASE WHEN fee_status = 'OVERDUE' OR (pending_fee > 0 AND next_due_date < CURRENT_DATE) THEN 1 END) AS overdue_count,
      COUNT(CASE WHEN next_due_date = CURRENT_DATE THEN 1 END) AS due_today_count
    FROM admissions
    WHERE 1=1
  `;
  const values = [];

  if (counsellorId || userId) {
    if (counsellorId && userId) {
      query += ` AND (assigned_counsellor_id = $1 OR created_by = $2)`;
      values.push(counsellorId, userId);
    } else if (counsellorId) {
      query += ` AND (assigned_counsellor_id = $1 OR created_by = (SELECT user_id FROM employees WHERE id = $1))`;
      values.push(counsellorId);
    } else {
      query += ` AND created_by = $1`;
      values.push(userId);
    }
  }

  const { rows } = await pool.query(query, values);
  return rows[0];
};

/**
 * Find admission by ID
 */
export const findAdmissionByIdRepository = async (id) => {
  const query = `
    SELECT 
      a.*,
      e.full_name AS counsellor_name,
      e.employee_code AS counsellor_code
    FROM admissions a
    LEFT JOIN employees e ON a.assigned_counsellor_id = e.id
    WHERE a.id = $1;
  `;
  const { rows } = await pool.query(query, [id]);
  return rows[0];
};

/**
 * Create new admission
 */
export const createAdmissionRepository = async (client, data) => {
  const query = `
    INSERT INTO admissions (
      lead_id,
      student_name,
      mobile,
      email,
      course_name,
      centre,
      total_fee,
      paid_fee,
      pending_fee,
      fee_status,
      next_due_date,
      assigned_counsellor_id,
      created_by,
      remarks
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
    RETURNING *;
  `;

  const totalFee = Number(data.total_fee || 0);
  const paidFee = Number(data.paid_fee || 0);
  const pendingFee = Math.max(0, totalFee - paidFee);
  
  let status = "PARTIAL";
  if (pendingFee === 0 && totalFee > 0) status = "FULLY_PAID";
  else if (data.next_due_date && new Date(data.next_due_date) < new Date()) status = "OVERDUE";

  const values = [
    data.lead_id || null,
    data.student_name,
    data.mobile,
    data.email || null,
    data.course_name,
    data.centre || null,
    totalFee,
    paidFee,
    pendingFee,
    status,
    data.next_due_date || null,
    data.assigned_counsellor_id || null,
    data.created_by || null,
    data.remarks || null,
  ];

  const { rows } = await client.query(query, values);
  return rows[0];
};

/**
 * Update admission fee balance
 */
export const updateAdmissionFeeRepository = async (client, id, { paidFee, pendingFee, feeStatus, nextDueDate, remarks }) => {
  const query = `
    UPDATE admissions
    SET 
      paid_fee = $1,
      pending_fee = $2,
      fee_status = $3,
      next_due_date = $4,
      remarks = COALESCE($5, remarks),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $6
    RETURNING *;
  `;

  const values = [paidFee, pendingFee, feeStatus, nextDueDate || null, remarks || null, id];
  const { rows } = await client.query(query, values);
  return rows[0];
};

/**
 * Add payment transaction record
 */
export const addPaymentTransactionRepository = async (client, payment) => {
  const query = `
    INSERT INTO admission_payments (
      admission_id,
      amount,
      payment_mode,
      receipt_number,
      payment_date,
      remarks,
      recorded_by
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *;
  `;

  const values = [
    payment.admission_id,
    payment.amount,
    payment.payment_mode || "UPI",
    payment.receipt_number || null,
    payment.payment_date || new Date().toISOString().slice(0, 10),
    payment.remarks || null,
    payment.recorded_by || null,
  ];

  const { rows } = await client.query(query, values);
  return rows[0];
};

/**
 * Get payment history for an admission
 */
export const getAdmissionPaymentsRepository = async (admissionId) => {
  const query = `
    SELECT 
      p.*,
      u.full_name AS recorded_by_name
    FROM admission_payments p
    LEFT JOIN users u ON p.recorded_by = u.id
    WHERE p.admission_id = $1
    ORDER BY p.payment_date DESC, p.created_at DESC;
  `;
  const { rows } = await pool.query(query, [admissionId]);
  return rows;
};
