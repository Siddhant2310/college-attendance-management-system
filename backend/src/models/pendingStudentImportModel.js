
const mongoose = require("mongoose");

const pendingStudentImportSchema = new mongoose.Schema(
    {
        importId: {
            type: String,
            required: true,
            unique: true
        },

        adminId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        rows: [
            {
                name: {
                    type: String,
                    required: true
                },
                rollNumber: {
                    type: String,
                    required: true
                },
                email: {
                    type: String,
                    default: ""
                },
                branchCode: {
                    type: String,
                    required: true
                },
                sectionName: {
                    type: String,
                    required: true
                },
                semester: {
                    type: Number,
                    required: true
                },
                academicYear: {
                    type: String,
                    required: true
                },
                sectionId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "Section",
                    required: true
                }
            }
        ],

        expiresAt: {
            type: Date,
            required: true,
            index: {
                expires: 0
            }
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model(
    "PendingStudentImport",
    pendingStudentImportSchema
);
