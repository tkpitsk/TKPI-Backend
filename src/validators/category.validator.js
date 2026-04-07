export const validateCategory = (data) => {

    const errors = {};

    if (!data.name || data.name.trim() === "") {
        errors.name = "Category name is required";
    }

    if (data.description && typeof data.description !== "string") {
        errors.description = "Invalid description";
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors
    };
};