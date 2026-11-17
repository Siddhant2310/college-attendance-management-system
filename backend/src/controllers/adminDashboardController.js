
const mongoose = require("mongoose");

const User = require("../models/userModel");
const Branch = require("../models/branchModel");
const Section = require("../models/sectionModel");
const Student = require("../models/studentModel");
const Teacher = require("../models/teacherModel");
const AttendanceSession = require("../models/attendanceSessionModel");
const AttendanceRecord = require("../models/attendanceRecordModel");

// GET ADMIN DASHBOARD OVERVIEW
const getDashboardOverview = async (req, res) => {
    try {
        // Get basic system counts
        const [
            totalUsers,
            totalStudents,
            totalTeachers,
            totalBranches,
            totalSections,
            totalSubmittedSessions
        ] = await Promise.all([
            User.countDocuments({ isActive: true }),
            Student.countDocuments({ isActive: true }),
            Teacher.countDocuments({ isActive: true }),
            Branch.countDocuments({ isActive: true }),
            Section.countDocuments({ isActive: true }),
            AttendanceSession.countDocuments({ status: "SUBMITTED" })
        ]);

        // Calculate attendance statistics from submitted sessions only
        const attendanceStats = await AttendanceRecord.aggregate([
            {
                $lookup: {
                    from: AttendanceSession.collection.name,
                    localField: "sessionId",
                    foreignField: "_id",
                    as: "session"
                }
            },
            {
                $unwind: "$session"
            },
            {
                $match: {
                    "session.status": "SUBMITTED"
                }
            },
            {
                $group: {
                    _id: null,

                    totalRecords: {
                        $sum: 1
                    },

                    present: {
                        $sum: {
                            $cond: [
                                { $eq: ["$status", "PRESENT"] },
                                1,
                                0
                            ]
                        }
                    },

                    absent: {
                        $sum: {
                            $cond: [
                                { $eq: ["$status", "ABSENT"] },
                                1,
                                0
                            ]
                        }
                    },

                    notMarked: {
                        $sum: {
                            $cond: [
                                { $eq: ["$status", "NOT_MARKED"] },
                                1,
                                0
                            ]
                        }
                    }
                }
            }
        ]);

        const stats = attendanceStats[0] || {
            totalRecords: 0,
            present: 0,
            absent: 0,
            notMarked: 0
        };

        // Calculate overall attendance percentage
        const attendancePercentage = stats.totalRecords > 0
            ? Number(
                ((stats.present / stats.totalRecords) * 100).toFixed(2)
            )
            : 0;

        return res.status(200).json({
            success: true,
            message: "Dashboard overview fetched successfully.",

            overview: {
                totalUsers,
                totalStudents,
                totalTeachers,
                totalBranches,
                totalSections,
                totalSubmittedSessions,

                attendance: {
                    totalRecords: stats.totalRecords,
                    present: stats.present,
                    absent: stats.absent,
                    notMarked: stats.notMarked,
                    attendancePercentage
                }
            }
        });

    } catch (error) {
        console.error("Admin Dashboard Overview Error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to fetch dashboard overview."
        });
    }
};


