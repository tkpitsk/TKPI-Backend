import mongoose from "mongoose";
import SalesOrder from "../models/SalesOrder.js";
import SalesQuotation from "../models/SalesQuotation.js";
import Stock from "../models/Stock.js";
import StockMovement from "../models/StockMovement.js";

/* ===================================================== */
/* ================= CREATE ORDER ======================= */
/* ===================================================== */

export const createOrderFromQuotation = async (req, res) => {

    const session = await mongoose.startSession();
    session.startTransaction();

    try {

        const { quotationId } = req.params;

        const quotation = await SalesQuotation.findById(quotationId).session(session);

        if (!quotation || quotation.status !== "approved") {
            throw new Error("Quotation must be approved");
        }

        /* 🔥 PREVENT DUPLICATE */
        const existing = await SalesOrder.findOne({
            quotation: quotationId
        }).session(session);

        if (existing) {
            throw new Error("Order already created");
        }

        /* ================= PREPARE ITEMS ================= */

        const items = quotation.items.map(i => ({
            product: i.product,
            variant: i.variant,
            quantity: i.quantity,
            unit: i.unit,

            baseRate: i.baseRate,
            difference: i.difference,
            costPrice: i.costPrice,
            sellingPrice: i.sellingPrice,
            finalAmount: i.finalAmount,
            profit: i.profit,

            deliveredQty: 0,
            dispatchedQty: 0
        }));

        /* ================= STOCK CHECK + RESERVE ================= */

        for (const item of items) {

            const stock = await Stock.findOne({
                variant: item.variant
            }).session(session);

            if (!stock) throw new Error("Stock not found");

            const available = stock.quantity - stock.reserved;

            if (available < item.quantity) {
                throw new Error("Insufficient stock");
            }

            stock.reserved += item.quantity;
            await stock.save({ session });
        }

        /* ================= CREATE ORDER ================= */

        const order = await SalesOrder.create([{
            customer: quotation.customer,
            quotation: quotationId,
            items,

            totalAmount: quotation.totalAmount,
            transportCost: quotation.transportCost,
            loadingCost: quotation.loadingCost,
            gstPercent: quotation.gstPercent,
            gstAmount: quotation.gstAmount,
            finalTotal: quotation.finalTotal,

            status: "confirmed"
        }], { session });

        await session.commitTransaction();
        session.endSession();

        return res.status(201).json({
            success: true,
            data: order[0]
        });

    } catch (error) {

        await session.abortTransaction();
        session.endSession();

        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};




/* ===================================================== */
/* ================= DISPATCH MODULE ==================== */
/* ===================================================== */

export const dispatchOrder = async (req, res) => {

    const session = await mongoose.startSession();
    session.startTransaction();

    try {

        const { orderId } = req.params;
        const { items } = req.body; // [{ variant, qty }]

        const order = await SalesOrder.findById(orderId).session(session);

        if (!order) throw new Error("Order not found");

        if (!["confirmed", "partially_dispatched"].includes(order.status)) {
            throw new Error("Order not ready for dispatch");
        }

        if (!Array.isArray(items) || items.length === 0) {
            throw new Error("Dispatch items required");
        }

        for (const dispatch of items) {

            const orderItem = order.items.find(
                i => i.variant.toString() === dispatch.variant
            );

            if (!orderItem) throw new Error("Invalid item");

            const remaining = orderItem.quantity - orderItem.dispatchedQty;

            if (dispatch.qty > remaining) {
                throw new Error("Dispatch exceeds remaining quantity");
            }

            const stock = await Stock.findOne({
                variant: dispatch.variant
            }).session(session);

            if (!stock) throw new Error("Stock not found");

            if (stock.quantity < dispatch.qty) {
                throw new Error("Insufficient stock for dispatch");
            }

            const prev = stock.quantity;

            /* 🔥 REDUCE STOCK */
            stock.quantity -= dispatch.qty;
            stock.reserved -= dispatch.qty;

            await stock.save({ session });

            /* 🔥 STOCK MOVEMENT */
            await StockMovement.create([{
                product: stock.product,
                variant: stock.variant,
                type: "sale",
                quantity: dispatch.qty,
                previousStock: prev,
                newStock: stock.quantity,
                referenceId: order._id,
                referenceModel: "Order",
                notes: "Dispatch",
                createdBy: req.user?._id || null
            }], { session });

            orderItem.dispatchedQty += dispatch.qty;
        }

        /* ================= UPDATE STATUS ================= */

        const allDispatched = order.items.every(
            i => i.dispatchedQty >= i.quantity
        );

        const anyDispatched = order.items.some(
            i => i.dispatchedQty > 0
        );

        if (allDispatched) {
            order.status = "dispatched";
        } else if (anyDispatched) {
            order.status = "partially_dispatched";
        }

        await order.save({ session });

        await session.commitTransaction();
        session.endSession();

        return res.json({
            success: true,
            data: order
        });

    } catch (error) {

        await session.abortTransaction();
        session.endSession();

        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};




/* ===================================================== */
/* ================= DELIVERY MODULE ==================== */
/* ===================================================== */

export const deliverOrder = async (req, res) => {

    const session = await mongoose.startSession();
    session.startTransaction();

    try {

        const { orderId } = req.params;
        const { items } = req.body;

        const order = await SalesOrder.findById(orderId).session(session);

        if (!order) throw new Error("Order not found");

        if (!["dispatched", "partially_dispatched"].includes(order.status)) {
            throw new Error("Order not ready for delivery");
        }

        for (const delivery of items) {

            const orderItem = order.items.find(
                i => i.variant.toString() === delivery.variant
            );

            if (!orderItem) throw new Error("Invalid item");

            const remaining =
                orderItem.dispatchedQty - orderItem.deliveredQty;

            if (delivery.qty > remaining) {
                throw new Error("Delivery exceeds dispatched quantity");
            }

            orderItem.deliveredQty += delivery.qty;
        }

        /* ================= STATUS ================= */

        const allDelivered = order.items.every(
            i => i.deliveredQty >= i.quantity
        );

        const anyDelivered = order.items.some(
            i => i.deliveredQty > 0
        );

        if (allDelivered) {
            order.status = "completed";
        } else if (anyDelivered) {
            order.status = "partially_delivered";
        }

        await order.save({ session });

        await session.commitTransaction();
        session.endSession();

        return res.json({
            success: true,
            data: order
        });

    } catch (error) {

        await session.abortTransaction();
        session.endSession();

        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


/* ================= GET ALL ORDERS ================= */
export const getOrders = async (req, res) => {
    try {

        const {
            page = 1,
            limit = 10,
            status,
            customer,
            fromDate,
            toDate
        } = req.query;

        const filter = {};

        if (status) filter.status = status;
        if (customer) filter.customer = customer;

        if (fromDate || toDate) {
            filter.createdAt = {};
            if (fromDate) filter.createdAt.$gte = new Date(fromDate);
            if (toDate) filter.createdAt.$lte = new Date(toDate);
        }

        const skip = (page - 1) * limit;

        const [data, total] = await Promise.all([
            SalesOrder.find(filter)
                .populate("customer", "name")
                .populate("quotation")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(Number(limit)),

            SalesOrder.countDocuments(filter)
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
            message: "Failed to fetch orders"
        });
    }
};


/* ================= GET ORDER ================= */
export const getOrderById = async (req, res) => {
    try {

        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid order ID"
            });
        }

        const order = await SalesOrder.findById(id)
            .populate("customer")
            .populate("quotation")
            .populate("items.product")
            .populate("items.variant");

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found"
            });
        }

        res.json({
            success: true,
            data: order
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch order"
        });
    }
};


