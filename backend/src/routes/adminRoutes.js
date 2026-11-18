
const express = require("express");

const {
    createBranch,
    getBranches
} = require("../controllers/branchController");

const {
    createSection,
    getSections
} = require("../controllers/sectionController");

const {
    createSubject,
    getSubjects
} = require("../controllers/subjectController");

const {
    createTeacher,
    getTeachers,
    resetTeacherPassword
} = require("../controllers/teacherController");

const {
    createStudent,
    getStudents,
    resetStudentPassword,
    bulkResetStudentPasswords
} = require("../controllers/studentController");
const {
    createTeacherAssignment,
    getTeacherAssignments
} = require("../controllers/teacherAssignmentController");

const {
    correctAttendance
} = require("../controllers/adminAttendanceController");

const {
    getAuditLogs
} = require("../controllers/auditLogController");

const {
    getDashboardOverview,
    getSectionAttendanceReport,
    getSubjectAttendanceReport,
    getDailyAttendanceReport,
    getStudentAttendanceReport
} = require("../controllers/adminDashboardController");

const { protect } = require("../middlewares/authMiddleware");
const authorizeRoles = require("../middlewares/roleMiddleware");
const requirePasswordChange = require("../middlewares/requirePasswordChange");
const {
    previewStudentImport,
    confirmStudentImport
} = require("../controllers/studentImportController");

const uploadStudentExcel = require("../middlewares/studentExcelUpload");

const router = express.Router();

// Authentication and authorization
router.use(protect);
router.use(authorizeRoles("ADMIN"));
router.use(requirePasswordChange);

// Branch management
router.post("/branches", createBranch);
router.get("/branches", getBranches);

// Section management
router.post("/sections", createSection);
router.get("/sections", getSections);
// Subject management
router.post("/subjects", createSubject);
router.get("/subjects", getSubjects);
// Teacher Management
router.post("/teachers", createTeacher);
router.get("/teachers", getTeachers);
router.post(
    "/teachers/:employeeId/reset-password",
    resetTeacherPassword
);
// Student Management
router.post("/students", createStudent);
router.get("/students", getStudents);
// Reset student password
router.post(
    "/students/:rollNumber/reset-password",
    resetStudentPassword
);

// Bulk Reset Passwords for All Active Students
router.post(
    "/students/bulk-reset-passwords",
    bulkResetStudentPasswords
);
// Bulk Student Excel Import
router.post(
    "/students/import/preview",
    uploadStudentExcel.single("file"),
    previewStudentImport
);

router.post(
    "/students/import/confirm",
    confirmStudentImport
);
// Teacher Assignment Management
router.post("/teacher-assignments", createTeacherAssignment);
router.get("/teacher-assignments", getTeacherAssignments);


// Admin Attendance Correction
router.patch(
    "/attendance/records/:recordId/correct",
    correctAttendance
);


// Audit Log Management
router.get("/audit-logs", getAuditLogs);

// Admin Dashboard
router.get("/dashboard/overview", getDashboardOverview);
// Dashboard Reports
router.get("/dashboard/sections", getSectionAttendanceReport);

router.get("/dashboard/subjects", getSubjectAttendanceReport);

// Daily Attendance Report
router.get("/dashboard/daily", getDailyAttendanceReport);

// Student-wise Attendance Report
router.get("/dashboard/students", getStudentAttendanceReport);

module.exports = router;