const getSectionAttendanceReport = async (req, res) => {
    try {
        const report = await AttendanceRecord.aggregate([
            {
                $lookup: {
                    from: AttendanceSession.collection.name,
                    localField: "sessionId",
                    foreignField: "_id",
                    as: "session"
                }
            },
            {
                $unwind: "$session"
            },
            {
                $match: {
                    "session.status": "SUBMITTED"
                }
            },
            {
                $group: {
                    _id: "$session.sectionId",

                    totalClasses: {
                        $addToSet: "$session._id"
                    },

                    totalRecords: {
                        $sum: 1
                    },

                    present: {
                        $sum: {
                            $cond: [
                                { $eq: ["$status", "PRESENT"] },
                                1,
                                0
                            ]
                        }
                    },

                    absent: {
                        $sum: {
                            $cond: [
                                { $eq: ["$status", "ABSENT"] },
                                1,
                                0
                            ]
                        }
                    }
                }
            },
            {
                $lookup: {
                    from: Section.collection.name,
                    localField: "_id",
                    foreignField: "_id",
                    as: "section"
                }
            },
            {
                $unwind: "$section"
            },
            {
    $lookup: {
        from: Student.collection.name,
        let: {
            sectionId: "$section._id"
        },
        pipeline: [
            {
                $match: {
                    $expr: {
                        $and: [
                            { $eq: ["$sectionId", "$$sectionId"] },
                            { $eq: ["$isActive", true] }
                        ]
                    }
                }
            },
            {
                $count: "total"
            }
        ],
        as: "activeStudentCount"
    }
},
            {
                $lookup: {
                    from: Branch.collection.name,
                    localField: "section.branchId",
                    foreignField: "_id",
                    as: "branch"
                }
            },
            {
                $unwind: "$branch"
            },
            {
                $project: {
                    _id: 0,
                    branchName: "$branch.name",
                    branchCode: "$branch.code",
                    semester: "$section.semester",
                    section: "$section.name",
                    academicYear: "$section.academicYear",

                    totalStudents: {
    $ifNull: [
        { $arrayElemAt: ["$activeStudentCount.total", 0] },
        0
    ]
},

                    totalSubmittedClasses: {
                        $size: "$totalClasses"
                    },

                    totalRecords: 1,
                    present: 1,
                    absent: 1,

                    attendancePercentage: {
                        $cond: [
                            { $gt: ["$totalRecords", 0] },
                            {
                                $round: [
                                    {
                                        $multiply: [
                                            {
                                                $divide: [
                                                    "$present",
                                                    "$totalRecords"
                                                ]
                                            },
                                            100
                                        ]
                                    },
                                    2
                                ]
                            },
                            0
                        ]
                    }
                }
            },
            {
                $sort: {
                    branchCode: 1,
                    semester: 1,
                    section: 1
                }
            }
        ]);

        return res.status(200).json({
            success: true,
            totalSections: report.length,
            reports: report
        });

    } catch (error) {
        console.error("Section Attendance Report Error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to fetch section attendance report."
        });
    }
};


const getSubjectAttendanceReport = async (req, res) => {
    try {
        const report = await AttendanceRecord.aggregate([
            {
                $lookup: {
                    from: AttendanceSession.collection.name,
                    localField: "sessionId",
                    foreignField: "_id",
                    as: "session"
                }
            },
            {
                $unwind: "$session"
            },
            {
                $match: {
                    "session.status": "SUBMITTED"
                }
            },
            {
                $group: {
                    _id: "$session.subjectId",

                    sessions: {
                        $addToSet: "$session._id"
                    },

                    totalRecords: {
                        $sum: 1
                    },

                    present: {
                        $sum: {
                            $cond: [
                                { $eq: ["$status", "PRESENT"] },
                                1,
                                0
                            ]
                        }
                    },

                    absent: {
                        $sum: {
                            $cond: [
                                { $eq: ["$status", "ABSENT"] },
                                1,
                                0
                            ]
                        }
                    }
                }
            },
            {
                $lookup: {
                    from: "subjects",
                    localField: "_id",
                    foreignField: "_id",
                    as: "subject"
                }
            },
            {
                $unwind: "$subject"
            },
            {
                $lookup: {
                    from: Branch.collection.name,
                    localField: "subject.branchId",
                    foreignField: "_id",
                    as: "branch"
                }
            },
            {
                $unwind: "$branch"
            },
            {
                $project: {
                    _id: 0,
                    subjectName: "$subject.name",
                    subjectCode: "$subject.code",
                    branchName: "$branch.name",
                    branchCode: "$branch.code",
                    semester: "$subject.semester",

                    totalSubmittedSessions: {
                        $size: "$sessions"
                    },

                    totalRecords: 1,
                    present: 1,
                    absent: 1,

                    attendancePercentage: {
                        $round: [
                            {
                                $multiply: [
                                    {
                                        $divide: [
                                            "$present",
                                            "$totalRecords"
                                        ]
                                    },
                                    100
                                ]
                            },
                            2
                        ]
                    }
                }
            },
            {
                $sort: {
                    subjectCode: 1
                }
            }
        ]);

        return res.status(200).json({
            success: true,
            totalSubjects: report.length,
            reports: report
        });

    } catch (error) {
        console.error("Subject Attendance Report Error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to fetch subject attendance report."
        });
    }
};

