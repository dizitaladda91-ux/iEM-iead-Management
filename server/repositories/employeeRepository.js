import pool from "../config/db.js";

/* ============================================================================
 * Employee Repository
 * ============================================================================
 * Responsibilities:
 * - Database access only
 * - No business logic
 * - No validation
 * - No HTTP response
 * ============================================================================
 */

const EMPLOYEE_SELECT_COLUMNS = `
    e.id,
    e.user_id,
    e.employee_code,
    e.full_name,
    e.email,
    e.mobile,
    e.department_id,
    d.department_name,
    e.designation,
    e.role,
    e.employment_type,
    e.status,
    e.joining_date,
    e.date_of_birth,
    e.gender,
    e.profile_image,
    e.address,
    e.emergency_contact_name,
    e.emergency_contact,
    e.created_by,
    e.updated_by,
    e.deleted_by,
    e.created_at,
    e.updated_at,
    e.deleted_at,
    e.is_deleted
`;

const EMPLOYEE_BASE_QUERY = `
    FROM employees e
    LEFT JOIN departments d
        ON d.id = e.department_id
    WHERE e.is_deleted = FALSE
`;

/* ============================================================================
 * Employee Code
 * ============================================================================
 */

export const getNextEmployeeCodeRepository = async (client) => {

    const query = `
        SELECT nextval('employee_code_seq') AS sequence;
    `;

    const { rows } = await client.query(query);

    return Number(rows[0].sequence);

};

/* ============================================================================
 * Find Employee By ID
 * ============================================================================
 */

export const findEmployeeByIdRepository = async (id) => {

    const query = `
        SELECT
            ${EMPLOYEE_SELECT_COLUMNS}

        ${EMPLOYEE_BASE_QUERY}

        AND e.id = $1

        LIMIT 1;
    `;

    const { rows } = await pool.query(query, [id]);

    return rows[0] || null;

};

/* ============================================================================
 * Find Employee By User ID
 * ============================================================================
 */

export const findEmployeeByUserIdRepository = async (userId) => {

    const query = `
        SELECT
            ${EMPLOYEE_SELECT_COLUMNS}

        ${EMPLOYEE_BASE_QUERY}

        AND e.user_id = $1

        LIMIT 1;
    `;

    const { rows } = await pool.query(query, [userId]);

    return rows[0] || null;

};

/* ============================================================================
 * Find Employee By Email
 * ============================================================================
 */

export const findEmployeeByEmailRepository = async (email) => {

    const query = `
        SELECT
            ${EMPLOYEE_SELECT_COLUMNS}

        ${EMPLOYEE_BASE_QUERY}

        AND e.email = $1

        LIMIT 1;
    `;

    const { rows } = await pool.query(query, [email]);

    return rows[0] || null;

};

/* ============================================================================
 * Find Employee By Mobile
 * ============================================================================
 */

export const findEmployeeByMobileRepository = async (mobile) => {

    const query = `
        SELECT
            ${EMPLOYEE_SELECT_COLUMNS}

        ${EMPLOYEE_BASE_QUERY}

        AND e.mobile = $1

        LIMIT 1;
    `;

    const { rows } = await pool.query(query, [mobile]);

    return rows[0] || null;

};

/* ============================================================================
 * Find Employee By Employee Code
 * ============================================================================
 */

export const findEmployeeByCodeRepository = async (employeeCode) => {

    const query = `
        SELECT
            ${EMPLOYEE_SELECT_COLUMNS}

        ${EMPLOYEE_BASE_QUERY}

        AND e.employee_code = $1

        LIMIT 1;
    `;

    const { rows } = await pool.query(query, [employeeCode]);

    return rows[0] || null;

};

/* ============================================================================
 * Exists By Email
 * ============================================================================
 */

export const existsEmployeeByEmailRepository = async (email) => {

    const query = `
        SELECT EXISTS(

            SELECT 1

            FROM employees

            WHERE email = $1

            AND is_deleted = FALSE

        ) AS exists;
    `;

    const { rows } = await pool.query(query, [email]);

    return rows[0].exists;

};

