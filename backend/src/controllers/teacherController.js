const mongoose = require("mongoose");
const crypto = require("crypto");

const User = require("../models/userModel");
const Teacher = require("../models/teacherModel");

// CREATE TEACHER
const createTeacher = async (req, res) => {
    const { name, employeeId, email } = req.body;

    if (!name || !employeeId) {
        return res.status(400).json({
            success: false,
            message: "Teacher name and employee ID are required."
        });
    }

    const normalizedName = name.trim();
    const normalizedEmployeeId = employeeId.trim().toUpperCase();

    if (!normalizedName || !normalizedEmployeeId) {
        return res.status(400).json({
            success: false,
            message: "Teacher name and employee ID cannot be empty."
        });
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        return res.status(400).json({
            success: false,
            message: "Please provide a valid email address."
        });
    }

    // Generate a random temporary password
    const temporaryPassword = crypto.randomBytes(9).toString("base64url");

    const session = await mongoose.startSession();

    try {
        let createdTeacher;

        await session.withTransaction(async () => {
            // Create login account
            const [user] = await User.create(
                [{
                    name: normalizedName,
                    loginId: normalizedEmployeeId,
                    email: email ? email.trim().toLowerCase() : undefined,
                    password: temporaryPassword,
                    role: "TEACHER",
                    isActive: true,
                    isFirstLogin: true
                }],
                { session }
            );

            // Create teacher profile
            const [teacher] = await Teacher.create(
                [{
                    userId: user._id,
                    employeeId: normalizedEmployeeId,
                    isActive: true
                }],
                { session }
            );

            createdTeacher = {
                id: teacher._id,
                employeeId: teacher.employeeId,
                userId: user._id,
                name: user.name,
                email: user.email
            };
        });

        return res.status(201).json({
            success: true,
            message: "Teacher account created successfully.",
            teacher: createdTeacher,
            temporaryPassword
        });

    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "This employee ID or login ID already exists."
            });
        }

        console.error("Create Teacher Error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to create teacher account."
        });

    } finally {
        await session.endSession();
    }
};
// GET ALL TEACHERS
const getTeachers = async (req, res) => {
    try {
        const teachers = await Teacher.find()
            .populate("userId", "name loginId email isActive")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: teachers.length,
            teachers
        });

    } catch (error) {
        console.error("Get Teachers Error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Internal server error."
        });
    }
};

// RESET TEACHER PASSWORD
const resetTeacherPassword = async (req, res) => {
    try {
        const { employeeId } = req.params;

        if (!employeeId || !employeeId.trim()) {
            return res.status(400).json({
                success: false,
                message: "Employee ID is required."
            });
        }

        const teacher = await Teacher.findOne({
            employeeId: employeeId.trim().toUpperCase()
        });

        if (!teacher || !teacher.isActive) {
            return res.status(404).json({
                success: false,
                message: "Active teacher not found."
            });
        }

        const user = await User.findById(teacher.userId);

        if (!user || !user.isActive) {
            return res.status(404).json({
                success: false,
                message: "Teacher account not found or inactive."
            });
        }

        // Generate a new temporary password
        const temporaryPassword = crypto.randomBytes(9).toString("base64url");

        user.password = temporaryPassword;
        user.isFirstLogin = true;

        await user.save();

        return res.status(200).json({
            success: true,
            message: "Teacher password reset successfully.",
            employeeId: teacher.employeeId,
            temporaryPassword
        });

    } catch (error) {
        console.error("Reset Teacher Password Error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to reset teacher password."
        });
    }
};

module.exports = {
    createTeacher,
    getTeachers,
    resetTeacherPassword
};