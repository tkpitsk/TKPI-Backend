import mongoose from "mongoose";

export const validateOrderItem = (item) => {

    const errors = {};

    if (!mongoose.Types.ObjectId.isValid(item.product)) {
        errors.product = "Invalid product";
    }

    if (!mongoose.Types.ObjectId.isValid(item.variant)) {
        errors.variant = "Invalid variant";
    }

    const qty = Number(item.quantity);

    if (!item.quantity || isNaN(qty) || qty <= 0) {
        errors.quantity = "Valid quantity required";
    }

    if (!item.finalAmount || isNaN(Number(item.finalAmount))) {
        errors.finalAmount = "Final amount required";
    }

    return errors;
};