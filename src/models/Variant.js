import mongoose from "mongoose";

const imageSchema = new mongoose.Schema({
    url: String,
    publicId: String
}, { _id: false });

const variantSchema = new mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true,
        index: true
    },
    sku: {
        type: String,
        unique: true,
        index: true
    },
    variantName: {
        type: String,
        required: true
    },
    skuPrefix: String, // Helper field for SKU generation
    skuNumber: Number, // Helper field for SKU generation
    
    /* Technical Industrial Specifications */
    grade: String,           // e.g. Fe 500, Fe 550D, E250
    materialType: String,    // e.g. MS, GI, High Tensile
    finishType: String,      // e.g. Polished, Black, Galvanized
    sectionalWeight: Number, // Kg/m - Standard industrial reference
    unit: {
        type: String,
        enum: ["kg", "ton", "meter", "piece"],
        required: true
    },
    
    dimensions: {
        diameter: Number,      // mm
        thickness: Number,     // mm
        width: Number,         // mm
        height: Number,        // mm
        length: Number,        // meter
        outerDiameter: Number, // mm (for pipes)
        wallThickness: Number  // mm (for pipes)
    },
    
    tolerance: {
        positive: String,
        negative: String
    },
    
    mechanicalProperties: {
        yieldStrength: String,
        tensileStrength: String,
        elongation: String,
        bendTest: String
    },
    
    chemicalComposition: {
        carbon: String,
        sulfur: String,
        phosphorus: String,
        manganese: String
    },
    
    pricingFactors: {
        difference: { type: Number, default: 0 },
        transport: { type: Number, default: 0 },
        loading: { type: Number, default: 0 },
        unloading: { type: Number, default: 0 },
        gstPercentage: { type: Number, default: 18 }
    },
    
    images: [imageSchema],
    millTestCertificates: [imageSchema],
    status: {
        type: String,
        enum: ["active", "inactive"],
        default: "active",
        index: true
    }
}, { timestamps: true });

/* SKU GENERATION LOGIC */
variantSchema.pre("save", async function (next) {
    if (this.isNew || !this.sku) {
        try {
            const Product = mongoose.model("Product");
            const Category = mongoose.model("Category");
            const Variant = mongoose.model("Variant");

            // 1. Get Product and Category
            const product = await Product.findById(this.productId);
            if (!product) throw new Error("Product not found");

            const category = await Category.findById(product.categoryId);
            if (!category) throw new Error("Category not found");

            const catShortCode = category.shortCode || "GEN";
            const prefix = `TKPI_${catShortCode}`;

            // 2. Find the last number for this prefix
            const lastVariant = await Variant.findOne({ sku: new RegExp(`^${prefix}_`) })
                .sort({ skuNumber: -1 })
                .select("skuNumber");

            const nextNumber = (lastVariant?.skuNumber || 0) + 1;
            const paddedNumber = String(nextNumber).padStart(3, "0");

            this.skuPrefix = prefix;
            this.skuNumber = nextNumber;
            this.sku = `${prefix}_${paddedNumber}`;
        } catch (error) {
            return next(error);
        }
    }
    next();
});

export default mongoose.model("Variant", variantSchema);