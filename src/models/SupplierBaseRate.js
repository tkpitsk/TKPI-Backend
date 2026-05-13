import mongoose from "mongoose";

const supplierBaseRateSchema = new mongoose.Schema({
    supplierId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Supplier", // Assuming you have a Supplier model
        required: true,
        index: true
    },
    categoryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
        required: true,
        index: true
    },
    baseRate: {
        type: Number,
        required: true,
        min: 0
    },
    effectiveDate: {
        type: Date,
        default: Date.now,
        index: true
    },
    region: {
        type: String,
        trim: true,
        index: true
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }
}, { timestamps: true });

/* Composite index for latest rate lookup per supplier/category/region */
supplierBaseRateSchema.index({ supplierId: 1, categoryId: 1, region: 1, effectiveDate: -1 });

export default mongoose.model("SupplierBaseRate", supplierBaseRateSchema);
