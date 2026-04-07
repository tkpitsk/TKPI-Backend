import mongoose from "mongoose";

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

    /* 🔥 SNAPSHOT PRICING */
    baseRate: Number,
    difference: Number,
    transport: Number,
    loading: Number,
    gst: Number,

    finalAmount: {
        type: Number,
        required: true
    },

    receivedQty: {
        type: Number,
        default: 0
    }

}, { _id: false });

const purchaseOrderSchema = new mongoose.Schema({

    company: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Company",
        required: true,
        index: true
    },

    supplier: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Supplier",
        required: true,
        index: true
    },

    enquiry: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "PurchaseEnquiry"
    },

    items: {
        type: [orderItemSchema],
        validate: v => v.length > 0
    },

    totalAmount: {
        type: Number,
        required: true
    },

    status: {
        type: String,
        enum: [
            "draft",
            "confirmed",
            "partially_received",
            "completed",
            "cancelled"
        ],
        default: "draft",
        index: true
    },

    isActive: {
        type: Boolean,
        default: true
    }

}, { timestamps: true });

export default mongoose.model("PurchaseOrder", purchaseOrderSchema);