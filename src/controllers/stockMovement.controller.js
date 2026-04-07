import StockMovement from "../models/StockMovement.js";
import Stock from "../models/Stock.js";

export const getStockMovements = async (req, res) => {
    try {

        const {
            variant,
            product,
            type,
            page = 1,
            limit = 10
        } = req.query;

        const filter = {};

        if (variant) filter.variant = variant;
        if (product) filter.product = product;
        if (type) filter.type = type;

        const skip = (page - 1) * limit;

        const data = await StockMovement.find(filter)
            .populate("product", "name")
            .populate("variant")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit));

        const total = await StockMovement.countDocuments(filter);

        res.json({
            page: Number(page),
            limit: Number(limit),
            total,
            totalPages: Math.ceil(total / limit),
            data
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch stock movements"
        });
    }
};

export const getVariantMovement = async (req, res) => {
    try {

        const { variantId } = req.params;

        const movements = await StockMovement.find({
            variant: variantId
        })
            .sort({ createdAt: -1 });

        res.json(movements);

    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch variant movement"
        });
    }
};

export const adjustStock = async (req, res) => {
    try {

        const { variantId, quantity, notes } = req.body;

        const stock = await Stock.findOne({ variant: variantId });

        if (!stock) {
            return res.status(404).json({
                message: "Stock not found"
            });
        }

        const previousStock = stock.quantity;

        stock.quantity += quantity;

        if (stock.quantity < 0) {
            return res.status(400).json({
                message: "Stock cannot be negative"
            });
        }

        await stock.save();

        await StockMovement.create({
            variant: variantId,
            product: stock.product,
            type: "adjustment",
            quantity,
            previousStock,
            newStock: stock.quantity,
            referenceModel: "Manual",
            notes
        });

        res.json({ message: "Stock adjusted" });

    } catch (error) {
        res.status(500).json({
            message: "Failed to adjust stock"
        });
    }
};

export const getStockByVariant = async (req, res) => {
    try {
        const { variantId } = req.params;

        const stock = await Stock.findOne({ variant: variantId });

        if (!stock) {
            return res.status(404).json({
                message: "Stock not found"
            });
        }

        res.json(stock);
    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch stock"
        });
    }
};