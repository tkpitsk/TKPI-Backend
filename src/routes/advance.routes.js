import express from "express";
import authMiddleware from "../middleware/auth.middleware.js";
import requireRole from "../middleware/role.middleware.js";
import auditMiddleware from "../audit/audit.middleware.js";
import { AUDIT_ACTIONS } from "../audit/audit.constants.js";
import {
    giveAdvance,
    getAdvances,
    getMyAdvances,
} from "../controllers/advance.controller.js";

const router = express.Router();

router.use(authMiddleware);

router.post(
    "/",
    requireRole("admin", "manager"),
    auditMiddleware({ action: AUDIT_ACTIONS.CREATE, entity: "ADVANCE" }),
    giveAdvance
);

router.get(
    "/",
    requireRole("admin", "manager"),
    getAdvances
);

router.get("/me", getMyAdvances); // 👈 NEW

export default router;
