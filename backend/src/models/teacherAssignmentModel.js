
const mongoose = require("mongoose");

const teacherAssignmentSchema = new mongoose.Schema(
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

        academicYear: {
            type: String,
            required: true,
            trim: true
        },

        isActive: {
            type: Boolean,
            default: true
        }
    },
    {
        timestamps: true
    }
);

// Prevent duplicate active assignments for the same combination
teacherAssignmentSchema.index(
    {
        teacherId: 1,
        subjectId: 1,
        sectionId: 1,
        academicYear: 1
    },
    {
        unique: true
    }
);

const TeacherAssignment = mongoose.model(
    "TeacherAssignment",
    teacherAssignmentSchema
);

module.exports = TeacherAssignment;
