import express from "express";
import authMiddleware from "../middleware/auth.middleware.js";
import requireRole from "../middleware/role.middleware.js";

import {
    downloadPurchaseEnquiryPDF,
    downloadPurchaseOrderPDF,
    downloadSalesInvoicePDF,
    downloadSalesQuotationPDF,
    downloadSalesOrderPDF,
    downloadEmployeeReportPDF,
    downloadSalarySlipPDF
} from "../controllers/pdf.controller.js";

const router = express.Router();

router.use(authMiddleware);
router.use(requireRole("admin"));

/* ================= PDF ROUTES ================= */

/* 🔥 ENQUIRY PDF */
router.get("/purchase/enquiry/:id/pdf", downloadPurchaseEnquiryPDF);

/* 🔥 ORDER PDF */
router.get("/purchase/order/:id/pdf", downloadPurchaseOrderPDF);

/* 🔥 SALES QUOTATION PDF */
router.get("/sales/quotation/:id/pdf", downloadSalesQuotationPDF);

/* 🔥 SALES INVOICE PDF */
router.get("/sales/invoice/:id/pdf", downloadSalesInvoicePDF);

/* 🔥 SALES ORDER PDF */
router.get("/sales/order/:id/pdf", downloadSalesOrderPDF);

/* 🔥 Employee Report PDF */
router.get(
    "/employee-report",
    downloadEmployeeReportPDF
);

router.get("/salary-slip", downloadSalarySlipPDF);

export default router;