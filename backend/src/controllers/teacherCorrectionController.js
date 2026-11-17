
const mongoose = require("mongoose");

const Teacher = require("../models/teacherModel");
const AttendanceSession = require("../models/attendanceSessionModel");
const AttendanceRecord = require("../models/attendanceRecordModel");
const CorrectionRequest = require("../models/correctionRequestModel");
const AuditLog = require("../models/auditLogModel");

// GET PENDING CORRECTION REQUESTS FOR LOGGED-IN TEACHER
const getTeacherCorrectionRequests = async (req, res) => {
    try {
        const teacher = await Teacher.findOne({
            userId: req.user._id,
            isActive: true
        });

        if (!teacher) {
            return res.status(404).json({
                success: false,
                message: "Teacher profile not found."
            });
        }

        // Find attendance sessions created by this teacher
        const sessions = await AttendanceSession.find({
            teacherId: teacher._id
        }).select("_id");

        const sessionIds = sessions.map(session => session._id);

        // Find attendance records belonging to those sessions
        const records = await AttendanceRecord.find({
            sessionId: { $in: sessionIds }
        }).select("_id");

        const recordIds = records.map(record => record._id);

        // Find pending correction requests
        const requests = await CorrectionRequest.find({
            attendanceRecordId: { $in: recordIds },
            status: "PENDING"
        })
        .populate({
            path: "studentId",
            select: "rollNumber userId",
            populate: {
                path: "userId",
                select: "name"
            }
        })
        .populate({
            path: "attendanceRecordId",
            select: "status sessionId",
            populate: {
                path: "sessionId",
                select: "subjectId sectionId period date status",
                populate: [
                    {
                        path: "subjectId",
                        select: "name code"
                    },
                    {
                        path: "sectionId",
                        select: "name semester academicYear"
                    }
                ]
            }
        })
        .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            totalRequests: requests.length,
            requests
        });

    } catch (error) {
        console.error("Get Teacher Correction Requests Error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to fetch correction requests."
        });
    }
};


// APPROVE OR REJECT CORRECTION REQUEST
const reviewCorrectionRequest = async (req, res) => {
    const { requestId } = req.params;
    const { decision, reviewRemark = "" } = req.body;

    // Validate request ID
    if (!mongoose.Types.ObjectId.isValid(requestId)) {
        return res.status(400).json({
            success: false,
            message: "Invalid correction request ID."
        });
    }

    // Validate decision
    if (!["APPROVED", "REJECTED"].includes(decision)) {
        return res.status(400).json({
            success: false,
            message: "Decision must be APPROVED or REJECTED."
        });
    }

    // Validate review remark
    if (
        typeof reviewRemark !== "string" ||
        reviewRemark.trim().length > 500
    ) {
        return res.status(400).json({
            success: false,
            message: "Review remark must be a string of at most 500 characters."
        });
    }

    const mongoSession = await mongoose.startSession();

    try {
        let responseData;

        await mongoSession.withTransaction(async () => {

            // Find logged-in teacher
            const teacher = await Teacher.findOne({
                userId: req.user._id,
                isActive: true
            }).session(mongoSession);

            if (!teacher) {
                throw new Error("TEACHER_NOT_FOUND");
            }

            // Find correction request
            const correctionRequest = await CorrectionRequest.findById(
                requestId
            ).session(mongoSession);

            if (!correctionRequest) {
                throw new Error("REQUEST_NOT_FOUND");
            }

            // Prevent reviewing the same request twice
            if (correctionRequest.status !== "PENDING") {
                throw new Error("REQUEST_ALREADY_REVIEWED");
            }

            // Find attendance record
            const record = await AttendanceRecord.findById(
                correctionRequest.attendanceRecordId
            ).session(mongoSession);

            if (!record) {
                throw new Error("RECORD_NOT_FOUND");
            }

            // Verify that this attendance session belongs to the teacher
            const attendanceSession = await AttendanceSession.findOne({
                _id: record.sessionId,
                teacherId: teacher._id
            }).session(mongoSession);

            if (!attendanceSession) {
                throw new Error("ACCESS_DENIED");
            }

            // Attendance must still be in DRAFT state
            if (attendanceSession.status !== "DRAFT") {
                throw new Error("SESSION_ALREADY_SUBMITTED");
            }

            // Store actual previous attendance status
            const previousAttendanceStatus = record.status;

            // Update attendance only when approved
            if (decision === "APPROVED") {

                record.status = correctionRequest.requestedStatus;
                record.markedAt = new Date();
                record.markedBy = teacher._id;

                await record.save({
                    session: mongoSession
                });
            }

            // Update correction request
            correctionRequest.status = decision;
            correctionRequest.reviewedBy = req.user._id;
            correctionRequest.reviewedAt = new Date();
            correctionRequest.reviewRemark = reviewRemark.trim();

            await correctionRequest.save({
                session: mongoSession
            });

            // Create audit log
            await AuditLog.create([{
                performedBy: req.user._id,

                action: decision === "APPROVED"
                    ? "CORRECTION_APPROVED"
                    : "CORRECTION_REJECTED",

                targetType: "CorrectionRequest",
                targetId: correctionRequest._id,

                description: `Teacher ${decision.toLowerCase()} attendance correction request.`,

                changes: {
                    previousStatus: previousAttendanceStatus,
                    newStatus: record.status
                }

            }], {
                session: mongoSession
            });

            responseData = {
                requestId: correctionRequest._id,
                decision: correctionRequest.status,
                previousAttendanceStatus,
                attendanceStatus: record.status,
                reviewRemark: correctionRequest.reviewRemark
            };
        });

        return res.status(200).json({
            success: true,
            message: `Correction request ${decision.toLowerCase()} successfully.`,
            result: responseData
        });

    } catch (error) {

        const errors = {
            TEACHER_NOT_FOUND: [
                404,
                "Teacher profile not found."
            ],

            REQUEST_NOT_FOUND: [
                404,
                "Correction request not found."
            ],

            REQUEST_ALREADY_REVIEWED: [
                409,
                "This request has already been reviewed."
            ],

            RECORD_NOT_FOUND: [
                404,
                "Attendance record not found."
            ],

            ACCESS_DENIED: [
                403,
                "You cannot review another teacher's request."
            ],

            SESSION_ALREADY_SUBMITTED: [
                409,
                "Attendance has already been submitted."
            ]
        };

        if (errors[error.message]) {
            const [statusCode, message] = errors[error.message];

            return res.status(statusCode).json({
                success: false,
                message
            });
        }

        console.error("Review Correction Request Error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to review correction request."
        });

    } finally {
        await mongoSession.endSession();
    }
};


module.exports = {
    getTeacherCorrectionRequests,
    reviewCorrectionRequest
};
