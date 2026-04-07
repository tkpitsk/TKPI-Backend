import mongoose from "mongoose";

const stockSchema = new mongoose.Schema({

    /* 🔥 IMPORTANT: ADD PRODUCT */
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true,
        index: true
    },

    variant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Variant",
        required: true,
        unique: true,
        index: true
    },

    quantity: {
        type: Number,
        default: 0,
        min: 0
    },

    reserved: {
        type: Number,
        default: 0,
        min: 0
    }

}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

/* ================= VIRTUAL ================= */

stockSchema.virtual("available").get(function () {
    return this.quantity - this.reserved;
});


/* ================= SAFETY ================= */

stockSchema.pre("save", function () {

    /* Reserved cannot exceed total */
    if (this.reserved > this.quantity) {
        throw new Error("Reserved stock cannot exceed total quantity");
    }

    /* Hard safety (extra protection) */
    if (this.quantity < 0) {
        throw new Error("Stock cannot be negative");
    }

});


export default mongoose.model("Stock", stockSchema);