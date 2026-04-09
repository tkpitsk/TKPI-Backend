import mongoose from "mongoose";
import Attendance from "../models/Attendance.js";
import Advance from "../models/Advance.js";

/* ================= HELPERS ================= */
const getDateKey = (d) =>
    new Date(d).toISOString().split("T")[0];

/* ================= SUMMARY ================= */
export const getEmployeeSummary = async (req, res) => {
    try {
        const { employeeId, start, end } = req.query;

        if (!mongoose.Types.ObjectId.isValid(employeeId)) {
            return res.status(400).json({ message: "Invalid employee ID" });
        }

        const startDate = new Date(start);
        const endDate = new Date(end);

        const attendance = await Attendance.find({
            employee: employeeId,
            date: { $gte: startDate, $lte: endDate },
        }).lean();

        const advances = await Advance.find({
            employee: employeeId,
            date: { $gte: startDate, $lte: endDate },
        }).lean();

        /* ================= COUNTS ================= */
        let present = 0;
        let absent = 0;
        let halfDay = 0;

        attendance.forEach((a) => {
            if (a.status === "present") present++;
            else if (a.status === "absent") absent++;
            else if (a.status === "half-day") halfDay++;
        });

        /* ================= ADVANCE ================= */
        const totalAdvance = advances.reduce(
            (sum, a) => sum + Number(a.amount || 0),
            0
        );

        /* ================= DERIVED ================= */
        const payableDays = present + (halfDay * 0.5);

        res.json({
            success: true,
            data: {
                totalRecords: attendance.length, // 🔥 clearer name
                present,
                absent,
                halfDay,
                payableDays,
                totalAdvance,
            },
        });

    } catch (err) {
        res.status(500).json({
            message: err.message || "Failed to fetch summary",
        });
    }
};

/* ================= DETAILS ================= */
export const getEmployeeDetails = async (req, res) => {
    try {
        const { employeeId, start, end } = req.query;

        if (!mongoose.Types.ObjectId.isValid(employeeId)) {
            return res.status(400).json({ message: "Invalid employee ID" });
        }

        const startDate = new Date(start);
        const endDate = new Date(end);

        const attendance = await Attendance.find({
            employee: employeeId,
            date: { $gte: startDate, $lte: endDate },
        })
            .sort({ date: 1 })
            .lean();

        const advances = await Advance.find({
            employee: employeeId,
            date: { $gte: startDate, $lte: endDate },
        }).lean();

        /* ================= MERGE ================= */
        const advanceMap = new Map();

        advances.forEach((a) => {
            const key = getDateKey(a.date);
            advanceMap.set(key, (advanceMap.get(key) || 0) + Number(a.amount || 0));
        });

        const records = attendance.map((item) => {
            const key = getDateKey(item.date);

            return {
                _id: item._id,
                date: item.date,
                status: item.status,
                advance: advanceMap.get(key) || 0,
            };
        });

        res.json({
            success: true,
            data: records,
        });

    } catch (err) {
        res.status(500).json({
            message: err.message || "Failed to fetch details",
        });
    }
};