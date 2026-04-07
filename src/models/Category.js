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

    description: String,

    image: imageSchema,

    /* WEBSITE */
    showOnWebsite: {
        type: Boolean,
        default: true
    },

    /* ERP */
    isActive: {
        type: Boolean,
        default: true,
        index: true
    }

}, { timestamps: true });

/* AUTO SLUG */
categorySchema.pre("save", function (next) {
    this.slug = slugify(this.name, {
        lower: true,
        strict: true
    });
});

export default mongoose.model("Category", categorySchema);