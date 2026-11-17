
const mongoose = require("mongoose");

const subjectSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },

        code: {
            type: String,
            required: true,
            uppercase: true,
            trim: true
        },

        branchId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Branch",
            required: true
        },

        semester: {
            type: Number,
            required: true,
            min: 1,
            max: 8
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

// Prevent duplicate subject codes within the same branch and semester
subjectSchema.index(
    {
        code: 1,
        branchId: 1,
        semester: 1
    },
    {
        unique: true
    }
);

const Subject = mongoose.model("Subject", subjectSchema);

module.exports = Subject;
