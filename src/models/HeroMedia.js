import mongoose from "mongoose";

const heroMediaSchema = new mongoose.Schema(
    {
        type: {
            type: String,
            enum: ["image", "video"],
            required: true,
        },

        url: {
            type: String,
            required: true,
        },

        publicId: {
            type: String,
            required: true,
        },

        order: {
            type: Number,
            required: true,
        },
    },
    { timestamps: true }
);

export default mongoose.model("HeroMedia", heroMediaSchema);
