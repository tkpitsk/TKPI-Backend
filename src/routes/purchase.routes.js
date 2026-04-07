import express from "express";
import authMiddleware from "../middleware/auth.middleware.js";
import requireRole from "../middleware/role.middleware.js";

import {
    createEnquiry,
    addSupplierQuote,
    selectSupplier,
    getEnquiries,
    getEnquiryById,
    updateEnquiry,
    updateQuote
} from "../controllers/purchase.controller.js";
import {
    createOrderFromEnquiry,
    addItemToOrder,
    confirmOrder,
    getOrders,
    getOrderById,
} from "../controllers/purchaseOrder.controller.js";

const router = express.Router();

router.use(authMiddleware);
router.use(requireRole("admin"));

router.post("/enquiry", createEnquiry);
router.get("/enquiries", getEnquiries);
router.get("/enquiry/:enquiryId", getEnquiryById);
router.patch("/enquiry/:enquiryId", updateEnquiry);
router.post("/enquiry/:enquiryId/quote", addSupplierQuote);
router.patch("/quote/:quoteId", updateQuote);
router.patch("/enquiry/:enquiryId/select/:quoteId", selectSupplier);

/* ORDER */
router.get("/orders", getOrders);
router.get("/order/:orderId", getOrderById);
router.post("/order/:enquiryId", createOrderFromEnquiry);
router.post("/order/:orderId/item", addItemToOrder);
router.patch("/order/:orderId/confirm", confirmOrder);

export default router;