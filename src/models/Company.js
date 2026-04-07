import mongoose from "mongoose";

const companySchema = new mongoose.Schema({

    name: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },

    address: {
        type: String,
        trim: true
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

    gstNumber: {
        type: String,
        trim: true,
        uppercase: true
    },

    isActive: {
        type: Boolean,
        default: true,
        index: true
    }

}, { timestamps: true });

export default mongoose.model("Company", companySchema);