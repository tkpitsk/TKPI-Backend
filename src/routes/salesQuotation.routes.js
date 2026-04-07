import express from "express";

import authMiddleware from "../middleware/auth.middleware.js";
import requireRole from "../middleware/role.middleware.js";

import {
    createQuotation,
    getQuotations,
    getQuotationById,
    updateQuotationStatus
} from "../controllers/salesQuotation.controller.js";

const router = express.Router();

/* ================= AUTH ================= */
router.use(authMiddleware);

/* ================= ROLE CONTROL ================= */
/*
🔥 Flexible roles:
- admin → full access
- sales → create + view + update status
*/
router.use(requireRole("admin"));

/* ================= CREATE ================= */
router.post("/", createQuotation);

/* ================= LIST ================= */
router.get("/", getQuotations);

/* ================= GET ONE ================= */
router.get("/:id", getQuotationById);

/* ================= STATUS UPDATE ================= */
router.patch("/:id/status", updateQuotationStatus);


/* ===================================================== */
/* 🔥 FUTURE READY ROUTES (ERP FLOW) */
/* ===================================================== */

/*
✅ 1. CONVERT TO SALES ORDER
👉 This connects quotation → order flow

POST /api/sales-quotation/:id/convert-to-order
*/
//// router.post("/:id/convert-to-order", convertToSalesOrder);


/*
✅ 2. DUPLICATE QUOTATION
👉 Used heavily in real businesses

POST /api/sales-quotation/:id/duplicate
*/
//// router.post("/:id/duplicate", duplicateQuotation);


/*
✅ 3. SOFT DELETE
👉 Never hard delete in ERP

PATCH /api/sales-quotation/:id/deactivate
*/
//// router.patch("/:id/deactivate", deactivateQuotation);


/*
✅ 4. CUSTOMER HISTORY
👉 Important for CRM

GET /api/sales-quotation/customer/:customerId
*/
//// router.get("/customer/:customerId", getCustomerQuotations);


/*
✅ 5. BULK STATUS UPDATE
👉 Dashboard bulk actions

PATCH /api/sales-quotation/bulk/status
*/
//// router.patch("/bulk/status", bulkUpdateQuotationStatus);

export default router;