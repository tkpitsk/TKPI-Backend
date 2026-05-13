import mongoose from "mongoose";

const specificationTemplateSchema = new mongoose.Schema({
    categoryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
        required: true,
        index: true
    },
    templateName: {
        type: String,
        required: true,
        trim: true
    },
    fields: [
        {
            fieldName: String,
            fieldKey: String,
            fieldType: {
                type: String,
                enum: ["number", "text", "dropdown", "boolean"],
                default: "text"
            },
            required: {
                type: Boolean,
                default: false
            },
            unit: String,
            options: [String] // For dropdown type
        }
    ],
    status: {
        type: String,
        enum: ["active", "inactive"],
        default: "active"
    }
}, { timestamps: true });

export default mongoose.model("SpecificationTemplate", specificationTemplateSchema);
