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

        repeat: {
            type: String,
            enum: ["none", "hourly", "daily", "3days", "weekly", "15days", "monthly", "6monthly", "yearly", "custom"],
            default: "none",
        },

        customDays: {
            type: Number,
        },

        priority: {
            type: String,
            enum: ["low", "medium", "high"],
            default: "medium",
        },

        assignedTo: {
            type: String,
            trim: true,
        },
    },
    { timestamps: true }
);

export default mongoose.model("Reminder", reminderSchema);
