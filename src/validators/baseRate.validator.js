import mongoose from "mongoose";

export const validateBaseRate = (data) => {

    const errors = {};

    /* ================= PRODUCT ================= */

    if (!data.product || typeof data.product !== "string") {
        errors.product = "Product is required";
    } else if (!mongoose.Types.ObjectId.isValid(data.product.trim())) {
        errors.product = "Invalid product ID";
    }

    /* ================= RATE ================= */

    const rate = Number(data.rate);

    if (data.rate === undefined || data.rate === null || data.rate === "") {
        errors.rate = "Rate is required";
    } else if (isNaN(rate)) {
        errors.rate = "Rate must be a number";
    } else if (rate <= 0) {
        errors.rate = "Rate must be greater than 0";
    } else if (rate > 100000000) { // 🔒 safety cap (10 Cr)
        errors.rate = "Rate is too large";
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors
    };
};