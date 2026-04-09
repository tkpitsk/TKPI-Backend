import express from "express";
import authMiddleware from "../middleware/auth.middleware.js";
import requireRole from "../middleware/role.middleware.js";
import {
  getEmployeeSummary,
  getEmployeeDetails,
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

export default router;