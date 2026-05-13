import mongoose from "mongoose";
import slugify from "slugify";

const imageSchema = new mongoose.Schema({
    url: String,
    publicId: String
}, { _id: false });

const brandSchema = new mongoose.Schema({
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
    logo: imageSchema,
    description: String,
    certifications: [String],
    website: String,
    country: {
        type: String,
        default: "India"
    },
    featured: {
        type: Boolean,
        default: false
    },
    status: {
        type: String,
        enum: ["active", "inactive"],
        default: "active"
    }
}, { timestamps: true });

/* AUTO SLUG */
brandSchema.pre("save", async function () {
    if (this.isModified("name")) {
        this.slug = slugify(this.name, {
            lower: true,
            strict: true
        });
    }
});

export default mongoose.model("Brand", brandSchema);