/* ============================================================================
 * Exists By Mobile
 * ============================================================================
 */

export const existsEmployeeByMobileRepository = async (mobile) => {

    const query = `
        SELECT EXISTS(

            SELECT 1

            FROM employees

            WHERE mobile = $1

            AND is_deleted = FALSE

        ) AS exists;
    `;

    const { rows } = await pool.query(query, [mobile]);

    return rows[0].exists;

};

/* ============================================================================
 * Exists By Employee Code
 * ============================================================================
 */

export const existsEmployeeByCodeRepository = async (employeeCode) => {

    const query = `
        SELECT EXISTS(

            SELECT 1

            FROM employees

            WHERE employee_code = $1

            AND is_deleted = FALSE

        ) AS exists;
    `;

    const { rows } = await pool.query(query, [employeeCode]);

    return rows[0].exists;

};

/* ============================================================================
 * Create Employee
 * ============================================================================
 */

export const createEmployeeRepository = async (
    client,
    employee
) => {

    const query = `
        INSERT INTO employees (

            user_id,
            employee_code,
            full_name,
            email,
            mobile,
            department_id,
            designation,
            role,
            employment_type,
            status,
            joining_date,
            date_of_birth,
            gender,
            profile_image,
            address,
            emergency_contact_name,
            emergency_contact,
            created_by

        )

        VALUES (

            $1,$2,$3,$4,$5,$6,$7,$8,$9,
            $10,$11,$12,$13,$14,$15,$16,
            $17,$18

        )

        RETURNING *;
    `;

    const values = [

        employee.user_id,
        employee.employee_code,
        employee.full_name,
        employee.email,
        employee.mobile,
        employee.department_id,
        employee.designation,
        employee.role,
        employee.employment_type,
        employee.status,
        employee.joining_date,
        employee.date_of_birth,
        employee.gender,
        employee.profile_image,
        employee.address,
        employee.emergency_contact_name,
        employee.emergency_contact,
        employee.created_by

    ];

    const { rows } = await client.query(query, values);

    return rows[0];

};

/* ============================================================================
 * Update Employee
 * ============================================================================
 */

export const updateEmployeeRepository = async (
    client,
    id,
    employee
) => {

    const query = `
        UPDATE employees

        SET

            full_name = $1,
            mobile = $2,
            department_id = $3,
            designation = $4,
            role = $5,
            employment_type = $6,
            status = $7,
            joining_date = $8,
            date_of_birth = $9,
            gender = $10,
            profile_image = $11,
            address = $12,
            emergency_contact_name = $13,
            emergency_contact = $14,
            updated_by = $15,
            updated_at = CURRENT_TIMESTAMP

        WHERE id = $16
        AND is_deleted = FALSE

        RETURNING *;
    `;

    const values = [

        employee.full_name,
        employee.mobile,
        employee.department_id,
        employee.designation,
        employee.role,
        employee.employment_type,
        employee.status,
        employee.joining_date,
        employee.date_of_birth,
        employee.gender,
        employee.profile_image,
        employee.address,
        employee.emergency_contact_name,
        employee.emergency_contact,
        employee.updated_by,
        id

    ];

    const { rows } = await client.query(query, values);

    return rows[0];

};

/* ============================================================================
 * Soft Delete Employee
 * ============================================================================
 */

export const deleteEmployeeRepository = async (
    client,
    id,
    deletedBy
) => {

    const query = `
        UPDATE employees

        SET

            is_deleted = TRUE,
            deleted_at = CURRENT_TIMESTAMP,
            deleted_by = $1,
            updated_by = $1,
            updated_at = CURRENT_TIMESTAMP

        WHERE id = $2
        AND is_deleted = FALSE

        RETURNING *;
    `;

    const { rows } = await client.query(
        query,
        [
            deletedBy,
            id
        ]
    );

    return rows[0];

};

