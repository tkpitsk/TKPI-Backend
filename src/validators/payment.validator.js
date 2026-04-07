import mongoose from "mongoose";

export const validatePayment = (data) => {
    const errors = {};

    if (!data.type || !["customer", "supplier"].includes(data.type)) {
        errors.type = "Invalid payment type";
    }

    if (!data.entityId || !mongoose.Types.ObjectId.isValid(data.entityId)) {
        errors.entityId = "Valid entity required";
    }

    const amount = Number(data.amount);

    if (!data.amount || isNaN(amount) || amount <= 0) {
        errors.amount = "Valid amount required";
    }

    const methods = ["cash", "bank", "upi"];

    if (!data.method || !methods.includes(data.method)) {
        errors.method = "Invalid payment method";
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors,
    };
};