import mongoose from "mongoose";
import Attendance from "../models/Attendance.js";
import Advance from "../models/Advance.js";

/* ================= HELPER ================= */
const normalizeDate = (d) => {
  const date = new Date(d);
  date.setHours(0, 0, 0, 0);
  return date;
};

const getDateKey = (d) =>
  new Date(d).toISOString().split("T")[0];

/* ================= MARK ATTENDANCE ================= */
export const markAttendance = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    const { employeeId, date, status, advance = 0 } = req.body;

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