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

    name: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        index: true
    },

    hsnCode: {
        type: String,
        trim: true,
        validate: {
            validator: function (val) {
                return !val || /^[0-9]{4,8}$/.test(val);
            },
            message: "HSN must be 4 to 8 digits"
        }
    },

    slug: {
        type: String,
        unique: true,
        index: true
    },

    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
        required: true,
        index: true
    },

    productType: {
        type: String,
        enum: ["trading", "manufacturing", "service"],
        required: true,
        index: true
    },

    /* WEBSITE CONTENT */
    description: String,
    features: {
        type: [String],
        default: []
    },
    applications: {
        type: [String],
        default: []
    },

    images: {
        type: [imageSchema],
        default: [],
        validate: {
            validator: (val) => !val || val.length <= 5,
            message: "Maximum 5 images allowed"
        }
    },

    /* SERVICE ONLY */
    serviceRate: {
        type: Number,
        min: 0
    },

    isActive: {
        type: Boolean,
        default: true,
        index: true
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

    /* ALWAYS VALIDATE */
    if (this.productType !== "service" && !this.hsnCode) {
        throw new Error("HSN code is required for goods");
    }

    if (this.productType === "service") {
        if (!this.serviceRate || this.serviceRate <= 0) {
            throw new Error("Service must have serviceRate");
        }
    }
});

export default mongoose.model("Product", productSchema);