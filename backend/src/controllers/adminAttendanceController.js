
const mongoose = require("mongoose");

const AttendanceRecord = require("../models/attendanceRecordModel");
const AttendanceSession = require("../models/attendanceSessionModel");
const AuditLog = require("../models/auditLogModel");

// ADMIN CORRECTS ATTENDANCE
const correctAttendance = async (req, res) => {
    const { recordId } = req.params;
    const { status, reason } = req.body;

    // Validate attendance record ID
    if (!mongoose.Types.ObjectId.isValid(recordId)) {
        return res.status(400).json({
            success: false,
            message: "Invalid attendance record ID."
        });
    }

    // Validate attendance status
    if (!["PRESENT", "ABSENT"].includes(status)) {
        return res.status(400).json({
            success: false,
            message: "Status must be PRESENT or ABSENT."
        });
    }

    // Validate correction reason
    if (
        typeof reason !== "string" ||
        !reason.trim() ||
        reason.trim().length > 500
    ) {
        return res.status(400).json({
            success: false,
            message: "A valid correction reason is required (maximum 500 characters)."
        });
    }

    const mongoSession = await mongoose.startSession();

    try {
        let responseData;

        await mongoSession.withTransaction(async () => {

            // Find attendance record
            const record = await AttendanceRecord.findById(
                recordId
            ).session(mongoSession);

            if (!record) {
                throw new Error("RECORD_NOT_FOUND");
            }

            // Find associated attendance session
            const attendanceSession = await AttendanceSession.findById(
                record.sessionId
            ).session(mongoSession);

            if (!attendanceSession) {
                throw new Error("SESSION_NOT_FOUND");
            }

            // Admin correction is allowed only after submission
            if (attendanceSession.status !== "SUBMITTED") {
                throw new Error("SESSION_NOT_SUBMITTED");
            }

            // Prevent unnecessary corrections
            if (record.status === status) {
                throw new Error("SAME_STATUS");
            }

            // Save previous status for audit log
            const previousStatus = record.status;

            // Apply admin correction
            record.status = status;
            record.markedAt = new Date();

            await record.save({
                session: mongoSession
            });

            // Create audit log
            await AuditLog.create([{
                performedBy: req.user._id,
                action: "ATTENDANCE_CORRECTED",
                targetType: "AttendanceRecord",
                targetId: record._id,

                description: "Admin corrected submitted attendance.",

                changes: {
                    previousStatus,
                    newStatus: status,
                    reason: reason.trim(),
                    sessionId: attendanceSession._id
                }
            }], {
                session: mongoSession
            });

            responseData = {
                recordId: record._id,
                sessionId: attendanceSession._id,
                previousStatus,
                newStatus: record.status,
                reason: reason.trim()
            };
        });

        return res.status(200).json({
            success: true,
            message: "Attendance corrected successfully by admin.",
            result: responseData
        });

    } catch (error) {

        const errors = {
            RECORD_NOT_FOUND: [
                404,
                "Attendance record not found."
            ],

            SESSION_NOT_FOUND: [
                404,
                "Attendance session not found."
            ],

            SESSION_NOT_SUBMITTED: [
                409,
                "Admin correction is allowed only for submitted attendance."
            ],

            SAME_STATUS: [
                400,
                "Attendance already has the requested status."
            ]
        };

        if (errors[error.message]) {
            const [statusCode, message] = errors[error.message];

            return res.status(statusCode).json({
                success: false,
                message
            });
        }

        console.error("Admin Attendance Correction Error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to correct attendance."
        });

    } finally {
        await mongoSession.endSession();
    }
};

module.exports = {
    correctAttendance
};
