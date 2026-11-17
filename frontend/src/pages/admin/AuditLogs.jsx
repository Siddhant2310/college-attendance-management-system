
import { useEffect, useState } from "react";
import {
    Activity,
    RefreshCw,
    Search,
    Filter,
    ChevronLeft,
    ChevronRight,
    Download
} from "lucide-react";
import api from "../../services/api";

const actionLabels = {
    ATTENDANCE_CREATED: "Attendance Created",
    ATTENDANCE_MARKED: "Attendance Marked",
    ATTENDANCE_SUBMITTED: "Attendance Submitted",
    ATTENDANCE_CORRECTED: "Attendance Corrected",
    CORRECTION_REQUESTED: "Correction Requested",
    CORRECTION_APPROVED: "Correction Approved",
    CORRECTION_REJECTED: "Correction Rejected",
    STUDENT_CREATED: "Student Created",
    STUDENT_UPDATED: "Student Updated",
    TEACHER_CREATED: "Teacher Created",
    TEACHER_UPDATED: "Teacher Updated"
};

const targetTypes = [
    "AttendanceSession",
    "AttendanceRecord",
    "CorrectionRequest",
    "Student",
    "Teacher"
];

const formatDate = (date) => {
    if (!date) return "-";

    return new Date(date).toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });
};

