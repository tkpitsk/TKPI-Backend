import Attendance from "../models/Attendance.js";
import Advance from "../models/Advance.js";

/* ================= HELPERS ================= */
const round = (num) => Math.round(num || 0);

/* ================= CALCULATE SALARY ================= */
export const calculateSalary = async ({
    employee,
    startDate,
    endDate,
    attendanceData,
    advanceData
}) => {

    const attendance = attendanceData || await Attendance.find({
        employee: employee._id,
        date: { $gte: startDate, $lte: endDate }
    }).lean();

    const advances = advanceData || await Advance.find({
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

/* ================= CALCULATE LIFETIME BALANCE ================= */
export const calculateLifetimeBalance = async ({
    employee,
    endDate,
    allAttendanceData,
    allAdvanceData
}) => {
    const attendance = allAttendanceData || await Attendance.find({
        employee: employee._id,
        date: { $lte: endDate }
    }).lean();

    const advances = allAdvanceData || await Advance.find({
        employee: employee._id,
        date: { $lte: endDate }
    }).lean();

    let totalEarned = 0;
    const salaryAmount = Number(employee.salaryAmount || 0);

    if (employee.salaryType === "monthly") {
        const monthGroups = {};
        attendance.forEach(a => {
            const date = new Date(a.date);
            const key = `${date.getFullYear()}-${date.getMonth()}`;
            if (!monthGroups[key]) {
                const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
                monthGroups[key] = {
                    daysInMonth,
                    payableDays: 0
                };
            }
            if (a.status === "present") monthGroups[key].payableDays += 1;
            else if (a.status === "half-day") monthGroups[key].payableDays += 0.5;
        });

        for (const key in monthGroups) {
            const group = monthGroups[key];
            const perDay = salaryAmount / group.daysInMonth;
            totalEarned += group.payableDays * perDay;
        }
    } else {
        let payableDays = 0;
        attendance.forEach(a => {
            if (a.status === "present") payableDays += 1;
            else if (a.status === "half-day") payableDays += 0.5;
        });
        const perDay = employee.salaryType === "weekly" ? salaryAmount / 7 : salaryAmount;
        totalEarned += payableDays * perDay;
    }

    const totalAdvancesTaken = advances.reduce((sum, a) => sum + Number(a.amount || 0), 0);
    const totalDeductionsPaid = advances.reduce((sum, a) => sum + Number(a.deduction || 0), 0);

    const netAdvance = totalAdvancesTaken - totalEarned - totalDeductionsPaid;

    return {
        totalEarned: round(totalEarned),
        totalAdvancesTaken: round(totalAdvancesTaken),
        totalDeductionsPaid: round(totalDeductionsPaid),
        netAdvance: round(netAdvance)
    };
};