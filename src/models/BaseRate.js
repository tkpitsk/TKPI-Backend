import mongoose from "mongoose";

const baseRateSchema = new mongoose.Schema({

    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true,
        index: true
    },

    rate: {
        type: Number,
        required: true,
        min: 0
    },

    /* FULL TIMESTAMP (NOT DAY) */
    date: {
        type: Date,
        default: Date.now,
        index: true
    },

    isActive: {
        type: Boolean,
        default: true,
        index: true
    }

}, { timestamps: true });

/* INDEX FOR FAST LATEST LOOKUP */
baseRateSchema.index({ product: 1, isActive: 1, date: -1 });

export default mongoose.model("BaseRate", baseRateSchema);