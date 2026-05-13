import mongoose from "mongoose";
import slugify from "slugify";

const imageSchema = new mongoose.Schema(
    {
        url: String,
        publicId: String
    },
    { _id: false }
);

const productSchema = new mongoose.Schema({
    categoryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
        required: true,
        index: true
    },
    name: {
        type: String,
        required: true,
        trim: true,
        index: true
    },
    slug: {
        type: String,
        unique: true,
        index: true
    },
    shortDescription: String,
    longDescription: String,
    overview: String,
    applications: [String],
    industriesUsed: [String],
    advantages: [String],
    features: [String],
    manufacturingProcess: String,
    standards: [String],
    certifications: [String],
    availableBrands: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Brand"
    }],
    galleryImages: [imageSchema],
    brochures: [imageSchema],
    videos: [{
        title: String,
        url: String
    }],
    faqs: [{
        question: String,
        answer: String
    }],
    technicalDocuments: [imageSchema],
    downloadableFiles: [imageSchema],
    relatedProducts: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product"
    }],
    seo: {
        title: String,
        description: String,
        keywords: [String]
    },
    hsnCode: {
        type: String,
        required: true,
        trim: true
    },
    inquiryEnabled: {
        type: Boolean,
        default: true
    },
    status: {
        type: String,
        enum: ["active", "inactive"],
        default: "active",
        index: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }
}, { timestamps: true });

/* AUTO SLUG */
productSchema.pre("save", async function () {
    if (this.isModified("name")) {
        const baseSlug = slugify(this.name, {
            lower: true,
            strict: true
        });

        let slug = baseSlug;
        let count = 1;

        const Product = mongoose.model("Product");

        while (await Product.findOne({ slug, _id: { $ne: this._id } })) {
            slug = `${baseSlug}-${count++}`;
        }

        this.slug = slug;
    }
});

export default mongoose.model("Product", productSchema);