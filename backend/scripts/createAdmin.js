
require("dotenv").config();

const mongoose = require("mongoose");
const connectDB = require("../src/config/db");
const User = require("../src/models/userModel");

const createAdmin = async () => {
    try {
        // Check required environment variables
        const { ADMIN_NAME, ADMIN_LOGIN_ID, ADMIN_PASSWORD } = process.env;

        if (!ADMIN_NAME || !ADMIN_LOGIN_ID || !ADMIN_PASSWORD) {
            throw new Error("Admin details are missing from environment variables.");
        }

        if (ADMIN_PASSWORD.length < 8) {
            throw new Error("Admin password must be at least 8 characters.");
        }

        await connectDB();

        // Prevent accidental duplicate bootstrap
        const existingAdmin = await User.findOne({ role: "ADMIN" });

        if (existingAdmin) {
            throw new Error("An admin account already exists. Bootstrap stopped.");
        }

        // Create first admin account
        const admin = await User.create({
            name: ADMIN_NAME,
            loginId: ADMIN_LOGIN_ID,
            password: ADMIN_PASSWORD,
            role: "ADMIN",
            isActive: true,
            isFirstLogin: false
        });

        console.log("Admin account created successfully!");
        console.log("Admin Login ID:", admin.loginId);

    } catch (error) {
        console.error("Admin creation failed:", error.message);
        process.exitCode = 1;

    } finally {
        await mongoose.disconnect();
    }
};

createAdmin();
