import bcrypt from "bcryptjs";
import User from "../models/User.js";
import Advance from "../models/Advance.js";
import Attendance from "../models/Attendance.js";
import Reminder from "../models/Reminder.js";
import Payment from "../models/Payment.js";
import StockMovement from "../models/StockMovement.js";
import Ledger from "../models/Ledger.js";
import PurchaseEnquiry from "../models/PurchaseEnquiry.js";

import { logAudit } from "../audit/audit.service.js";
import { AUDIT_ACTIONS } from "../audit/audit.constants.js";
import { getChanges } from "../utils/diff.utils.js";
import { uploadToCloudinary } from "../utils/upload.utils.js";

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
            password,
            role,
            salaryType,
            salaryAmount,
            name,
            phone,
            aadhar,
            pan,
            dob,
            address,
            designation,
            reportingTime,
            workDescription,
            joiningDate,
            familyMembersCount,
            familyDependents,
            previousWorkplace,
            previousDesignation,
            reasonForLeaving,
            salaryPaymentDate,
            iqTestResult,
            kgTestResult,
            personType,
            significantAction,
            employeeClassification,
            incentivesProvided,
            additionalBenefits,
            bankAccount
        } = req.body;

        let { userId } = req.body;

        /* ================= AUTO GENERATE USER ID ================= */
        if (!userId && name) {
            const baseId = name.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
            if (baseId) {
                let uniqueId = baseId;
                let counter = 1;
                while (await User.findOne({ userId: uniqueId })) {
                    uniqueId = `${baseId}${counter}`;
                    counter++;
                }
                userId = uniqueId;
            }
        }

        /* ================= BASIC VALIDATION ================= */
        if (!userId || !password || !role) {
            return res.status(400).json({
                message: "userId, password, role are required (or provide Full Name to auto-generate User ID)"
            });
        }

        const existingUser = await User.findOne({ userId });

        if (existingUser) {
            return res.status(409).json({
                message: "User ID already exists"
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

        if (role === "worker") {
            if (!salaryType || !salaryAmount) {
                return res.status(400).json({
                    message: "Worker must have salaryType and salaryAmount"
                });
            }

            if (!["daily", "weekly", "monthly"].includes(salaryType)) {
                return res.status(400).json({
                    message: "Invalid salary type for worker"
                });
            }
        }

        /* ================= HASH PASSWORD ================= */
        const hashedPassword = await bcrypt.hash(password, 10);

        /* ================= IMAGE UPLOADS ================= */
        let imageUrl = null;
        let aadharPhotoUrl = null;
        let panPhotoUrl = null;

        if (req.files) {
            if (req.files.image && req.files.image[0]) {
                imageUrl = await uploadToCloudinary(req.files.image[0]);
            }
            if (req.files.aadharPhoto && req.files.aadharPhoto[0]) {
                aadharPhotoUrl = await uploadToCloudinary(req.files.aadharPhoto[0]);
            }
            if (req.files.panPhoto && req.files.panPhoto[0]) {
                panPhotoUrl = await uploadToCloudinary(req.files.panPhoto[0]);
            }
        }

        /* ================= CREATE USER ================= */
        const user = await User.create({
            userId,
            password: hashedPassword,
            role,
            salaryType: role === "worker" ? salaryType : "monthly",
            salaryAmount: salaryAmount || 0,
            name,
            phone,
            aadhar,
            pan,
            image: imageUrl,
            aadharPhoto: aadharPhotoUrl,
            panPhoto: panPhotoUrl,
            dob: dob ? new Date(dob) : undefined,
            address,
            designation,
            reportingTime,
            workDescription,
            joiningDate: joiningDate ? new Date(joiningDate) : undefined,
            familyMembersCount: familyMembersCount ? Number(familyMembersCount) : 0,
            familyDependents,
            previousWorkplace,
            previousDesignation,
            reasonForLeaving,
            salaryPaymentDate: salaryPaymentDate ? Number(salaryPaymentDate) : undefined,
            iqTestResult,
            kgTestResult,
            personType,
            significantAction,
            employeeClassification,
            incentivesProvided,
            additionalBenefits,
            bankAccount: bankAccount ? JSON.parse(bankAccount) : undefined
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
                aadhar: user.aadhar,
                pan: user.pan,
                isActive: user.isActive,
                image: user.image
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
            phone,
            aadhar,
            pan,
            dob,
            address,
            designation,
            reportingTime,
            workDescription,
            joiningDate,
            familyMembersCount,
            familyDependents,
            previousWorkplace,
            previousDesignation,
            reasonForLeaving,
            salaryPaymentDate,
            iqTestResult,
            kgTestResult,
            personType,
            significantAction,
            employeeClassification,
            incentivesProvided,
            additionalBenefits,
            bankAccount
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
        if (aadhar !== undefined) user.aadhar = aadhar;
        if (pan !== undefined) user.pan = pan;
        if (dob !== undefined) user.dob = dob ? new Date(dob) : null;
        if (address !== undefined) user.address = address;
        if (designation !== undefined) user.designation = designation;
        if (reportingTime !== undefined) user.reportingTime = reportingTime;
        if (workDescription !== undefined) user.workDescription = workDescription;
        if (joiningDate !== undefined) user.joiningDate = joiningDate ? new Date(joiningDate) : null;
        if (familyMembersCount !== undefined) user.familyMembersCount = Number(familyMembersCount) || 0;
        if (familyDependents !== undefined) user.familyDependents = familyDependents;
        if (previousWorkplace !== undefined) user.previousWorkplace = previousWorkplace;
        if (previousDesignation !== undefined) user.previousDesignation = previousDesignation;
        if (reasonForLeaving !== undefined) user.reasonForLeaving = reasonForLeaving;
        if (salaryPaymentDate !== undefined) user.salaryPaymentDate = Number(salaryPaymentDate) || null;
        if (iqTestResult !== undefined) user.iqTestResult = iqTestResult;
        if (kgTestResult !== undefined) user.kgTestResult = kgTestResult;
        if (personType !== undefined) user.personType = personType;
        if (significantAction !== undefined) user.significantAction = significantAction;
        if (employeeClassification !== undefined) user.employeeClassification = employeeClassification;
        if (incentivesProvided !== undefined) user.incentivesProvided = incentivesProvided;
        if (additionalBenefits !== undefined) user.additionalBenefits = additionalBenefits;
        if (bankAccount !== undefined) user.bankAccount = JSON.parse(bankAccount);

        /* ================= SALARY LOGIC ================= */

        if (user.role === "worker") {
            if (salaryType) user.salaryType = salaryType;
        } else {
            user.salaryType = "monthly"; // force
        }

        if (salaryAmount !== undefined) {
            user.salaryAmount = salaryAmount;
        }

        /* ================= IMAGE UPLOADS ================= */
        if (req.files) {
            if (req.files.image && req.files.image[0]) {
                user.image = await uploadToCloudinary(req.files.image[0]);
            }
            if (req.files.aadharPhoto && req.files.aadharPhoto[0]) {
                user.aadharPhoto = await uploadToCloudinary(req.files.aadharPhoto[0]);
            }
            if (req.files.panPhoto && req.files.panPhoto[0]) {
                user.panPhoto = await uploadToCloudinary(req.files.panPhoto[0]);
            }
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


/* ================= GET USER REFERENCES ================= */
export const getUserReferences = async (req, res) => {
    try {
        const { id } = req.params;

        const [
            advancesAsEmployee,
            advancesAsGiver,
            attendanceAsEmployee,
            attendanceAsMarker,
            reminders,
            payments,
            stockMovements,
            ledgers,
            purchaseEnquiries
        ] = await Promise.all([
            Advance.countDocuments({ employee: id }),
            Advance.countDocuments({ givenBy: id }),
            Attendance.countDocuments({ employee: id }),
            Attendance.countDocuments({ markedBy: id }),
            Reminder.countDocuments({ createdBy: id }),
            Payment.countDocuments({ createdBy: id }),
            StockMovement.countDocuments({ createdBy: id }),
            Ledger.countDocuments({ createdBy: id }),
            PurchaseEnquiry.countDocuments({ createdBy: id })
        ]);

        const references = [
            { label: "Advances (Taken)", count: advancesAsEmployee },
            { label: "Advances (Given)", count: advancesAsGiver },
            { label: "Attendance Records", count: attendanceAsEmployee },
            { label: "Attendance Marked", count: attendanceAsMarker },
            { label: "Reminders Created", count: reminders },
            { label: "Payments Created", count: payments },
            { label: "Stock Movements", count: stockMovements },
            { label: "Ledger Entries", count: ledgers },
            { label: "Purchase Enquiries", count: purchaseEnquiries }
        ].filter(r => r.count > 0);

        res.json({
            hasReferences: references.length > 0,
            references
        });
    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch user references"
        });
    }
};


/* ================= PERMANENTLY DELETE USER ================= */
export const hardDeleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        if (req.user._id.toString() === id) {
            return res.status(400).json({
                message: "You cannot delete yourself"
            });
        }

        const user = await User.findById(id);

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        await User.findByIdAndDelete(id);

        res.json({
            message: "User deleted permanently"
        });

        await logAudit({
            actor: req.user._id,
            action: AUDIT_ACTIONS.DELETE,
            entity: "USER",
            entityId: id,
            req
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to delete user permanently"
        });
    }
};

/* ================= GET USER STATS ================= */
export const getUserStats = async (req, res) => {
    try {
        const { id } = req.params;

        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Calculate leaves taken in this financial year
        const today = new Date();
        let currentYear = today.getFullYear();
        let startYear = currentYear;
        let endYear = currentYear + 1;
        
        // If current month is before April (0-3), the financial year started last year
        if (today.getMonth() < 3) {
            startYear = currentYear - 1;
            endYear = currentYear;
        }

        const financialYearStart = new Date(startYear, 3, 1); // April 1st
        const financialYearEnd = new Date(endYear, 2, 31, 23, 59, 59); // March 31st

        const absents = await Attendance.countDocuments({
            employee: id,
            status: "absent",
            date: { $gte: financialYearStart, $lte: financialYearEnd }
        });

        const halfDays = await Attendance.countDocuments({
            employee: id,
            status: "half-day",
            date: { $gte: financialYearStart, $lte: financialYearEnd }
        });

        const totalLeaves = absents + (halfDays * 0.5);

        res.json({
            financialYear: `${startYear}-${endYear}`,
            totalLeaves,
            absents,
            halfDays
        });
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch user stats" });
    }
};