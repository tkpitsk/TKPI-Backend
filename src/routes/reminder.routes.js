import express from "express";
import authMiddleware from "../middleware/auth.middleware.js";
import requireRole from "../middleware/role.middleware.js";
import {
  createReminder,
  getReminders,
  updateReminder,
  deleteReminder,
} from "../controllers/reminder.controller.js";

const router = express.Router();

router.use(authMiddleware);
router.use(requireRole("admin"));

router.get("/", getReminders);
router.post("/", createReminder);
router.put("/:id", updateReminder);
router.delete("/:id", deleteReminder);

export default router;
