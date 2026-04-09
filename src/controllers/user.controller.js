import bcrypt from "bcryptjs";
import User from "../models/User.js";

import { logAudit } from "../audit/audit.service.js";
import { AUDIT_ACTIONS } from "../audit/audit.constants.js";
import { getChanges } from "../utils/diff.utils.js";

/* ================= GET ALL USERS ================= */
export const getAllUsers = async (req, res) => {
    try {
        const users = await User.find()
            .select("-password")
            .sort({ createdAt: -1 });

        res.json(users);
    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch users"
        });
    }
};


/* ================= CREATE USER ================= */
export const createUser = async (req, res) => {
    try {
        const {
            userId,
            password,
            role,
            salaryType,
            salaryAmount,
            name,
            phone
        } = req.body;

        /* ================= BASIC VALIDATION ================= */
        if (!userId || !password || !role) {
            return res.status(400).json({
                message: "userId, password, role are required"
            });
        }

        const existingUser = await User.findOne({ userId });

        if (existingUser) {
            return res.status(409).json({
                message: "User already exists"
            });
        }

        /* ================= ROLE BASED VALIDATION ================= */

        if (["manager", "employee"].includes(role)) {
            if (!salaryAmount) {
                return res.status(400).json({
                    message: "Monthly salary required for employee/manager"
                });
            }
        }

        if (role === "labour") {
            if (!salaryType || !salaryAmount) {
                return res.status(400).json({
                    message: "Labour must have salaryType and salaryAmount"
                });
            }

            if (!["daily", "weekly", "monthly"].includes(salaryType)) {
                return res.status(400).json({
                    message: "Invalid salary type for labour"
                });
            }
        }

        /* ================= HASH PASSWORD ================= */
        const hashedPassword = await bcrypt.hash(password, 10);

        /* ================= CREATE USER ================= */
        const user = await User.create({
            userId,
            password: hashedPassword,
            role,
            salaryType: role === "labour" ? salaryType : "monthly",
            salaryAmount: salaryAmount || 0,
            name,
            phone
        });

        res.status(201).json({
            message: "User created successfully",
            user: {
                _id: user._id,
                userId: user.userId,
                role: user.role,
                salaryType: user.salaryType,
                salaryAmount: user.salaryAmount,
                name: user.name,
                phone: user.phone,
                isActive: user.isActive
            }
        });

        /* ================= AUDIT ================= */
        await logAudit({
            actor: req.user._id,
            action: AUDIT_ACTIONS.CREATE,
            entity: "USER",
            entityId: user._id,
            req
        });

    } catch (error) {
        res.status(500).json({
            message: error.message || "Failed to create user"
        });
    }
};


/* ================= UPDATE USER ================= */
export const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            role,
            isActive,
            salaryType,
            salaryAmount,
            name,
            phone
        } = req.body;

        const user = await User.findById(id);

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        const oldUser = user.toObject();

        /* ================= UPDATE FIELDS ================= */
        if (role) user.role = role;
        if (typeof isActive === "boolean") user.isActive = isActive;
        if (name !== undefined) user.name = name;
        if (phone !== undefined) user.phone = phone;

        /* ================= SALARY LOGIC ================= */

        if (user.role === "labour") {
            if (salaryType) user.salaryType = salaryType;
        } else {
            user.salaryType = "monthly"; // force
        }

        if (salaryAmount !== undefined) {
            user.salaryAmount = salaryAmount;
        }

        await user.save();

        const changes = getChanges(oldUser, user.toObject());

        res.json({
            message: "User updated successfully"
        });

        /* ================= AUDIT ================= */
        await logAudit({
            actor: req.user._id,
            action: AUDIT_ACTIONS.UPDATE,
            entity: "USER",
            entityId: user._id,
            changes,
            req
        });

    } catch (error) {
        res.status(500).json({
            message: error.message || "Failed to update user"
        });
    }
};


/* ================= RESET PASSWORD ================= */
export const updateUserPassword = async (req, res) => {
    try {
        const { id } = req.params;
        const { newPassword } = req.body;

        if (!newPassword || newPassword.length < 6) {
            return res.status(400).json({
                message: "Password must be at least 6 characters"
            });
        }

        const user = await User.findById(id);

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        user.password = await bcrypt.hash(newPassword, 10);

        await user.save();

        res.json({
            message: "Password updated successfully"
        });

        await logAudit({
            actor: req.user._id,
            action: AUDIT_ACTIONS.PASSWORD_RESET,
            entity: "USER",
            entityId: user._id,
            req
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to update password"
        });
    }
};


/* ================= DELETE USER (SOFT) ================= */
export const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        if (req.user._id.toString() === id) {
            return res.status(400).json({
                message: "You cannot deactivate yourself"
            });
        }

        const user = await User.findById(id);

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        user.isActive = false;

        await user.save();

        res.json({
            message: "User deactivated successfully"
        });

        await logAudit({
            actor: req.user._id,
            action: AUDIT_ACTIONS.DELETE,
            entity: "USER",
            entityId: user._id,
            req
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to delete user"
        });
    }
};