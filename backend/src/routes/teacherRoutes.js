const express = require("express");
const {
    getTeacherCorrectionRequests,
    reviewCorrectionRequest
} = require("../controllers/teacherCorrectionController");

const {
    createAttendanceSession,
    markAttendance,
    getAttendanceSession,
    submitAttendance
} = require("../controllers/attendanceSessionController");

const {
    getMyAssignments,
    getTeacherAttendanceSessions
} = require("../controllers/teacherDashboardController");

const { protect } = require("../middlewares/authMiddleware");
const authorizeRoles = require("../middlewares/roleMiddleware");
const requirePasswordChange = require("../middlewares/requirePasswordChange");

const router = express.Router();

// Authentication and authorization
router.use(protect);
router.use(authorizeRoles("TEACHER"));
router.use(requirePasswordChange);

// Attendance Management
router.post("/attendance/sessions", createAttendanceSession);
// Mark student attendance
router.patch(
    "/attendance/sessions/:sessionId/records/:recordId",
    markAttendance
);
// Get attendance session details and roster
router.get(
    "/attendance/sessions/:sessionId",
    getAttendanceSession
);
// Submit final attendance
router.post(
    "/attendance/sessions/:sessionId/submit",
    submitAttendance
);

// Teacher correction request management
router.get(
    "/attendance/correction-requests",
    getTeacherCorrectionRequests
);
router.patch(
    "/attendance/correction-requests/:requestId/review",
    reviewCorrectionRequest
);

// Teacher Dashboard
router.get("/assignments", getMyAssignments);
router.get("/attendance/sessions", getTeacherAttendanceSessions);

module.exports = router;