const mongoose = require("mongoose");

const Teacher = require("../models/teacherModel");
const Subject = require("../models/subjectModel");
const Section = require("../models/sectionModel");
const TeacherAssignment = require("../models/teacherAssignmentModel");

// CREATE TEACHER ASSIGNMENT
const createTeacherAssignment = async (req, res) => {
    try {
        const { teacherId, subjectId, sectionId, academicYear } = req.body;

        if (!teacherId || !subjectId || !sectionId || !academicYear) {
            return res.status(400).json({
                success: false,
                message: "Teacher ID, subject ID, section ID and academic year are required."
            });
        }

        // Validate MongoDB IDs
        const ids = [teacherId, subjectId, sectionId];

        if (!ids.every(id => mongoose.Types.ObjectId.isValid(id))) {
            return res.status(400).json({
                success: false,
                message: "Invalid teacher, subject or section ID."
            });
        }

        const normalizedAcademicYear = academicYear.trim();

        if (!normalizedAcademicYear) {
            return res.status(400).json({
                success: false,
                message: "Academic year cannot be empty."
            });
        }

        // Verify active teacher
        const teacher = await Teacher.findOne({
            _id: teacherId,
            isActive: true
        });

        if (!teacher) {
            return res.status(404).json({
                success: false,
                message: "Active teacher not found."
            });
        }

        // Verify active subject
        const subject = await Subject.findOne({
            _id: subjectId,
            isActive: true
        });

        if (!subject) {
            return res.status(404).json({
                success: false,
                message: "Active subject not found."
            });
        }

        // Verify active section
        const section = await Section.findOne({
            _id: sectionId,
            isActive: true
        });

        if (!section) {
            return res.status(404).json({
                success: false,
                message: "Active section not found."
            });
        }

        // Ensure subject belongs to the same branch and semester
        if (
            subject.branchId.toString() !== section.branchId.toString() ||
            subject.semester !== section.semester
        ) {
            return res.status(400).json({
                success: false,
                message: "Subject does not belong to this section's branch and semester."
            });
        }

        // Ensure academic year matches section
        if (section.academicYear !== normalizedAcademicYear) {
            return res.status(400).json({
                success: false,
                message: "Academic year does not match the section."
            });
        }

        // Prevent duplicate assignment
        const existingAssignment = await TeacherAssignment.findOne({
            teacherId,
            subjectId,
            sectionId,
            academicYear: normalizedAcademicYear
        });

        if (existingAssignment) {
            return res.status(409).json({
                success: false,
                message: "This teacher assignment already exists."
            });
        }

        const assignment = await TeacherAssignment.create({
            teacherId,
            subjectId,
            sectionId,
            academicYear: normalizedAcademicYear,
            isActive: true
        });

        return res.status(201).json({
            success: true,
            message: "Teacher assigned successfully.",
            assignment
        });

    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "This teacher assignment already exists."
            });
        }

        console.error("Create Teacher Assignment Error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Internal server error."
        });
    }
};

// GET ALL TEACHER ASSIGNMENTS
const getTeacherAssignments = async (req, res) => {
    try {
        const assignments = await TeacherAssignment.find()
            .populate({
                path: "teacherId",
                populate: {
                    path: "userId",
                    select: "name loginId email"
                }
            })
            .populate("subjectId", "name code semester")
            .populate({
                path: "sectionId",
                select: "name semester academicYear branchId",
                populate: {
                    path: "branchId",
                    select: "name code"
                }
            })
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: assignments.length,
            assignments
        });

    } catch (error) {
        console.error("Get Teacher Assignments Error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Internal server error."
        });
    }
};

module.exports = {
    createTeacherAssignment,
    getTeacherAssignments
};