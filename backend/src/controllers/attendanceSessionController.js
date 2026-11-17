
const mongoose = require("mongoose");

const Teacher = require("../models/teacherModel");
const Section = require("../models/sectionModel");
const Student = require("../models/studentModel");
const TeacherAssignment = require("../models/teacherAssignmentModel");
const AttendanceSession = require("../models/attendanceSessionModel");
const AttendanceRecord = require("../models/attendanceRecordModel");
const AuditLog = require("../models/auditLogModel");

// CREATE ATTENDANCE SESSION
const createAttendanceSession = async (req, res) => {
    try {
        const { subjectId, sectionId, period } = req.body;

        // Validate required fields
        if (!subjectId || !sectionId || period === undefined) {
            return res.status(400).json({
                success: false,
                message: "Subject ID, section ID and period are required."
            });
        }

        // Validate MongoDB IDs
        if (
            !mongoose.Types.ObjectId.isValid(subjectId) ||
            !mongoose.Types.ObjectId.isValid(sectionId)
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid subject ID or section ID."
            });
        }

        const periodNumber = Number(period);

        if (!Number.isInteger(periodNumber) || periodNumber < 1) {
            return res.status(400).json({
                success: false,
                message: "Period must be a positive integer."
            });
        }

        const dbSession = await mongoose.startSession();

        let createdSessionId;

        try {
            await dbSession.withTransaction(async () => {

                // Find logged-in teacher's profile
                const teacher = await Teacher.findOne({
                    userId: req.user._id,
                    isActive: true
                }).session(dbSession);

                if (!teacher) {
                    const error = new Error("Teacher profile not found.");
                    error.statusCode = 404;
                    throw error;
                }

                // Verify active section
                const section = await Section.findOne({
                    _id: sectionId,
                    isActive: true
                }).session(dbSession);

                if (!section) {
                    const error = new Error("Active section not found.");
                    error.statusCode = 404;
                    throw error;
                }

                // Verify teacher assignment
                const assignment = await TeacherAssignment.findOne({
                    teacherId: teacher._id,
                    subjectId,
                    sectionId,
                    academicYear: section.academicYear,
                    isActive: true
                }).session(dbSession);

                if (!assignment) {
                    const error = new Error(
                        "You are not assigned to this subject and section."
                    );
                    error.statusCode = 403;
                    throw error;
                }

                // Fetch all active students in this section
                const students = await Student.find({
                    sectionId: section._id,
                    isActive: true
                }).session(dbSession);

                if (students.length === 0) {
                    const error = new Error(
                        "No active students found in this section."
                    );
                    error.statusCode = 400;
                    throw error;
                }

                // Create attendance session
                const [attendanceSession] = await AttendanceSession.create(
                    [{
                        teacherId: teacher._id,
                        subjectId,
                        sectionId,
                        assignmentId: assignment._id,
                        period: periodNumber,
                        academicYear: section.academicYear
                    }],
                    { session: dbSession }
                );

                createdSessionId = attendanceSession._id;

                // Generate one record for every student
                const attendanceRecords = students.map(student => ({
                    sessionId: attendanceSession._id,
                    studentId: student._id,
                    rollNumber: student.rollNumber,
                    status: "NOT_MARKED",
                    markedAt: null,
                    markedBy: null
                }));

                await AttendanceRecord.insertMany(
                    attendanceRecords,
                    { session: dbSession }
                );

                // Create audit log
                await AuditLog.create(
                    [{
                        performedBy: req.user._id,
                        action: "ATTENDANCE_CREATED",
                        targetType: "AttendanceSession",
                        targetId: attendanceSession._id,
                        description: "Teacher created an attendance session.",
                        changes: {
                            sectionId: section._id,
                            subjectId,
                            period: periodNumber,
                            studentCount: students.length
                        }
                    }],
                    { session: dbSession }
                );
            });

        } finally {
            await dbSession.endSession();
        }

        // Fetch generated roster
        const roster = await AttendanceRecord.find({
            sessionId: createdSessionId
        })
            .populate({
                path: "studentId",
                select: "rollNumber",
                populate: {
                    path: "userId",
                    select: "name"
                }
            })
            .sort({ rollNumber: 1 });

        return res.status(201).json({
            success: true,
            message: "Attendance session created successfully.",
            sessionId: createdSessionId,
            totalStudents: roster.length,
            attendance: roster
        });

    } catch (error) {
        if (error.statusCode) {
            return res.status(error.statusCode).json({
                success: false,
                message: error.message
            });
        }

        console.error("Create Attendance Session Error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to create attendance session."
        });
    }
};


// MARK STUDENT ATTENDANCE
const markAttendance = async (req, res) => {
    const { sessionId, recordId } = req.params;
    const { status } = req.body;

    try {
        // Validate IDs
        if (
            !mongoose.Types.ObjectId.isValid(sessionId) ||
            !mongoose.Types.ObjectId.isValid(recordId)
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid session ID or attendance record ID."
            });
        }

        // Validate status
        if (!["PRESENT", "ABSENT"].includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Status must be PRESENT or ABSENT."
            });
        }

        // Find logged-in teacher
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

        // Verify session belongs to this teacher
        const attendanceSession = await AttendanceSession.findOne({
            _id: sessionId,
            teacherId: teacher._id
        });

        if (!attendanceSession) {
            return res.status(404).json({
                success: false,
                message: "Attendance session not found."
            });
        }

        // Prevent changes after final submission
        if (attendanceSession.status !== "DRAFT") {
            return res.status(409).json({
                success: false,
                message: "Attendance has already been submitted."
            });
        }

        const record = await AttendanceRecord.findOne({
            _id: recordId,
            sessionId: attendanceSession._id
        });

        if (!record) {
            return res.status(404).json({
                success: false,
                message: "Attendance record not found in this session."
            });
        }

        const previousStatus = record.status;

        // Update attendance
        record.status = status;
        record.markedAt = new Date();
        record.markedBy = teacher._id;

        await record.save();

        // Save audit log
        await AuditLog.create({
            performedBy: req.user._id,
            action: "ATTENDANCE_MARKED",
            targetType: "AttendanceRecord",
            targetId: record._id,
            changes: {
                previousStatus,
                newStatus: status
            },
            description: `Teacher marked student ${record.rollNumber} as ${status}.`
        });

        return res.status(200).json({
            success: true,
            message: `Attendance marked ${status} successfully.`,
            attendance: {
                recordId: record._id,
                sessionId: record.sessionId,
                rollNumber: record.rollNumber,
                status: record.status,
                markedAt: record.markedAt
            }
        });

    } catch (error) {
        console.error("Mark Attendance Error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to mark attendance."
        });
    }
};