/* ================= CUSTOMER ORDERS ================= */
export const getOrdersByCustomer = async (req, res) => {
    try {

        const { customerId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(customerId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid customer ID"
            });
        }

        const orders = await SalesOrder.find({ customer: customerId })
            .populate("quotation")
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            data: orders
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch customer orders"
        });
    }
};


/* ================= CANCEL ORDER ================= */
export const cancelOrder = async (req, res) => {

    const session = await mongoose.startSession();
    session.startTransaction();

    try {

        const { id } = req.params;

        const order = await SalesOrder.findById(id).session(session);

        if (!order) throw new Error("Order not found");

        if (order.status === "completed") {
            throw new Error("Cannot cancel completed order");
        }

        if (order.status === "cancelled") {
            throw new Error("Order already cancelled");
        }

        /* ================= ROLLBACK STOCK ================= */

        for (const item of order.items) {

            const stock = await Stock.findOne({
                variant: item.variant
            }).session(session);

            if (!stock) continue;

            const prev = stock.quantity;

            /* Restore reserved */
            stock.reserved = Math.max(
                0,
                stock.reserved - (item.quantity - item.deliveredQty)
            );

            /* Restore delivered stock */
            if (item.deliveredQty > 0) {
                stock.quantity += item.deliveredQty;
            }

            await stock.save({ session });

            /* Stock movement */
            await StockMovement.create([{
                product: item.product,
                variant: item.variant,
                type: "return_in",
                quantity: item.deliveredQty,
                previousStock: prev,
                newStock: stock.quantity,
                referenceId: order._id,
                referenceModel: "Order",
                notes: "Order cancelled rollback",
                createdBy: req.user._id
            }], { session });
        }

        order.status = "cancelled";

        await order.save({ session });

        await session.commitTransaction();
        session.endSession();

        res.json({
            success: true,
            message: "Order cancelled successfully"
        });

    } catch (error) {

        await session.abortTransaction();
        session.endSession();

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


/* ================= ORDER ANALYTICS ================= */
export const getOrderAnalytics = async (req, res) => {
    try {

        const totalOrders = await SalesOrder.countDocuments();

        const totalRevenueAgg = await SalesOrder.aggregate([
            { $match: { status: "completed" } },
            {
                $group: {
                    _id: null,
                    revenue: { $sum: "$totalAmount" }
                }
            }
        ]);

        const statusCounts = await SalesOrder.aggregate([
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 }
                }
            }
        ]);

        res.json({
            success: true,
            data: {
                totalOrders,
                totalRevenue: totalRevenueAgg[0]?.revenue || 0,
                statusBreakdown: statusCounts
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch analytics"
        });
    }
};