const getDailyAttendanceReport = async (req, res) => {
    try {
        const { branchId, semester } = req.query;

        // Validate branch ID if provided
        if (branchId && !mongoose.Types.ObjectId.isValid(branchId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid branch ID."
            });
        }

        // Validate semester if provided
        if (
            semester &&
            (!/^[1-8]$/.test(semester))
        ) {
            return res.status(400).json({
                success: false,
                message: "Semester must be between 1 and 8."
            });
        }

        const sessionMatch = {
            status: "SUBMITTED"
        };

        // Filter by semester or branch
        const sectionMatch = {};

        if (semester) {
            sectionMatch.semester = Number(semester);
        }

        if (branchId) {
            sectionMatch.branchId = new mongoose.Types.ObjectId(branchId);
        }

        const report = await AttendanceRecord.aggregate([
            {
                $lookup: {
                    from: AttendanceSession.collection.name,
                    localField: "sessionId",
                    foreignField: "_id",
                    as: "session"
                }
            },
            {
                $unwind: "$session"
            },
            {
                $match: {
                    "session.status": sessionMatch.status
                }
            },
            {
                $lookup: {
                    from: Section.collection.name,
                    localField: "session.sectionId",
                    foreignField: "_id",
                    as: "section"
                }
            },
            {
                $unwind: "$section"
            },
            {
                $match: sectionMatch
            },
            {
                $group: {
                    _id: {
                        year: {
                            $year: {
                                date: "$session.date",
                                timezone: "Asia/Kolkata"
                            }
                        },
                        month: {
                            $month: {
                                date: "$session.date",
                                timezone: "Asia/Kolkata"
                            }
                        },
                        day: {
                            $dayOfMonth: {
                                date: "$session.date",
                                timezone: "Asia/Kolkata"
                            }
                        }
                    },

                    sessions: {
                        $addToSet: "$session._id"
                    },

                    totalRecords: {
                        $sum: 1
                    },

                    present: {
                        $sum: {
                            $cond: [
                                { $eq: ["$status", "PRESENT"] },
                                1,
                                0
                            ]
                        }
                    },

                    absent: {
                        $sum: {
                            $cond: [
                                { $eq: ["$status", "ABSENT"] },
                                1,
                                0
                            ]
                        }
                    }
                }
            },
            {
                $project: {
                    _id: 0,

                    date: {
                        $dateFromParts: {
                            year: "$_id.year",
                            month: "$_id.month",
                            day: "$_id.day",
                            timezone: "Asia/Kolkata"
                        }
                    },

                    totalSessions: {
                        $size: "$sessions"
                    },

                    totalStudentsMarked: "$totalRecords",
                    present: 1,
                    absent: 1,

                    attendancePercentage: {
                        $round: [
                            {
                                $multiply: [
                                    {
                                        $divide: [
                                            "$present",
                                            "$totalRecords"
                                        ]
                                    },
                                    100
                                ]
                            },
                            2
                        ]
                    }
                }
            },
            {
                $sort: {
                    date: -1
                }
            }
        ]);

        return res.status(200).json({
            success: true,
            totalDays: report.length,
            filters: {
                branchId: branchId || "ALL",
                semester: semester ? Number(semester) : "ALL"
            },
            reports: report
        });

    } catch (error) {
        console.error("Daily Attendance Report Error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to fetch daily attendance report."
        });
    }
};


