import SupplierBaseRate from "../models/SupplierBaseRate.js";
import Category from "../models/Category.js";
import Supplier from "../models/Supplier.js";

/* ================= SET SUPPLIER BASE RATE ================= */
export const setSupplierBaseRate = async (req, res) => {
    try {
        const { supplierId, categoryId, baseRate, region } = req.body;

        if (!supplierId || !categoryId || !baseRate) {
            return res.status(400).json({ message: "Supplier, Category and Base Rate are required" });
        }

        const supplier = await Supplier.findById(supplierId);
        const category = await Category.findById(categoryId);

        if (!supplier || !category) {
            return res.status(404).json({ message: "Supplier or Category not found" });
        }

        /* Create new daily record */
        const rateRecord = await SupplierBaseRate.create({
            supplierId,
            categoryId,
            baseRate,
            region: region || "All India",
            effectiveDate: new Date(),
            updatedBy: req.user?._id
        });

        res.status(201).json(rateRecord);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to set supplier base rate" });
    }
};

/* ================= GET LATEST RATES FOR MATRIX ================= */
export const getSupplierRateMatrix = async (req, res) => {
    try {
        /* 
           This query will group by category and supplier to find the latest rate for each combination.
        */
        const matrix = await SupplierBaseRate.aggregate([
            { $sort: { effectiveDate: -1 } },
            {
                $group: {
                    _id: {
                        supplierId: "$supplierId",
                        categoryId: "$categoryId"
                    },
                    latestRate: { $first: "$baseRate" },
                    date: { $first: "$effectiveDate" }
                }
            },
            {
                $lookup: {
                    from: "suppliers",
                    localField: "_id.supplierId",
                    foreignField: "_id",
                    as: "supplier"
                }
            },
            {
                $lookup: {
                    from: "categories",
                    localField: "_id.categoryId",
                    foreignField: "_id",
                    as: "category"
                }
            },
            { $unwind: "$supplier" },
            { $unwind: "$category" },
            {
                $project: {
                    _id: 0,
                    supplierId: "$supplier._id",
                    supplierName: "$supplier.name",
                    categoryId: "$category._id",
                    categoryName: "$category.name",
                    rate: "$latestRate",
                    date: 1
                }
            }
        ]);

        res.json(matrix);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to fetch rate matrix" });
    }
};

/* ================= GET HISTORY PER SUPPLIER/CATEGORY ================= */
export const getRateHistory = async (req, res) => {
    try {
        const { supplierId, categoryId } = req.query;

        const filter = {};
        if (supplierId) filter.supplierId = supplierId;
        if (categoryId) filter.categoryId = categoryId;

        const history = await SupplierBaseRate.find(filter)
            .populate("supplierId", "name")
            .populate("categoryId", "name")
            .sort({ effectiveDate: -1 })
            .limit(100);

        res.json(history);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch history" });
    }
};
