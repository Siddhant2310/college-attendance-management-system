
const mongoose = require("mongoose");
const crypto = require("crypto");
const XLSX = require("xlsx");

const User = require("../models/userModel");
const Student = require("../models/studentModel");
const Section = require("../models/sectionModel");
const Branch = require("../models/branchModel");
const PendingStudentImport = require("../models/pendingStudentImportModel");

const normalize = (value) => String(value ?? "").trim();

const normalizeUpper = (value) => normalize(value).toUpperCase();

const validEmail = (email) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

// PREVIEW STUDENT EXCEL
const previewStudentImport = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "Please upload an Excel file."
            });
        }

        const workbook = XLSX.read(req.file.buffer, {
            type: "buffer",
            cellDates: false
        });

        const sheet = workbook.Sheets[workbook.SheetNames[0]];

        if (!sheet) {
            return res.status(400).json({
                success: false,
                message: "Excel sheet is empty."
            });
        }

        const rows = XLSX.utils.sheet_to_json(sheet, {
            defval: "",
            raw: false
        });

        if (!rows.length) {
            return res.status(400).json({
                success: false,
                message: "No student records found."
            });
        }

        if (rows.length > 500) {
            return res.status(400).json({
                success: false,
                message: "Maximum 500 students are allowed per import."
            });
        }

        const requiredColumns = [
            "Name",
            "Roll Number",
            "Email",
            "Branch Code",
            "Section",
            "Semester",
            "Academic Year"
        ];

        const actualColumns = Object.keys(rows[0]);

        const missingColumns = requiredColumns.filter(
            (column) => !actualColumns.includes(column)
        );

        if (missingColumns.length) {
            return res.status(400).json({
                success: false,
                message: "Excel columns are missing.",
                missingColumns
            });
        }

        const branches = await Branch.find({ isActive: true }).lean();
        const sections = await Section.find({ isActive: true }).lean();

        const branchMap = new Map(
            branches.map((branch) => [
                normalizeUpper(branch.code),
                branch
            ])
        );

        const sectionMap = new Map();

        sections.forEach((section) => {
            const branch = branches.find(
                (item) => String(item._id) === String(section.branchId)
            );

            if (!branch) return;

            const key = [
                normalizeUpper(branch.code),
                normalizeUpper(section.name),
                String(section.semester),
                normalize(section.academicYear)
            ].join("|");

            sectionMap.set(key, section);
        });

        const existingRollNumbers = new Set(
            (
                await Student.find({}, { rollNumber: 1 }).lean()
            ).map((student) => normalizeUpper(student.rollNumber))
        );

        const existingEmails = new Set(
            (
                await User.find(
                    { email: { $exists: true, $ne: null } },
                    { email: 1 }
                ).lean()
            ).map((user) => normalize(user.email).toLowerCase())
        );

        const seenRollNumbers = new Set();
        const seenEmails = new Set();

        const preview = rows.map((row, index) => {
            const name = normalize(row["Name"]);
            const rollNumber = normalizeUpper(row["Roll Number"]);
            const email = normalize(row["Email"]).toLowerCase();
            const branchCode = normalizeUpper(row["Branch Code"]);
            const sectionName = normalizeUpper(row["Section"]);
            const semester = Number(row["Semester"]);
            const academicYear = normalize(row["Academic Year"]);

            const errors = [];

            if (!name) errors.push("Name is required.");

            if (!rollNumber) {
                errors.push("Roll number is required.");
            } else if (existingRollNumbers.has(rollNumber)) {
                errors.push("Roll number already exists.");
            } else if (seenRollNumbers.has(rollNumber)) {
                errors.push("Duplicate roll number in Excel.");
            }

            if (rollNumber) seenRollNumbers.add(rollNumber);

            if (email) {
                if (!validEmail(email)) {
                    errors.push("Invalid email address.");
                } else if (existingEmails.has(email)) {
                    errors.push("Email already exists.");
                } else if (seenEmails.has(email)) {
                    errors.push("Duplicate email in Excel.");
                }

                seenEmails.add(email);
            }

            if (!branchMap.has(branchCode)) {
                errors.push("Active branch not found.");
            }

            if (!sectionName) {
                errors.push("Section is required.");
            }

            if (
                !Number.isInteger(semester) ||
                semester < 1 ||
                semester > 8
            ) {
                errors.push("Semester must be between 1 and 8.");
            }

            if (!academicYear) {
                errors.push("Academic year is required.");
            }

            const sectionKey = [
                branchCode,
                sectionName,
                String(semester),
                academicYear
            ].join("|");

            const section = sectionMap.get(sectionKey);

            if (
                branchMap.has(branchCode) &&
                sectionName &&
                Number.isInteger(semester) &&
                academicYear &&
                !section
            ) {
                errors.push("Matching active section not found.");
            }

            return {
                rowNumber: index + 2,
                name,
                rollNumber,
                email,
                branchCode,
                sectionName,
                semester,
                academicYear,
                sectionId: section ? String(section._id) : null,
                valid: errors.length === 0,
                errors
            };
        });

        const validRows = preview.filter((row) => row.valid);

        if (!validRows.length) {
            return res.status(400).json({
                success: false,
                message: "No valid student records found.",
                totalRows: preview.length,
                validCount: 0,
                invalidCount: preview.length,
                preview
            });
        }

        const importId = crypto.randomUUID();

        await PendingStudentImport.create({
            importId,
            adminId: req.user._id,
            rows: validRows,
            expiresAt: new Date(Date.now() + 15 * 60 * 1000)
        });

        return res.status(200).json({
            success: true,
            message: "Excel file validated successfully.",
            importId,
            totalRows: preview.length,
            validCount: validRows.length,
            invalidCount: preview.length - validRows.length,
            preview
        });

    } catch (error) {
        console.error("Student Import Preview Error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to validate Excel file."
        });
    }
};

