import mongoose from "mongoose";

const supplierQuoteSchema = new mongoose.Schema({

    enquiry: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "PurchaseEnquiry",
        required: true,
        index: true
    },

    supplier: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Supplier",
        required: true,
        index: true
    },

    /* 🔥 ADD THESE (CRITICAL) */
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true,
        index: true
    },

    variant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Variant",
        required: true,
        index: true
    },

    /* 🔥 SNAPSHOT PRICING */
    baseRate: {
        type: Number,
        required: true,
        min: 0
    },

    difference: {
        type: Number,
        required: true
    },

    transport: {
        type: Number,
        default: 0,
        min: 0
    },

    loading: {
        type: Number,
        default: 0,
        min: 0
    },

    gst: {
        type: Number,
        default: 18,
        min: 0,
        max: 100
    },

    /* OPTIONAL BUT USEFUL */
    finalRate: {
        type: Number, // per unit rate
        min: 0
    },

    /* 🔥 FINAL CALCULATED TOTAL */
    finalAmount: {
        type: Number,
        required: true,
        min: 0
    },

    isSelected: {
        type: Boolean,
        default: false,
        index: true
    },

    isActive: {
        type: Boolean,
        default: true,
        index: true
    }

}, { timestamps: true });


/* ================= INDEXES ================= */

/* Prevent duplicate supplier per enquiry */
supplierQuoteSchema.index(
    { enquiry: 1, supplier: 1 },
    { unique: true }
);

/* 🔥 FAST COMPARISON QUERIES */
supplierQuoteSchema.index({ product: 1, variant: 1 });
supplierQuoteSchema.index({ supplier: 1, createdAt: -1 });


export default mongoose.model("SupplierQuote", supplierQuoteSchema);