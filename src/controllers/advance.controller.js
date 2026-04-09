import mongoose from "mongoose";
import Advance from "../models/Advance.js";

/* ================= GIVE ADVANCE ================= */
export const giveAdvance = async (req, res) => {
    try {
        const { employeeId, amount, date, reason } = req.body;

        /* ================= VALIDATION ================= */
        if (!mongoose.Types.ObjectId.isValid(employeeId)) {
            return res.status(400).json({ message: "Invalid employee ID" });
        }

        if (!amount || amount < 0) {
            return res.status(400).json({ message: "Invalid advance amount" });
        }

        if (!date) {
            return res.status(400).json({ message: "Date is required" });
        }

        const normalizedDate = new Date(date);
        normalizedDate.setHours(0, 0, 0, 0);

        /* ================= CREATE ================= */
        const advance = await Advance.findOneAndUpdate(
            { employee: employeeId, date: normalizedDate },
            {
                amount,
                givenBy: req.user._id,
                note: reason, // ✅ FIXED
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        res.status(201).json({
            message: "Advance recorded",
            advance,
        });

    } catch (err) {
        /* 🔥 HANDLE DUPLICATE INDEX ERROR */
        if (err.code === 11000) {
            return res.status(400).json({
                message: "Advance already exists for this date",
            });
        }

        res.status(500).json({
            message: err.message || "Failed to record advance",
        });
    }
};

/* ================= GET ADVANCES ================= */
export const getAdvances = async (req, res) => {
    try {
        const { employeeId, start, end } = req.query;

        if (!mongoose.Types.ObjectId.isValid(employeeId)) {
            return res.status(400).json({ message: "Invalid employee ID" });
        }

        const startDate = new Date(start);
        const endDate = new Date(end);

        const advances = await Advance.find({
            employee: employeeId,
            date: { $gte: startDate, $lte: endDate }
        }).sort({ date: 1 });

        res.json(advances);

    } catch (err) {
        res.status(500).json({
            message: err.message || "Failed to fetch advances",
        });
    }
};

/* ================= GET MY ADVANCES ================= */
export const getMyAdvances = async (req, res) => {
    try {
        const { start, end } = req.query;

        const startDate = new Date(start);  // ✅ FIXED
        const endDate = new Date(end);      // ✅ FIXED

        const advances = await Advance.find({
            employee: req.user._id,
            date: { $gte: startDate, $lte: endDate }
        }).sort({ date: 1 });

        res.json(advances);

    } catch (err) {
        res.status(500).json({
            message: err.message || "Failed to fetch your advances",
        });
    }
};