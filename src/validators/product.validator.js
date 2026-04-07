import mongoose from "mongoose";

export const validateProduct = (data) => {

    const errors = {};

    /* ================= NAME ================= */
    if (!data.name || typeof data.name !== "string" || data.name.trim() === "") {
        errors.name = "Product name is required";
    }

    /* ================= PRODUCT TYPE ================= */
    const allowedProductTypes = ["trading", "manufacturing", "service"];

    if (!data.productType) {
        errors.productType = "Product type is required";
    } else if (!allowedProductTypes.includes(data.productType)) {
        errors.productType = "Invalid product type";
    }

    /* ================= CATEGORY ================= */
    if (!data.category || !mongoose.Types.ObjectId.isValid(data.category)) {
        errors.category = "Valid category is required";
    }

    /* ================= HSN CODE ================= */
    if (data.hsnCode !== undefined) {
        const hsn = String(data.hsnCode).trim();

        if (!/^[0-9]{4,8}$/.test(hsn)) {
            errors.hsnCode = "HSN must be 4 to 8 digits";
        }
    }

    if (data.productType && data.productType !== "service" && !data.hsnCode) {
        errors.hsnCode = "HSN code is required for goods";
    }

    /* ================= SERVICE ================= */
    if (data.productType === "service") {

        const rate = Number(data.serviceRate);

        if (!data.serviceRate || isNaN(rate) || rate <= 0) {
            errors.serviceRate = "Valid service rate is required";
        }

    }

    /* ================= FEATURES ================= */
    if (data.features) {
        try {
            const parsed =
                typeof data.features === "string"
                    ? JSON.parse(data.features)
                    : data.features;

            if (!Array.isArray(parsed)) {
                errors.features = "Features must be an array";
            }
        } catch {
            errors.features = "Features must be valid JSON";
        }
    }

    /* ================= APPLICATIONS ================= */
    if (data.applications) {
        try {
            const parsed =
                typeof data.applications === "string"
                    ? JSON.parse(data.applications)
                    : data.applications;

            if (!Array.isArray(parsed)) {
                errors.applications = "Applications must be an array";
            }
        } catch {
            errors.applications = "Applications must be valid JSON";
        }
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors
    };
};