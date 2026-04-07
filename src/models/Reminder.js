import mongoose from "mongoose";

const reminderSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
        },

        description: {
            type: String,
            trim: true,
        },

        date: {
            type: Date,
            required: true,
        },

        time: {
            type: String, // "14:30" (optional)
        },

        expiryDate: {
            type: Date,
            required: true,
        },

        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    { timestamps: true }
);

export default mongoose.model("Reminder", reminderSchema);
