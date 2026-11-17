
const Subject = require("../models/subjectModel");
const Branch = require("../models/branchModel");

// Create a new subject
const createSubject = async (req, res) => {
    try {
        const { name, code, branchId, semester } = req.body;

        // Validate required fields
        if (!name || !code || !branchId || semester === undefined) {
            return res.status(400).json({
                success: false,
                message: "Name, code, branchId and semester are required."
            });
        }

        const normalizedName = name.trim();
        const normalizedCode = code.trim().toUpperCase();

        // Validate branch ID
        if (!/^[0-9a-fA-F]{24}$/.test(branchId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid branch ID."
            });
        }

        // Validate semester
        const semesterNumber = Number(semester);

        if (
            !Number.isInteger(semesterNumber) ||
            semesterNumber < 1 ||
            semesterNumber > 8
        ) {
            return res.status(400).json({
                success: false,
                message: "Semester must be between 1 and 8."
            });
        }

        if (!normalizedName || !normalizedCode) {
            return res.status(400).json({
                success: false,
                message: "Subject name and code cannot be empty."
            });
        }

        // Check whether the branch exists and is active
        const branch = await Branch.findOne({
            _id: branchId,
            isActive: true
        });

        if (!branch) {
            return res.status(404).json({
                success: false,
                message: "Active branch not found."
            });
        }

        // Check for an existing subject
        const existingSubject = await Subject.findOne({
            code: normalizedCode,
            branchId,
            semester: semesterNumber
        });

        if (existingSubject) {
            return res.status(409).json({
                success: false,
                message: "This subject already exists for this branch and semester."
            });
        }

        // Create subject
        const subject = await Subject.create({
            name: normalizedName,
            code: normalizedCode,
            branchId,
            semester: semesterNumber
        });

        return res.status(201).json({
            success: true,
            message: "Subject created successfully.",
            subject
        });

    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "Subject already exists."
            });
        }

        console.error("Create Subject Error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Internal server error."
        });
    }
};

// Get all subjects
const getSubjects = async (req, res) => {
    try {
        const subjects = await Subject.find()
            .populate("branchId", "name code")
            .sort({ semester: 1, name: 1 });

        return res.status(200).json({
            success: true,
            count: subjects.length,
            subjects
        });

    } catch (error) {
        console.error("Get Subjects Error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Internal server error."
        });
    }
};

module.exports = {
    createSubject,
    getSubjects
};
