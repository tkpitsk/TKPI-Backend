import mongoose from "mongoose";

export const validateProduct = (data) => {
    const errors = {};

    /* ================= NAME ================= */
    if (!data.name || typeof data.name !== "string" || data.name.trim() === "") {
        errors.name = "Product name is required";
    }

    /* ================= HSN CODE ================= */
    if (!data.hsnCode || typeof data.hsnCode !== "string" || data.hsnCode.trim() === "") {
        errors.hsnCode = "HSN code is required";
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors
    };
};