
const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
    {
        // User who performed the action
        performedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        action: {
            type: String,
            required: true,
            enum: [
                "ATTENDANCE_CREATED",
                "ATTENDANCE_MARKED",
                "ATTENDANCE_SUBMITTED",
                "ATTENDANCE_CORRECTED",
                "CORRECTION_REQUESTED",
                "CORRECTION_APPROVED",
                "CORRECTION_REJECTED",
                "STUDENT_CREATED",
                "STUDENT_UPDATED",
                "TEACHER_CREATED",
                "TEACHER_UPDATED"
            ]
        },

        // Type of document affected
        targetType: {
            type: String,
            required: true,
            enum: [
                "AttendanceSession",
                "AttendanceRecord",
                "CorrectionRequest",
                "Student",
                "Teacher"
            ]
        },

        // ID of the affected document
        targetId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true
        },

        // Store previous and updated values
        changes: {
            type: mongoose.Schema.Types.Mixed,
            default: {}
        },

        // Additional information or reason
        description: {
            type: String,
            trim: true,
            default: ""
        }
    },
    {
        timestamps: true
    }
);

// Quickly retrieve audit history for a document
auditLogSchema.index({
    targetType: 1,
    targetId: 1,
    createdAt: -1
});

// Retrieve actions performed by a particular user
auditLogSchema.index({
    performedBy: 1,
    createdAt: -1
});

const AuditLog = mongoose.model("AuditLog", auditLogSchema);

module.exports = AuditLog;
