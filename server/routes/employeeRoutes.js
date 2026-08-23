import { Router } from "express";

import {
    createEmployeeController,
    getAllEmployeesController,
    getEmployeeByIdController,
    updateEmployeeController,
    deleteEmployeeController,
    restoreEmployeeController,
    getEmployeeStatisticsController,
    getEmployeePerformanceController,
    getMyPerformanceController,
} from "../controllers/employeeController.js";

import authenticate from "../middleware/authMiddleware.js";

import authorize from "../middleware/authorize.js";

import PERMISSIONS from "../constants/permissions.js";

import {
    validateCreateEmployee,
    validateUpdateEmployee,
    validateEmployeeId,
    validateEmployeeFilters,
} from "../validators/employee.validator.js";

import {
  getMyLeadsController,
} from "../controllers/employeeController.js";

const router = Router();

/**
 * =====================================================
 * Create Employee
 * =====================================================
 */
router.post(
    "/",
    authenticate,
    authorize(PERMISSIONS.CREATE_EMPLOYEE),
    validateCreateEmployee,
    createEmployeeController
);

/**
 * =====================================================
 * Get All Employees
 * =====================================================
 */
router.get(
    "/",
    authenticate,
    authorize(PERMISSIONS.VIEW_EMPLOYEE),
    validateEmployeeFilters,
    getAllEmployeesController
);

/**
 * =====================================================
 * Employee Statistics
 * =====================================================
 */
router.get(
    "/statistics",
    authenticate,
    authorize(PERMISSIONS.VIEW_EMPLOYEE),
    getEmployeeStatisticsController
);

/**
 * =====================================================
 * Get Employee By ID
 * =====================================================
 */
router.get(
    "/:id",
    authenticate,
    authorize(PERMISSIONS.VIEW_EMPLOYEE),
    validateEmployeeId,
    getEmployeeByIdController
);

/**
 * =====================================================
 * Get Employee Performance & Week-Wise Analytics
 * =====================================================
 */
router.get(
    "/:id/performance",
    authenticate,
    authorize(PERMISSIONS.VIEW_EMPLOYEE),
    validateEmployeeId,
    getEmployeePerformanceController
);

/**
 * =====================================================
 * Update Employee
 * =====================================================
 */
router.put(
    "/:id",
    authenticate,
    authorize(PERMISSIONS.UPDATE_EMPLOYEE),
    validateEmployeeId,
    validateUpdateEmployee,
    updateEmployeeController
);

/**
 * =====================================================
 * Delete Employee
 * =====================================================
 */
router.delete(
    "/:id",
    authenticate,
    authorize(PERMISSIONS.DELETE_EMPLOYEE),
    validateEmployeeId,
    deleteEmployeeController
);

/**
 * =====================================================
 * Restore Employee
 * =====================================================
 */
router.patch(
    "/:id/restore",
    authenticate,
    authorize(PERMISSIONS.RESTORE_EMPLOYEE),
    validateEmployeeId,
    restoreEmployeeController
);

router.get(
  "/my-performance",
  authenticate,
  getMyPerformanceController
);

router.get(
  "/my-leads",
  authenticate,
  getMyLeadsController
);

export default router;