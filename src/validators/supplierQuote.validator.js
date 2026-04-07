import mongoose from "mongoose";

export const validateSupplierQuote = (data) => {

    const errors = {};

    if (!data.supplier || !mongoose.Types.ObjectId.isValid(data.supplier)) {
        errors.supplier = "Valid supplier required";
    }

    if (data.difference === undefined || isNaN(Number(data.difference))) {
        errors.difference = "Valid difference required";
    }

    ["transport", "loading"].forEach(field => {
        if (data[field] !== undefined && isNaN(Number(data[field]))) {
            errors[field] = `${field} must be number`;
        }
    });

    return {
        isValid: Object.keys(errors).length === 0,
        errors
    };
};