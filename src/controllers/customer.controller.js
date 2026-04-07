import mongoose from "mongoose";
import Customer from "../models/Customer.js";
import { validateCustomer } from "../validators/customer.validator.js";

/* ================= HELPERS ================= */

const normalizeCustomerPayload = (data) => ({
    ...data,
    name: data.name?.trim(),
    gstNumber: data.gstNumber?.toUpperCase().trim()
});

/* ================= CREATE ================= */
export const createCustomer = async (req, res) => {
    try {
        const { isValid, errors } = validateCustomer(req.body);

        if (!isValid) {
            return res.status(400).json({
                success: false,
                errors
            });
        }

        const payload = normalizeCustomerPayload(req.body);

        const customer = await Customer.create(payload);

        return res.status(201).json({
            success: true,
            data: customer
        });

    } catch (error) {

        /* 🔥 DUPLICATE KEY */
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "Customer already exists"
            });
        }

        console.error("Create Customer Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to create customer"
        });
    }
};


/* ================= GET ALL ================= */
export const getCustomers = async (req, res) => {
    try {
        let {
            page = 1,
            limit = 10,
            search = "",
            customerType
        } = req.query;

        /* 🔥 SAFE PAGINATION */
        const pageNum = Math.max(1, Number(page));
        const limitNum = Math.min(50, Number(limit)); // prevent abuse
        const skip = (pageNum - 1) * limitNum;

        const filter = { isActive: true };

        /* 🔍 SEARCH (Regex or Text Index Ready) */
        if (search) {
            filter.name = {
                $regex: search,
                $options: "i"
            };

            // 👉 If using text index:
            // filter.$text = { $search: search };
        }

        if (customerType) {
            filter.customerType = customerType;
        }

        const [customers, total] = await Promise.all([
            Customer.find(filter)
                .select("-__v")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limitNum)
                .lean(),

            Customer.countDocuments(filter)
        ]);

        return res.json({
            success: true,
            page: pageNum,
            limit: limitNum,
            total,
            totalPages: Math.ceil(total / limitNum),
            data: customers
        });

    } catch (error) {
        console.error("Get Customers Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch customers"
        });
    }
};


/* ================= GET ONE ================= */
export const getCustomerById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid customer ID"
            });
        }

        const customer = await Customer.findOne({
            _id: id,
            isActive: true
        }).select("-__v").lean();

        if (!customer) {
            return res.status(404).json({
                success: false,
                message: "Customer not found"
            });
        }

        return res.json({
            success: true,
            data: customer
        });

    } catch (error) {
        console.error("Get Customer Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch customer"
        });
    }
};


/* ================= UPDATE ================= */
export const updateCustomer = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid customer ID"
            });
        }

        const customer = await Customer.findById(id);

        if (!customer) {
            return res.status(404).json({
                success: false,
                message: "Customer not found"
            });
        }

        if (!customer.isActive) {
            return res.status(400).json({
                success: false,
                message: "Cannot update inactive customer"
            });
        }

        const payload = normalizeCustomerPayload(req.body);

        const allowedFields = [
            "name",
            "customerType",
            "contacts",
            "gstNumber",
            "billingAddress",
            "shippingAddress",
            "creditLimit",
            "notes"
        ];

        for (const field of allowedFields) {
            if (payload[field] !== undefined) {

                if (field === "creditLimit") {
                    const credit = Number(payload.creditLimit);

                    if (isNaN(credit) || credit < 0) {
                        return res.status(400).json({
                            success: false,
                            message: "Invalid credit limit"
                        });
                    }

                    customer.creditLimit = credit;

                } else {
                    customer[field] = payload[field];
                }
            }
        }

        await customer.save();

        return res.json({
            success: true,
            data: customer
        });

    } catch (error) {

        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "Duplicate GST or unique field"
            });
        }

        console.error("Update Customer Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to update customer"
        });
    }
};


/* ================= DELETE (SOFT) ================= */
export const deactivateCustomer = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid customer ID"
            });
        }

        const customer = await Customer.findById(id);

        if (!customer) {
            return res.status(404).json({
                success: false,
                message: "Customer not found"
            });
        }

        if (!customer.isActive) {
            return res.status(400).json({
                success: false,
                message: "Customer already deactivated"
            });
        }

        customer.isActive = false;
        await customer.save();

        return res.json({
            success: true,
            message: "Customer deactivated successfully"
        });

    } catch (error) {
        console.error("Deactivate Customer Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to delete customer"
        });
    }
};