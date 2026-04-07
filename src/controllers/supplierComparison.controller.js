import mongoose from "mongoose";
import SupplierQuote from "../models/SupplierQuote.js";

/* ================= COMPARISON ================= */
export const getSupplierComparison = async (req, res) => {
    try {

        const { productId, variantId } = req.query;

        if (!productId || !variantId) {
            return res.status(400).json({
                message: "Product and variant required"
            });
        }

        const data = await SupplierQuote.aggregate([

            {
                $match: {
                    product: new mongoose.Types.ObjectId(productId),
                    variant: new mongoose.Types.ObjectId(variantId),
                    isActive: true
                }
            },

            /* SORT LATEST FIRST */
            { $sort: { createdAt: -1 } },

            /* GROUP BY SUPPLIER */
            {
                $group: {
                    _id: "$supplier",

                    latestQuote: { $first: "$$ROOT" },

                    avgPrice: { $avg: "$finalAmount" },
                    minPrice: { $min: "$finalAmount" },
                    maxPrice: { $max: "$finalAmount" },

                    totalQuotes: { $sum: 1 }
                }
            },

            /* JOIN SUPPLIER */
            {
                $lookup: {
                    from: "suppliers",
                    localField: "_id",
                    foreignField: "_id",
                    as: "supplier"
                }
            },

            { $unwind: "$supplier" },

            {
                $project: {
                    _id: 0,

                    supplierId: "$supplier._id",
                    supplierName: "$supplier.name",

                    latestPrice: "$latestQuote.finalAmount",
                    latestDifference: "$latestQuote.difference",
                    latestDate: "$latestQuote.createdAt",

                    avgPrice: 1,
                    minPrice: 1,
                    maxPrice: 1,

                    totalQuotes: 1
                }
            },

            /* SORT BY BEST PRICE */
            { $sort: { latestPrice: 1 } }

        ]);

        res.json(data);

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Failed to fetch comparison"
        });
    }
};

export const getBestSupplier = async (req, res) => {
    try {

        const { productId, variantId } = req.query;

        const best = await SupplierQuote.findOne({
            product: productId,
            variant: variantId,
            isActive: true
        })
            .sort({ finalAmount: 1 }) // 🔥 lowest price
            .populate("supplier", "name");

        if (!best) {
            return res.status(404).json({
                message: "No quotes found"
            });
        }

        res.json(best);

    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch best supplier"
        });
    }
};

export const getPriceTrend = async (req, res) => {
    try {

        const { productId, variantId } = req.query;

        const trend = await SupplierQuote.find({
            product: productId,
            variant: variantId,
            isActive: true
        })
            .select("finalAmount createdAt supplier")
            .populate("supplier", "name")
            .sort({ createdAt: 1 });

        res.json(trend);

    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch trend"
        });
    }
};

export const getSupplierPerformance = async (req, res) => {
    try {

        const { supplierId } = req.params;

        const data = await SupplierQuote.aggregate([

            {
                $match: {
                    supplier: new mongoose.Types.ObjectId(supplierId),
                    isActive: true
                }
            },

            {
                $group: {
                    _id: null,
                    avgPrice: { $avg: "$finalAmount" },
                    minPrice: { $min: "$finalAmount" },
                    maxPrice: { $max: "$finalAmount" },
                    totalQuotes: { $sum: 1 }
                }
            }

        ]);

        res.json(data[0] || {});

    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch supplier performance"
        });
    }
};