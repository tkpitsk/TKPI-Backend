import express from "express";

import authMiddleware from "../middleware/auth.middleware.js";
import requireRole from "../middleware/role.middleware.js";

import auditMiddleware from "../audit/audit.middleware.js";
import { AUDIT_ACTIONS } from "../audit/audit.constants.js";

import {
    getAllUsers,
    createUser,
    updateUser,
    updateUserPassword,
    deleteUser
} from "../controllers/user.controller.js";

const router = express.Router();

/* ================= PROTECTED ROUTES ================= */
router.use(authMiddleware);

/* ================= ADMIN ONLY ================= */
router.use(requireRole("admin"));

/* ================= GET USERS ================= */
router.get("/", getAllUsers);

/* ================= CREATE USER ================= */
router.post(
    "/",
    auditMiddleware({
        action: AUDIT_ACTIONS.CREATE,
        entity: "USER"
    }),
    createUser
);

/* ================= UPDATE USER ================= */
router.put(
    "/:id",
    auditMiddleware({
        action: AUDIT_ACTIONS.UPDATE,
        entity: "USER"
    }),
    updateUser
);

/* ================= RESET PASSWORD ================= */
router.put(
    "/:id/password",
    auditMiddleware({
        action: AUDIT_ACTIONS.PASSWORD_RESET,
        entity: "USER"
    }),
    updateUserPassword
);

/* ================= DELETE USER ================= */
router.delete(
    "/:id",
    auditMiddleware({
        action: AUDIT_ACTIONS.DELETE,
        entity: "USER"
    }),
    deleteUser
);

export default router;