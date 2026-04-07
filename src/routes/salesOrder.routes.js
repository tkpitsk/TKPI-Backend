import express from "express";

import authMiddleware from "../middleware/auth.middleware.js";
import requireRole from "../middleware/role.middleware.js";

import {
    createOrderFromQuotation,
    dispatchOrder,
    deliverOrder,
    getOrders,
    getOrderById,
    getOrdersByCustomer,
    cancelOrder,
    getOrderAnalytics
} from "../controllers/salesOrder.controller.js";

const router = express.Router();

router.use(authMiddleware);
router.use(requireRole("admin"));

/* ================= CREATE ================= */
router.post("/from-quotation/:quotationId", createOrderFromQuotation);

/* ================= DISPATCH ================= */
router.post("/:orderId/dispatch", dispatchOrder);

/* ================= DELIVERY ================= */
router.post("/:orderId/deliver", deliverOrder);

/* ================= GET ================= */
router.get("/", getOrders);
router.get("/analytics", getOrderAnalytics);
router.get("/customer/:customerId", getOrdersByCustomer);
router.get("/:id", getOrderById);

/* ================= CANCEL ================= */
router.patch("/:id/cancel", cancelOrder);

export default router;