import mongoose from "mongoose";
import Attendance from "../models/Attendance.js";
import Advance from "../models/Advance.js";

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
    const { employeeId, date, status, advance: rawAdvance = 0, reason = "" } = req.body;
    const advance = Math.round(Number(rawAdvance));

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

    /* ================= ADVANCE ================= */
    if (advance > 0) {
      await Advance.findOneAndUpdate(
        { employee: employeeId, date: normalizedDate },
        {
          amount: advance,
          givenBy: req.user._id,
        },
        {
          upsert: true,
          session,
          setDefaultsOnInsert: true,
        }
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

    advances.forEach((a) => {
      const key = getDateKey(a.date);
      advanceMap.set(key, (advanceMap.get(key) || 0) + a.amount);
    });

    const merged = attendance.map((a) => {
      const key = getDateKey(a.date);

      return {
        date: a.date,
        status: a.status,
        advance: advanceMap.get(key) || 0,
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

    advances.forEach((a) => {
      const key = getDateKey(a.date);
      advanceMap.set(key, (advanceMap.get(key) || 0) + a.amount);
    });

    const merged = attendance.map((a) => {
      const key = getDateKey(a.date);

      return {
        date: a.date,
        status: a.status,
        advance: advanceMap.get(key) || 0,
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
        const { employeeIds, startDate, endDate, status, advance: rawAdvance = 0, reason = "" } = req.body;
        const advance = Math.round(Number(rawAdvance));

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

                if (advance > 0) {
                    advanceOperations.push({
                        updateOne: {
                            filter: { employee: id, date: normalizedDate },
                            update: {
                                amount: advance,
                                givenBy: req.user._id,
                            },
                            upsert: true,
                            setDefaultsOnInsert: true
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