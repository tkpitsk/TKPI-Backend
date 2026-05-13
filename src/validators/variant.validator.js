export const validateVariant = (data) => {
    const errors = {};

    /* ================= VARIANT NAME ================= */
    if (!data.variantName || typeof data.variantName !== "string" || data.variantName.trim() === "") {
        errors.variantName = "Variant name is required";
    }

    /* ================= UNIT ================= */
    const allowedUnits = ["kg", "ton", "meter", "piece"];
    if (!data.unit) {
        errors.unit = "Unit is required";
    } else if (!allowedUnits.includes(data.unit.toLowerCase())) {
        errors.unit = "Invalid unit";
    }

    /* ================= PRICING FACTORS ================= */
    if (data.pricingFactors) {
        const { difference, transport, loading, unloading } = data.pricingFactors;
        if (difference !== undefined && isNaN(Number(difference))) errors.difference = "Difference must be a number";
        if (transport !== undefined && isNaN(Number(transport))) errors.transport = "Transport must be a number";
        if (loading !== undefined && isNaN(Number(loading))) errors.loading = "Loading must be a number";
        if (unloading !== undefined && isNaN(Number(unloading))) errors.unloading = "Unloading must be a number";
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors
    };
};