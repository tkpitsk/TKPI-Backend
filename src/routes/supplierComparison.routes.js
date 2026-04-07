import express from "express";
import authMiddleware from "../middleware/auth.middleware.js";
import requireRole from "../middleware/role.middleware.js";

import {
    getSupplierComparison,
    getBestSupplier,
    getPriceTrend,
    getSupplierPerformance
} from "../controllers/supplierComparison.controller.js";

const router = express.Router();

/* ADMIN ONLY */
router.use(authMiddleware);
router.use(requireRole("admin"));

router.get("/", getSupplierComparison);
router.get("/best", getBestSupplier);
router.get("/trend", getPriceTrend);
router.get("/supplier/:supplierId", getSupplierPerformance);

export default router;