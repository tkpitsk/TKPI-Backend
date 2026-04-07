import mongoose from "mongoose";

/* ================= ITEM ================= */
const invoiceItemSchema = new mongoose.Schema({
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
    unit: String,

    sellingPrice: {
        type: Number,
        required: true,
        min: 0
    },

    amount: {
        type: Number,
        required: true,
        min: 0
    }

}, { _id: false });


/* ================= MAIN ================= */
const salesInvoiceSchema = new mongoose.Schema({

    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Customer",
        required: true,
        index: true
    },

    order: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "SalesOrder",
        required: true,
        unique: true
    },

    items: [invoiceItemSchema],

    /* ================= TOTALS ================= */
    subtotal: {
        type: Number,
        required: true,
        min: 0
    },

    gstPercent: {
        type: Number,
        default: 18
    },

    gst: {
        type: Number,
        required: true,
        min: 0
    },

    totalAmount: {
        type: Number,
        required: true,
        min: 0
    },

    /* ================= PAYMENT ================= */
    paidAmount: {
        type: Number,
        default: 0
    },

    dueAmount: {
        type: Number,
        default: 0
    },

    paymentStatus: {
        type: String,
        enum: ["unpaid", "partial", "paid"],
        default: "unpaid",
        index: true
    },

    status: {
        type: String,
        enum: ["generated", "cancelled"],
        default: "generated"
    },

    invoiceNumber: {
        type: String,
        unique: true
    }

}, { timestamps: true });


/* ================= AUTO INVOICE NUMBER ================= */
salesInvoiceSchema.pre("save", async function (next) {

    if (!this.invoiceNumber) {

        const count = await mongoose.model("SalesInvoice").countDocuments();

        this.invoiceNumber = `INV-${String(count + 1).padStart(5, "0")}`;
    }

    next();
});


/* ================= VALIDATIONS ================= */
salesInvoiceSchema.pre("validate", function (next) {

    const calculatedSubtotal = this.items.reduce(
        (sum, i) => sum + Number(i.amount || 0),
        0
    );

    if (Math.abs(calculatedSubtotal - this.subtotal) > 1) {
        return next(new Error("Subtotal mismatch"));
    }

    const expectedGST = (this.subtotal * this.gstPercent) / 100;

    if (Math.abs(expectedGST - this.gst) > 1) {
        return next(new Error("GST mismatch"));
    }

    const expectedTotal = this.subtotal + this.gst;

    if (Math.abs(expectedTotal - this.totalAmount) > 1) {
        return next(new Error("Total mismatch"));
    }

    next();
});


export default mongoose.model("SalesInvoice", salesInvoiceSchema);