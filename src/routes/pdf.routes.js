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
    downloadBulkEmployeeReportPDF,
    downloadSalarySlipPDF
} from "../controllers/pdf.controller.js";

const router = express.Router();

router.use(authMiddleware);

/* ================= PDF ROUTES ================= */

/* 🔥 ADMIN ONLY PDFs */
router.get("/purchase/enquiry/:id/pdf", requireRole("admin"), downloadPurchaseEnquiryPDF);
router.get("/purchase/order/:id/pdf", requireRole("admin"), downloadPurchaseOrderPDF);
router.get("/sales/quotation/:id/pdf", requireRole("admin"), downloadSalesQuotationPDF);
router.get("/sales/invoice/:id/pdf", requireRole("admin"), downloadSalesInvoicePDF);
router.get("/sales/order/:id/pdf", requireRole("admin"), downloadSalesOrderPDF);

/* 🔥 Employee & Manager PDFs */
router.get("/employee-report", requireRole("admin", "manager"), downloadEmployeeReportPDF);
router.get("/bulk-employee-report", requireRole("admin", "manager"), downloadBulkEmployeeReportPDF);
router.get("/salary-slip", requireRole("admin", "manager"), downloadSalarySlipPDF);

export default router;