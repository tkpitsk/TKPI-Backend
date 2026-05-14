import express from "express";
import authMiddleware from "../middleware/auth.middleware.js";
import requireRole from "../middleware/role.middleware.js";
import { getDailyOverview } from "../controllers/dailyOverview.controller.js";

const router = express.Router();

router.use(authMiddleware);
router.use(requireRole("admin", "manager"));

router.get("/", getDailyOverview);

export default router;
