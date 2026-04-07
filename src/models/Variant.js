import mongoose from "mongoose";

const variantSchema = new mongoose.Schema({

    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true,
        index: true
    },

    /* SKU ATTRIBUTES */
    size: {
        type: String,
        trim: true
    },

    grade: {
        type: String,
        trim: true
    },

    thickness: {
        type: String,
        trim: true
    },

    unit: {
        type: String,
        enum: ["kg", "ton", "meter", "piece"],
        required: true
    },

    weightPerUnit: {
        type: Number,
        min: 0
    },

    /* ERP */
    trackStock: {
        type: Boolean,
        default: true
    },

    isActive: {
        type: Boolean,
        default: true,
        index: true
    }

}, { timestamps: true });

/* UNIQUE SKU */
variantSchema.index(
    { product: 1, size: 1, grade: 1, thickness: 1 },
    { unique: true }
);

/* VALIDATION */
variantSchema.pre("save", async function () {

    const Product = mongoose.model("Product");
    const product = await Product.findById(this.product);

    if (!product) {
        throw new Error("Invalid product");
    }

    /* ❌ SERVICE SHOULD NOT HAVE VARIANTS */
    if (product.productType === "service") {
        throw new Error("Service products cannot have variants");
    }

    /* UNIT NORMALIZATION (IMPORTANT) */
    if (this.isModified("unit") && this.unit === "ton") {
        if (this.weightPerUnit) {
            this.weightPerUnit = this.weightPerUnit * 1000;
        }
        this.unit = "kg";
    }

});

export default mongoose.model("Variant", variantSchema);