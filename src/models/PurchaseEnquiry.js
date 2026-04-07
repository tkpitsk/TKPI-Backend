import mongoose from "mongoose";

const purchaseEnquirySchema = new mongoose.Schema({

    company: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Company",
        required: true,
        index: true
    },

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

    /* 🔥 SNAPSHOT */
    baseRate: {
        type: Number,
        required: true,
        min: 0
    },

    status: {
        type: String,
        enum: ["open", "selected", "ordered", "cancelled"],
        default: "open",
        index: true
    },

    selectedQuote: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "SupplierQuote"
    },

    /* 🔥 AUDIT / TRACKING */
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },

    notes: {
        type: String,
        trim: true
    },

    isActive: {
        type: Boolean,
        default: true,
        index: true
    }

}, { timestamps: true });


/* ================= INDEXES ================= */

/* 🔥 Prevent duplicate open enquiries */
// purchaseEnquirySchema.index(
//     { product: 1, variant: 1, status: 1 },
//     {
//         unique: true,
//         partialFilterExpression: { status: "open" }
//     }
// );

/* 🔥 Fast queries */
purchaseEnquirySchema.index({ company: 1, createdAt: -1 });
purchaseEnquirySchema.index({ product: 1, variant: 1 });


export default mongoose.model("PurchaseEnquiry", purchaseEnquirySchema);