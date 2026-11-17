
const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema(
    {
        // Link student profile with login account
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true
        },

        // Student's permanent roll number
        rollNumber: {
            type: String,
            required: true,
            unique: true,
            uppercase: true,
            trim: true
        },

        // Student's current academic section
        sectionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Section",
            required: true
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

const Student = mongoose.model("Student", studentSchema);

module.exports = Student;
