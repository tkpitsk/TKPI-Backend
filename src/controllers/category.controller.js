import Category from "../models/Category.js";
import { validateCategory } from "../validators/category.validator.js";
import cloudinary from "../config/cloudinary.js";

/* CREATE CATEGORY */
export const createCategory = async (req, res) => {
    try {
        const { isValid, errors } = validateCategory(req.body);

        if (!isValid) {
            return res.status(400).json({ errors });
        }

        let image;

        if (req.file) {
            const result = await new Promise((resolve, reject) => {
                const stream = cloudinary.uploader.upload_stream(
                    { folder: "categories" },
                    (error, result) => {
                        if (error) reject(error);
                        else resolve(result);
                    }
                );
                stream.end(req.file.buffer);
            });

            image = {
                url: result.secure_url,
                publicId: result.public_id
            };
        }

        const category = await Category.create({
            ...req.body,
            image
        });

        res.status(201).json(category);
    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};

/* GET CATEGORIES */
export const getCategories = async (req, res) => {
    try {
        const categories = await Category.find({
            isActive: true
        }).sort({ createdAt: -1 });

        res.json(categories);
    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch categories"
        });
    }
};


/* GET CATEGORY BY SLUG */
export const getCategoryBySlug = async (req, res) => {
    try {
        const category = await Category.findOne({
            slug: req.params.slug,
            isActive: true
        });

        if (!category) {
            return res.status(404).json({
                message: "Category not found"
            });
        }

        res.json(category);
    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch category"
        });
    }
};


/* UPDATE CATEGORY */
export const updateCategory = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);

        if (!category) {
            return res.status(404).json({
                message: "Category not found"
            });
        }

        const allowedFields = [
            "name",
            "description",
            "showOnWebsite"
        ];

        allowedFields.forEach(field => {
            if (req.body[field] !== undefined) {
                category[field] = req.body[field];
            }
        });

        if (req.file) {
            const result = await new Promise((resolve, reject) => {
                const stream = cloudinary.uploader.upload_stream(
                    { folder: "categories" },
                    (error, result) => {
                        if (error) reject(error);
                        else resolve(result);
                    }
                );

                stream.end(req.file.buffer);
            });

            category.image = {
                url: result.secure_url,
                publicId: result.public_id
            };
        }

        await category.save();

        res.json(category);
    } catch (error) {
        res.status(500).json({
            message: "Failed to update category"
        });
    }
};

/* DELETE CATEGORY (SOFT DELETE) */
export const deactivateCategory = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);

        if (!category) {
            return res.status(404).json({
                message: "Category not found"
            });
        }

        category.isActive = false;

        await category.save();

        res.json({
            message: "Category deactivated"
        });
    } catch (error) {
        res.status(500).json({
            message: "Failed to delete category"
        });
    }
};