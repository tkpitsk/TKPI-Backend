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

/* 🔥 ENSURE ONE RECORD PER DAY */
attendanceSchema.index(
    { employee: 1, date: 1 },
    { unique: true }
);

/* 🔥 NORMALIZE DATE (IMPORTANT) */
attendanceSchema.pre("save", function (next) {
    if (this.date) {
        this.date.setHours(0, 0, 0, 0);
    }
    next();
});

export default mongoose.model("Attendance", attendanceSchema);