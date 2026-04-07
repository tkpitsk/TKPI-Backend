import express from "express";
import authMiddleware from "../middleware/auth.middleware.js";
import requireRole from "../middleware/role.middleware.js";
import {
    markAttendance,
    getAttendance,
    getMyAttendance,
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

router.get("/me", getMyAttendance); // 👈 NEW

export default router;
