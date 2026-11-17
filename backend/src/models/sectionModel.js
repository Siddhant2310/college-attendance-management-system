
const mongoose = require("mongoose");

const sectionSchema = new mongoose.Schema(
    {
        name: {
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

// Prevent duplicate sections in the same academic structure
sectionSchema.index(
    {
        branchId: 1,
        semester: 1,
        name: 1,
        academicYear: 1
    },
    {
        unique: true
    }
);

const Section = mongoose.model("Section", sectionSchema);

module.exports = Section;
