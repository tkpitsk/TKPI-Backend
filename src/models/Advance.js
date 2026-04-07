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

        note: String,
    },
    { timestamps: true }
);

export default mongoose.model("Advance", advanceSchema);
