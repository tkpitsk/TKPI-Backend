export const validateVariant = (data) => {

    const errors = {};

    /* ================= UNIT ================= */
    const allowedUnits = ["kg", "ton", "meter", "piece"];

    if (!data.unit) {
        errors.unit = "Unit is required";
    } else if (!allowedUnits.includes(data.unit)) {
        errors.unit = "Invalid unit";
    }

    /* ================= SIZE ================= */
    if (data.size && typeof data.size !== "string") {
        errors.size = "Invalid size";
    }

    /* ================= GRADE ================= */
    if (data.grade && typeof data.grade !== "string") {
        errors.grade = "Invalid grade";
    }

    /* ================= THICKNESS ================= */
    if (data.thickness && typeof data.thickness !== "string") {
        errors.thickness = "Invalid thickness";
    }

    /* ================= WEIGHT ================= */
    if (data.weightPerUnit !== undefined) {

        const weight = Number(data.weightPerUnit);

        if (isNaN(weight)) {
            errors.weightPerUnit = "Weight must be a number";
        }

        if (weight < 0) {
            errors.weightPerUnit = "Weight cannot be negative";
        }
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors
    };
};