/* ============================================================================
 * Restore Employee
 * ============================================================================
 */

export const restoreEmployeeRepository = async (
    client,
    id,
    updatedBy
) => {

    const query = `
        UPDATE employees

        SET

            is_deleted = FALSE,
            deleted_at = NULL,
            deleted_by = NULL,
            updated_by = $1,
            updated_at = CURRENT_TIMESTAMP

        WHERE id = $2
        AND is_deleted = TRUE

        RETURNING *;
    `;

    const { rows } = await client.query(
        query,
        [
            updatedBy,
            id
        ]
    );

    return rows[0];

};

/* ============================================================================
 * Change Employee Status
 * ============================================================================
 */

export const changeEmployeeStatusRepository = async (
    client,
    id,
    status,
    updatedBy
) => {

    const query = `
        UPDATE employees

        SET

            status = $1,
            updated_by = $2,
            updated_at = CURRENT_TIMESTAMP

        WHERE id = $3
        AND is_deleted = FALSE

        RETURNING *;
    `;

    const { rows } = await client.query(
        query,
        [
            status,
            updatedBy,
            id
        ]
    );

    return rows[0];

};

/* ============================================================================
 * Change Employee Role
 * ============================================================================
 */

export const changeEmployeeRoleRepository = async (
    client,
    id,
    role,
    updatedBy
) => {

    const query = `
        UPDATE employees

        SET

            role = $1,
            updated_by = $2,
            updated_at = CURRENT_TIMESTAMP

        WHERE id = $3
        AND is_deleted = FALSE

        RETURNING *;
    `;

    const { rows } = await client.query(
        query,
        [
            role,
            updatedBy,
            id
        ]
    );

    return rows[0];

};

/* ============================================================================
 * Get Employees
 * ============================================================================
 */

export const getEmployeesRepository = async (filters = {}) => {

    const {

        page = 1,
        limit = 10,
        search = "",
        departmentId,
        role,
        status,
        employment_type,
        sortBy = "created_at",
        order = "DESC"

    } = filters;

    const offset = (page - 1) * limit;

    let baseQuery = `
        ${EMPLOYEE_BASE_QUERY}
    `;

    const values = [];
    let index = 1;

    /* ===========================================================
     * Search
     * ===========================================================
     */

    if (search) {

        baseQuery += `
            AND (

                e.employee_code ILIKE $${index}

                OR e.full_name ILIKE $${index}

                OR e.email ILIKE $${index}

                OR e.mobile ILIKE $${index}

            )
        `;

        values.push(`%${search}%`);

        index++;

    }

    /* ===========================================================
     * Department Filter
     * ===========================================================
     */

    if (departmentId) {

        baseQuery += `
            AND e.department_id = $${index}
        `;

        values.push(departmentId);

        index++;

    }

    /* ===========================================================
     * Role Filter
     * ===========================================================
     */

    if (role) {

        baseQuery += `
            AND e.role = $${index}
        `;

        values.push(role);

        index++;

    }

    /* ===========================================================
     * Status Filter
     * ===========================================================
     */

    if (status) {

        baseQuery += `
            AND e.status = $${index}
        `;

        values.push(status);

        index++;

    }

    /* ===========================================================
     * Employment Type
     * ===========================================================
     */

    if (employment_type) {

        baseQuery += `
            AND e.employment_type = $${index}
        `;

        values.push(employment_type);

        index++;

    }

    /* ===========================================================
     * Count Query
     * ===========================================================
     */

    const countQuery = `
        SELECT COUNT(*)
        ${baseQuery}
    `;

    const countResult = await pool.query(
        countQuery,
        values
    );

    const totalRecords = Number(
        countResult.rows[0].count
    );

    /* ===========================================================
     * Sorting
     * ===========================================================
     */

    const allowedSortColumns = [

        "created_at",

        "joining_date",

        "employee_code",

        "full_name",

        "status",

        "role"

    ];

    const sortColumn =
        allowedSortColumns.includes(sortBy)
            ? sortBy
            : "created_at";

    const sortOrder =
        order.toUpperCase() === "ASC"
            ? "ASC"
            : "DESC";

    /* ===========================================================
     * Data Query
     * ===========================================================
     */

    const dataQuery = `

        SELECT

            ${EMPLOYEE_SELECT_COLUMNS}

        ${baseQuery}

        ORDER BY e.${sortColumn} ${sortOrder}

        LIMIT $${index}

        OFFSET $${index + 1};

    `;

    values.push(limit);

    values.push(offset);

    const result = await pool.query(
        dataQuery,
        values
    );

    return {

        employees: result.rows,

        pagination: {

            page: Number(page),

            limit: Number(limit),

            totalRecords,

            totalPages: Math.ceil(
                totalRecords / limit
            )

        }

    };

};

