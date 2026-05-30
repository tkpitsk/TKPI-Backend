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

    dob: {
      type: Date,
    },

    address: {
      type: String,
      trim: true,
    },

    aadhar: {
      type: String,
      trim: true,
    },

    aadharPhoto: {
      type: String, // URL
      default: null,
    },

    pan: {
      type: String,
      trim: true,
    },

    panPhoto: {
      type: String, // URL
      default: null,
    },

    designation: {
      type: String,
      trim: true,
    },

    reportingTime: {
      type: String,
      trim: true,
    },

    workDescription: {
      type: String,
      trim: true,
    },

    joiningDate: {
      type: Date,
    },

    familyMembersCount: {
      type: Number,
      default: 0,
    },

    familyDependents: {
      type: String,
      trim: true,
    },

    previousWorkplace: {
      type: String,
      trim: true,
    },

    previousDesignation: {
      type: String,
      trim: true,
    },

    reasonForLeaving: {
      type: String,
      trim: true,
    },

    salaryPaymentDate: {
      type: Number,
      min: 1,
      max: 31,
    },

    iqTestResult: {
      type: String,
      trim: true,
    },

    kgTestResult: {
      type: String,
      trim: true,
    },

    personType: {
      type: String,
      trim: true,
    },

    bankAccount: {
      accountNumber: { type: String, trim: true },
      ifscCode: { type: String, trim: true },
      bankName: { type: String, trim: true },
    },

    significantAction: {
      type: String,
      trim: true,
    },

    employeeClassification: {
      type: String,
      enum: ["Blue Collar", "White Collar", ""],
      default: "",
    },

    incentivesProvided: {
      type: String,
      trim: true,
    },

    additionalBenefits: {
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