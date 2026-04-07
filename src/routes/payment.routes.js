import express from "express";
import authMiddleware from "../middleware/auth.middleware.js";
import requireRole from "../middleware/role.middleware.js";

import { createPayment } from "../controllers/payment.controller.js";

const router = express.Router();

router.use(authMiddleware);
router.use(requireRole("admin"));

router.post("/", createPayment);

export default router;