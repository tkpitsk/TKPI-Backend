import { generatePDF } from "../pdf/pdf.service.js";
import { purchaseOrderTemplate } from "../pdf/templates/purchaseOrder.template.js";
import PurchaseOrder from "../models/PurchaseOrder.js";
import PurchaseEnquiry from "../models/PurchaseEnquiry.js";
import SupplierQuote from "../models/SupplierQuote.js";
import SalesQuotation from "../models/SalesQuotation.js";
import { salesQuotationTemplate } from "../pdf/templates/salesQuotation.template.js";
import SalesInvoice from "../models/SalesInvoice.js";
import { salesInvoiceTemplate } from "../pdf/templates/salesInvoice.template.js";
import SalesOrder from "../models/SalesOrder.js";
import { salesOrderTemplate } from "../pdf/templates/salesOrder.template.js";
import User from "../models/User.js";
import Attendance from "../models/Attendance.js";
import Advance from "../models/Advance.js";
import { employeeReportTemplate } from "../pdf/templates/employeeReport.template.js";
import { calculateSalary } from "../services/salary.service.js";
import { salarySlipTemplate } from "../pdf/templates/salarySlip.template.js";


/* ================= ENQUIRY PDF ================= */
export const downloadPurchaseEnquiryPDF = async (req, res) => {
    try {
        const enquiry = await PurchaseEnquiry.findById(req.params.id)
            .populate("company")
            .populate("product")
            .populate("variant");

        if (!enquiry) {
            return res.status(404).json({
                message: "Enquiry not found"
            });
        }

        /* 🔥 GET ALL QUOTES */
        const quotes = await SupplierQuote.find({
            enquiry: enquiry._id
        }).populate("supplier");

        /* 🔥 CALCULATE BEST QUOTE */
        const bestQuote =
            quotes.length > 0
                ? quotes.reduce((min, q) =>
                    q.finalAmount < min.finalAmount ? q : min
                )
                : null;

        const html = `
            <h2>Purchase Enquiry</h2>
            <p><strong>Product:</strong> ${enquiry.product?.name}</p>
            <p><strong>Variant:</strong> ${enquiry.variant?.size || ""}</p>
            <p><strong>Quantity:</strong> ${enquiry.quantity} ${enquiry.unit}</p>
            <p><strong>Company:</strong> ${enquiry.company?.name}</p>

            <h3>Supplier Quotes</h3>
            <ul>
                ${quotes
                .map(
                    (q) => `
                    <li>
                        ${q.supplier?.name} → ₹${q.finalAmount}
                        ${bestQuote?._id.toString() === q._id.toString()
                            ? " (Best)"
                            : ""
                        }
                    </li>
                `
                )
                .join("")}
            </ul>
        `;

        const pdfBuffer = await generatePDF(html);

        res.set({
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename=enquiry-${enquiry._id}.pdf`
        });

        res.send(pdfBuffer);

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Failed to generate enquiry PDF"
        });
    }
};

/* ================= ORDER PDF ================= */
export const downloadPurchaseOrderPDF = async (req, res) => {
    try {
        const order = await PurchaseOrder.findById(req.params.id)
            .populate("company")
            .populate("supplier")
            .populate("items.product")
            .populate("items.variant")
            .lean();

        if (!order) {
            return res.status(404).json({
                message: "Order not found"
            });
        }

        /* 🔥 CALCULATE TOTALS (IMPORTANT FIX) */
        const subtotal = order.items.reduce(
            (sum, i) =>
                sum + (i.baseRate + i.difference) * i.quantity,
            0
        );

        const transport = order.items.reduce(
            (sum, i) => sum + (i.transport || 0),
            0
        );

        const loading = order.items.reduce(
            (sum, i) => sum + (i.loading || 0),
            0
        );

        const gst = (subtotal + transport + loading) * 0.18;

        const finalAmount =
            subtotal + transport + loading + gst;

        /* 🔥 GENERATE TEMPLATE */
        const html = purchaseOrderTemplate({
            company: order.company,
            supplier: order.supplier,
            items: order.items,
            totals: {
                subtotal,
                transport,
                loading,
                gst,
                finalAmount
            },
            orderNumber: order._id,
            date: new Date(order.createdAt).toDateString()
        });

        const pdfBuffer = await generatePDF(html);

        res.set({
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename=po-${order._id}.pdf`
        });

        res.send(pdfBuffer);

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Failed to generate PO PDF"
        });
    }
};


