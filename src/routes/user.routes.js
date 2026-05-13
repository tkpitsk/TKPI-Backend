import express from "express";

import authMiddleware from "../middleware/auth.middleware.js";
import requireRole from "../middleware/role.middleware.js";
import upload from "../middleware/upload.middleware.js";

import auditMiddleware from "../audit/audit.middleware.js";
import { AUDIT_ACTIONS } from "../audit/audit.constants.js";

import {
    getAllUsers,
    createUser,
    updateUser,
    updateUserPassword,
    deleteUser,
    getUserReferences,
    hardDeleteUser
} from "../controllers/user.controller.js";

const router = express.Router();

/* ================= PROTECTED ROUTES ================= */
router.use(authMiddleware);

/* ================= GET USERS ================= */
router.get("/", requireRole("admin", "manager"), getAllUsers);



/* ================= CREATE USER ================= */
router.post(
    "/",
    requireRole("admin", "manager"),
    upload.single("image"),
    auditMiddleware({
        action: AUDIT_ACTIONS.CREATE,
        entity: "USER"
    }),
    createUser
);

/* ================= UPDATE USER ================= */
router.put(
    "/:id",
    requireRole("admin", "manager"),
    upload.single("image"),
    auditMiddleware({
        action: AUDIT_ACTIONS.UPDATE,
        entity: "USER"
    }),
    updateUser
);

/* ================= RESET PASSWORD ================= */
router.put(
    "/:id/password",
    requireRole("admin", "manager"),
    auditMiddleware({
        action: AUDIT_ACTIONS.PASSWORD_RESET,
        entity: "USER"
    }),
    updateUserPassword
);

/* ================= DELETE USER ================= */
router.delete(
    "/:id",
    requireRole("admin", "manager"),
    auditMiddleware({
        action: AUDIT_ACTIONS.DELETE,
        entity: "USER"
    }),
    deleteUser
);

/* ================= PERMANENT DELETE (DISABLED) ================= */
// router.delete(
//     "/:id/permanent",
//     auditMiddleware({
//         action: AUDIT_ACTIONS.DELETE,
//         entity: "USER"
//     }),
//     hardDeleteUser
// );

/* ================= USER REFERENCES ================= */
router.get("/:id/references", requireRole("admin", "manager"), getUserReferences);

export default router;