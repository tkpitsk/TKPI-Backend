import mongoose from "mongoose";

const advanceSchema = new mongoose.Schema(
    {
        employee: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        amount: {
            type: Number,
            required: true,
            min: [0, "Advance amount cannot be negative"],
        },

        date: {
            type: Date,
            required: true,
        },

        givenBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        note: {
            type: String,
            trim: true,
        },
    },
    { timestamps: true }
);

/* 🔥 PREVENT DUPLICATE ADVANCE PER DAY */
advanceSchema.index(
    { employee: 1, date: 1 },
    { unique: true }
);

export default mongoose.model("Advance", advanceSchema);