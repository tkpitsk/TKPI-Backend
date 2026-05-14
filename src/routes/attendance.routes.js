import express from "express";
import authMiddleware from "../middleware/auth.middleware.js";
import requireRole from "../middleware/role.middleware.js";
import auditMiddleware from "../audit/audit.middleware.js";
import { AUDIT_ACTIONS } from "../audit/audit.constants.js";
import {
    markAttendance,
    getAttendance,
    getMyAttendance,
    bulkMarkAttendance,
} from "../controllers/attendance.controller.js";

const router = express.Router();

router.use(authMiddleware);

router.post(
    "/",
    requireRole("admin", "manager"),
    auditMiddleware({ action: AUDIT_ACTIONS.CREATE, entity: "ATTENDANCE" }),
    markAttendance
);

router.get(
    "/",
    requireRole("admin", "manager"),
    getAttendance
);

router.post(
    "/bulk",
    requireRole("admin", "manager"),
    auditMiddleware({ action: AUDIT_ACTIONS.CREATE, entity: "ATTENDANCE_BULK" }),
    bulkMarkAttendance
);

router.get("/me", getMyAttendance);

export default router;
