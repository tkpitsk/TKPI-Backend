import mongoose from "mongoose";
import Product from "../models/Product.js";
import Variant from "../models/Variant.js";
import Stock from "../models/Stock.js";
import cloudinary from "../config/cloudinary.js";
import { validateProduct } from "../validators/product.validator.js";
import { validateVariant } from "../validators/variant.validator.js";

/* ================= CREATE PRODUCT ================= */
export const createProduct = async (req, res) => {
    try {
        const { isValid, errors } = validateProduct(req.body);

        if (!isValid) {
            return res.status(400).json({ errors });
        }

        let images = [];

        if (req.files?.length) {
            for (const file of req.files) {

                const result = await new Promise((resolve, reject) => {
                    const stream = cloudinary.uploader.upload_stream(
                        { folder: "products" },
                        (err, result) => {
                            if (err) reject(err);
                            else resolve(result);
                        }
                    );
                    stream.end(file.buffer);
                });

                images.push({
                    url: result.secure_url,
                    publicId: result.public_id
                });
            }
        }

        let features = [];
        let applications = [];

        try {
            features = req.body.features
                ? typeof req.body.features === "string"
                    ? JSON.parse(req.body.features)
                    : req.body.features
                : [];

            applications = req.body.applications
                ? typeof req.body.applications === "string"
                    ? JSON.parse(req.body.applications)
                    : req.body.applications
                : [];
        } catch {
            return res.status(400).json({
                message: "features/applications must be valid JSON"
            });
        }

        const product = await Product.create({
            ...req.body,
            categoryId: req.body.categoryId || req.body.category,
            hsnCode: req.body.hsnCode,
            createdBy: req.user?._id,
            galleryImages: images
        });

        res.status(201).json(product);

    } catch (error) {
        console.error(error);

        if (error.code === 11000) {
            return res.status(400).json({
                message: "Product already exists"
            });
        }

        res.status(500).json({
            message: error.message || "Internal server error"
        });
    }
};



/* ================= CREATE VARIANTS ================= */
export const createVariants = async (req, res) => {
    try {

        const { productId } = req.params;
        const variants = req.body.variants;

        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        if (!Array.isArray(variants) || variants.length === 0) {
            return res.status(400).json({
                message: "Variants are required"
            });
        }

        const createdVariants = [];

        const session = await mongoose.startSession();
        session.startTransaction();

        try {

            for (const item of variants) {

                const { isValid, errors } = validateVariant(item);
                if (!isValid) throw new Error(Object.values(errors)[0]);

                const [variant] = await Variant.create([{
                    ...item,
                    productId: productId
                }], { session });

                /* ✅ FIXED: ADD PRODUCT */
                await Stock.create([{
                    productId: productId,
                    variantId: variant._id,
                    quantity: 0
                }], { session });

                createdVariants.push(variant);
            }

            await session.commitTransaction();
            session.endSession();

            return res.status(201).json(createdVariants);

        } catch (err) {

            await session.abortTransaction();
            session.endSession();

            /* ✅ HANDLE DUPLICATE ERROR */
            if (err.code === 11000) {
                return res.status(400).json({
                    message: "Duplicate variant exists"
                });
            }

            throw err;
        }

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: error.message || "Internal server error"
        });
    }
};



/* ================= GET PRODUCTS (ADMIN) ================= */
export const getProductsAdmin = async (req, res) => {
    try {

        const products = await Product.find()
            .populate("categoryId", "name")
            .sort({ createdAt: -1 });

        res.json(products);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to fetch products"
        });
    }
};



/* ================= GET PRODUCTS (PUBLIC) ================= */
export const getProducts = async (req, res) => {
    try {

        const { category } = req.query;

        const filter = {
            isActive: true
        };

        if (category && mongoose.Types.ObjectId.isValid(category)) {
            filter.category = category;
        }

        const products = await Product.find(filter)
            .select("name slug galleryImages")
            .populate("categoryId", "name slug");

        res.json(products);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to fetch products"
        });
    }
};



/* ================= GET PRODUCT DETAILS ================= */
export const getProductBySlug = async (req, res) => {
    try {

        const product = await Product.findOne({
            slug: req.params.slug,
            status: "active"
        }).populate("categoryId", "name slug");

        if (!product) {
            return res.status(404).json({
                message: "Product not found"
            });
        }

        /* GET VARIANTS */
        const variants = await Variant.find({
            productId: product._id,
            status: "active"
        });

        const variantIds = variants.map(v => v._id);

        const stocks = await Stock.find({
            variantId: { $in: variantIds }
        });

        const stockMap = {};

        stocks.forEach(s => {
            stockMap[s.variantId.toString()] = s;
        });

        const variantsWithStock = variants.map(v => {
            const stock = stockMap[v._id.toString()];

            const quantity = stock?.quantity || 0;
            const reserved = stock?.reserved || 0;

            return {
                ...v.toObject(),
                stock: quantity,
                reserved,
                available: quantity - reserved
            };
        });

        res.json({
            product,
            variants: variantsWithStock
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to fetch product"
        });
    }
};


