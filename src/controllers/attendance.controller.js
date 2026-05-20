import mongoose from "mongoose";
import Attendance from "../models/Attendance.js";
import Advance from "../models/Advance.js";
import User from "../models/User.js";

/* ================= HELPER ================= */
const normalizeDate = (d) => {
  const date = new Date(d);
  date.setUTCHours(0, 0, 0, 0);
  return date;
};

const getDateKey = (d) =>
  new Date(d).toISOString().split("T")[0];

/* ================= MARK ATTENDANCE ================= */
export const markAttendance = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    const { employeeId, date, status, advance: rawAdvance = 0, deduction: rawDeduction = 0, reason = "" } = req.body;
    const advance = Math.round(Number(rawAdvance));
    const deduction = Math.round(Number(rawDeduction));

    /* ================= VALIDATION ================= */
    if (!mongoose.Types.ObjectId.isValid(employeeId)) {
      return res.status(400).json({ message: "Invalid employee ID" });
    }

    if (!date) {
      return res.status(400).json({ message: "Date is required" });
    }

    const normalizedDate = normalizeDate(date);

    await session.startTransaction();

    /* ================= ATTENDANCE ================= */
    const attendance = await Attendance.findOneAndUpdate(
      { employee: employeeId, date: normalizedDate },
      {
        status,
        markedBy: req.user._id,
        reason,
      },
      {
        upsert: true,
        new: true,
        session,
      }
    );

    /* ================= ADVANCE & DEDUCTION ================= */
    if (advance > 0 || deduction > 0) {
      await Advance.findOneAndUpdate(
        { employee: employeeId, date: normalizedDate },
        {
          amount: advance,
          deduction: deduction,
          givenBy: req.user._id,
        },
        {
          upsert: true,
          session,
          setDefaultsOnInsert: true,
        }
      );
    } else {
      await Advance.findOneAndDelete(
        { employee: employeeId, date: normalizedDate },
        { session }
      );
    }

    await session.commitTransaction();

    res.json({ attendance });

  } catch (err) {
    await session.abortTransaction();

    console.error(err);

    res.status(500).json({
      message: err.message || "Failed to mark attendance",
    });
  } finally {
    session.endSession();
  }
};

/* ================= GET ATTENDANCE ================= */
export const getAttendance = async (req, res) => {
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

    /* ================= MERGE ================= */
    const advanceMap = new Map();
    const deductionMap = new Map();

    advances.forEach((a) => {
      const key = getDateKey(a.date);
      advanceMap.set(key, (advanceMap.get(key) || 0) + (a.amount || 0));
      deductionMap.set(key, (deductionMap.get(key) || 0) + (a.deduction || 0));
    });

    const merged = attendance.map((a) => {
      const key = getDateKey(a.date);

      return {
        date: a.date,
        status: a.status,
        advance: advanceMap.get(key) || 0,
        deduction: deductionMap.get(key) || 0,
      };
    });

    res.json(merged);

  } catch (err) {
    res.status(500).json({
      message: err.message || "Failed to fetch attendance",
    });
  }
};

/* ================= GET MY ATTENDANCE ================= */
export const getMyAttendance = async (req, res) => {
  try {
    const { start, end } = req.query;

    const startDate = new Date(start);
    const endDate = new Date(end);

    const attendance = await Attendance.find({
      employee: req.user._id,
      date: { $gte: startDate, $lte: endDate },
    }).lean();

    const advances = await Advance.find({
      employee: req.user._id,
      date: { $gte: startDate, $lte: endDate },
    }).lean();

    /* ================= MERGE ================= */
    const advanceMap = new Map();
    const deductionMap = new Map();

    advances.forEach((a) => {
      const key = getDateKey(a.date);
      advanceMap.set(key, (advanceMap.get(key) || 0) + (a.amount || 0));
      deductionMap.set(key, (deductionMap.get(key) || 0) + (a.deduction || 0));
    });

    const merged = attendance.map((a) => {
      const key = getDateKey(a.date);

      return {
        date: a.date,
        status: a.status,
        advance: advanceMap.get(key) || 0,
        deduction: deductionMap.get(key) || 0,
      };
    });

    res.json(merged);

    } catch (err) {
        res.status(500).json({
            message: err.message || "Failed to fetch your attendance",
        });
    }
};

