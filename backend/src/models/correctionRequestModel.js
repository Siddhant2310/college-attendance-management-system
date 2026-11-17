
const mongoose = require("mongoose");

const correctionRequestSchema = new mongoose.Schema(
    {
        attendanceRecordId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "AttendanceRecord",
            required: true
        },

        studentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Student",
            required: true
        },

        // Attendance status before the correction request
        originalStatus: {
            type: String,
            enum: ["PRESENT", "ABSENT", "NOT_MARKED"],
            default: null
        },

        requestedStatus: {
            type: String,
            enum: ["PRESENT", "ABSENT"],
            required: true
        },

        reason: {
            type: String,
            required: true,
            trim: true,
            maxlength: 500
        },

        status: {
            type: String,
            enum: ["PENDING", "APPROVED", "REJECTED"],
            default: "PENDING"
        },

        reviewedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null
        },

        reviewedAt: {
            type: Date,
            default: null
        },

        reviewRemark: {
            type: String,
            trim: true,
            maxlength: 500,
            default: ""
        }
    },
    {
        timestamps: true
    }
);

const CorrectionRequest = mongoose.model(
    "CorrectionRequest",
    correctionRequestSchema
);

module.exports = CorrectionRequest;
