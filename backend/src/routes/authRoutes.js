
const express = require("express");
const rateLimit = require("express-rate-limit");

const {
    loginUser,
    getMe,
    changePassword
} = require("../controllers/authController");

const { protect } = require("../middlewares/authMiddleware");

const router = express.Router();

// Login rate limiter
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 10, // Maximum 10 attempts
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: {
        success: false,
        message: "Too many login attempts. Please try again after 15 minutes."
    }
});

// Public route
router.post("/login", loginLimiter, loginUser);

// Protected routes
router.get("/me", protect, getMe);
router.put("/change-password", protect, changePassword);

module.exports = router;
