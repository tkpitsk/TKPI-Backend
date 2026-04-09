import mongoose from "mongoose";
import User from "../models/User.js";
import { calculateSalary } from "../services/salary.service.js";

export const getSalaryReport = async (req, res) => {
    try {
        const { employeeId, start, end } = req.query;

        /* ================= VALIDATION ================= */
        if (!mongoose.Types.ObjectId.isValid(employeeId)) {
            return res.status(400).json({
                message: "Invalid employee ID"
            });
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
            .select("userId role salaryType salaryAmount name phone");

        if (!employee) {
            return res.status(404).json({
                message: "Employee not found"
            });
        }

        /* ================= SALARY ================= */
        const salary = await calculateSalary({
            employee,
            startDate,
            endDate
        });

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
                period: {
                    start: startDate,
                    end: endDate
                },
                salary
            }
        });

    } catch (err) {
        res.status(500).json({
            message: err.message || "Failed to fetch salary report"
        });
    }
};