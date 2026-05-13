import mongoose from "mongoose";
import slugify from "slugify";

const imageSchema = new mongoose.Schema(
    {
        url: String,
        publicId: String
    },
    { _id: false }
);

const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },
    slug: {
        type: String,
        unique: true,
        index: true
    },
    shortCode: {
        type: String,
        trim: true,
        uppercase: true
    },
    description: String,
    parentCategoryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
        default: null
    },
    image: imageSchema,
    icon: imageSchema,
    bannerImage: imageSchema,
    featured: {
        type: Boolean,
        default: false
    },
    sortOrder: {
        type: Number,
        default: 0
    },
    seo: {
        title: String,
        description: String,
        keywords: [String]
    },
    specificationsTemplateId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "SpecificationTemplate"
    },
    status: {
        type: String,
        enum: ["active", "inactive"],
        default: "active",
        index: true
    }
}, { timestamps: true });

/* AUTO SLUG */
categorySchema.pre("save", async function () {
    if (this.isModified("name")) {
        this.slug = slugify(this.name, {
            lower: true,
            strict: true
        });
    }
});

export default mongoose.model("Category", categorySchema);