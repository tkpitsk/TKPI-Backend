import mongoose from "mongoose";

const ledgerSchema = new mongoose.Schema(
    {
        type: {
            type: String,
            enum: ["debit", "credit"],
            required: true,
        },

        amount: {
            type: Number,
            required: true,
        },

        entityType: {
            type: String,
            enum: ["customer", "supplier"],
            required: true,
        },

        entityId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            refPath: "entityType",
        },

        referenceType: {
            type: String,
            enum: ["invoice", "payment", "purchase_order"],
            required: true,
        },

        referenceId: {
            type: mongoose.Schema.Types.ObjectId,
        },

        invoiceId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "SalesInvoice",
            index: true
        },

        paymentMethod: {
            type: String,
            enum: ["cash", "bank", "upi"],
        },

        note: String,

        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
    },
    { timestamps: true }
);

ledgerSchema.index({
    referenceId: 1,
    referenceType: 1
});

export default mongoose.model("Ledger", ledgerSchema);