import Attendance from "../models/Attendance.js";
import Advance from "../models/Advance.js";

export const markAttendance = async (req, res) => {
  try {
    const { employeeId, date, status, advance = 0 } = req.body;

    const attendance = await Attendance.findOneAndUpdate(
      { employee: employeeId, date },
      {
        status,
        markedBy: req.user._id,
      },
      { upsert: true, new: true }
    );

    // 🔥 HANDLE ADVANCE
    if (advance > 0) {
      await Advance.findOneAndUpdate(
        { employee: employeeId, date },
        {
          amount: advance,
          givenBy: req.user._id,
        },
        { upsert: true }
      );
    }

    res.json({ attendance });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to mark attendance" });
  }
};

/* ================= GET ATTENDANCE ================= */
export const getAttendance = async (req, res) => {
  const { employeeId, start, end } = req.query;

  const attendance = await Attendance.find({
    employee: employeeId,
    date: { $gte: new Date(start), $lte: new Date(end) },
  }).lean();

  const advances = await Advance.find({
    employee: employeeId,
    date: { $gte: new Date(start), $lte: new Date(end) },
  }).lean();

  const advanceMap = new Map();
  advances.forEach((a) => {
    advanceMap.set(
      new Date(a.date).toDateString(),
      a.amount
    );
  });

  const merged = attendance.map((a) => ({
    date: a.date,
    status: a.status,
    advance:
      advanceMap.get(new Date(a.date).toDateString()) || 0,
  }));

  res.json(merged);
};


export const getMyAttendance = async (req, res) => {
  const { start, end } = req.query;

  const attendance = await Attendance.find({
    employee: req.user._id,
    date: { $gte: new Date(start), $lte: new Date(end) },
  }).lean();

  const advances = await Advance.find({
    employee: req.user._id,
    date: { $gte: new Date(start), $lte: new Date(end) },
  }).lean();

  const advanceMap = new Map();
  advances.forEach((a) => {
    advanceMap.set(
      new Date(a.date).toDateString(),
      a.amount
    );
  });

  const merged = attendance.map((a) => ({
    date: a.date,
    status: a.status,
    advance:
      advanceMap.get(new Date(a.date).toDateString()) || 0,
  }));

  res.json(merged);
};
