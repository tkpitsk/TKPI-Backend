import mongoose from "mongoose";

export const validateSalesItem = (item) => {

    const errors = {};

    /* ================= SAFE PARSING ================= */

    const quantity = Number(item.quantity);
    const sellingPrice = Number(item.sellingPrice);
    const difference =
        item.difference !== undefined && item.difference !== ""
            ? Number(item.difference)
            : 0;

    /* ================= OBJECT ID ================= */

    if (!item.product || !mongoose.Types.ObjectId.isValid(item.product)) {
        errors.product = "Invalid product ID";
    }

    if (!item.variant || !mongoose.Types.ObjectId.isValid(item.variant)) {
        errors.variant = "Invalid variant ID";
    }

    /* ================= QUANTITY ================= */

    if (
        item.quantity === undefined ||
        item.quantity === null ||
        item.quantity === "" ||
        isNaN(quantity) ||
        quantity <= 0
    ) {
        errors.quantity = "Quantity must be greater than 0";
    } else if (quantity > 1_000_000) {
        errors.quantity = "Quantity too large";
    }

    /* ================= UNIT ================= */

    const allowedUnits = ["kg", "ton", "meter", "piece"];

    if (!item.unit || !allowedUnits.includes(item.unit)) {
        errors.unit = "Invalid or missing unit";
    }

    /* ================= SELLING PRICE ================= */

    if (
        item.sellingPrice === undefined ||
        item.sellingPrice === null ||
        item.sellingPrice === "" ||
        isNaN(sellingPrice) ||
        sellingPrice <= 0
    ) {
        errors.sellingPrice = "Selling price must be greater than 0";
    } else if (sellingPrice > 1_000_000_000) {
        errors.sellingPrice = "Selling price too large";
    }

    /* ================= DIFFERENCE ================= */

    if (item.difference !== undefined && item.difference !== "") {

        if (isNaN(difference)) {
            errors.difference = "Difference must be a number";
        } else if (Math.abs(difference) > 100000) {
            errors.difference = "Difference value too large";
        }
    }

    /* ================= FINAL CALCULATION CHECK ================= */

    if (!errors.quantity && !errors.sellingPrice) {

        const total = quantity * sellingPrice;

        if (!isFinite(total) || total <= 0) {
            errors.finalAmount = "Invalid total calculation";
        } else if (total > 1_000_000_000_000) {
            errors.finalAmount = "Total amount too large";
        }
    }

    return errors;
};