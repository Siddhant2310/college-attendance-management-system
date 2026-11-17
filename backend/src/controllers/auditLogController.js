
const AuditLog = require("../models/auditLogModel");

// GET ALL AUDIT LOGS (ADMIN)
const getAuditLogs = async (req, res) => {
    try {
        // Pagination
        const page = Math.max(1, parseInt(req.query.page, 10) || 1);
        const limit = Math.min(
            100,
            Math.max(1, parseInt(req.query.limit, 10) || 20)
        );

        const skip = (page - 1) * limit;

        // Optional filters
        const filter = {};

        if (req.query.action) {
            filter.action = req.query.action.toUpperCase();
        }

        if (req.query.targetType) {
            filter.targetType = req.query.targetType;
        }

        if (req.query.performedBy) {
            filter.performedBy = req.query.performedBy;
        }

        // Fetch logs and total count
        const [logs, totalLogs] = await Promise.all([
            AuditLog.find(filter)
                .populate({
                    path: "performedBy",
                    select: "name loginId role"
                })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),

            AuditLog.countDocuments(filter)
        ]);

        return res.status(200).json({
            success: true,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalLogs / limit),
                totalLogs,
                limit
            },
            logs
        });

    } catch (error) {
        console.error("Get Audit Logs Error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to fetch audit logs."
        });
    }
};

module.exports = {
    getAuditLogs
};
