import express from "express";

import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";

import ROLES from "../constants/roles.js";

import { getEmployeeDashboard } from "../controllers/employeePortal.controller.js";
import { getMyLeadsController, getMyPerformanceController } from "../controllers/employeeController.js";

const router = express.Router();

router.get(
  "/dashboard",
  authMiddleware,
  roleMiddleware(
    ROLES.ADMIN,
    ROLES.COUNSELLOR
  ),
  getEmployeeDashboard
);

router.get(
  "/my-leads",
  authMiddleware,
  roleMiddleware(
    ROLES.ADMIN,
    ROLES.COUNSELLOR
  ),
  getMyLeadsController
);

router.get(
  "/performance",
  authMiddleware,
  roleMiddleware(
    ROLES.ADMIN,
    ROLES.COUNSELLOR
  ),
  getMyPerformanceController
);

export default router;