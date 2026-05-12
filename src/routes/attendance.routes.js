import express from "express";
import authMiddleware from "../middleware/auth.middleware.js";
import requireRole from "../middleware/role.middleware.js";
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
    bulkMarkAttendance
);

router.get("/me", getMyAttendance);

export default router;
