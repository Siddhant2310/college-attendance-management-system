
const Branch = require("../models/branchModel");

// @desc    Create a new branch
// @route   POST /api/v1/admin/branches
// @access  Admin only

const createBranch = async (req, res) => {
    try {
        const { name, code } = req.body;

        // Validate input
        if (!name || !code) {
            return res.status(400).json({
                success: false,
                message: "Branch name and code are required."
            });
        }

        // Normalize input
        const normalizedName = name.trim();
        const normalizedCode = code.trim().toUpperCase();

        if (!normalizedName || !normalizedCode) {
            return res.status(400).json({
                success: false,
                message: "Branch name and code cannot be empty."
            });
        }

        // Check whether branch already exists
        const existingBranch = await Branch.findOne({
            $or: [
                { name: normalizedName },
                { code: normalizedCode }
            ]
        });

        if (existingBranch) {
            return res.status(409).json({
                success: false,
                message: "Branch with this name or code already exists."
            });
        }

        // Create branch
        const branch = await Branch.create({
            name: normalizedName,
            code: normalizedCode
        });

        return res.status(201).json({
            success: true,
            message: "Branch created successfully.",
            branch
        });

    } catch (error) {
        console.error("Create Branch Error:", error.message);

        // Handle MongoDB duplicate key error
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "Branch name or code already exists."
            });
        }

        return res.status(500).json({
            success: false,
            message: "Internal server error."
        });
    }
};

// @desc    Get all branches
// @route   GET /api/v1/admin/branches
// @access  Admin only

const getBranches = async (req, res) => {
    try {
        const branches = await Branch.find()
            .sort({ name: 1 });

        return res.status(200).json({
            success: true,
            count: branches.length,
            branches
        });

    } catch (error) {
        console.error("Get Branches Error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Internal server error."
        });
    }
};

module.exports = { createBranch, getBranches };
