import mongoose from "mongoose";

const stockMovementSchema = new mongoose.Schema({

    variant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Variant",
        required: true,
        index: true
    },

    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true,
        index: true
    },

    /* TYPE OF MOVEMENT */
    type: {
        type: String,
        enum: [
            "purchase",        // GRN
            "sale",            // future
            "adjustment",      // manual fix
            "return_in",       // customer return
            "return_out"       // supplier return
        ],
        required: true,
        index: true
    },

    /* ALWAYS POSITIVE NUMBER */
    quantity: {
        type: Number,
        required: true,
        min: 0
    },

    /* BEFORE / AFTER */
    previousStock: {
        type: Number,
        required: true,
        min: 0
    },

    newStock: {
        type: Number,
        required: true,
        min: 0
    },

    /* LINKING */
    referenceId: {
        type: mongoose.Schema.Types.ObjectId
    },

    referenceModel: {
        type: String,
        enum: ["GRN", "Order", "Manual"]
    },

    notes: {
        type: String,
        trim: true
    },

    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }

}, { timestamps: true });

/* ================= INDEXES ================= */
stockMovementSchema.index({ variant: 1, createdAt: -1 });
stockMovementSchema.index({ product: 1, createdAt: -1 });
stockMovementSchema.index({ type: 1, createdAt: -1 });

/* ================= VALIDATIONS ================= */
stockMovementSchema.pre("validate", function (next) {

    /* Ensure reference consistency */
    if (this.referenceId && !this.referenceModel) {
        return next(new Error("referenceModel is required when referenceId is provided"));
    }

    /* Ensure stock math integrity */
    const validIncrease = this.newStock === this.previousStock + this.quantity;
    const validDecrease = this.newStock === this.previousStock - this.quantity;

    if (!validIncrease && !validDecrease) {
        return next(new Error("Invalid stock movement calculation"));
    }
});

export default mongoose.model("StockMovement", stockMovementSchema);