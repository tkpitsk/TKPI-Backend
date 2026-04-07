import BaseRate from "../models/BaseRate.js";
import Product from "../models/Product.js";
import { validateBaseRate } from "../validators/baseRate.validator.js";

/* ================= SET BASE RATE ================= */
export const setBaseRate = async (req, res) => {
    try {

        const { isValid, errors } = validateBaseRate(req.body);

        if (!isValid) {
            return res.status(400).json({ errors });
        }

        const { product, rate } = req.body;

        const productExists = await Product.findById(product);

        if (!productExists) {
            return res.status(404).json({ message: "Product not found" });
        }

        /* ✅ ALWAYS CREATE NEW ENTRY (NO UPSERT) */
        const baseRate = await BaseRate.create({
            product,
            rate,
            date: new Date()
        });

        res.status(201).json(baseRate);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to set base rate"
        });
    }
};


/* ================= GLOBAL HISTORY ================= */
export const getAllBaseRateHistory = async (req, res) => {
    try {
        const history = await BaseRate.find({ isActive: true })
            .populate("product", "name")
            .sort({ date: -1 })
            .limit(50); // limit for dashboard

        res.json(history);
    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch global history"
        });
    }
};


/* ================= GET ALL LATEST BASE RATES ================= */
export const getAllLatestBaseRates = async (req, res) => {
    try {

        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const rates = await BaseRate.aggregate([
            { $match: { isActive: true } },

            { $sort: { date: -1 } },

            {
                $group: {
                    _id: "$product",

                    rates: { $push: "$rate" },   // 👈 store all rates
                    dates: { $push: "$date" },

                    updatedAt: { $first: "$updatedAt" }
                }
            },

            {
                $lookup: {
                    from: "products",
                    localField: "_id",
                    foreignField: "_id",
                    as: "product"
                }
            },
            { $unwind: "$product" },

            {
                $project: {
                    _id: 0,
                    productId: "$product._id",
                    productName: "$product.name",

                    rate: { $arrayElemAt: ["$rates", 0] },          // ✅ latest
                    previousRate: { $arrayElemAt: ["$rates", 1] },  // ✅ previous

                    change: {
                        $cond: [
                            { $gt: [{ $size: "$rates" }, 1] },
                            {
                                $subtract: [
                                    { $arrayElemAt: ["$rates", 0] },
                                    { $arrayElemAt: ["$rates", 1] }
                                ]
                            },
                            null
                        ]
                    },

                    date: { $arrayElemAt: ["$dates", 0] },
                    updatedAt: 1
                }
            },

            { $sort: { updatedAt: -1 } },

            { $skip: skip },
            { $limit: limit }
        ]);

        res.json({
            page,
            limit,
            data: rates
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to fetch base rates"
        });
    }
};


/* ================= GET LATEST BASE RATE ================= */
export const getLatestBaseRate = async (req, res) => {
    try {

        const { productId } = req.params;

        if (!productId) {
            return res.status(400).json({
                message: "Product ID is required"
            });
        }

        const rate = await BaseRate.findOne({
            product: productId,
            isActive: true
        }).sort({ date: -1 });

        if (!rate) {
            return res.status(404).json({
                message: "Base rate not found"
            });
        }

        res.json(rate);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to fetch base rate"
        });
    }
};


/* ================= GET HISTORY ================= */
export const getBaseRateHistory = async (req, res) => {
    try {

        const { productId } = req.params;

        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const history = await BaseRate.find({
            product: productId
        })
            .sort({ date: -1 })
            .skip(skip)
            .limit(limit);

        const total = await BaseRate.countDocuments({
            product: productId
        });

        res.json({
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
            data: history
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to fetch history"
        });
    }
};


/* ================= DELETE (SOFT) ================= */
export const deactivateBaseRate = async (req, res) => {
    try {

        const rate = await BaseRate.findById(req.params.id);

        if (!rate) {
            return res.status(404).json({
                message: "Base rate not found"
            });
        }

        if (!rate.isActive) {
            return res.status(400).json({
                message: "Base rate already inactive"
            });
        }

        rate.isActive = false;
        await rate.save();

        res.json({ message: "Base rate deactivated" });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to delete base rate"
        });
    }
};