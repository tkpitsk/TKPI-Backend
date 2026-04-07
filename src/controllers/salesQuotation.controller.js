import mongoose from "mongoose";
import Product from "../models/Product.js";
import Variant from "../models/Variant.js";
import SalesQuotation from "../models/SalesQuotation.js";
import BaseRate from "../models/BaseRate.js";
import Stock from "../models/Stock.js";
import Customer from "../models/Customer.js";
import { validateSalesItem } from "../validators/salesQuotation.validator.js";

/* ================= CREATE QUOTATION ================= */
export const createQuotation = async (req, res) => {
    try {
        const {
            customer,
            items,
            notes,
            transportCost = 0,
            loadingCost = 0,
            gstPercent = 18
        } = req.body;

        /* ================= VALIDATE CUSTOMER ================= */

        if (!mongoose.Types.ObjectId.isValid(customer)) {
            return res.status(400).json({
                success: false,
                message: "Invalid customer ID"
            });
        }

        const customerExists = await Customer.findById(customer).lean();

        if (!customerExists || !customerExists.isActive) {
            return res.status(404).json({
                success: false,
                message: "Customer not found or inactive"
            });
        }

        /* ================= ITEMS VALIDATION ================= */

        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Items are required"
            });
        }

        /* ================= DUPLICATE CHECK ================= */

        const seen = new Set();
        for (const item of items) {
            const key = `${item.product}-${item.variant}`;
            if (seen.has(key)) {
                return res.status(400).json({
                    success: false,
                    message: "Duplicate product + variant not allowed"
                });
            }
            seen.add(key);
        }

        /* ================= BULK FETCH ================= */

        const productIds = items.map(i => i.product);
        const variantIds = items.map(i => i.variant);

        const [products, variants, baseRates, stocks] = await Promise.all([
            Product.find({ _id: { $in: productIds } }).lean(),
            Variant.find({ _id: { $in: variantIds } }).lean(),

            BaseRate.aggregate([
                { $match: { product: { $in: productIds }, isActive: true } },
                { $sort: { date: -1 } },
                {
                    $group: {
                        _id: "$product",
                        rate: { $first: "$rate" }
                    }
                }
            ]),

            Stock.find({ variant: { $in: variantIds } }).lean()
        ]);

        /* ================= MAPS ================= */

        const productMap = new Map(
            products.map(p => [String(p._id), p])
        );

        const variantMap = new Map(
            variants.map(v => [String(v._id), v])
        );

        const baseRateMap = new Map(
            baseRates.map(b => [String(b._id), b.rate]) // ✅ FIXED
        );

        const stockMap = new Map(
            stocks.map(s => [String(s.variant), s])
        );

        const finalItems = [];

        /* ================= PROCESS ITEMS ================= */

        for (const item of items) {

            const errors = validateSalesItem(item);

            if (Object.keys(errors).length > 0) {
                return res.status(400).json({
                    success: false,
                    errors
                });
            }

            const product = productMap.get(String(item.product));
            const variant = variantMap.get(String(item.variant));
            let baseRate = baseRateMap.get(String(item.product)); // ✅ FIXED
            const stock = stockMap.get(String(item.variant));

            /* ================= FALLBACK (IMPORTANT) ================= */

            if (!baseRate) {
                const fallback = await BaseRate.findOne({
                    product: item.product,
                    isActive: true
                }).sort({ date: -1 });

                if (!fallback) {
                    return res.status(400).json({
                        success: false,
                        message: "Base rate not found for selected product"
                    });
                }

                baseRate = fallback.rate;
            }

            /* ================= VALIDATIONS ================= */

            if (!product) {
                return res.status(400).json({
                    success: false,
                    message: "Product not found"
                });
            }

            if (!variant) {
                return res.status(400).json({
                    success: false,
                    message: "Variant not found"
                });
            }

            if (String(variant.product) !== String(product._id)) {
                return res.status(400).json({
                    success: false,
                    message: "Variant does not belong to product"
                });
            }

            /* ================= CALCULATIONS ================= */

            const difference = Number(item.difference || 0);
            const costPrice = baseRate + difference;
            const sellingPrice = Number(item.sellingPrice);
            const quantity = Number(item.quantity);

            if (sellingPrice < costPrice) {
                return res.status(400).json({
                    success: false,
                    message: "Selling price cannot be less than cost price"
                });
            }

            const finalAmount = sellingPrice * quantity;

            finalItems.push({
                product: item.product,
                variant: item.variant,
                quantity,
                unit: item.unit,
                baseRate,
                difference,
                costPrice,
                sellingPrice,
                finalAmount,
                profit: sellingPrice - costPrice
            });
        }

        /* ================= TOTALS ================= */

        const totalAmount = finalItems.reduce(
            (sum, i) => sum + i.finalAmount,
            0
        );

        const subtotal =
            totalAmount +
            Number(transportCost) +
            Number(loadingCost);

        const gstAmount =
            (subtotal * Number(gstPercent)) / 100;

        const finalTotal = subtotal + gstAmount;

        /* ================= CREATE ================= */

        const quotation = await SalesQuotation.create({
            customer,
            items: finalItems,
            totalAmount,
            transportCost,
            loadingCost,
            gstPercent,
            gstAmount,
            finalTotal,
            notes,
            status: "draft"
        });

        /* ================= RESPONSE ================= */

        return res.status(201).json({
            success: true,
            data: {
                ...quotation.toObject(),
                items: quotation.items.map(item => ({
                    ...item.toObject(),
                    availableStock:
                        stockMap.get(String(item.variant))?.quantity -
                        stockMap.get(String(item.variant))?.reserved || 0
                }))
            }
        });

    } catch (error) {
        console.error("Create Quotation Error:", error);

        return res.status(500).json({
            success: false,
            message: error.message || "Failed to create quotation"
        });
    }
};

