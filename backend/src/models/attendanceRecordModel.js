
const mongoose = require("mongoose");

const attendanceRecordSchema = new mongoose.Schema(
    {
        sessionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "AttendanceSession",
            required: true
        },

        studentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Student",
            required: true
        },

        // Preserve the student's roll number at attendance time
        rollNumber: {
            type: String,
            required: true,
            uppercase: true,
            trim: true
        },

        status: {
            type: String,
            enum: ["PRESENT", "ABSENT", "NOT_MARKED"],
            default: "NOT_MARKED"
        },

        markedAt: {
            type: Date,
            default: null
        },

        markedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Teacher",
            default: null
        }
    },
    {
        timestamps: true
    }
);

// A student can have only one attendance record per session
attendanceRecordSchema.index(
    {
        sessionId: 1,
        studentId: 1
    },
    {
        unique: true
    }
);

const AttendanceRecord = mongoose.model(
    "AttendanceRecord",
    attendanceRecordSchema
);

module.exports = AttendanceRecord;