// CONFIRM STUDENT IMPORT
const confirmStudentImport = async (req, res) => {
    const { importId } = req.body;

    if (!importId) {
        return res.status(400).json({
            success: false,
            message: "Import ID is required."
        });
    }

    let session;

    try {
        const pending = await PendingStudentImport.findOne({
            importId,
            adminId: req.user._id,
            expiresAt: { $gt: new Date() }
        }).lean();

        if (!pending) {
            return res.status(404).json({
                success: false,
                message: "Import preview not found or expired. Please upload again."
            });
        }

        session = await mongoose.startSession();

        const credentials = [];

        await session.withTransaction(async () => {
            const rollNumbers = pending.rows.map(
                (row) => row.rollNumber
            );

            const emails = pending.rows
                .filter((row) => row.email)
                .map((row) => row.email);

            const existingStudents = await Student.find({
                rollNumber: { $in: rollNumbers }
            }).session(session);

            const existingUsers = await User.find({
                $or: [
                    { loginId: { $in: rollNumbers } },
                    ...(emails.length
                        ? [{ email: { $in: emails } }]
                        : [])
                ]
            }).session(session);

            if (existingStudents.length || existingUsers.length) {
                const error = new Error(
                    "Some student records now exist. Please upload and validate the Excel file again."
                );
                error.statusCode = 409;
                throw error;
            }

            const sectionIds = [
                ...new Set(pending.rows.map((row) => String(row.sectionId)))
            ];

            const activeSections = await Section.find({
                _id: { $in: sectionIds },
                isActive: true
            }).session(session);

            if (activeSections.length !== sectionIds.length) {
                const error = new Error(
                    "One or more sections are no longer active. Please upload again."
                );
                error.statusCode = 409;
                throw error;
            }

            for (const row of pending.rows) {
                const temporaryPassword = crypto
                    .randomBytes(9)
                    .toString("base64url");

                const [user] = await User.create(
                    [{
                        name: row.name,
                        loginId: row.rollNumber,
                        email: row.email || undefined,
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
                        rollNumber: row.rollNumber,
                        sectionId: row.sectionId,
                        isActive: true
                    }],
                    { session }
                );

                credentials.push({
                    name: row.name,
                    rollNumber: student.rollNumber,
                    email: row.email || "",
                    temporaryPassword
                });
            }
        });

        await PendingStudentImport.deleteOne({ importId });

        return res.status(201).json({
            success: true,
            message: "Students imported successfully.",
            importedCount: credentials.length,
            credentials
        });

    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "A duplicate student record was detected. Please validate the file again."
            });
        }

        if (error.statusCode) {
            return res.status(error.statusCode).json({
                success: false,
                message: error.message
            });
        }

        console.error("Student Import Error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to import students."
        });

    } finally {
        if (session) {
            await session.endSession();
        }
    }
};

module.exports = {
    previewStudentImport,
    confirmStudentImport
};
