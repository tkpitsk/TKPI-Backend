import Attendance from "../models/Attendance.js";
import Advance from "../models/Advance.js";

/* ================= HELPERS ================= */
const round = (num) => Math.round(num || 0);

/* ================= CALCULATE SALARY ================= */
export const calculateSalary = async ({
    employee,
    startDate,
    endDate
}) => {

    const attendance = await Attendance.find({
        employee: employee._id,
        date: { $gte: startDate, $lte: endDate }
    }).lean();

    const advances = await Advance.find({
        employee: employee._id,
        date: { $gte: startDate, $lte: endDate }
    }).lean();

    /* ================= COUNTS ================= */
    let present = 0, absent = 0, halfDay = 0;

    attendance.forEach(a => {
        if (a.status === "present") present++;
        else if (a.status === "absent") absent++;
        else if (a.status === "half-day") halfDay++;
    });

    /* ================= PER DAY SALARY ================= */
    let perDay = 0;
    const salaryAmount = Number(employee.salaryAmount || 0);

    if (employee.salaryType === "monthly") {
        /* 🔥 FIX: handle multi-month ranges properly */
        const daysInMonth = new Date(
            startDate.getFullYear(),
            startDate.getMonth() + 1,
            0
        ).getDate();

        perDay = salaryAmount / daysInMonth;

    } else if (employee.salaryType === "weekly") {
        perDay = salaryAmount / 7;

    } else {
        perDay = salaryAmount; // daily
    }

    /* ================= SALARY ================= */
    const payableDays = present + (halfDay * 0.5);

    const earned = payableDays * perDay;

    const totalAdvance = advances.reduce(
        (sum, a) => sum + Number(a.amount || 0),
        0
    );

    const totalDeduction = advances.reduce(
        (sum, a) => sum + Number(a.deduction || 0),
        0
    );

    const netSalary = Math.max(0, earned - totalAdvance - totalDeduction);

    return {
        present,
        absent,
        halfDay,
        payableDays,              // 🔥 NEW (important for UI)
        perDay: round(perDay),
        earned: round(earned),
        totalAdvance: round(totalAdvance),
        totalDeduction: round(totalDeduction),
        netSalary: round(netSalary)
    };
};