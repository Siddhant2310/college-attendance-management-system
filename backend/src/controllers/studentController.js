
const mongoose = require("mongoose");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");

const User = require("../models/userModel");
const Student = require("../models/studentModel");
const Section = require("../models/sectionModel");

// CREATE STUDENT
const createStudent = async (req, res) => {
    const { name, rollNumber, email, sectionId } = req.body;

    if (!name || !rollNumber || !sectionId) {
        return res.status(400).json({
            success: false,
            message: "Name, roll number and section ID are required."
        });
    }

    const normalizedName = name.trim();
    const normalizedRollNumber = rollNumber.trim().toUpperCase();

    if (!normalizedName || !normalizedRollNumber) {
        return res.status(400).json({
            success: false,
            message: "Name and roll number cannot be empty."
        });
    }

    if (!mongoose.Types.ObjectId.isValid(sectionId)) {
        return res.status(400).json({
            success: false,
            message: "Invalid section ID."
        });
    }

    if (
        email &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
    ) {
        return res.status(400).json({
            success: false,
            message: "Please provide a valid email address."
        });
    }

    const temporaryPassword = crypto.randomBytes(9).toString("base64url");
    const session = await mongoose.startSession();

    try {
        let createdStudent;

        await session.withTransaction(async () => {
            const section = await Section.findOne({
                _id: sectionId,
                isActive: true
            }).session(session);

            if (!section) {
                const error = new Error("Active section not found.");
                error.statusCode = 404;
                throw error;
            }

            const [user] = await User.create(
                [{
                    name: normalizedName,
                    loginId: normalizedRollNumber,
                    email: email ? email.trim().toLowerCase() : undefined,
                    password: temporaryPassword,
                    role: "STUDENT",
                    isActive: true,
                    isFirstLogin: true
                }],
                { session }
            );

            const [student] = await Student.create(
                [{
                    userId: user._id,
                    rollNumber: normalizedRollNumber,
                    sectionId: section._id,
                    isActive: true
                }],
                { session }
            );

            createdStudent = {
                id: student._id,
                userId: user._id,
                rollNumber: student.rollNumber,
                name: user.name,
                email: user.email,
                sectionId: student.sectionId
            };
        });

        return res.status(201).json({
            success: true,
            message: "Student account created successfully.",
            student: createdStudent,
            temporaryPassword
        });

    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "This roll number or login ID already exists."
            });
        }

        if (error.statusCode) {
            return res.status(error.statusCode).json({
                success: false,
                message: error.message
            });
        }

        console.error("Create Student Error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to create student account."
        });

    } finally {
        await session.endSession();
    }
};


// GET ALL STUDENTS
const getStudents = async (req, res) => {
    try {
        const students = await Student.find()
            .populate("userId", "name loginId email isActive isFirstLogin")
            .populate({
                path: "sectionId",
                select: "name semester academicYear",
                populate: {
                    path: "branchId",
                    select: "name code"
                }
            })
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: students.length,
            students
        });

    } catch (error) {
        console.error("Get Students Error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Internal server error."
        });
    }
};


// RESET INDIVIDUAL STUDENT PASSWORD
const resetStudentPassword = async (req, res) => {
    try {
        const { rollNumber } = req.params;

        const student = await Student.findOne({
            rollNumber: rollNumber.toUpperCase(),
            isActive: true
        });

        if (!student) {
            return res.status(404).json({
                success: false,
                message: "Student not found."
            });
        }

        const user = await User.findById(student.userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Student user account not found."
            });
        }

        const temporaryPassword = crypto
            .randomBytes(5)
            .toString("hex");

        user.password = temporaryPassword;
        user.isFirstLogin = true;

        await user.save();

        return res.status(200).json({
            success: true,
            message: "Student password reset successfully.",
            rollNumber: student.rollNumber,
            temporaryPassword
        });

    } catch (error) {
        console.error("Reset Student Password Error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to reset student password."
        });
    }
};


// BULK RESET PASSWORDS FOR ALL ACTIVE STUDENTS
const bulkResetStudentPasswords = async (req, res) => {
    try {
        // Fetch all active students and their active user accounts.
        const students = await Student.find({
            isActive: true
        }).populate({
            path: "userId",
            match: {
                isActive: true,
                role: "STUDENT"
            },
            select: "name loginId email isActive role"
        });

        const activeStudents = students.filter(
            student => student.userId
        );

        if (activeStudents.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No active student accounts found."
            });
        }

        // Generate and hash each student's temporary password.
        const preparedRecords = await Promise.all(
            activeStudents.map(async student => {
                const user = student.userId;

                const temporaryPassword = crypto
                    .randomBytes(9)
                    .toString("base64url");

                const hashedPassword = await bcrypt.hash(
                    temporaryPassword,
                    12
                );

                return {
                    userId: user._id,
                    name: user.name,
                    rollNumber: student.rollNumber,
                    loginId: user.loginId,
                    email: user.email || "",
                    temporaryPassword,
                    hashedPassword
                };
            })
        );

        // Prepare one bulk database operation.
        const operations = preparedRecords.map(record => ({
            updateOne: {
                filter: {
                    _id: record.userId,
                    isActive: true,
                    role: "STUDENT"
                },
                update: {
                    $set: {
                        password: record.hashedPassword,
                        isFirstLogin: true
                    }
                }
            }
        }));

        // Apply updates together in a short transaction.
        const session = await mongoose.startSession();

        try {
            await session.withTransaction(async () => {
                const result = await User.bulkWrite(
                    operations,
                    {
                        session,
                        ordered: true
                    }
                );

                if (result.matchedCount !== preparedRecords.length) {
                    const error = new Error(
                        "Some student accounts changed during the reset. No passwords were reset."
                    );
                    error.statusCode = 409;
                    throw error;
                }
            });
        } finally {
            await session.endSession();
        }

        // Return plaintext credentials only after successful commit.
        const credentials = preparedRecords.map(record => ({
            name: record.name,
            rollNumber: record.rollNumber,
            loginId: record.loginId,
            email: record.email,
            temporaryPassword: record.temporaryPassword
        }));

        return res.status(200).json({
            success: true,
            message: "Student passwords reset successfully.",
            count: credentials.length,
            credentials
        });

    } catch (error) {
        if (error.statusCode) {
            return res.status(error.statusCode).json({
                success: false,
                message: error.message
            });
        }

        console.error(
            "Bulk Reset Student Passwords Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Unable to reset student passwords."
        });
    }
};


module.exports = {
    createStudent,
    getStudents,
    resetStudentPassword,
    bulkResetStudentPasswords
};
