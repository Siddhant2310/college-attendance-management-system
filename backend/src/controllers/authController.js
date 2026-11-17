
const User = require("../models/userModel");
const generateToken = require("../utils/generateToken");

// @desc    Login user
// @route   POST /api/v1/auth/login
// @access  Public

const loginUser = async (req, res) => {
    try {
        const { loginId, password } = req.body;

        if (!loginId || !password) {
            return res.status(400).json({
                success: false,
                message: "Login ID and password are required."
            });
        }

        const user = await User.findOne({
            loginId: loginId.trim().toUpperCase()
        }).select("+password");

        if (!user || !(await user.comparePassword(password))) {
            return res.status(401).json({
                success: false,
                message: "Invalid login ID or password."
            });
        }

        if (!user.isActive) {
            return res.status(403).json({
                success: false,
                message: "Your account is deactivated. Contact admin."
            });
        }

        const token = generateToken(user);

        return res.status(200).json({
            success: true,
            message: "Login successful.",
            token,
            user: {
                id: user._id,
                name: user.name,
                loginId: user.loginId,
                email: user.email,
                role: user.role,
                isFirstLogin: user.isFirstLogin
            }
        });

    } catch (error) {
        console.error("Login Error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Internal server error."
        });
    }
};


// @desc    Get logged-in user details
// @route   GET /api/v1/auth/me
// @access  Private

const getMe = async (req, res) => {
    return res.status(200).json({
        success: true,
        user: {
            id: req.user._id,
            name: req.user.name,
            loginId: req.user.loginId,
            email: req.user.email,
            role: req.user.role,
            isFirstLogin: req.user.isFirstLogin
        }
    });
};


// @desc    Change user password
// @route   PUT /api/v1/auth/change-password
// @access  Private

const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        // Validate input
        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: "Current password and new password are required."
            });
        }

        if (newPassword.length < 8) {
            return res.status(400).json({
                success: false,
                message: "New password must be at least 8 characters."
            });
        }

        // Fetch logged-in user with password
        const user = await User.findById(req.user._id).select("+password");

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found."
            });
        }

        // Verify current password
        const isPasswordCorrect = await user.comparePassword(currentPassword);

        if (!isPasswordCorrect) {
            return res.status(401).json({
                success: false,
                message: "Current password is incorrect."
            });
        }

        // Update password
        user.password = newPassword;
        user.isFirstLogin = false;

        await user.save();

        return res.status(200).json({
            success: true,
            message: "Password changed successfully."
        });

    } catch (error) {
        console.error("Password Change Error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Internal server error."
        });
    }
};


module.exports = { loginUser, getMe, changePassword };
