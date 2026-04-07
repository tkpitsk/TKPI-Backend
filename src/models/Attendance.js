import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema(
    {
        employee: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        date: {
            type: Date,
            required: true,
        },

        status: {
            type: String,
            enum: ["present", "absent", "half-day"],
            default: "present",
        },

        markedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    { timestamps: true }
);

attendanceSchema.index(
    { employee: 1, date: 1 },
    { unique: true }
);

export default mongoose.model("Attendance", attendanceSchema);
