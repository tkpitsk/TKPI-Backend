export const validateSupplier = (data) => {

    const errors = {};

    /* ================= NAME ================= */
    if (!data.name || typeof data.name !== "string" || data.name.trim() === "") {
        errors.name = "Supplier name is required";
    }

    /* ================= EMAIL ================= */
    if (data.email) {
        const emailRegex = /^\S+@\S+\.\S+$/;
        if (!emailRegex.test(data.email)) {
            errors.email = "Invalid email";
        }
    }

    /* ================= PHONE ================= */
    if (data.phone) {
        const phoneRegex = /^[0-9]{10}$/;
        if (!phoneRegex.test(data.phone)) {
            errors.phone = "Invalid phone number";
        }
    }

    /* ================= GST ================= */
    if (data.gstNumber) {
        const gstRegex = /^[0-9A-Z]{15}$/;
        if (!gstRegex.test(data.gstNumber)) {
            errors.gstNumber = "Invalid GST number";
        }
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors
    };
};