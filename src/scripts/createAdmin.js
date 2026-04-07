import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import User from "../models/User.js";

dotenv.config();

const createAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        const existingAdmin = await User.findOne({
            role: "admin",
            userId: process.env.ADMIN_USER_ID,
        });

        if (existingAdmin) {
            console.log("⚠️ Admin already exists");
            process.exit(0);
        }

        const hashedPassword = await bcrypt.hash(
            process.env.ADMIN_PASSWORD,
            10
        );

        await User.create({
            userId: process.env.ADMIN_USER_ID,
            password: hashedPassword,
            role: "admin",
            createdBy: null,   // 🔥 explicitly first system user
            isActive: true,
        });

        console.log("✅ Admin created successfully");
        process.exit(0);
    } catch (error) {
        console.error("❌ Error creating admin:", error.message);
        process.exit(1);
    }
};

createAdmin();