const getStudentAttendanceReport = async (req, res) => {
    try {
        const { branchId, semester, sectionId, rollNumber } = req.query;

        // Validate branch ID
        if (branchId && !mongoose.Types.ObjectId.isValid(branchId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid branch ID."
            });
        }

        // Validate section ID
        if (sectionId && !mongoose.Types.ObjectId.isValid(sectionId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid section ID."
            });
        }

        // Validate semester
        if (semester && !/^[1-8]$/.test(semester)) {
            return res.status(400).json({
                success: false,
                message: "Semester must be between 1 and 8."
            });
        }

        const sectionMatch = {};

if (branchId) {
    sectionMatch["section.branchId"] =
        new mongoose.Types.ObjectId(branchId);
}

if (semester) {
    sectionMatch["section.semester"] = Number(semester);
}

if (sectionId) {
    sectionMatch["section._id"] =
        new mongoose.Types.ObjectId(sectionId);
}
        const report = await AttendanceRecord.aggregate([
            {
                $lookup: {
                    from: AttendanceSession.collection.name,
                    localField: "sessionId",
                    foreignField: "_id",
                    as: "session"
                }
            },
            {
                $unwind: "$session"
            },
            {
                $match: {
                    "session.status": "SUBMITTED"
                }
            },
            {
                $lookup: {
                    from: Section.collection.name,
                    localField: "session.sectionId",
                    foreignField: "_id",
                    as: "section"
                }
            },
            {
                $unwind: "$section"
            },
            {
                $match: sectionMatch
            },
            ...(rollNumber ? [{
                $match: {
                    rollNumber: rollNumber.trim().toUpperCase()
                }
            }] : []),
            {
                $group: {
                    _id: "$studentId",

                    rollNumber: {
                        $first: "$rollNumber"
                    },

                    totalSessions: {
                        $addToSet: "$session._id"
                    },

                    totalRecords: {
                        $sum: 1
                    },

                    present: {
                        $sum: {
                            $cond: [
                                { $eq: ["$status", "PRESENT"] },
                                1,
                                0
                            ]
                        }
                    },

                    absent: {
                        $sum: {
                            $cond: [
                                { $eq: ["$status", "ABSENT"] },
                                1,
                                0
                            ]
                        }
                    }
                }
            },
            {
                $lookup: {
                    from: Student.collection.name,
                    localField: "_id",
                    foreignField: "_id",
                    as: "student"
                }
            },
            {
                $unwind: "$student"
            },
            {
                $lookup: {
                    from: User.collection.name,
                    localField: "student.userId",
                    foreignField: "_id",
                    as: "user"
                }
            },
            {
                $unwind: "$user"
            },
            {
                $project: {
                    _id: 0,
                    studentId: "$_id",
                    studentName: "$user.name",
                    rollNumber: 1,

                    totalSubmittedClasses: {
                        $size: "$totalSessions"
                    },

                    totalRecords: 1,
                    present: 1,
                    absent: 1,

                    attendancePercentage: {
                        $round: [
                            {
                                $multiply: [
                                    {
                                        $divide: [
                                            "$present",
                                            "$totalRecords"
                                        ]
                                    },
                                    100
                                ]
                            },
                            2
                        ]
                    }
                }
            },
            {
                $sort: {
                    rollNumber: 1
                }
            }
        ]);

        return res.status(200).json({
            success: true,
            totalStudents: report.length,
            filters: {
                branchId: branchId || "ALL",
                semester: semester ? Number(semester) : "ALL",
                sectionId: sectionId || "ALL",
                rollNumber: rollNumber || "ALL"
            },
            reports: report
        });

    } catch (error) {
        console.error("Student Attendance Report Error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to fetch student attendance report."
        });
    }
};


module.exports = {
    getDashboardOverview,
    getSectionAttendanceReport, getSubjectAttendanceReport,
    getDailyAttendanceReport,
    getStudentAttendanceReport
};
