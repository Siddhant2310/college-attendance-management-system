
const mongoose = require("mongoose");

const teacherSchema = new mongoose.Schema(
    {
        // Link teacher profile with login account
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true
        },

        // Teacher's unique employee ID
        employeeId: {
            type: String,
            required: true,
            unique: true,
            uppercase: true,
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

const Teacher = mongoose.model("Teacher", teacherSchema);

module.exports = Teacher;
