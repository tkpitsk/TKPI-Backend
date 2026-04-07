import Company from "../models/Company.js";
import { validateCompany } from "../validators/company.validator.js";

/* ================= CREATE ================= */
export const createCompany = async (req, res) => {
    try {
        const { isValid, errors } = validateCompany(req.body);

        if (!isValid) {
            return res.status(400).json({ errors });
        }

        const company = await Company.create(req.body);

        res.status(201).json(company);

    } catch (error) {

        if (error.code === 11000) {
            return res.status(400).json({
                message: "Company already exists"
            });
        }

        res.status(500).json({
            message: "Failed to create company"
        });
    }
};

/* ================= GET ALL ================= */
export const getCompanies = async (req, res) => {
    try {

        const companies = await Company.find({ isActive: true })
            .sort({ createdAt: -1 });

        res.json(companies);

    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch companies"
        });
    }
};

/* ================= GET ONE ================= */
export const getCompanyById = async (req, res) => {
    try {

        const company = await Company.findById(req.params.id);

        if (!company || !company.isActive) {
            return res.status(404).json({
                message: "Company not found"
            });
        }

        res.json(company);

    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch company"
        });
    }
};

/* ================= UPDATE ================= */
export const updateCompany = async (req, res) => {
    try {

        const company = await Company.findById(req.params.id);

        if (!company) {
            return res.status(404).json({
                message: "Company not found"
            });
        }

        const allowedFields = [
            "name",
            "address",
            "phone",
            "email",
            "gstNumber"
        ];

        allowedFields.forEach(field => {
            if (req.body[field] !== undefined) {
                company[field] = req.body[field];
            }
        });

        await company.save();

        res.json(company);

    } catch (error) {
        res.status(500).json({
            message: "Failed to update company"
        });
    }
};

/* ================= DELETE (SOFT) ================= */
export const deactivateCompany = async (req, res) => {
    try {

        const company = await Company.findById(req.params.id);

        if (!company) {
            return res.status(404).json({
                message: "Company not found"
            });
        }

        company.isActive = false;
        await company.save();

        res.json({ message: "Company deactivated" });

    } catch (error) {
        res.status(500).json({
            message: "Failed to delete company"
        });
    }
};