import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import morgan from "morgan";

/* ROUTES */
import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import productRoutes from "./routes/product.routes.js";
import categoryRoutes from "./routes/category.routes.js";
import baseRateRoutes from "./routes/baseRate.routes.js";
import companyRoutes from "./routes/company.routes.js";
import supplierRoutes from "./routes/supplier.routes.js";
import purchaseRoutes from "./routes/purchase.routes.js";
import pdfRoutes from "./routes/pdf.routes.js";
import supplierComparisonRoutes from "./routes/supplierComparison.routes.js";
import grnRoutes from "./routes/grn.routes.js";
import customerRoutes from "./routes/customer.routes.js";
import salesQuotationRoutes from "./routes/salesQuotation.routes.js";
import salesOrderRoutes from "./routes/salesOrder.routes.js";
import salesInvoiceRoutes from "./routes/salesInvoice.routes.js";
import stockMovementRoutes from "./routes/stockMovement.routes.js";
import ledgerRoutes from "./routes/ledger.routes.js";
import paymentRoutes from "./routes/payment.routes.js";
import reminderRoutes from "./routes/reminder.routes.js";
import attendanceRoutes from "./routes/attendance.routes.js";
import advanceRoutes from "./routes/advance.routes.js";
import heroMediaRoutes from "./routes/heroMedia.routes.js";
import employeeReportRoutes from "./routes/employeeReport.routes.js";
import salaryRoutes from "./routes/salary.routes.js";
import employeeDashboardRoutes from "./routes/employeeDashboard.routes.js";


const app = express();

/* ================= SECURITY ================= */

app.use(helmet());

app.use(cors());

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 500
});
app.use(limiter);

/* ================= LOGGING ================= */

/* Use detailed logs in dev, minimal in production */
if (process.env.NODE_ENV === "development") {
    app.use(morgan("dev"));       // colorful, detailed
} else {
    app.use(morgan("combined"));  // standard production logs
}

/* ================= BODY PARSER ================= */

app.use(express.json({
    limit: "10mb"
}));

app.use(cookieParser());

/* ================= ROUTES ================= */

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/base-rates", baseRateRoutes);
app.use("/api/companies", companyRoutes);
app.use("/api/suppliers", supplierRoutes);
app.use("/api/stock-movements", stockMovementRoutes);
app.use("/api/purchase", purchaseRoutes);
app.use("/api/pdf", pdfRoutes);
app.use("/api/supplier-comparison", supplierComparisonRoutes);
app.use("/api/grn", grnRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/sales-quotation", salesQuotationRoutes);
app.use("/api/sales-order", salesOrderRoutes);
app.use("/api/sales-invoice", salesInvoiceRoutes);
app.use("/api/ledger", ledgerRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/reminders", reminderRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/advance", advanceRoutes);
app.use("/api/hero-media", heroMediaRoutes);
app.use("/api/employee-report", employeeReportRoutes);
app.use("/api/salary", salaryRoutes);
app.use("/api/employee-dashboard", employeeDashboardRoutes);

/* ================= HEALTH CHECK ================= */

app.get("/api/health", (req, res) => {
    res.json({ status: "OK" });
});

/* ================= 404 HANDLER ================= */

app.use((req, res) => {
    res.status(404).json({
        message: "Route not found"
    });
});

/* ================= GLOBAL ERROR HANDLER ================= */

app.use((err, req, res, next) => {
    console.error("🔥 Error:", err.message);

    res.status(err.status || 500).json({
        message: err.message || "Internal Server Error"
    });
});

export default app;