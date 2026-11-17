
const mongoose = require("mongoose");

const attendanceSessionSchema = new mongoose.Schema(
    {
        teacherId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Teacher",
            required: true
        },

        subjectId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Subject",
            required: true
        },

        sectionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Section",
            required: true
        },

        assignmentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "TeacherAssignment",
            required: true
        },

        date: {
            type: Date,
            required: true,
            default: Date.now
        },

        period: {
            type: Number,
            required: true,
            min: 1
        },

        status: {
            type: String,
            enum: ["DRAFT", "SUBMITTED"],
            default: "DRAFT"
        },

        submittedAt: {
            type: Date,
            default: null
        },

        academicYear: {
            type: String,
            required: true,
            trim: true
        }
    },
    {
        timestamps: true
    }
);

const AttendanceSession = mongoose.model(
    "AttendanceSession",
    attendanceSessionSchema
);

module.exports = AttendanceSession;