// GET ATTENDANCE SESSION DETAILS
const getAttendanceSession = async (req, res) => {
    const { sessionId } = req.params;

    try {
        // Validate session ID
        if (!mongoose.Types.ObjectId.isValid(sessionId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid session ID."
            });
        }

        // Find logged-in teacher
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

        // Verify session ownership
        const attendanceSession = await AttendanceSession.findOne({
            _id: sessionId,
            teacherId: teacher._id
        })
            .populate("subjectId", "name code")
            .populate("sectionId", "name semester academicYear");

        if (!attendanceSession) {
            return res.status(404).json({
                success: false,
                message: "Attendance session not found."
            });
        }

        // Fetch attendance records
        const records = await AttendanceRecord.find({
            sessionId: attendanceSession._id
        })
            .populate({
                path: "studentId",
                select: "rollNumber userId",
                populate: {
                    path: "userId",
                    select: "name"
                }
            })
            .sort({ rollNumber: 1 });

        // Calculate attendance counts
        const summary = {
            totalStudents: records.length,
            present: records.filter(r => r.status === "PRESENT").length,
            absent: records.filter(r => r.status === "ABSENT").length,
            notMarked: records.filter(r => r.status === "NOT_MARKED").length
        };

        return res.status(200).json({
            success: true,
            attendanceSession: {
                _id: attendanceSession._id,
                subject: attendanceSession.subjectId,
                section: attendanceSession.sectionId,
                period: attendanceSession.period,
                date: attendanceSession.date,
                status: attendanceSession.status,
                submittedAt: attendanceSession.submittedAt
            },
            summary,
            attendance: records.map(record => ({
                recordId: record._id,
                studentId: record.studentId?._id,
                name: record.studentId?.userId?.name,
                rollNumber: record.rollNumber,
                status: record.status,
                markedAt: record.markedAt
            }))
        });

    } catch (error) {
        console.error("Get Attendance Session Error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to fetch attendance session."
        });
    }
};


// SUBMIT FINAL ATTENDANCE
const submitAttendance = async (req, res) => {
    const { sessionId } = req.params;

    let mongoSession;

    try {
        if (!mongoose.Types.ObjectId.isValid(sessionId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid session ID."
            });
        }

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

        mongoSession = await mongoose.startSession();

        let result;

        await mongoSession.withTransaction(async () => {

            const attendanceSession = await AttendanceSession.findOne({
                _id: sessionId,
                teacherId: teacher._id
            }).session(mongoSession);

            if (!attendanceSession) {
                throw new Error("SESSION_NOT_FOUND");
            }

            if (attendanceSession.status !== "DRAFT") {
                throw new Error("SESSION_ALREADY_SUBMITTED");
            }

            // Convert all remaining NOT_MARKED records to ABSENT
            await AttendanceRecord.updateMany(
                {
                    sessionId: attendanceSession._id,
                    status: "NOT_MARKED"
                },
                {
                    $set: {
                        status: "ABSENT",
                        markedAt: new Date(),
                        markedBy: teacher._id
                    }
                },
                { session: mongoSession }
            );

            // Finalize attendance session
            attendanceSession.status = "SUBMITTED";
            attendanceSession.submittedAt = new Date();

            await attendanceSession.save({
                session: mongoSession
            });

            // Record submission in audit log
            await AuditLog.create([{
                performedBy: req.user._id,
                action: "ATTENDANCE_SUBMITTED",
                targetType: "AttendanceSession",
                targetId: attendanceSession._id,
                description: `Teacher submitted attendance for session ${attendanceSession._id}.`
            }], { session: mongoSession });

            result = {
                sessionId: attendanceSession._id,
                status: attendanceSession.status,
                submittedAt: attendanceSession.submittedAt
            };
        });

        const records = await AttendanceRecord.find({
            sessionId: sessionId
        });

        return res.status(200).json({
            success: true,
            message: "Attendance submitted successfully.",
            ...result,
            summary: {
                totalStudents: records.length,
                present: records.filter(r => r.status === "PRESENT").length,
                absent: records.filter(r => r.status === "ABSENT").length,
                notMarked: records.filter(r => r.status === "NOT_MARKED").length
            }
        });

    } catch (error) {
        console.error("Submit Attendance Error:", error.message);

        if (error.message === "SESSION_NOT_FOUND") {
            return res.status(404).json({
                success: false,
                message: "Attendance session not found."
            });
        }

        if (error.message === "SESSION_ALREADY_SUBMITTED") {
            return res.status(409).json({
                success: false,
                message: "Attendance has already been submitted."
            });
        }

        return res.status(500).json({
            success: false,
            message: "Unable to submit attendance."
        });

    } finally {
        if (mongoSession) {
            await mongoSession.endSession();
        }
    }
};


module.exports = {
    createAttendanceSession,
    markAttendance,
    getAttendanceSession,
    submitAttendance
};