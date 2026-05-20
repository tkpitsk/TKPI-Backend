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
            default: 0,
        },

        deduction: {
            type: Number,
            required: true,
            min: [0, "Deduction amount cannot be negative"],
            default: 0,
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

/* 🔥 NORMALIZE DATE (IMPORTANT) */
advanceSchema.pre("save", function (next) {
    if (this.date) {
        this.date.setUTCHours(0, 0, 0, 0);
    }
    next();
});

export default mongoose.model("Advance", advanceSchema);