import express from "express";
import authMiddleware from "../middleware/auth.middleware.js";
import requireRole from "../middleware/role.middleware.js";
import {
  getEmployeeSummary,
  getEmployeeDetails,
  getAllEmployeesSummary,
} from "../controllers/employeeReport.controller.js";

const router = express.Router();

router.use(authMiddleware);

router.get(
  "/summary",
  requireRole("admin", "manager"),
  getEmployeeSummary
);

router.get(
  "/details",
  requireRole("admin", "manager"),
  getEmployeeDetails
);

router.get(
  "/all-summary",
  requireRole("admin", "manager"),
  getAllEmployeesSummary
);

export default router;