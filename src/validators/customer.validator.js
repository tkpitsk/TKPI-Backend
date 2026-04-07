export const validateCustomer = (data) => {

    const errors = {};

    /* NAME */
    if (!data.name || data.name.trim() === "") {
        errors.name = "Customer name is required";
    }

    /* CONTACTS */
    if (data.contacts) {

        if (!Array.isArray(data.contacts)) {
            errors.contacts = "Contacts must be an array";
        } else {
            data.contacts.forEach((c, index) => {

                if (c.email) {
                    const emailRegex = /^\S+@\S+\.\S+$/;
                    if (!emailRegex.test(c.email.trim())) {
                        errors[`contacts[${index}].email`] = "Invalid email";
                    }
                }

                if (c.phone) {
                    const phoneRegex = /^[0-9]{10}$/;
                    if (!phoneRegex.test(c.phone)) {
                        errors[`contacts[${index}].phone`] = "Invalid phone";
                    }
                }
            });
        }
    }

    /* GST */
    if (data.gstNumber) {
        const gst = data.gstNumber.trim().toUpperCase();
        const gstRegex = /^[0-9A-Z]{15}$/;

        if (!gstRegex.test(gst)) {
            errors.gstNumber = "Invalid GST number";
        }
    }

    /* CREDIT LIMIT */
    if (data.creditLimit !== undefined) {
        const credit = Number(data.creditLimit);

        if (isNaN(credit) || credit < 0) {
            errors.creditLimit = "Credit limit must be a positive number";
        }
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors
    };
};