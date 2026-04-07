import mongoose from "mongoose";
import PurchaseEnquiry from "../models/PurchaseEnquiry.js";
import SupplierQuote from "../models/SupplierQuote.js";
import BaseRate from "../models/BaseRate.js";
import { validatePurchaseEnquiry } from "../validators/purchaseEnquiry.validator.js";
import { validateSupplierQuote } from "../validators/supplierQuote.validator.js";

/* ================= CREATE ENQUIRY ================= */
export const createEnquiry = async (req, res) => {
    try {

        const { isValid, errors } = validatePurchaseEnquiry(req.body);

        if (!isValid) {
            return res.status(400).json({ errors });
        }

        const { product } = req.body;

        const baseRate = await BaseRate.findOne({
            product,
            isActive: true
        }).sort({ date: -1 });

        if (!baseRate) {
            return res.status(400).json({
                message: "Base rate not found for product"
            });
        }

        const enquiry = await PurchaseEnquiry.create({
            ...req.body,
            baseRate: baseRate.rate
        });

        res.status(201).json(enquiry);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to create enquiry" });
    }
};


/* ================= ADD SUPPLIER QUOTE ================= */
export const addSupplierQuote = async (req, res) => {
    try {

        const { enquiryId } = req.params;

        const { isValid, errors } = validateSupplierQuote(req.body);

        if (!isValid) {
            return res.status(400).json({ errors });
        }

        const enquiry = await PurchaseEnquiry.findById(enquiryId);

        if (!enquiry || !enquiry.isActive) {
            return res.status(404).json({ message: "Enquiry not found" });
        }

        if (enquiry.status !== "open") {
            return res.status(400).json({
                message: "Cannot add quotes to closed enquiry"
            });
        }

        const { supplier, difference = 0, transport = 0, loading = 0 } = req.body;

        const diff = Number(difference);
        const trans = Number(transport);
        const load = Number(loading);

        if (isNaN(diff) || isNaN(trans) || isNaN(load)) {
            return res.status(400).json({
                message: "Invalid numeric values"
            });
        }

        if (trans < 0 || load < 0) {
            return res.status(400).json({
                message: "Transport/loading cannot be negative"
            });
        }

        /* 🔥 CALCULATION */
        const base = Number(enquiry.baseRate);
        const price = base + diff;

        const itemTotal = price * Number(enquiry.quantity);
        const subtotal = itemTotal + trans + load;
        const gstAmount = subtotal * 0.18;
        const finalAmount = subtotal + gstAmount;

        const quote = await SupplierQuote.create({
            enquiry: enquiryId,
            supplier,

            product: enquiry.product,
            variant: enquiry.variant,
            baseRate: base,

            difference: diff,
            transport: trans,
            loading: load,
            gst: 18,

            finalRate: price,
            quantity: enquiry.quantity,
            itemTotal,
            finalAmount
        });

        res.status(201).json(quote);

    } catch (error) {

        if (error.code === 11000) {
            return res.status(400).json({
                message: "Supplier already added to this enquiry"
            });
        }

        console.error(error);
        res.status(500).json({ message: "Failed to add supplier quote" });
    }
};


/* ================= SELECT SUPPLIER ================= */
export const selectSupplier = async (req, res) => {

    const session = await mongoose.startSession();
    session.startTransaction();

    try {

        const { enquiryId, quoteId } = req.params;

        const enquiry = await PurchaseEnquiry.findById(enquiryId).session(session);

        if (!enquiry) {
            throw new Error("Enquiry not found");
        }

        if (enquiry.status === "ordered") {
            throw new Error("Enquiry already converted to order");
        }

        if (enquiry.status !== "open") {
            throw new Error("Supplier already selected");
        }

        const quote = await SupplierQuote.findById(quoteId).session(session);

        if (!quote) {
            throw new Error("Quote not found");
        }

        if (quote.enquiry.toString() !== enquiryId) {
            throw new Error("Quote does not belong to this enquiry");
        }

        await SupplierQuote.updateMany(
            { enquiry: enquiryId },
            { isSelected: false },
            { session }
        );

        quote.isSelected = true;
        await quote.save({ session });

        enquiry.selectedQuote = quoteId;
        enquiry.status = "selected";

        await enquiry.save({ session });

        await session.commitTransaction();
        session.endSession();

        res.json({
            message: "Supplier selected",
            enquiry
        });

    } catch (error) {

        await session.abortTransaction();
        session.endSession();

        res.status(400).json({
            message: error.message || "Failed to select supplier"
        });
    }
};


