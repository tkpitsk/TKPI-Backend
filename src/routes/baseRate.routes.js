import express from "express";

import authMiddleware from "../middleware/auth.middleware.js";
import requireRole from "../middleware/role.middleware.js";

import {
    setBaseRate,
    getLatestBaseRate,
    getBaseRateHistory,
    deactivateBaseRate,
    getAllLatestBaseRates,
    getAllBaseRateHistory
} from "../controllers/baseRate.controller.js";

const router = express.Router();

/* PUBLIC (optional) */
// router.get("/:productId", getLatestBaseRate);
// router.get("/:productId/history", getBaseRateHistory);

/* ================= ADMIN ONLY ================= */
router.use(authMiddleware);
router.use(requireRole("admin"));

/* LIST (Dashboard) */
router.get("/", getAllLatestBaseRates);
router.get("/history/all", getAllBaseRateHistory);

/* PRODUCT SPECIFIC */
router.get("/product/:productId/history", getBaseRateHistory);
router.get("/product/:productId", getLatestBaseRate);

/* CREATE */
router.post("/", setBaseRate);

/* DELETE */
router.patch("/:id/deactivate", deactivateBaseRate);

export default router;