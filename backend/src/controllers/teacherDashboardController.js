
const Teacher = require("../models/teacherModel");
const TeacherAssignment = require("../models/teacherAssignmentModel");
const AttendanceSession = require("../models/attendanceSessionModel");
const mongoose = require("mongoose");

// GET ASSIGNMENTS OF LOGGED-IN TEACHER
const getMyAssignments = async (req, res) => {
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

        const assignments = await TeacherAssignment.find({
            teacherId: teacher._id,
            isActive: true
        })
            .populate({
                path: "subjectId",
                select: "name code semester branchId",
                populate: {
                    path: "branchId",
                    select: "name code"
                }
            })
            .populate({
                path: "sectionId",
                select: "name semester academicYear branchId",
                populate: {
                    path: "branchId",
                    select: "name code"
                }
            })
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            totalAssignments: assignments.length,
            assignments
        });

    } catch (error) {
        console.error("Get Teacher Assignments Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch teacher assignments."
        });
    }
};


// GET ATTENDANCE SESSION HISTORY OF LOGGED-IN TEACHER
const getTeacherAttendanceSessions = async (req, res) => {
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

        let page = parseInt(req.query.page, 10) || 1;
        let limit = parseInt(req.query.limit, 10) || 10;

        page = Math.max(page, 1);
        limit = Math.min(Math.max(limit, 1), 100);

        const filter = {
            teacherId: teacher._id
        };

        // Optional status filter
        if (req.query.status) {
            const status = req.query.status.toUpperCase();

            if (!["DRAFT", "SUBMITTED"].includes(status)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid session status."
                });
            }

            filter.status = status;
        }

        // Optional subject filter
        if (req.query.subjectId) {
            if (!mongoose.Types.ObjectId.isValid(req.query.subjectId)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid subject ID."
                });
            }

            filter.subjectId = req.query.subjectId;
        }

        // Optional section filter
        if (req.query.sectionId) {
            if (!mongoose.Types.ObjectId.isValid(req.query.sectionId)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid section ID."
                });
            }

            filter.sectionId = req.query.sectionId;
        }

        const totalSessions = await AttendanceSession.countDocuments(filter);

        const sessions = await AttendanceSession.find(filter)
            .populate({
                path: "subjectId",
                select: "name code"
            })
            .populate({
                path: "sectionId",
                select: "name semester academicYear",
                populate: {
                    path: "branchId",
                    select: "name code"
                }
            })
            .sort({ date: -1, createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit);

        return res.status(200).json({
            success: true,
            pagination: {
                totalSessions,
                currentPage: page,
                totalPages: Math.ceil(totalSessions / limit),
                limit
            },
            sessions
        });

    } catch (error) {
        console.error("Get Teacher Sessions Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch attendance history."
        });
    }
};


module.exports = {
    getMyAssignments,
    getTeacherAttendanceSessions
};
