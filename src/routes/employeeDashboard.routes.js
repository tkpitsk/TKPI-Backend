import express from "express";
import authMiddleware from "../middleware/auth.middleware.js";
import requireRole from "../middleware/role.middleware.js";
import { getEmployeeDashboard } from "../controllers/employeeDashboard.controller.js";

const router = express.Router();

router.use(authMiddleware);

router.get(
    "/",
    requireRole("admin", "manager"),
    getEmployeeDashboard
);

export default router;