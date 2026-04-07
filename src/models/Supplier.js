import mongoose from "mongoose";

const supplierSchema = new mongoose.Schema({

    name: {
        type: String,
        required: true,
        trim: true,
        index: true
    },

    phone: {
        type: String,
        trim: true
    },

    email: {
        type: String,
        trim: true,
        lowercase: true
    },

    address: {
        type: String,
        trim: true
    },

    gstNumber: {
        type: String,
        trim: true,
        uppercase: true
    },

    notes: {
        type: String,
        trim: true
    },

    isActive: {
        type: Boolean,
        default: true,
        index: true
    }

}, { timestamps: true });

/* UNIQUE NAME (CASE INSENSITIVE) */
supplierSchema.index(
    { unique: true, collation: { locale: "en", strength: 2 } }
);

export default mongoose.model("Supplier", supplierSchema);