/* ============================================================================
 * Employee Count
 * ============================================================================
 */

export const getEmployeeCountRepository = async () => {

    const query = `
        SELECT COUNT(*) AS total

        FROM employees

        WHERE is_deleted = FALSE;
    `;

    const { rows } = await pool.query(query);

    return Number(rows[0].total);

};

/* ============================================================================
 * Employee Statistics
 * ============================================================================
 */

export const getEmployeeStatisticsRepository = async () => {

    const query = `

        SELECT

            COUNT(*) FILTER (

                WHERE is_deleted = FALSE

            ) AS total_employees,

            COUNT(*) FILTER (

                WHERE status = 'ACTIVE'

                AND is_deleted = FALSE

            ) AS active_employees,

            COUNT(*) FILTER (

                WHERE status = 'INACTIVE'

                AND is_deleted = FALSE

            ) AS inactive_employees,

            COUNT(*) FILTER (

                WHERE status = 'ON_LEAVE'

                AND is_deleted = FALSE

            ) AS on_leave_employees,

            COUNT(*) FILTER (

                WHERE status = 'SUSPENDED'

                AND is_deleted = FALSE

            ) AS suspended_employees,

            COUNT(*) FILTER (

                WHERE role = 'ADMIN'

                AND is_deleted = FALSE

            ) AS admins,

            COUNT(*) FILTER (

                WHERE role = 'MANAGER'

                AND is_deleted = FALSE

            ) AS managers,

            COUNT(*) FILTER (

                WHERE role = 'COUNSELLOR'

                AND is_deleted = FALSE

            ) AS counsellors

        FROM employees;

    `;

    const { rows } = await pool.query(query);

    return rows[0];

};

/**
 * =====================================================
 * Employee Performance & Week-Wise Analytics
 * =====================================================
 */