const exportCSV = (logs) => {
    if (!logs.length) return;

    const headers = [
        "Date",
        "Performed By",
        "Login ID",
        "Role",
        "Action",
        "Target Type",
        "Target ID",
        "Description"
    ];

    const rows = logs.map((log) => [
        log.createdAt
    ? new Date(log.createdAt).toLocaleString("sv-SE")
    : "-",
        log.performedBy?.name || "Unknown",
        log.performedBy?.loginId || "-",
        log.performedBy?.role || "-",
        actionLabels[log.action] || log.action,
        log.targetType,
        log.targetId,
        log.description || "-"
    ]);

    const csv = [
        headers,
        ...rows
    ].map((row) =>
        row.map((value) =>
            `"${String(value ?? "").replace(/"/g, '""')}"`
        ).join(",")
    ).join("\n");

    const blob = new Blob(["\uFEFF" + csv], {
        type: "text/csv;charset=utf-8;"
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "admin-audit-logs.csv";
    link.click();

    URL.revokeObjectURL(url);
};

function StatCard({ title, value, description }) {
    return (
        <div className="bg-white border border-gray-200 rounded-xl p-5">
            <p className="text-sm text-gray-500">{title}</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-2">
                {value}
            </h3>
            <p className="text-xs text-gray-400 mt-1">{description}</p>
        </div>
    );
}

export default function AuditLogs() {
    const [logs, setLogs] = useState([]);
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalLogs: 0,
        limit: 20
    });

    const [action, setAction] = useState("");
    const [targetType, setTargetType] = useState("");
    const [performedBy, setPerformedBy] = useState("");
    const [search, setSearch] = useState("");

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const fetchLogs = async (page = 1) => {
        setLoading(true);
        setError("");

        try {
            const response = await api.get("/admin/audit-logs", {
                params: {
                    page,
                    limit: 20,
                    ...(action && { action }),
                    ...(targetType && { targetType }),
                    ...(performedBy.trim() && {
                        performedBy: performedBy.trim()
                    })
                }
            });

            setLogs(response.data.logs || []);
            setPagination(response.data.pagination || {
                currentPage: 1,
                totalPages: 1,
                totalLogs: 0,
                limit: 20
            });
        } catch (err) {
            console.error("Audit logs loading error:", err);
            setLogs([]);
            setError(
                err.response?.data?.message ||
                "Unable to load audit logs."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs(1);
    }, [action, targetType]);

    const filteredLogs = logs.filter((log) => {
        const searchText = search.toLowerCase();

        const text = [
            log.performedBy?.name,
            log.performedBy?.loginId,
            log.performedBy?.role,
            log.action,
            log.targetType,
            log.targetId,
            log.description
        ].join(" ").toLowerCase();

        return text.includes(searchText);
    });

    const uniqueActions = [...new Set(logs.map((log) => log.action))];

    const goToPage = (page) => {
        if (
            page < 1 ||
            page > pagination.totalPages ||
            loading
        ) return;

        fetchLogs(page);
    };

    const clearFilters = () => {
        setAction("");
        setTargetType("");
        setPerformedBy("");
        setSearch("");
    };

    return (
        <div className="space-y-6">

            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        Audit Logs
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Monitor important activities performed across the system.
                    </p>
                </div>

                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => fetchLogs(pagination.currentPage)}
                        disabled={loading}
                        className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
                    >
                        <RefreshCw size={16} />
                        Refresh
                    </button>

                    <button
                        onClick={() => exportCSV(filteredLogs)}
                        disabled={!filteredLogs.length}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                    >
                        <Download size={16} />
                        Export CSV
                    </button>
                </div>
            </div>

            {/* Information */}
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3">
                <Activity
                    className="text-blue-600 shrink-0 mt-1"
                    size={20}
                />
                <div>
                    <p className="font-semibold text-blue-900 text-sm">
                        System Activity History
                    </p>
                    <p className="text-sm text-blue-800 mt-1">
                        View who performed an action, what was affected,
                        and when the activity occurred.
                    </p>
                </div>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                <StatCard
                    title="Total Audit Logs"
                    value={pagination.totalLogs}
                    description="All recorded system activities"
                />

                <StatCard
                    title="Current Page"
                    value={`${pagination.currentPage} / ${pagination.totalPages}`}
                    description="Pagination information"
                />

                <StatCard
                    title="Actions on This Page"
                    value={uniqueActions.length}
                    description="Different action types"
                />
            </div>

            {/* Filters and Table */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">

                <div className="p-4 border-b border-gray-200 space-y-4">

                    <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                        <Filter size={17} />
                        Audit Log Filters
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">

                        <select
                            value={action}
                            onChange={(e) => setAction(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                        >
                            <option value="">All Actions</option>

                            {Object.entries(actionLabels).map(([value, label]) => (
                                <option key={value} value={value}>
                                    {label}
                                </option>
                            ))}
                        </select>

                        <select
                            value={targetType}
                            onChange={(e) => setTargetType(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                        >
                            <option value="">All Target Types</option>

                            {targetTypes.map((type) => (
                                <option key={type} value={type}>
                                    {type}
                                </option>
                            ))}
                        </select>

                        <input
                            value={performedBy}
                            onChange={(e) => setPerformedBy(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") fetchLogs(1);
                            }}
                            placeholder="Filter by user ID"
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                        />

                        <div className="relative">
                            <Search
                                size={16}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                            />

                            <input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search current page..."
                                className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2 text-sm"
                            />
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <button
                            onClick={clearFilters}
                            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                        >
                            Clear filters
                        </button>

                        <button
                            onClick={() => fetchLogs(1)}
                            disabled={loading}
                            className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50"
                        >
                            Apply User ID Filter
                        </button>
                    </div>
                </div>

                {/* Error */}
                {error && (
                    <div className="mx-4 my-3 p-3 rounded-lg bg-red-50 text-red-700 text-sm">
                        {error}
                    </div>
                )}

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">

                        <thead className="bg-gray-50 text-gray-600">
                            <tr>
                                <th className="p-4">Date & Time</th>
                                <th className="p-4">Performed By</th>
                                <th className="p-4">Action</th>
                                <th className="p-4">Target Type</th>
                                <th className="p-4">Target ID</th>
                                <th className="p-4">Description</th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-gray-100">

                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="p-8 text-center text-gray-500">
                                        Loading audit logs...
                                    </td>
                                </tr>
                            ) : filteredLogs.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="p-8 text-center text-gray-500">
                                        No audit logs found.
                                    </td>
                                </tr>
                            ) : (
                                filteredLogs.map((log) => (
                                    <tr
                                        key={log._id}
                                        className="hover:bg-gray-50"
                                    >
                                        <td className="p-4 whitespace-nowrap text-gray-600">
                                            {formatDate(log.createdAt)}
                                        </td>

                                        <td className="p-4">
                                            <p className="font-medium text-gray-900">
                                                {log.performedBy?.name || "Unknown User"}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {log.performedBy?.loginId || "-"} · {log.performedBy?.role || "-"}
                                            </p>
                                        </td>

                                        <td className="p-4">
                                            <span className="inline-flex px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700">
                                                {actionLabels[log.action] || log.action}
                                            </span>
                                        </td>

                                        <td className="p-4 text-gray-700">
                                            {log.targetType}
                                        </td>

                                        <td className="p-4">
                                            <span className="text-xs text-gray-500 font-mono">
                                                {String(log.targetId || "-").slice(0, 12)}...
                                            </span>
                                        </td>

                                        <td className="p-4 text-gray-600 min-w-48">
                                            {log.description || "-"}
                                        </td>
                                    </tr>
                                ))
                            )}

                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="p-4 border-t border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">

                    <p className="text-xs text-gray-500">
                        Showing {filteredLogs.length} of {logs.length} logs on this page.
                        {" "}Total logs: {pagination.totalLogs}
                    </p>

                    <div className="flex items-center gap-2">

                        <button
                            onClick={() => goToPage(pagination.currentPage - 1)}
                            disabled={loading || pagination.currentPage <= 1}
                            className="inline-flex items-center gap-1 px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-40"
                        >
                            <ChevronLeft size={16} />
                            Previous
                        </button>

                        <span className="text-sm text-gray-600 px-2">
                            Page {pagination.currentPage} of {pagination.totalPages}
                        </span>

                        <button
                            onClick={() => goToPage(pagination.currentPage + 1)}
                            disabled={
                                loading ||
                                pagination.currentPage >= pagination.totalPages
                            }
                            className="inline-flex items-center gap-1 px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-40"
                        >
                            Next
                            <ChevronRight size={16} />
                        </button>

                    </div>
                </div>
            </div>
        </div>
    );
}
