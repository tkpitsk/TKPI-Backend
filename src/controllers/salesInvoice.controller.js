import mongoose from "mongoose";
import SalesInvoice from "../models/SalesInvoice.js";
import SalesOrder from "../models/SalesOrder.js";
import Ledger from "../models/Ledger.js";

/* ================= CREATE INVOICE ================= */
export const createInvoice = async (req, res) => {

    const session = await mongoose.startSession();
    session.startTransaction();

    try {

        const { orderId } = req.params;
        const { gstPercent = 18 } = req.body;

        const order = await SalesOrder.findById(orderId).session(session);

        if (!order || order.status !== "completed") {
            throw new Error("Order must be fully delivered");
        }

        const existing = await SalesInvoice.findOne({ order: orderId });

        if (existing) {
            throw new Error("Invoice already exists");
        }

        /* ================= ITEMS ================= */
        const items = order.items.map(i => ({
            product: i.product,
            variant: i.variant,
            quantity: i.deliveredQty,
            unit: i.unit,
            sellingPrice: i.sellingPrice,
            amount: i.sellingPrice * i.deliveredQty
        }));

        const subtotal = items.reduce((sum, i) => sum + i.amount, 0);
        const gst = (subtotal * gstPercent) / 100;
        const totalAmount = subtotal + gst;

        const [invoice] = await SalesInvoice.create([{
            customer: order.customer,
            order: orderId,
            items,
            subtotal,
            gstPercent,
            gst,
            totalAmount,
            paidAmount: 0,
            dueAmount: totalAmount,
            paymentStatus: "unpaid"
        }], { session });

        /* ================= LEDGER ENTRY ================= */
        await Ledger.create([{
            type: "debit", // customer owes
            amount: totalAmount,
            entityType: "customer",
            entityId: order.customer,
            referenceType: "invoice",
            referenceId: invoice._id,
            note: "Invoice created"
        }], { session });

        await session.commitTransaction();

        res.status(201).json({
            success: true,
            data: invoice
        });

    } catch (error) {

        await session.abortTransaction();

        res.status(400).json({
            success: false,
            message: error.message
        });

    } finally {
        session.endSession();
    }
};


/* ================= GET ALL INVOICES ================= */
export const getInvoices = async (req, res) => {
    try {

        const {
            page = 1,
            limit = 10,
            status,
            paymentStatus,
            customer,
            fromDate,
            toDate
        } = req.query;

        const filter = {};

        if (status) filter.status = status;
        if (paymentStatus) filter.paymentStatus = paymentStatus;
        if (customer) filter.customer = customer;

        if (fromDate || toDate) {
            filter.createdAt = {};
            if (fromDate) filter.createdAt.$gte = new Date(fromDate);
            if (toDate) filter.createdAt.$lte = new Date(toDate);
        }

        const skip = (page - 1) * limit;

        const [data, total] = await Promise.all([
            SalesInvoice.find(filter)
                .populate("customer", "name")
                .populate("order")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(Number(limit)),

            SalesInvoice.countDocuments(filter)
        ]);

        res.json({
            success: true,
            page: Number(page),
            limit: Number(limit),
            total,
            totalPages: Math.ceil(total / limit),
            data
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch invoices"
        });
    }
};


/* ================= GET ONE INVOICE ================= */
export const getInvoiceById = async (req, res) => {
    try {

        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid invoice ID"
            });
        }

        const invoice = await SalesInvoice.findById(id)
            .populate("customer")
            .populate("order")
            .populate("items.product")
            .populate("items.variant");

        if (!invoice) {
            return res.status(404).json({
                success: false,
                message: "Invoice not found"
            });
        }

        res.json({
            success: true,
            data: invoice
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch invoice"
        });
    }
};


/* ================= CANCEL INVOICE ================= */
export const cancelInvoice = async (req, res) => {

    const session = await mongoose.startSession();
    session.startTransaction();

    try {

        const { id } = req.params;

        const invoice = await SalesInvoice.findById(id).session(session);

        if (!invoice) throw new Error("Invoice not found");

        if (invoice.status === "cancelled") {
            throw new Error("Invoice already cancelled");
        }

        if (invoice.paidAmount > 0) {
            throw new Error("Cannot cancel invoice with payment received");
        }

        /* ================= LEDGER REVERSAL ================= */
        await Ledger.create([{
            type: "credit",
            amount: invoice.totalAmount,
            entityType: "customer",
            entityId: invoice.customer,
            referenceType: "invoice",
            referenceId: invoice._id,
            note: "Invoice cancelled"
        }], { session });

        invoice.status = "cancelled";
        invoice.paymentStatus = "unpaid";
        invoice.paidAmount = 0;
        invoice.dueAmount = 0;

        await invoice.save({ session });

        await session.commitTransaction();

        res.json({
            success: true,
            message: "Invoice cancelled successfully"
        });

    } catch (error) {

        await session.abortTransaction();

        res.status(400).json({
            success: false,
            message: error.message
        });

    } finally {
        session.endSession();
    }
};