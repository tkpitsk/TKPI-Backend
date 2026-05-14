import express from "express";
import authMiddleware from "../middleware/auth.middleware.js";
import requireRole from "../middleware/role.middleware.js";
import auditMiddleware from "../audit/audit.middleware.js";
import { AUDIT_ACTIONS } from "../audit/audit.constants.js";
import {
  createReminder,
  getReminders,
  updateReminder,
  deleteReminder,
} from "../controllers/reminder.controller.js";

const router = express.Router();

router.use(authMiddleware);
router.use(requireRole("admin", "manager"));

router.get("/", getReminders);
router.post(
    "/",
    auditMiddleware({ action: AUDIT_ACTIONS.CREATE, entity: "REMINDER" }),
    createReminder
);
router.put(
    "/:id",
    auditMiddleware({ action: AUDIT_ACTIONS.UPDATE, entity: "REMINDER" }),
    updateReminder
);
router.delete(
    "/:id",
    auditMiddleware({ action: AUDIT_ACTIONS.DELETE, entity: "REMINDER" }),
    deleteReminder
);

export default router;
