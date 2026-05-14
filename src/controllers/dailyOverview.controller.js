import mongoose from "mongoose";
import Attendance from "../models/Attendance.js";
import Advance from "../models/Advance.js";
import Reminder from "../models/Reminder.js";

const normalizeDate = (d) => {
  const date = new Date(d);
  date.setUTCHours(0, 0, 0, 0);
  return date;
};

export const getDailyOverview = async (req, res) => {
  try {
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ message: "Date is required" });
    }

    const targetDate = normalizeDate(date);
    const endDate = new Date(targetDate);
    endDate.setHours(23, 59, 59, 999);

    // 1. Fetch Attendance
    let attendance = await Attendance.find({
      date: { $gte: targetDate, $lte: endDate },
    })
      .populate("employee", "name userId image role")
      .populate("markedBy", "name")
      .lean();

    // 2. Fetch Advances
    let advances = await Advance.find({
      date: { $gte: targetDate, $lte: endDate },
    })
      .populate("employee", "name userId image role")
      .populate("givenBy", "name")
      .lean();

    // 3. Fetch Reminders
    const reminders = await Reminder.find({
      date: { $gte: targetDate, $lte: endDate },
    })
      .populate("createdBy", "name")
      .lean();

    res.json({
      date: targetDate,
      attendance,
      advances,
      reminders,
    });
  } catch (err) {
    console.error("Daily Overview Error:", err);
    res.status(500).json({
      message: err.message || "Failed to fetch daily overview",
    });
  }
};
