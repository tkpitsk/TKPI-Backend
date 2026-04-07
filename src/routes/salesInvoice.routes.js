import express from "express";

import authMiddleware from "../middleware/auth.middleware.js";
import requireRole from "../middleware/role.middleware.js";

import {
    createInvoice,
    getInvoices,
    getInvoiceById,
    cancelInvoice
} from "../controllers/salesInvoice.controller.js";

const router = express.Router();

router.use(authMiddleware);
router.use(requireRole("admin"));

/* ================= CREATE ================= */
router.post("/order/:orderId", createInvoice);

/* ================= GET ================= */
router.get("/", getInvoices);
router.get("/:id", getInvoiceById);

/* ================= CANCEL ================= */
router.patch("/:id/cancel", cancelInvoice);

export default router;