/* ================= UPDATE PRODUCT ================= */
export const updateProduct = async (req, res) => {
    try {

        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({
                message: "Product not found"
            });
        }

        /* ================= BASIC FIELDS ================= */

        const allowedFields = [
            "name",
            "shortDescription",
            "longDescription",
            "overview",
            "applications",
            "industriesUsed",
            "advantages",
            "features",
            "manufacturingProcess",
            "standards",
            "certifications",
            "categoryId",
            "hsnCode",
            "inquiryEnabled",
            "status"
        ];

        allowedFields.forEach(field => {
            if (req.body[field] !== undefined) {
                // Map category to categoryId
                if (field === "category") {
                    product.categoryId = req.body[field];
                } else if (field === "isActive") {
                    product.status = req.body[field] ? "active" : "inactive";
                } else {
                    product[field] = req.body[field];
                }
            }
        });

        /* ================= REMOVE IMAGES ================= */

        if (req.body.removedImages) {
            let removed = [];

            try {
                removed = JSON.parse(req.body.removedImages);
            } catch {
                return res.status(400).json({
                    message: "removedImages must be valid JSON"
                });
            }

            // Remove from DB
            product.images = product.images.filter(
                img => !removed.includes(img.publicId)
            );

            // Remove from Cloudinary
            await Promise.all(
                removed.map(publicId =>
                    cloudinary.uploader.destroy(publicId)
                )
            );
        }

        /* ================= ADD NEW IMAGES ================= */

        if (req.files?.length) {

            // ❗ Check max limit (5 total)
            if (product.images.length + req.files.length > 5) {
                return res.status(400).json({
                    message: "Maximum 5 images allowed"
                });
            }

            for (const file of req.files) {

                const result = await new Promise((resolve, reject) => {
                    const stream = cloudinary.uploader.upload_stream(
                        { folder: "products" },
                        (err, result) => {
                            if (err) reject(err);
                            else resolve(result);
                        }
                    );
                    stream.end(file.buffer);
                });

                product.images.push({
                    url: result.secure_url,
                    publicId: result.public_id
                });
            }
        }

        /* ================= SAVE ================= */

        await product.save();

        res.json(product);

    } catch (error) {
        res.status(500).json({
            message: error.message || "Failed to update product"
        });
    }
};



/* ================= UPDATE VARIANT ================= */
export const updateVariant = async (req, res) => {
    try {

        const variant = await Variant.findById(req.params.id);

        if (!variant) {
            return res.status(404).json({
                message: "Variant not found"
            });
        }

        const allowedFields = [
            "variantName",
            "grade",
            "materialType",
            "finishType",
            "sectionalWeight",
            "unit",
            "dimensions",
            "tolerance",
            "mechanicalProperties",
            "chemicalComposition",
            "status"
        ];

        allowedFields.forEach(field => {
            if (req.body[field] !== undefined) {
                variant[field] = req.body[field];
            }
        });

        if (req.body.pricingFactors) {
            variant.pricingFactors = {
                ...variant.pricingFactors,
                ...req.body.pricingFactors
            };
        }

        const product = await Product.findById(variant.product);

        if (product.productType === "service") {
            return res.status(400).json({
                message: "Service does not have variants"
            });
        }

        await variant.save();

        res.json(variant);

    } catch (error) {
        res.status(500).json({ message: "Failed to update variant" });
    }
};



/* ================= GET VARIANTS ================= */
export const getVariantsByProduct = async (req, res) => {
    try {
        const { productId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({ message: "Invalid productId" });
        }

        const variants = await Variant.find({
            productId: productId,
            status: "active"
        });

        res.json(variants);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch variants" });
    }
};



/* ================= DELETE PRODUCT ================= */
export const deactivateProduct = async (req, res) => {
    try {

        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({
                message: "Product not found"
            });
        }

        product.status = "inactive";
        await product.save();

        await Variant.updateMany(
            { productId: product._id },
            { status: "inactive" }
        );

        res.json({ message: "Product deactivated" });

    } catch (error) {
        res.status(500).json({ message: "Failed to delete product" });
    }
};



/* ================= DELETE VARIANT ================= */
export const deactivateVariant = async (req, res) => {
    try {

        const variant = await Variant.findById(req.params.id);

        if (!variant) {
            return res.status(404).json({
                message: "Variant not found"
            });
        }

        variant.isActive = false;
        await variant.save();

        res.json({ message: "Variant deactivated" });

    } catch (error) {
        res.status(500).json({ message: "Failed to delete variant" });
    }
};