
const Student = require("../models/studentModel");
const AttendanceRecord = require("../models/attendanceRecordModel");
const AttendanceSession = require("../models/attendanceSessionModel");
const CorrectionRequest = require("../models/correctionRequestModel");
const AuditLog = require("../models/auditLogModel");
// GET LOGGED-IN STUDENT'S ATTENDANCE
const getMyAttendance = async (req, res) => {
    try {
        // Find student profile using authenticated user ID
        const student = await Student.findOne({
            userId: req.user._id,
            isActive: true
        });

        if (!student) {
            return res.status(404).json({
                success: false,
                message: "Student profile not found."
            });
        }

        // Fetch only this student's attendance records
        const records = await AttendanceRecord.find({
            studentId: student._id
        })
        .populate({
            path: "sessionId",
            select: "subjectId sectionId period date status submittedAt",
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
        })
        .sort({ createdAt: -1 });

       
// Only submitted sessions count towards attendance percentage
const submittedRecords = records.filter(
    record =>
        record.sessionId &&
        record.sessionId.status === "SUBMITTED"
);

const total = submittedRecords.length;

const present = submittedRecords.filter(
    record => record.status === "PRESENT"
).length;

const absent = submittedRecords.filter(
    record => record.status === "ABSENT"
).length;

const attendancePercentage = total > 0
    ? Number(((present / total) * 100).toFixed(2))
    : 0;

// Calculate subject-wise attendance
const subjectMap = new Map();

submittedRecords.forEach(record => {
    const subject = record.sessionId.subjectId;

    if (!subject) return;

    const subjectId = subject._id.toString();

    if (!subjectMap.has(subjectId)) {
        subjectMap.set(subjectId, {
            subjectId: subject._id,
            subjectName: subject.name,
            subjectCode: subject.code,
            totalClasses: 0,
            attended: 0,
            absent: 0
        });
    }

    const subjectData = subjectMap.get(subjectId);

    subjectData.totalClasses++;

    if (record.status === "PRESENT") {
        subjectData.attended++;
    } else if (record.status === "ABSENT") {
        subjectData.absent++;
    }
});

const subjectWise = Array.from(subjectMap.values()).map(subject => ({
    ...subject,
    percentage: Number(
        ((subject.attended / subject.totalClasses) * 100).toFixed(2)
    )
}));

const summary = {
    totalClasses: total,
    present,
    absent,
    attendancePercentage,
    subjectWise
};

        return res.status(200).json({
            success: true,
            student: {
                name: req.user.name,
                rollNumber: student.rollNumber
            },
            summary,
            attendance: records.map(record => ({
                recordId: record._id,
                status: record.status,
                markedAt: record.markedAt,
                session: record.sessionId
            }))
        });

    } catch (error) {
        console.error("Get Student Attendance Error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to fetch student attendance."
        });
    }
};


const createCorrectionRequest = async (req, res) => {
    try {
        const { recordId } = req.params;
        const { requestedStatus, reason } = req.body;

        // Validate requested status
        if (!["PRESENT", "ABSENT"].includes(requestedStatus)) {
            return res.status(400).json({
                success: false,
                message: "Requested status must be PRESENT or ABSENT."
            });
        }

        // Validate reason
        if (!reason || !reason.trim()) {
            return res.status(400).json({
                success: false,
                message: "Please provide a reason for correction."
            });
        }

        if (reason.trim().length > 500) {
            return res.status(400).json({
                success: false,
                message: "Reason cannot exceed 500 characters."
            });
        }

        // Find logged-in student's profile
        const student = await Student.findOne({
            userId: req.user._id,
            isActive: true
        });

        if (!student) {
            return res.status(404).json({
                success: false,
                message: "Student profile not found."
            });
        }

        // Find only this student's attendance record
        const record = await AttendanceRecord.findOne({
            _id: recordId,
            studentId: student._id
        });

        if (!record) {
            return res.status(404).json({
                success: false,
                message: "Attendance record not found."
            });
        }

        // Check attendance session
        const attendanceSession = await AttendanceSession.findById(
            record.sessionId
        );

        if (!attendanceSession) {
            return res.status(404).json({
                success: false,
                message: "Attendance session not found."
            });
        }

        // Requests are allowed only before final submission
        if (attendanceSession.status !== "DRAFT") {
            return res.status(409).json({
                success: false,
                message: "Correction requests are not allowed after attendance submission."
            });
        }

        // Prevent requesting the same existing status
        if (record.status === requestedStatus) {
            return res.status(400).json({
                success: false,
                message: "Attendance already has the requested status."
            });
        }

        // Prevent multiple pending requests for the same record
        const existingRequest = await CorrectionRequest.findOne({
            attendanceRecordId: record._id,
            status: "PENDING"
        });

        if (existingRequest) {
            return res.status(409).json({
                success: false,
                message: "A pending correction request already exists."
            });
        }

       
// Create correction request
const correctionRequest = await CorrectionRequest.create({
    attendanceRecordId: record._id,
    studentId: student._id,
    originalStatus: record.status,
    requestedStatus,
    reason: reason.trim()
});

        // Create audit log
        await AuditLog.create({
            performedBy: req.user._id,
            action: "CORRECTION_REQUESTED",
            targetType: "CorrectionRequest",
            targetId: correctionRequest._id,
            description: `Student ${student.rollNumber} requested attendance correction.`
        });

        return res.status(201).json({
            success: true,
            message: "Attendance correction request submitted successfully.",
            correctionRequest: {
                requestId: correctionRequest._id,
                recordId: record._id,
                currentStatus: record.status,
                requestedStatus: correctionRequest.requestedStatus,
                reason: correctionRequest.reason,
                status: correctionRequest.status
            }
        });

    } catch (error) {
        console.error("Create Correction Request Error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to submit correction request."
        });
    }
};

// GET LOGGED-IN STUDENT'S CORRECTION REQUEST HISTORY
const getMyCorrectionRequests = async (req, res) => {
    try {
        const student = await Student.findOne({
            userId: req.user._id,
            isActive: true
        });

        if (!student) {
            return res.status(404).json({
                success: false,
                message: "Student profile not found."
            });
        }

        const requests = await CorrectionRequest.find({
            studentId: student._id
        })
            .populate({
                path: "attendanceRecordId",
                select: "status markedAt sessionId",
                populate: {
                    path: "sessionId",
                    select: "subjectId sectionId period date",
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
            .populate("reviewedBy", "name")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: requests.length,
            requests
        });

    } catch (error) {
        console.error("Get Student Correction Requests Error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to fetch correction request history."
        });
    }
};
module.exports = {
    getMyAttendance,
    createCorrectionRequest,
    getMyCorrectionRequests
};