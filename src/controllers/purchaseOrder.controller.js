import PurchaseOrder from "../models/PurchaseOrder.js";
import PurchaseEnquiry from "../models/PurchaseEnquiry.js";
import SupplierQuote from "../models/SupplierQuote.js";
import { validateOrderItem } from "../validators/purchaseOrder.validator.js";

/* ================= CREATE ORDER ================= */
export const createOrderFromEnquiry = async (req, res) => {
    try {
        const { enquiryId } = req.params;

        const enquiry = await PurchaseEnquiry.findById(enquiryId);

        /* ✅ VALIDATION */
        if (!enquiry || enquiry.status !== "selected") {
            return res.status(400).json({
                message: "Enquiry must have selected supplier"
            });
        }

        /* ✅ PREVENT DUPLICATE */
        const existingOrder = await PurchaseOrder.findOne({ enquiry: enquiryId });

        if (existingOrder) {
            return res.status(400).json({
                message: "Order already created for this enquiry"
            });
        }

        const quote = await SupplierQuote.findById(enquiry.selectedQuote);

        if (!quote) {
            return res.status(400).json({
                message: "Selected supplier not found"
            });
        }

        /* 🔥 CREATE SAFE SNAPSHOT */
        const item = {
            product: enquiry.product,
            variant: enquiry.variant,
            quantity: enquiry.quantity,
            unit: enquiry.unit,

            baseRate: enquiry.baseRate,
            difference: quote.difference,
            transport: quote.transport,
            loading: quote.loading,
            gst: quote.gst,

            finalAmount: Number(quote.finalAmount || 0),

            receivedQty: 0 // ✅ REQUIRED FOR GRN
        };

        const totalAmount = Number(item.finalAmount || 0);

        const order = await PurchaseOrder.create({
            company: enquiry.company,
            supplier: quote.supplier,
            enquiry: enquiryId,
            items: [item],
            totalAmount,
            status: "draft"
        });

        /* ✅ UPDATE ENQUIRY */
        enquiry.status = "ordered";
        await enquiry.save();

        /* ✅ POPULATE */
        const populatedOrder = await PurchaseOrder.findById(order._id)
            .populate("company", "name")
            .populate("supplier", "name")
            .populate("items.product", "name")
            .populate("items.variant");

        res.status(201).json(populatedOrder);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to create order" });
    }
};


/* ================= ADD ITEM ================= */
export const addItemToOrder = async (req, res) => {
    try {
        const { orderId } = req.params;
        const item = req.body;

        const order = await PurchaseOrder.findById(orderId);

        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        if (order.status !== "draft") {
            return res.status(400).json({
                message: "Cannot modify confirmed order"
            });
        }

        const errors = validateOrderItem(item);

        if (Object.keys(errors).length > 0) {
            return res.status(400).json({ errors });
        }

        /* 🔥 PREVENT DUPLICATE */
        const exists = order.items.find(
            i =>
                i.product.toString() === item.product &&
                i.variant.toString() === item.variant
        );

        if (exists) {
            return res.status(400).json({
                message: "Item already exists, update quantity instead"
            });
        }

        /* 🔒 SAFE CALCULATION (DO NOT TRUST FRONTEND) */
        const {
            product,
            variant,
            quantity,
            unit,
            baseRate = 0,
            difference = 0,
            transport = 0,
            loading = 0,
            gst = 18
        } = item;

        const qty = Number(quantity);
        const base = Number(baseRate);
        const diff = Number(difference);
        const trans = Number(transport);
        const load = Number(loading);
        const gstPercent = Number(gst);

        if (qty <= 0) {
            return res.status(400).json({
                message: "Quantity must be greater than 0"
            });
        }

        const price = base + diff;
        const itemTotal = price * qty;
        const subtotal = itemTotal + trans + load;
        const gstAmount = subtotal * (gstPercent / 100);
        const finalAmount = subtotal + gstAmount;

        order.items.push({
            product,
            variant,
            quantity: qty,
            unit,
            baseRate: base,
            difference: diff,
            transport: trans,
            loading: load,
            gst: gstPercent,
            finalAmount,
            receivedQty: 0
        });

        /* ✅ UPDATE TOTAL */
        order.totalAmount = order.items.reduce(
            (sum, i) => sum + Number(i.finalAmount || 0),
            0
        );

        await order.save();

        /* ✅ POPULATE */
        const populated = await PurchaseOrder.findById(order._id)
            .populate("company", "name")
            .populate("supplier", "name")
            .populate("items.product", "name")
            .populate("items.variant");

        res.json(populated);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to add item" });
    }
};


/* ================= CONFIRM ORDER ================= */
export const confirmOrder = async (req, res) => {
    try {
        const order = await PurchaseOrder.findById(req.params.orderId);

        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        if (order.status !== "draft") {
            return res.status(400).json({
                message: "Order already confirmed"
            });
        }

        if (order.items.length === 0) {
            return res.status(400).json({
                message: "Cannot confirm empty order"
            });
        }

        order.status = "confirmed";
        await order.save();

        res.json({ message: "Order confirmed" });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to confirm order" });
    }
};


/* ================= GET ALL ORDERS ================= */
export const getOrders = async (req, res) => {
    try {
        const orders = await PurchaseOrder.find()
            .populate("supplier", "name")
            .populate("company", "name")
            .sort({ createdAt: -1 });

        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch orders" });
    }
};


/* ================= GET ORDER BY ID ================= */
export const getOrderById = async (req, res) => {
    try {
        const order = await PurchaseOrder.findById(req.params.orderId)
            .populate("supplier")
            .populate("company")
            .populate("items.product")
            .populate("items.variant");

        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        res.json(order);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch order" });
    }
};