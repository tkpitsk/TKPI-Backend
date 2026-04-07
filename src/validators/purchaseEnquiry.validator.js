import mongoose from "mongoose";

export const validatePurchaseEnquiry = (data) => {

    const errors = {};

    if (!data.company || !mongoose.Types.ObjectId.isValid(data.company)) {
        errors.company = "Valid company required";
    }

    if (!data.product || !mongoose.Types.ObjectId.isValid(data.product)) {
        errors.product = "Valid product required";
    }

    if (!data.variant || !mongoose.Types.ObjectId.isValid(data.variant)) {
        errors.variant = "Valid variant required";
    }

    const qty = Number(data.quantity);

    if (!data.quantity || isNaN(qty) || qty <= 0) {
        errors.quantity = "Valid quantity required";
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors
    };
};