/* ================= GET ALL ================= */
export const getQuotations = async (req, res) => {
    try {

        const {
            page = 1,
            limit = 10,
            status,
            customer,
            fromDate,
            toDate
        } = req.query;

        const filter = { isActive: true };

        if (status) filter.status = status;
        if (customer) filter.customer = customer;

        if (fromDate || toDate) {
            filter.createdAt = {};
            if (fromDate) filter.createdAt.$gte = new Date(fromDate);
            if (toDate) filter.createdAt.$lte = new Date(toDate);
        }

        const skip = (page - 1) * limit;

        const [data, total] = await Promise.all([
            SalesQuotation.find(filter)
                .populate("customer", "name")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(Number(limit)),

            SalesQuotation.countDocuments(filter)
        ]);

        return res.json({
            success: true,
            page: Number(page),
            limit: Number(limit),
            total,
            totalPages: Math.ceil(total / limit),
            data
        });

    } catch (error) {
        console.error("Get Quotations Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch quotations"
        });
    }
};


/* ================= GET ONE ================= */
export const getQuotationById = async (req, res) => {
    try {

        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid quotation ID"
            });
        }

        const quotation = await SalesQuotation.findById(id)
            .populate("customer", "-__v")
            .populate("items.product")
            .populate("items.variant");

        if (!quotation) {
            return res.status(404).json({
                success: false,
                message: "Quotation not found"
            });
        }

        return res.json({
            success: true,
            data: quotation
        });

    } catch (error) {
        console.error("Get Quotation Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch quotation"
        });
    }
};


/* ================= UPDATE STATUS ================= */
export const updateQuotationStatus = async (req, res) => {
    try {

        const { id } = req.params;
        const { status } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid quotation ID"
            });
        }

        const quotation = await SalesQuotation.findById(id);

        if (!quotation) {
            return res.status(404).json({
                success: false,
                message: "Quotation not found"
            });
        }

        const allowedTransitions = {
            draft: ["sent"],
            sent: ["approved", "rejected"],
            approved: [],
            rejected: []
        };

        if (!allowedTransitions[quotation.status].includes(status)) {
            return res.status(400).json({
                success: false,
                message: `Cannot change status from ${quotation.status} to ${status}`
            });
        }

        quotation.status = status;
        await quotation.save();

        return res.json({
            success: true,
            data: quotation
        });

    } catch (error) {
        console.error("Update Status Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to update status"
        });
    }
};