export const getEmployeePerformanceRepository = async (employeeId) => {
    // 1. Overall Metrics
    const summaryQuery = `
        SELECT
            COUNT(l.id) AS total_assigned,
            COUNT(l.id) FILTER (WHERE l.status IN ('ENROLLED', 'ADMISSION_DONE', 'ADMITTED', 'COMPLETED')) AS completed_leads,
            COUNT(l.id) FILTER (WHERE l.status IN ('NEW', 'CONTACTED', 'FOLLOW_UP', 'FOLLOW_UP_REQUIRED', 'QUALIFIED', 'INTERESTED', 'HOT', 'WARM', 'COLD', 'PENDING')) AS pending_leads,
            COUNT(l.id) FILTER (WHERE l.status IN ('LOST', 'REJECTED', 'NOT_INTERESTED')) AS lost_leads,
            (SELECT COUNT(*) FROM admissions WHERE assigned_counsellor_id = $1) AS enrolled_admissions,
            (SELECT COALESCE(SUM(paid_fee), 0) FROM admissions WHERE assigned_counsellor_id = $1) AS total_fees_collected,
            (SELECT COALESCE(SUM(total_fee), 0) FROM admissions WHERE assigned_counsellor_id = $1) AS total_revenue_value
        FROM leads l
        WHERE l.assigned_to = $1 AND l.is_deleted = FALSE;
    `;

    // 2. Week-Wise Breakdown (Last 8 Weeks)
    const weekWiseQuery = `
        WITH weeks AS (
            SELECT 
                generate_series(
                    DATE_TRUNC('week', CURRENT_DATE - INTERVAL '7 weeks'),
                    DATE_TRUNC('week', CURRENT_DATE),
                    '1 week'::interval
                ) AS week_start
        )
        SELECT 
            TO_CHAR(w.week_start, 'YYYY-MM-DD') AS week_start_date,
            TO_CHAR(w.week_start + INTERVAL '6 days', 'YYYY-MM-DD') AS week_end_date,
            TO_CHAR(w.week_start, 'DD Mon') || ' - ' || TO_CHAR(w.week_start + INTERVAL '6 days', 'DD Mon YYYY') AS week_label,
            'Week ' || TO_CHAR(w.week_start, 'IW') AS week_name,
            COUNT(l.id) AS assigned_count,
            COUNT(l.id) FILTER (WHERE l.status IN ('ENROLLED', 'ADMISSION_DONE', 'ADMITTED', 'COMPLETED')) AS completed_count,
            COUNT(l.id) FILTER (WHERE l.status IN ('NEW', 'CONTACTED', 'FOLLOW_UP', 'FOLLOW_UP_REQUIRED', 'QUALIFIED', 'INTERESTED', 'HOT', 'WARM', 'COLD', 'PENDING')) AS pending_count,
            COUNT(l.id) FILTER (WHERE l.status IN ('ENROLLED', 'ADMISSION_DONE', 'ADMITTED')) AS enrolled_count,
            COALESCE((
                SELECT SUM(p.amount)
                FROM admission_payments p
                JOIN admissions a ON p.admission_id = a.id
                WHERE a.assigned_counsellor_id = $1 
                  AND p.payment_date >= w.week_start::date 
                  AND p.payment_date <= (w.week_start + INTERVAL '6 days')::date
            ), 0) AS fees_collected
        FROM weeks w
        LEFT JOIN leads l ON l.assigned_to = $1 
            AND l.is_deleted = FALSE 
            AND l.created_at >= w.week_start 
            AND l.created_at < w.week_start + INTERVAL '7 days'
        GROUP BY w.week_start
        ORDER BY w.week_start DESC;
    `;

    // 3. Recent Leads
    const recentLeadsQuery = `
        SELECT 
            id,
            lead_code,
            full_name,
            mobile,
            email,
            interested_course,
            status,
            priority,
            created_at,
            updated_at
        FROM leads
        WHERE assigned_to = $1 AND is_deleted = FALSE
        ORDER BY updated_at DESC
        LIMIT 10;
    `;

    const [summaryRes, weekRes, leadsRes] = await Promise.all([
        pool.query(summaryQuery, [employeeId]),
        pool.query(weekWiseQuery, [employeeId]),
        pool.query(recentLeadsQuery, [employeeId]),
    ]);

    const summary = summaryRes.rows[0] || {};
    const totalAssigned = parseInt(summary.total_assigned || 0, 10);
    const completedLeads = parseInt(summary.completed_leads || 0, 10);
    const pendingLeads = parseInt(summary.pending_leads || 0, 10);
    const enrolledCount = parseInt(summary.enrolled_admissions || 0, 10);

    const conversionRate = totalAssigned > 0 ? ((enrolledCount / totalAssigned) * 100).toFixed(1) : "0.0";

    return {
        summary: {
            total_assigned: totalAssigned,
            completed_leads: completedLeads,
            pending_leads: pendingLeads,
            lost_leads: parseInt(summary.lost_leads || 0, 10),
            enrolled_count: enrolledCount,
            total_fees_collected: parseFloat(summary.total_fees_collected || 0),
            total_revenue_value: parseFloat(summary.total_revenue_value || 0),
            conversion_rate: conversionRate,
        },
        week_wise: weekRes.rows,
        recent_leads: leadsRes.rows,
    };
};