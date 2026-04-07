import mongoose from "mongoose";

const addressSchema = new mongoose.Schema({
    addressLine: String,
    city: String,
    state: String,
    pincode: String,
    country: {
        type: String,
        default: "India"
    }
}, { _id: false });

const contactSchema = new mongoose.Schema({
    name: String,
    phone: String,
    email: String
}, { _id: false });

const customerSchema = new mongoose.Schema({

    name: {
        type: String,
        required: true,
        trim: true,
        index: true
    },

    customerType: {
        type: String,
        enum: ["individual", "business"],
        default: "business"
    },

    /* 🔥 MULTIPLE CONTACTS */
    contacts: [contactSchema],

    /* 🔥 GST */
    gstNumber: {
        type: String,
        trim: true,
        uppercase: true
    },

    /* 🔥 ADDRESSES */
    billingAddress: addressSchema,
    shippingAddress: addressSchema,

    /* 🔥 CREDIT SYSTEM */
    creditLimit: {
        type: Number,
        default: 0
    },

    outstandingAmount: {
        type: Number,
        default: 0
    },

    /* OPTIONAL */
    notes: String,

    isActive: {
        type: Boolean,
        default: true,
        index: true
    }

}, { timestamps: true });

export default mongoose.model("Customer", customerSchema);