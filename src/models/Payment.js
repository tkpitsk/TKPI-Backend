import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
    {
        type: {
            type: String,
            enum: ["customer", "supplier"],
            required: true,
        },

        entityId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
        },

        amount: {
            type: Number,
            required: true,
        },

        method: {
            type: String,
            enum: ["cash", "bank", "upi"],
            required: true,
        },

        reference: String,

        note: String,

        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
    },
    { timestamps: true }
);

export default mongoose.model("Payment", paymentSchema);