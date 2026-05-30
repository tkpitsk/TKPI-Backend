import mongoose from "mongoose";
import Attendance from "../models/Attendance.js";
import Advance from "../models/Advance.js";
import User from "../models/User.js";
import { calculateSalary } from "../services/salary.service.js";

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

        const employee = await User.findById(employeeId).lean();
        if (!employee) {
            return res.status(404).json({ message: "Employee not found" });
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

        const totalDeduction = advances.reduce(
            (sum, a) => sum + Number(a.deduction || 0),
            0
        );

        /* ================= DERIVED ================= */
        const payableDays = present + (halfDay * 0.5);

        // Fetch Lifetime Balance up to endDate
        const { calculateLifetimeBalance } = await import("../services/salary.service.js");
        const lifetimeData = await calculateLifetimeBalance({ employee, endDate });

        res.json({
            success: true,
            data: {
                totalRecords: attendance.length,
                present,
                absent,
                halfDay,
                payableDays,
                totalAdvance,
                totalDeduction,
                netAdvance: lifetimeData.netAdvance, // Lifetime Running Balance
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
        const deductionMap = new Map();

        advances.forEach((a) => {
            const key = getDateKey(a.date);
            advanceMap.set(key, (advanceMap.get(key) || 0) + Number(a.amount || 0));
            deductionMap.set(key, (deductionMap.get(key) || 0) + Number(a.deduction || 0));
        });

        const records = attendance.map((item) => {
            const key = getDateKey(item.date);

            return {
                _id: item._id,
                date: item.date,
                status: item.status,
                advance: advanceMap.get(key) || 0,
                deduction: deductionMap.get(key) || 0,
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

/* ================= ALL EMPLOYEES SUMMARY ================= */
export const getAllEmployeesSummary = async (req, res) => {
    try {
        const { start, end } = req.query;

        const startDate = new Date(start);
        const endDate = new Date(end);

        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            return res.status(400).json({ message: "Invalid date range" });
        }

        // Fetch all employees
        const employees = await User.find({
            role: { $in: ["admin", "manager", "employee", "worker"] },
            isActive: true
        }).sort({ name: 1 }).lean();

        const employeeIds = employees.map(e => e._id);

        // Fetch Period Data (for period salary and stats)
        const periodAttendance = await Attendance.find({
            employee: { $in: employeeIds },
            date: { $gte: startDate, $lte: endDate }
        }).lean();

        const periodAdvances = await Advance.find({
            employee: { $in: employeeIds },
            date: { $gte: startDate, $lte: endDate }
        }).lean();

        // Fetch Lifetime Data (for netAdvance balance)
        const lifetimeAttendance = await Attendance.find({
            employee: { $in: employeeIds },
            date: { $lte: endDate }
        }).lean();

        const lifetimeAdvances = await Advance.find({
            employee: { $in: employeeIds },
            date: { $lte: endDate }
        }).lean();

        const attendanceByEmp = {};
        for (const a of periodAttendance) {
            const empId = a.employee.toString();
            if (!attendanceByEmp[empId]) attendanceByEmp[empId] = [];
            attendanceByEmp[empId].push(a);
        }

        const advanceByEmp = {};
        for (const a of periodAdvances) {
            const empId = a.employee.toString();
            if (!advanceByEmp[empId]) advanceByEmp[empId] = [];
            advanceByEmp[empId].push(a);
        }

        const lifetimeAttendanceByEmp = {};
        for (const a of lifetimeAttendance) {
            const empId = a.employee.toString();
            if (!lifetimeAttendanceByEmp[empId]) lifetimeAttendanceByEmp[empId] = [];
            lifetimeAttendanceByEmp[empId].push(a);
        }

        const lifetimeAdvanceByEmp = {};
        for (const a of lifetimeAdvances) {
            const empId = a.employee.toString();
            if (!lifetimeAdvanceByEmp[empId]) lifetimeAdvanceByEmp[empId] = [];
            lifetimeAdvanceByEmp[empId].push(a);
        }

        const { calculateLifetimeBalance } = await import("../services/salary.service.js");

        const reportData = await Promise.all(employees.map(async (employee) => {
            const empId = employee._id.toString();
            const attendanceData = attendanceByEmp[empId] || [];
            const advanceData = advanceByEmp[empId] || [];
            const allAttendanceData = lifetimeAttendanceByEmp[empId] || [];
            const allAdvanceData = lifetimeAdvanceByEmp[empId] || [];

            // Calculate Period Data
            const data = await calculateSalary({
                employee,
                startDate,
                endDate,
                attendanceData,
                advanceData
            });

            // Calculate Lifetime Balance
            const lifetimeData = await calculateLifetimeBalance({
                employee,
                endDate,
                allAttendanceData,
                allAdvanceData
            });

            let present = 0, absent = 0, halfDay = 0;
            attendanceData.forEach(a => {
                if (a.status === "present") present++;
                else if (a.status === "absent") absent++;
                else if (a.status === "half-day") halfDay++;
            });

            return {
                employee: {
                    _id: employee._id,
                    name: employee.name || employee.userId,
                    userId: employee.userId,
                    role: employee.role,
                    joiningDate: employee.createdAt,
                    image: employee.image
                },
                summary: {
                    present,
                    absent,
                    halfDay,
                    payableDays: data.payableDays,
                    totalAdvance: Math.round(data.totalAdvance), // Period Advance
                    totalDeduction: Math.round(data.totalDeduction || 0), // Period Deduction
                    earned: Math.round(data.earned), // Period Earned
                    netSalary: Math.round(data.netSalary), // Period Net Salary
                    netAdvance: lifetimeData.netAdvance, // Lifetime Running Balance
                    rawAttendance: attendanceData.map(a => ({
                        date: a.date,
                        status: a.status
                    }))
                }
            };
        }));

        res.json({
            success: true,
            data: reportData
        });

    } catch (err) {
        console.error("Global report error:", err);
        res.status(500).json({ message: err.message || "Failed to fetch global report" });
    }
};