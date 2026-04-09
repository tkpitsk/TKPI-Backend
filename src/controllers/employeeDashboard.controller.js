import mongoose from "mongoose";
import User from "../models/User.js";
import Attendance from "../models/Attendance.js";
import Advance from "../models/Advance.js";
import { calculateSalary } from "../services/salary.service.js";

/* ================= HELPERS ================= */
const getDateKey = (d) =>
    new Date(d).toISOString().split("T")[0];

export const getEmployeeDashboard = async (req, res) => {
    try {
        const { employeeId, start, end } = req.query;

        /* ================= VALIDATION ================= */
        if (!mongoose.Types.ObjectId.isValid(employeeId)) {
            return res.status(400).json({ message: "Invalid employee ID" });
        }

        if (!start || !end) {
            return res.status(400).json({
                message: "Start and end dates are required"
            });
        }

        const startDate = new Date(start);
        const endDate = new Date(end);

        /* ================= EMPLOYEE ================= */
        const employee = await User.findById(employeeId)
            .select("userId role name phone salaryType salaryAmount");

        if (!employee) {
            return res.status(404).json({ message: "Employee not found" });
        }

        /* ================= ATTENDANCE ================= */
        const attendance = await Attendance.find({
            employee: employeeId,
            date: { $gte: startDate, $lte: endDate }
        })
            .sort({ date: 1 }) // 🔥 important for timeline
            .lean();

        /* ================= ADVANCE ================= */
        const advances = await Advance.find({
            employee: employeeId,
            date: { $gte: startDate, $lte: endDate }
        }).lean();

        /* ================= MERGE ================= */
        const advanceMap = new Map();

        advances.forEach(a => {
            const key = getDateKey(a.date);
            advanceMap.set(
                key,
                (advanceMap.get(key) || 0) + Number(a.amount || 0)
            );
        });

        const records = attendance.map(a => {
            const key = getDateKey(a.date);

            return {
                date: a.date,
                status: a.status,
                advance: advanceMap.get(key) || 0
            };
        });

        /* ================= SALARY ================= */
        const salary = await calculateSalary({
            employee,
            startDate,
            endDate
        });

        /* ================= RESPONSE ================= */
        res.json({
            success: true,
            data: {
                employee: {
                    _id: employee._id,
                    userId: employee.userId,
                    role: employee.role,
                    name: employee.name,
                    phone: employee.phone,
                    salaryType: employee.salaryType,
                    salaryAmount: employee.salaryAmount
                },
                summary: {
                    present: salary.present,
                    absent: salary.absent,
                    halfDay: salary.halfDay,
                    payableDays: salary.payableDays, // 🔥 important
                    totalAdvance: salary.totalAdvance
                },
                salary,
                records
            }
        });

    } catch (err) {
        res.status(500).json({
            message: err.message || "Failed to fetch dashboard"
        });
    }
};