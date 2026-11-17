
const Section = require("../models/sectionModel");
const Branch = require("../models/branchModel");

// @desc    Create a new section
// @route   POST /api/v1/admin/sections
// @access  Admin only

const createSection = async (req, res) => {
    try {
        const { name, branchId, semester, academicYear } = req.body;

        // Validate required fields
        if (!name || !branchId || !semester || !academicYear) {
            return res.status(400).json({
                success: false,
                message: "Name, branch, semester and academic year are required."
            });
        }

        const normalizedName = name.trim().toUpperCase();
        const normalizedYear = academicYear.trim();

        if (!normalizedName || !normalizedYear) {
            return res.status(400).json({
                success: false,
                message: "Section name and academic year cannot be empty."
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

        // Check branch ID format
        if (!/^[0-9a-fA-F]{24}$/.test(branchId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid branch ID."
            });
        }

        // Verify branch exists and is active
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

        // Check duplicate section
        const existingSection = await Section.findOne({
            name: normalizedName,
            branchId,
            semester: semesterNumber,
            academicYear: normalizedYear
        });

        if (existingSection) {
            return res.status(409).json({
                success: false,
                message: "This section already exists for this branch, semester and academic year."
            });
        }

        // Create section
        const section = await Section.create({
            name: normalizedName,
            branchId,
            semester: semesterNumber,
            academicYear: normalizedYear
        });

        return res.status(201).json({
            success: true,
            message: "Section created successfully.",
            section
        });

    } catch (error) {
        console.error("Create Section Error:", error.message);

        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "This section already exists."
            });
        }

        return res.status(500).json({
            success: false,
            message: "Internal server error."
        });
    }
};


// @desc    Get all sections
// @route   GET /api/v1/admin/sections
// @access  Admin only

const getSections = async (req, res) => {
    try {
        const sections = await Section.find()
            .populate("branchId", "name code")
            .sort({ semester: 1, name: 1 });

        return res.status(200).json({
            success: true,
            count: sections.length,
            sections
        });

    } catch (error) {
        console.error("Get Sections Error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Internal server error."
        });
    }
};

module.exports = { createSection, getSections };
