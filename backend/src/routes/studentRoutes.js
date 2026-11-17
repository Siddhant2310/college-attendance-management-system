const express = require("express");

const {
    getMyAttendance,
    createCorrectionRequest,
    getMyCorrectionRequests
} = require("../controllers/studentAttendanceController");

const { protect } = require("../middlewares/authMiddleware");
const authorizeRoles = require("../middlewares/roleMiddleware");
const requirePasswordChange = require("../middlewares/requirePasswordChange");

const router = express.Router();

// Student authentication and authorization
router.use(protect);
router.use(authorizeRoles("STUDENT"));
router.use(requirePasswordChange);

// Student attendance
router.get("/attendance/my", getMyAttendance);
router.post(
    "/attendance/:recordId/correction-requests",
    createCorrectionRequest
);

router.get("/attendance/correction-requests", getMyCorrectionRequests);

module.exports = router;