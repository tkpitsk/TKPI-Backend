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

        const { userId, password, role } = req.body;

        if (!userId || !password || !role) {
            return res.status(400).json({
                message: "All fields are required"
            });
        }

        const existingUser = await User.findOne({ userId });

        if (existingUser) {
            return res.status(409).json({
                message: "User already exists"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            userId,
            password: hashedPassword,
            role
        });

        res.status(201).json({
            message: "User created successfully",
            user: {
                _id: user._id,
                userId: user.userId,
                role: user.role,
                isActive: user.isActive
            }
        });

        /* AUDIT */
        await logAudit({
            actor: req.user._id,
            action: AUDIT_ACTIONS.CREATE,
            entity: "USER",
            entityId: user._id,
            req
        });

    } catch (error) {

        res.status(500).json({
            message: "Failed to create user"
        });

    }

};


/* ================= UPDATE USER ================= */
export const updateUser = async (req, res) => {

    try {

        const { id } = req.params;
        const { role, isActive } = req.body;

        const user = await User.findById(id);

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        /* Capture old data BEFORE update */
        const oldUser = user.toObject();

        if (role) user.role = role;

        if (typeof isActive === "boolean") {
            user.isActive = isActive;
        }

        await user.save();

        const changes = getChanges(oldUser, user.toObject());

        res.json({
            message: "User updated successfully"
        });

        /* AUDIT */
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
            message: "Failed to update user"
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

        /* AUDIT */
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

        const user = await User.findById(id);

        if (req.user._id.toString() === id) {
            return res.status(400).json({
                message: "You cannot deactivate yourself"
            });
        }

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

        /* AUDIT */
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