export const validateCompany = (data) => {

    const errors = {};

    /* ================= NAME ================= */
    if (!data.name || typeof data.name !== "string" || data.name.trim() === "") {
        errors.name = "Company name is required";
    }

    /* ================= EMAIL ================= */
    if (data.email) {
        const emailRegex = /^\S+@\S+\.\S+$/;
        if (!emailRegex.test(data.email)) {
            errors.email = "Invalid email";
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