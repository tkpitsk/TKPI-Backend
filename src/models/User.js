import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },

    password: {
      type: String,
      required: true
    },

    role: {
      type: String,
      enum: ["admin", "manager", "employee", "worker"],
      required: true
    },

    /* ================= PAY STRUCTURE ================= */

    salaryType: {
      type: String,
      enum: ["monthly", "weekly", "daily"],
      default: "monthly", // 🔥 safer default
    },

    salaryAmount: {
      type: Number,
      default: 0,
      min: [0, "Salary cannot be negative"],
    },

    /* ================= OPTIONAL DETAILS ================= */

    name: {
      type: String,
      trim: true,
    },

    phone: {
      type: String,
      trim: true,
    },

    isActive: {
      type: Boolean,
      default: true
    },
    image: {
      type: String,
      default: null
    }

  },
  { timestamps: true }
);

/* ================= VALIDATION ================= */

userSchema.pre("save", function (next) {

  if (["manager", "employee"].includes(this.role)) {
    if (this.salaryType !== "monthly") {
      return next(new Error("Managers & Employees must have monthly salary"));
    }
  }

  if (this.role === "worker") {
    if (!["daily", "weekly", "monthly"].includes(this.salaryType)) {
      return next(new Error("Worker must have valid wage type"));
    }
  }
});

export default mongoose.model("User", userSchema);