/* ================= GET ENQUIRIES ================= */
export const getEnquiries = async (req, res) => {
    try {
        const data = await PurchaseEnquiry.find({ isActive: true })
            .populate("product", "name")
            .populate("variant")
            .populate("company", "name")
            .populate("selectedQuote")
            .sort({ createdAt: -1 });

        res.json(data);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch enquiries" });
    }
};


/* ================= GET SINGLE ENQUIRY ================= */
export const getEnquiryById = async (req, res) => {
    try {
        const { enquiryId } = req.params;

        const enquiry = await PurchaseEnquiry.findById(enquiryId)
            .populate("product", "name")
            .populate("company", "name")
            .populate("variant")
            .populate("selectedQuote")
            .lean();

        if (!enquiry) {
            return res.status(404).json({ message: "Enquiry not found" });
        }

        const quotes = await SupplierQuote.find({ enquiry: enquiryId })
            .populate("supplier", "name")
            .lean();

        res.json({
            ...enquiry,
            quotes,
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to fetch enquiry" });
    }
};


/* ================= UPDATE ENQUIRY ================= */
export const updateEnquiry = async (req, res) => {
    try {
        const { enquiryId } = req.params;

        const enquiry = await PurchaseEnquiry.findById(enquiryId);

        if (!enquiry) {
            return res.status(404).json({ message: "Enquiry not found" });
        }

        if (enquiry.status !== "open") {
            return res.status(400).json({
                message: "Cannot edit after supplier selection"
            });
        }

        const { quantity, unit, notes } = req.body;

        if (quantity !== undefined) {
            const qty = Number(quantity);
            if (qty <= 0) {
                return res.status(400).json({
                    message: "Quantity must be greater than 0"
                });
            }
            enquiry.quantity = qty;
        }

        if (unit) enquiry.unit = unit;
        if (notes !== undefined) enquiry.notes = notes;

        await enquiry.save();

        res.json(enquiry);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to update enquiry" });
    }
};


/* ================= UPDATE QUOTE ================= */
export const updateQuote = async (req, res) => {
    try {
        const { quoteId } = req.params;

        const quote = await SupplierQuote.findById(quoteId);

        if (!quote) {
            return res.status(404).json({ message: "Quote not found" });
        }

        const enquiry = await PurchaseEnquiry.findById(quote.enquiry);

        if (enquiry.status !== "open") {
            return res.status(400).json({
                message: "Cannot edit after selection"
            });
        }

        const diff = Number(req.body.difference || 0);
        const trans = Number(req.body.transport || 0);
        const load = Number(req.body.loading || 0);

        if (isNaN(diff) || isNaN(trans) || isNaN(load)) {
            return res.status(400).json({
                message: "Invalid numeric values"
            });
        }

        const base = Number(enquiry.baseRate);
        const price = base + diff;

        /* 🔥 FIXED CALCULATION */
        const itemTotal = price * Number(enquiry.quantity);
        const subtotal = itemTotal + trans + load;
        const gstAmount = subtotal * 0.18;
        const finalAmount = subtotal + gstAmount;

        quote.difference = diff;
        quote.transport = trans;
        quote.loading = load;
        quote.finalRate = price;
        quote.itemTotal = itemTotal;
        quote.finalAmount = finalAmount;

        await quote.save();

        res.json(quote);

    } catch (error) {
        res.status(500).json({ message: "Failed to update quote" });
    }
};