/* ================= INVOICE PDF ================= */
export const downloadSalesInvoicePDF = async (req, res) => {
    try {

        const invoice = await SalesInvoice.findById(req.params.id)
            .populate("customer")
            .populate("items.product")
            .populate("items.variant")
            .lean();

        if (!invoice) {
            return res.status(404).json({
                message: "Invoice not found"
            });
        }

        const html = salesInvoiceTemplate({
            company: {
                name: "Karan Pole Industries", // 🔥 replace later from DB
                address: "Your Address",
                phone: "Your Phone",
                gstNumber: "Your GST"
            },
            customer: invoice.customer,
            items: invoice.items,
            totals: {
                subtotal: invoice.subtotal,
                gst: invoice.gst,
                totalAmount: invoice.totalAmount,
                paidAmount: invoice.paidAmount,
                dueAmount: invoice.dueAmount,
            },
            invoiceNumber: invoice.invoiceNumber,
            date: new Date(invoice.createdAt).toDateString()
        });

        const pdfBuffer = await generatePDF(html);

        res.set({
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename=invoice-${invoice.invoiceNumber}.pdf`
        });

        res.send(pdfBuffer);

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Failed to generate invoice PDF"
        });
    }
};

/* ================= SALES QUOTATION PDF ================= */
export const downloadSalesQuotationPDF = async (req, res) => {
    try {
        const quotation = await SalesQuotation.findById(req.params.id)
            .populate("customer")
            .populate("items.product")
            .populate("items.variant")
            .lean();

        if (!quotation) {
            return res.status(404).json({
                message: "Quotation not found"
            });
        }

        const html = salesQuotationTemplate({
            company: {
                name: "Karan Pole Industries", // replace later from DB
                address: "Your Address",
                phone: "Your Phone",
                gstNumber: "Your GST"
            },
            customer: quotation.customer,
            items: quotation.items,
            totals: {
                totalAmount: quotation.totalAmount,
                transportCost: quotation.transportCost,
                loadingCost: quotation.loadingCost,
                subtotal:
                    Number(quotation.totalAmount || 0) +
                    Number(quotation.transportCost || 0) +
                    Number(quotation.loadingCost || 0),
                gstPercent: quotation.gstPercent,
                gstAmount: quotation.gstAmount,
                finalTotal: quotation.finalTotal,
            },
            quotationNumber: quotation.quotationNumber || quotation._id,
            status: quotation.status,
            notes: quotation.notes,
            date: new Date(quotation.createdAt).toDateString()
        });

        const pdfBuffer = await generatePDF(html);

        res.set({
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename=quotation-${quotation.quotationNumber || quotation._id}.pdf`
        });

        res.send(pdfBuffer);

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Failed to generate quotation PDF"
        });
    }
};


/* ================= SALES ORDER PDF ================= */
export const downloadSalesOrderPDF = async (req, res) => {
    try {

        const order = await SalesOrder.findById(req.params.id)
            .populate("customer")
            .populate("items.product")
            .populate("items.variant")
            .lean();

        if (!order) {
            return res.status(404).json({
                message: "Order not found"
            });
        }

        const html = salesOrderTemplate({
            company: {
                name: "Karan Pole Industries",
                address: "Your Address",
                phone: "Your Phone",
                gstNumber: "Your GST"
            },
            customer: order.customer,
            items: order.items,
            totals: {
                totalAmount: order.totalAmount,
                transportCost: order.transportCost,
                loadingCost: order.loadingCost,
                gstAmount: order.gstAmount,
                finalTotal: order.finalTotal,
            },
            orderNumber: order._id,
            status: order.status,
            date: new Date(order.createdAt).toDateString()
        });

        const pdfBuffer = await generatePDF(html);

        res.set({
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename=order-${order._id}.pdf`
        });

        res.send(pdfBuffer);

    } catch (error) {
        res.status(500).json({
            message: "Failed to generate order PDF"
        });
    }
};


export const downloadEmployeeReportPDF = async (req, res) => {
    try {
        const { employeeId, start, end, type } = req.query;

        const employee = await User.findById(employeeId);

        if (!employee) {
            return res.status(404).json({ message: "Employee not found" });
        }

        const attendance = await Attendance.find({
            employee: employeeId,
            date: { $gte: new Date(start), $lte: new Date(end) }
        });

        const advances = await Advance.find({
            employee: employeeId,
            date: { $gte: new Date(start), $lte: new Date(end) }
        });

        const advanceMap = new Map();
        advances.forEach(a => {
            advanceMap.set(
                new Date(a.date).toDateString(),
                a.amount
            );
        });

        const records = attendance.map(a => ({
            date: a.date,
            status: a.status,
            advance: advanceMap.get(new Date(a.date).toDateString()) || 0
        }));

        /* SUMMARY */
        let present = 0, absent = 0, halfDay = 0;

        attendance.forEach(a => {
            if (a.status === "present") present++;
            else if (a.status === "absent") absent++;
            else halfDay++;
        });

        const totalAdvance = advances.reduce((sum, a) => sum + a.amount, 0);

        const html = employeeReportTemplate({
            employee,
            records,
            summary: { present, absent, halfDay, totalAdvance },
            title: `${type.toUpperCase()} REPORT`
        });

        const pdfBuffer = await generatePDF(html);

        res.set({
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename=${type}-report.pdf`
        });

        res.send(pdfBuffer);

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};


export const downloadSalarySlipPDF = async (req, res) => {
    try {
        const { employeeId, start, end } = req.query;

        const employee = await User.findById(employeeId);

        if (!employee) {
            return res.status(404).json({
                message: "Employee not found"
            });
        }

        const data = await calculateSalary({
            employee,
            startDate: new Date(start),
            endDate: new Date(end)
        });

        const html = salarySlipTemplate({
            employee,
            period: { start, end },
            data
        });

        const pdfBuffer = await generatePDF(html);

        res.set({
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename=salary-slip.pdf`
        });

        res.send(pdfBuffer);

    } catch (err) {
        res.status(500).json({
            message: err.message
        });
    }
};