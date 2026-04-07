import mongoose from "mongoose";

/* ================= ITEM ================= */
const orderItemSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true
    },

    variant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Variant",
        required: true
    },

    quantity: {
        type: Number,
        required: true,
        min: 0
    },

    unit: {
        type: String,
        enum: ["kg", "ton", "meter", "piece"],
        required: true
    },

    /* 🔥 SNAPSHOT FROM QUOTATION */
    baseRate: Number,
    difference: Number,
    costPrice: Number,
    sellingPrice: Number,
    finalAmount: Number,
    profit: Number

}, { _id: false });

/* ================= MAIN ================= */
const salesOrderSchema = new mongoose.Schema({

    quotation: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "SalesQuotation",
        required: true,
        unique: true // 🔥 1 quotation = 1 order
    },

    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Customer",
        required: true
    },

    items: [orderItemSchema],

    /* 🔥 TOTAL SNAPSHOT */
    totalAmount: Number,
    transportCost: Number,
    loadingCost: Number,

    gstPercent: Number,
    gstAmount: Number,

    finalTotal: Number,

    /* 🔥 ORDER STATUS */
    status: {
        type: String,
        enum: [
            "pending",
            "confirmed",
            "partially_dispatched",
            "dispatched",
            "partially_delivered",
            "completed",
            "cancelled"
        ],
        default: "pending",
        index: true
    },

    isActive: {
        type: Boolean,
        default: true
    }

}, { timestamps: true });

/* ================= INDEX ================= */
salesOrderSchema.index({ customer: 1, createdAt: -1 });

export default mongoose.model("SalesOrder", salesOrderSchema);