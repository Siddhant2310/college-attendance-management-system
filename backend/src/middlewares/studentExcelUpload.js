
const multer = require("multer");

const uploadStudentExcel = multer({
    storage: multer.memoryStorage(),

    limits: {
        fileSize: 5 * 1024 * 1024, // 5 MB
        files: 1
    },

    fileFilter: (req, file, callback) => {
        const allowedExtensions = [".xlsx", ".xls"];

        const extension = file.originalname
            .slice(file.originalname.lastIndexOf("."))
            .toLowerCase();

        if (!allowedExtensions.includes(extension)) {
            return callback(
                new Error("Only .xlsx and .xls Excel files are allowed.")
            );
        }

        callback(null, true);
    }
});

module.exports = uploadStudentExcel;
