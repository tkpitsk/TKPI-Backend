import mongoose from "mongoose";
import GRN from "../models/GRN.js";
import PurchaseOrder from "../models/PurchaseOrder.js";
import Stock from "../models/Stock.js";
import StockMovement from "../models/StockMovement.js";

/* ================= CREATE GRN ================= */
export const createGRN = async (req, res) => {

    const session = await mongoose.startSession();
    session.startTransaction();

    try {

        const { purchaseOrderId, receivedItems, notes } = req.body;

        const order = await PurchaseOrder.findById(purchaseOrderId).session(session);

        if (!order || !order.isActive) {
            throw new Error("Purchase order not found or inactive");
        }

        if (order.status === "completed") {
            throw new Error("Order already fully received");
        }

        if (order.status !== "confirmed" && order.status !== "partially_received") {
            throw new Error("Order must be confirmed before GRN");
        }

        if (!Array.isArray(receivedItems) || receivedItems.length === 0) {
            throw new Error("Received items required");
        }

        /* MAP ORDER ITEMS */
        const orderMap = new Map();
        order.items.forEach(item => {
            orderMap.set(item.variant.toString(), item);
        });

        /* ================= VALIDATION ================= */
        for (const item of receivedItems) {

            const orderItem = orderMap.get(item.variant);

            if (!orderItem) {
                throw new Error("Invalid variant in GRN");
            }

            if (
                orderItem.product.toString() !== item.product ||
                orderItem.variant.toString() !== item.variant
            ) {
                throw new Error("Product/variant mismatch in GRN");
            }

            if (item.unit && orderItem.unit !== item.unit) {
                throw new Error("Unit mismatch in GRN");
            }

            const alreadyReceived = orderItem.receivedQty || 0;

            if (!item.receivedQty || Number(item.receivedQty) <= 0) {
                throw new Error("Received quantity must be greater than 0");
            }

            if (Number(item.receivedQty) + alreadyReceived > orderItem.quantity) {
                throw new Error("Receiving more than ordered quantity");
            }
        }

        const existingGRN = await GRN.findOne({
            purchaseOrder: purchaseOrderId,
            receivedItems: { $eq: receivedItems },
            isActive: true
        }).session(session);

        if (existingGRN) {
            throw new Error("Duplicate GRN detected");
        }

        /* ================= CREATE GRN ================= */
        const [grn] = await GRN.create([{
            purchaseOrder: purchaseOrderId,
            receivedItems,
            notes
        }], { session });

        /* ================= UPDATE STOCK ================= */
        const stockOps = [];

        for (const item of receivedItems) {

            const stock = await Stock.findOne({
                variant: item.variant
            }).session(session);

            if (!stock) {
                throw new Error("Stock not found for variant");
            }

            const previousStock = stock.quantity;

            stock.quantity += item.receivedQty;

            await stock.save({ session });

            stockOps.push({
                product: item.product,
                variant: item.variant,
                type: "purchase",
                quantity: item.receivedQty,
                previousStock,
                newStock: stock.quantity,
                referenceId: grn._id,
                referenceModel: "GRN",
                notes: "Stock added via GRN",
                createdBy: req.user?._id || null
            });
        }

        /* BULK INSERT */
        await StockMovement.insertMany(stockOps, { session });

        /* ================= UPDATE ORDER ================= */
        let allReceived = true;

        for (const item of receivedItems) {

            const orderItem = order.items.find(
                i => i.variant.toString() === item.variant
            );

            orderItem.receivedQty =
                (orderItem.receivedQty || 0) + item.receivedQty;

            if (orderItem.receivedQty < orderItem.quantity) {
                allReceived = false;
            }
        }

        order.status = allReceived ? "completed" : "partially_received";

        await order.save({ session });

        /* ================= COMMIT ================= */
        await session.commitTransaction();
        session.endSession();

        res.status(201).json(grn);

    } catch (error) {

        await session.abortTransaction();
        session.endSession();

        console.error(error);

        res.status(400).json({
            message: error.message || "Failed to create GRN"
        });
    }
};


/* ================= GET GRNs ================= */
export const getGRNsByOrder = async (req, res) => {
    try {

        const { purchaseOrderId } = req.params;

        const grns = await GRN.find({
            purchaseOrder: purchaseOrderId,
            isActive: true
        })
            .populate("receivedItems.product", "name")
            .populate("receivedItems.variant");

        res.json(grns);

    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch GRNs"
        });
    }
};


/* ================= DEACTIVATE GRN ================= */
export const deactivateGRN = async (req, res) => {

    const session = await mongoose.startSession();
    session.startTransaction();

    try {

        const grn = await GRN.findById(req.params.id).session(session);

        if (!grn) {
            throw new Error("GRN not found");
        }

        if (!grn.isActive) {
            throw new Error("GRN already deleted");
        }

        const order = await PurchaseOrder.findById(grn.purchaseOrder).session(session);

        /* ================= ROLLBACK STOCK ================= */
        for (const item of grn.receivedItems) {

            const stock = await Stock.findOne({
                variant: item.variant
            }).session(session);

            if (!stock) continue;

            if (stock.quantity < item.receivedQty) {
                throw new Error("Cannot rollback, stock already used");
            }

            const previousStock = stock.quantity;

            stock.quantity -= item.receivedQty;

            await stock.save({ session });

            /* CREATE REVERSE MOVEMENT */
            await StockMovement.create([{
                product: item.product,
                variant: item.variant,
                type: "return_out",
                quantity: item.receivedQty,
                previousStock,
                newStock: stock.quantity,
                referenceId: grn._id,
                referenceModel: "GRN",
                notes: "Stock rollback via GRN delete",
                createdBy: req.user?._id || null
            }], { session });

            /* ROLLBACK ORDER RECEIVED QTY */
            const orderItem = order.items.find(
                i => i.variant.toString() === item.variant.toString()
            );

            if (orderItem) {
                orderItem.receivedQty -= item.receivedQty;
            }
        }

        /* ================= UPDATE ORDER STATUS ================= */
        const allReceived = order.items.every(
            i => (i.receivedQty || 0) >= i.quantity
        );

        const anyReceived = order.items.some(
            i => (i.receivedQty || 0) > 0
        );

        if (allReceived) {
            order.status = "completed";
        } else if (anyReceived) {
            order.status = "partially_received";
        } else {
            order.status = "confirmed";
        }

        await order.save({ session });

        /* ================= DEACTIVATE GRN ================= */
        grn.isActive = false;
        await grn.save({ session });

        await session.commitTransaction();
        session.endSession();

        res.json({ message: "GRN deactivated successfully" });

    } catch (error) {

        await session.abortTransaction();
        session.endSession();

        res.status(400).json({
            message: error.message || "Failed to delete GRN"
        });
    }
};