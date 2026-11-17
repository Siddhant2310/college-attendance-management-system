
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const teacherRoutes = require("./routes/teacherRoutes");
const studentRoutes = require("./routes/studentRoutes");

const app = express();

// Security Middleware
app.use(helmet());

// CORS Configuration
const allowedOrigins = [
    "http://localhost:5173"
];

app.use(
    cors({
        origin: (origin, callback) => {
            // Allow requests without an Origin header
            // (for example, server-to-server or health checks).
            if (!origin || allowedOrigins.includes(origin)) {
                return callback(null, true);
            }

            return callback(
                new Error("Not allowed by CORS")
            );
        },
        credentials: true
    })
);

// Request Parsing Middleware
app.use(express.json({ limit: "10kb" }));
app.use(
    express.urlencoded({
        extended: true,
        limit: "10kb"
    })
);

// API Routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/teacher", teacherRoutes);
app.use("/api/v1/student", studentRoutes);

// Health Check API
app.get("/api/v1/health", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Attendance System API is running!"
    });
});

// Default Route
app.get("/", (req, res) => {
    res.send("College Attendance Backend is running!");
});

// Central Error Handler
app.use((err, req, res, next) => {
    console.error("Server Error:", err.message);

    if (res.headersSent) {
        return next(err);
    }

    if (err.message === "Not allowed by CORS") {
        return res.status(403).json({
            success: false,
            message: "Request origin is not allowed."
        });
    }

    res.status(err.status || 500).json({
        success: false,
        message:
            err.status && err.status < 500
                ? err.message
                : "Internal server error."
    });
});

module.exports = app;
