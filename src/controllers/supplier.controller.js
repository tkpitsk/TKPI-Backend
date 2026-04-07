import Supplier from "../models/Supplier.js";
import { validateSupplier } from "../validators/supplier.validator.js";

/* ================= CREATE ================= */
export const createSupplier = async (req, res) => {
    try {

        const { isValid, errors } = validateSupplier(req.body);

        if (!isValid) {
            return res.status(400).json({ errors });
        }

        const supplier = await Supplier.create(req.body);

        res.status(201).json(supplier);

    } catch (error) {

        if (error.code === 11000) {
            return res.status(400).json({
                message: "Supplier already exists"
            });
        }

        res.status(500).json({
            message: "Failed to create supplier"
        });
    }
};

/* ================= GET ALL ================= */
export const getSuppliers = async (req, res) => {
    try {

        const suppliers = await Supplier.find({ isActive: true })
            .sort({ createdAt: -1 });

        res.json(suppliers);

    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch suppliers"
        });
    }
};

/* ================= GET ONE ================= */
export const getSupplierById = async (req, res) => {
    try {

        const supplier = await Supplier.findById(req.params.id);

        if (!supplier || !supplier.isActive) {
            return res.status(404).json({
                message: "Supplier not found"
            });
        }

        res.json(supplier);

    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch supplier"
        });
    }
};

/* ================= UPDATE ================= */
export const updateSupplier = async (req, res) => {
    try {

        const supplier = await Supplier.findById(req.params.id);

        if (!supplier) {
            return res.status(404).json({
                message: "Supplier not found"
            });
        }

        const allowedFields = [
            "name",
            "phone",
            "email",
            "address",
            "gstNumber",
            "notes"
        ];

        allowedFields.forEach(field => {
            if (req.body[field] !== undefined) {
                supplier[field] = req.body[field];
            }
        });

        await supplier.save();

        res.json(supplier);

    } catch (error) {
        res.status(500).json({
            message: "Failed to update supplier"
        });
    }
};

/* ================= DELETE ================= */
export const deactivateSupplier = async (req, res) => {
    try {

        const supplier = await Supplier.findById(req.params.id);

        if (!supplier) {
            return res.status(404).json({
                message: "Supplier not found"
            });
        }

        supplier.isActive = false;
        await supplier.save();

        res.json({ message: "Supplier deactivated" });

    } catch (error) {
        res.status(500).json({
            message: "Failed to delete supplier"
        });
    }
};