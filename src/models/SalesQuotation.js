import mongoose from "mongoose";

/* ================= ITEM SCHEMA ================= */
const quotationItemSchema = new mongoose.Schema({

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

    /* 🔥 SNAPSHOT PRICING */
    baseRate: {
        type: Number,
        required: true,
        min: 0
    },

    difference: {
        type: Number,
        default: 0
    },

    costPrice: {
        type: Number,
        required: true,
        min: 0
    },

    sellingPrice: {
        type: Number,
        required: true,
        min: 0
    },

    finalAmount: {
        type: Number,
        required: true,
        min: 0
    },

    profit: {
        type: Number,
        default: 0
    }

});


/* ================= MAIN SCHEMA ================= */
const salesQuotationSchema = new mongoose.Schema({

    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Customer",
        required: true,
        index: true
    },

    items: {
        type: [quotationItemSchema],
        validate: v => v.length > 0
    },

    /* ================= TOTAL ================= */
    totalAmount: {
        type: Number,
        required: true,
        min: 0
    },

    /* ================= EXTRA CHARGES ================= */
    transportCost: {
        type: Number,
        default: 0,
        min: 0
    },

    loadingCost: {
        type: Number,
        default: 0,
        min: 0
    },

    /* ================= GST ================= */
    gstPercent: {
        type: Number,
        default: 18,
        min: 0,
        max: 100
    },

    gstAmount: {
        type: Number,
        default: 0,
        min: 0
    },

    /* ================= FINAL ================= */
    finalTotal: {
        type: Number,
        required: true,
        min: 0
    },

    status: {
        type: String,
        enum: ["draft", "sent", "approved", "rejected"],
        default: "draft",
        index: true
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

salesQuotationSchema.index({ customer: 1, createdAt: -1 });
salesQuotationSchema.index({ status: 1, createdAt: -1 });


/* ================= VALIDATIONS ================= */

salesQuotationSchema.pre("validate", function (next) {

    /* ================= ITEM TOTAL ================= */
    const calculatedTotal = this.items.reduce(
        (sum, i) => sum + Number(i.finalAmount || 0),
        0
    );

    if (Math.abs(calculatedTotal - this.totalAmount) > 1) {
        return next(new Error("Total amount mismatch"));
    }

    /* ================= SUBTOTAL ================= */
    const extras =
        Number(this.transportCost || 0) +
        Number(this.loadingCost || 0);

    const subtotal = calculatedTotal + extras;

    /* ================= GST ================= */
    const gst =
        (subtotal * Number(this.gstPercent || 0)) / 100;

    if (Math.abs(gst - this.gstAmount) > 1) {
        return next(new Error("GST amount mismatch"));
    }

    /* ================= FINAL ================= */
    const expectedFinal = subtotal + gst;

    if (Math.abs(expectedFinal - this.finalTotal) > 1) {
        return next(new Error("Final total mismatch"));
    }

    /* ================= ITEM VALIDATION ================= */
    for (const item of this.items) {

        const expectedFinal = item.sellingPrice * item.quantity;

        if (Math.abs(expectedFinal - item.finalAmount) > 1) {
            return next(new Error("Invalid item final amount"));
        }

        if (item.sellingPrice < item.costPrice) {
            return next(new Error("Selling price cannot be less than cost price"));
        }

        /* 🔥 STRICT CHECK */
        if (Math.abs(item.costPrice - (item.baseRate + item.difference)) > 0.5) {
            return next(new Error("Invalid cost price calculation"));
        }
    }
});


/* ================= LOCK AFTER APPROVAL ================= */

salesQuotationSchema.pre("save", function (next) {

    if (!this.isModified()) return next();

    if (this.status === "approved") {

        const restrictedFields = [
            "items",
            "totalAmount",
            "transportCost",
            "loadingCost",
            "gstPercent",
            "gstAmount",
            "finalTotal"
        ];

        const isRestrictedModified = restrictedFields.some(field =>
            this.isModified(field)
        );

        if (isRestrictedModified) {
            return next(new Error("Approved quotation cannot be modified"));
        }
    }
});


export default mongoose.model("SalesQuotation", salesQuotationSchema);