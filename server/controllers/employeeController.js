import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";

import {
    createEmployeeService,
    getAllEmployeesService,
    getEmployeeByIdService,
    updateEmployeeService,
    deleteEmployeeService,
    restoreEmployeeService,
    getEmployeeStatisticsService,
    getEmployeePerformanceService,
} from "../services/employeeService.js";
import { getMyLeadsService } from "../services/employeeService.js";
/**
 * =====================================================
 * Create Employee
 * =====================================================
 */

export const createEmployeeController = asyncHandler(
    async (req, res) => {

        const employee =
            await createEmployeeService(
                req.body,
                req.user,
                req
            );

        return res.status(201).json(

            new ApiResponse(
                201,
                employee,
                "Employee created successfully."
            )

        );

    }
);

/**
 * =====================================================
 * Get All Employees
 * =====================================================
 */

export const getAllEmployeesController = asyncHandler(
    async (req, res) => {

        const employees =
            await getAllEmployeesService(
                req.query
            );

        return res.status(200).json(

            new ApiResponse(
                200,
                employees,
                "Employees fetched successfully."
            )

        );

    }
);

/**
 * =====================================================
 * Get Employee By ID
 * @route GET /api/employees/:id
 * =====================================================
 */

export const getEmployeeByIdController = asyncHandler(

    async (req, res) => {

        const employee =
            await getEmployeeByIdService(

                req.params.id,
                req.user

            );

        return res.status(200).json(

            new ApiResponse(

                200,

                employee,

                "Employee fetched successfully."

            )

        );

    }

);

/**
 * =====================================================
 * Update Employee
 * @route PUT /api/employees/:id
 * =====================================================
 */

export const updateEmployeeController = asyncHandler(

    async (req, res) => {

        const updatedEmployee =
            await updateEmployeeService(

                req.params.id,

                req.body,

                req.user,

                {
                    requestId: req.requestId,
                    ip: req.ip
                }

            );

        return res.status(200).json(

            new ApiResponse(

                200,

                updatedEmployee,

                "Employee updated successfully."

            )

        );

    }

);


/**
 * =====================================================
 * Delete Employee
 * @route DELETE /api/employees/:id
 * =====================================================
 */

export const deleteEmployeeController = asyncHandler(

    async (req, res) => {

        const employee =
            await deleteEmployeeService(

                req.params.id,

                req.user,

                {
                    requestId: req.requestId,
                    ip: req.ip
                }

            );

        return res.status(200).json(

            new ApiResponse(

                200,

                employee,

                "Employee deleted successfully."

            )

        );

    }

);

/**
 * =====================================================
 * Restore Employee
 * @route PATCH /api/employees/:id/restore
 * =====================================================
 */

export const restoreEmployeeController = asyncHandler(

    async (req, res) => {

        const employee =
            await restoreEmployeeService(

                req.params.id,

                req.user,

                {
                    requestId: req.requestId,
                    ip: req.ip
                }

            );

        return res.status(200).json(

            new ApiResponse(

                200,

                employee,

                "Employee restored successfully."

            )

        );

    }

);

/**
 * =====================================================
 * Employee Statistics
 * @route GET /api/employees/statistics
 * =====================================================
 */

export const getEmployeeStatisticsController = asyncHandler(

    async (req, res) => {

        const statistics =
            await getEmployeeStatisticsService();

        return res.status(200).json(

            new ApiResponse(

                200,

                statistics,

                "Employee statistics fetched successfully."

            )

        );

    }

);

/**
 * =====================================================
 * Get My Leads Controller
 * =====================================================
 */

export const getMyLeadsController = async (
  req,
  res,
  next
) => {

  try {

    const filters = {

      page: req.query.page,

      limit: req.query.limit,

      search: req.query.search,

      status: req.query.status,

      priority: req.query.priority,

      sortBy: req.query.sortBy,

      order: req.query.order,

    };

    const data = await getMyLeadsService(

      req.user.id,

      filters

    );

    return res.status(200).json({

      success: true,

      statusCode: 200,

      message: "My leads fetched successfully.",

      data,

    });

  } catch (error) {

    next(error);

  }

};

/**
 * =====================================================
 * Get Employee Performance & Week-Wise Stats Controller
 * =====================================================
 */
export const getEmployeePerformanceController = asyncHandler(
  async (req, res) => {
    const { id } = req.params;
    const performance = await getEmployeePerformanceService(id);

    return res.status(200).json(
      new ApiResponse(
        200,
        performance,
        "Employee performance details fetched successfully."
      )
    );
  }
);

/**
 * =====================================================
 * Get Logged-In Counsellor Self-Performance Controller
 * =====================================================
 */
export const getMyPerformanceController = asyncHandler(
  async (req, res) => {
    const { default: pool } = await import("../config/db.js");
    
    // Find employee linked to user
    const { rows: empRows } = await pool.query(
      "SELECT id FROM employees WHERE user_id = $1 AND is_deleted = FALSE;",
      [req.user.id]
    );

    let employeeId = empRows.length > 0 ? empRows[0].id : null;

    if (!employeeId) {
      const { rows: byEmail } = await pool.query(
        "SELECT id FROM employees WHERE email = $1 AND is_deleted = FALSE;",
        [req.user.email]
      );
      if (byEmail.length > 0) employeeId = byEmail[0].id;
    }

    if (!employeeId) {
      throw new ApiError(404, "Employee profile not found for this user.");
    }

    const performance = await getEmployeePerformanceService(employeeId);

    return res.status(200).json(
      new ApiResponse(
        200,
        performance,
        "My performance data fetched successfully."
      )
    );
  }
);