/* ================= BULK MARK ATTENDANCE ================= */
export const bulkMarkAttendance = async (req, res) => {
    const session = await mongoose.startSession();

    try {
        const { employeeIds, startDate, endDate, status, advance: rawAdvance = 0, deduction: rawDeduction = 0, reason = "", employeeAdvances, employeeDeductions } = req.body;
        const advance = Math.round(Number(rawAdvance));
        const deduction = Math.round(Number(rawDeduction));

        if (!Array.isArray(employeeIds) || employeeIds.length === 0) {
            return res.status(400).json({ message: "Employee IDs array is required" });
        }

        if (!startDate) {
            return res.status(400).json({ message: "Start date is required" });
        }

        // Generate date range
        const dates = [];
        let current = new Date(startDate);
        const last = endDate ? new Date(endDate) : new Date(startDate);
        
        // Normalize dates to midnight UTC for consistent matching
        current.setUTCHours(0, 0, 0, 0);
        last.setUTCHours(0, 0, 0, 0);

        // Safety check to prevent infinite loops or excessive ranges (e.g. > 31 days)
        const diffDays = Math.ceil((last - current) / (1000 * 60 * 60 * 24));
        if (diffDays > 31) {
            return res.status(400).json({ message: "Date range cannot exceed 31 days" });
        }
        if (diffDays < 0) {
            return res.status(400).json({ message: "End date must be after start date" });
        }

        while (current <= last) {
            dates.push(new Date(current));
            current.setUTCDate(current.getUTCDate() + 1);
        }

        await session.startTransaction();

        /* ================= BULK OPERATIONS ================= */
        const attendanceOperations = [];
        const advanceOperations = [];

        for (const dateObj of dates) {
            const normalizedDate = normalizeDate(dateObj);
            
            for (const id of employeeIds) {
                attendanceOperations.push({
                    updateOne: {
                        filter: { employee: id, date: normalizedDate },
                        update: {
                            status,
                            markedBy: req.user._id,
                            reason,
                        },
                        upsert: true
                    }
                });

                // Determine advance amount for this specific employee
                let empAdvance = advance;
                let hasCustomAdvance = false;
                if (employeeAdvances && employeeAdvances[id] !== undefined && employeeAdvances[id] !== "") {
                    empAdvance = Math.round(Number(employeeAdvances[id] || 0));
                    hasCustomAdvance = true;
                }

                // Determine deduction amount for this specific employee
                let empDeduction = deduction;
                let hasCustomDeduction = false;
                if (employeeDeductions && employeeDeductions[id] !== undefined && employeeDeductions[id] !== "") {
                    empDeduction = Math.round(Number(employeeDeductions[id] || 0));
                    hasCustomDeduction = true;
                }

                if (empAdvance > 0 || empDeduction > 0) {
                    advanceOperations.push({
                        updateOne: {
                            filter: { employee: id, date: normalizedDate },
                            update: {
                                amount: empAdvance,
                                deduction: empDeduction,
                                givenBy: req.user._id,
                            },
                            upsert: true,
                            setDefaultsOnInsert: true
                        }
                    });
                } else if ((hasCustomAdvance && empAdvance === 0) || (hasCustomDeduction && empDeduction === 0)) {
                    // Explicitly set custom advance or deduction to 0 / cleared: delete the advance record for this date
                    advanceOperations.push({
                        deleteOne: {
                            filter: { employee: id, date: normalizedDate }
                        }
                    });
                }
            }
        }

        if (attendanceOperations.length > 0) {
            await Attendance.bulkWrite(attendanceOperations, { session });
        }

        if (advanceOperations.length > 0) {
            await Advance.bulkWrite(advanceOperations, { session });
        }

        await session.commitTransaction();

        res.json({
            message: `Successfully marked ${status} and ₹${advance} advance for ${employeeIds.length} employees over ${dates.length} days`,
            count: employeeIds.length,
            days: dates.length,
            totalEntries: attendanceOperations.length
        });

    } catch (err) {
        if (session.inTransaction()) {
            await session.abortTransaction();
        }
        console.error("Bulk Attendance Error:", err);
        res.status(500).json({
            message: err.message || "Failed to mark bulk attendance",
        });
    } finally {
        session.endSession();
    }
};

/* ================= AUTO MARK PRESENT ================= */
export const autoMarkPresent = async (req, res) => {
    try {
        const { date, roles } = req.body;
        
        if (!date) {
            return res.status(400).json({ message: "Date is required" });
        }
        if (!Array.isArray(roles) || roles.length === 0) {
            return res.status(400).json({ message: "At least one role is required" });
        }

        const targetDate = normalizeDate(date);

        // 1. Find all active users with the matching roles
        const users = await User.find({
            role: { $in: roles },
            isActive: true
        }).lean();

        if (users.length === 0) {
            return res.json({ message: "No active users found for the chosen roles", count: 0 });
        }

        const userIds = users.map(u => u._id);

        // 2. Find who already has attendance marked on this date
        const existingAttendance = await Attendance.find({
            employee: { $in: userIds },
            date: targetDate
        }).lean();

        const markedUserIds = new Set(existingAttendance.map(a => a.employee.toString()));

        // 3. Filter to find users who do NOT have attendance marked
        const unmarkedUserIds = userIds.filter(id => !markedUserIds.has(id.toString()));

        if (unmarkedUserIds.length === 0) {
            return res.json({ message: "All matching employees already have attendance marked for this day", count: 0 });
        }

        // 4. Perform bulk insert/upsert for the unmarked employees as "present"
        const operations = unmarkedUserIds.map(id => ({
            updateOne: {
                filter: { employee: id, date: targetDate },
                update: {
                    status: "present",
                    markedBy: req.user._id,
                    reason: "Auto-marked present"
                },
                upsert: true
            }
        }));

        await Attendance.bulkWrite(operations);

        res.json({
            success: true,
            message: `Successfully auto-marked ${unmarkedUserIds.length} employees as present`,
            count: unmarkedUserIds.length
        });

    } catch (err) {
        console.error("Auto Mark Present Error:", err);
        res.status(500).json({ message: err.message || "Failed to auto mark attendance" });
    }
};