
import { useEffect, useMemo, useState } from "react";
import {
    CalendarDays,
    Clock,
    Users,
    CheckCircle2,
    XCircle,
    AlertCircle,
    Eye,
    X,
    ChevronLeft,
    ChevronRight,
    RefreshCw
} from "lucide-react";
import teacherService from "../../services/teacherService";

const formatDate = (date) => {
    if (!date) return "N/A";

    return new Date(date).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
};

const formatTime = (date) => {
    if (!date) return "N/A";

    return new Date(date).toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit"
    });
};

const getStatusStyle = (status) => {
    if (status === "SUBMITTED") {
        return "bg-green-100 text-green-700";
    }

    return "bg-amber-100 text-amber-700";
};

export default function AttendanceHistory() {
    const [sessions, setSessions] = useState([]);
    const [pagination, setPagination] = useState({
        totalSessions: 0,
        currentPage: 1,
        totalPages: 1,
        limit: 10
    });

    const [currentPage, setCurrentPage] = useState(1);
    const [filter, setFilter] = useState("ALL");

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [selectedSession, setSelectedSession] = useState(null);
    const [sessionDetails, setSessionDetails] = useState(null);
    const [detailsLoading, setDetailsLoading] = useState(false);
    const [detailsError, setDetailsError] = useState("");

    const fetchSessions = async () => {
        try {
            setLoading(true);
            setError("");

            const response =
                await teacherService.getAttendanceSessions({
                    page: currentPage,
                    limit: 10
                });

            setSessions(response.sessions || []);

            setPagination({
                totalSessions:
                    response.pagination?.totalSessions || 0,
                currentPage:
                    response.pagination?.currentPage || 1,
                totalPages:
                    response.pagination?.totalPages || 1,
                limit:
                    response.pagination?.limit || 10
            });
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Unable to load attendance history."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSessions();
    }, [currentPage]);

    const filteredSessions = useMemo(() => {
        if (filter === "ALL") return sessions;

        return sessions.filter(
            (session) => session.status === filter
        );
    }, [sessions, filter]);

    const submittedCount = sessions.filter(
        (session) => session.status === "SUBMITTED"
    ).length;

    const draftCount = sessions.filter(
        (session) => session.status === "DRAFT"
    ).length;

    const openSessionDetails = async (session) => {
        try {
            setSelectedSession(session);
            setSessionDetails(null);
            setDetailsError("");
            setDetailsLoading(true);

            const response =
                await teacherService.getAttendanceSession(
                    session._id
                );

            setSessionDetails(response);
        } catch (err) {
            setDetailsError(
                err.response?.data?.message ||
                "Unable to load session details."
            );
        } finally {
            setDetailsLoading(false);
        }
    };

    const closeSessionDetails = () => {
        setSelectedSession(null);
        setSessionDetails(null);
        setDetailsError("");
    };

    const attendanceRecords =
        sessionDetails?.attendance || [];

    const summary = sessionDetails?.summary || {
        totalStudents: 0,
        present: 0,
        absent: 0,
        notMarked: 0
    };

    return (
        <div className="space-y-6">

            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">
                        Attendance History
                    </h1>
                    <p className="mt-1 text-sm text-slate-500">
                        View and review your previous attendance sessions.
                    </p>
                </div>

                <button
                    onClick={fetchSessions}
                    disabled={loading}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                    <RefreshCw
                        size={16}
                        className={loading ? "animate-spin" : ""}
                    />
                    Refresh
                </button>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">

                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-500">
                                Total Sessions
                            </p>
                            <h2 className="mt-2 text-3xl font-bold text-slate-800">
                                {pagination.totalSessions}
                            </h2>
                        </div>

                        <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
                            <CalendarDays size={24} />
                        </div>
                    </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-500">
                                Submitted Sessions
                            </p>
                            <h2 className="mt-2 text-3xl font-bold text-green-600">
                                {submittedCount}
                            </h2>
                            <p className="mt-1 text-xs text-slate-400">
                                On this page
                            </p>
                        </div>

                        <div className="rounded-xl bg-green-50 p-3 text-green-600">
                            <CheckCircle2 size={24} />
                        </div>
                    </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-500">
                                Draft Sessions
                            </p>
                            <h2 className="mt-2 text-3xl font-bold text-amber-600">
                                {draftCount}
                            </h2>
                            <p className="mt-1 text-xs text-slate-400">
                                On this page
                            </p>
                        </div>

                        <div className="rounded-xl bg-amber-50 p-3 text-amber-600">
                            <Clock size={24} />
                        </div>
                    </div>
                </div>

            </div>

            {/* Session Table */}
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

                <div className="flex flex-col gap-4 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="font-semibold text-slate-800">
                            Attendance Sessions
                        </h2>
                        <p className="mt-1 text-sm text-slate-500">
                            Showing {filteredSessions.length} of{" "}
                            {pagination.totalSessions} sessions
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {[
                            { label: "All Sessions", value: "ALL" },
                            { label: "Submitted", value: "SUBMITTED" },
                            { label: "Draft", value: "DRAFT" }
                        ].map((item) => (
                            <button
                                key={item.value}
                                onClick={() => setFilter(item.value)}
                                className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                                    filter === item.value
                                        ? "bg-blue-600 text-white"
                                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                }`}
                            >
                                {item.label}
                            </button>
                        ))}
                    </div>
                </div>

                {error && (
                    <div className="m-5 flex items-center gap-2 rounded-lg bg-red-50 p-4 text-sm text-red-700">
                        <AlertCircle size={18} />
                        {error}
                    </div>
                )}

                {loading ? (
                    <div className="flex items-center justify-center py-16 text-slate-500">
                        <RefreshCw
                            size={20}
                            className="mr-2 animate-spin"
                        />
                        Loading attendance history...
                    </div>
                ) : filteredSessions.length === 0 ? (
                    <div className="py-16 text-center">
                        <CalendarDays
                            size={40}
                            className="mx-auto mb-3 text-slate-300"
                        />
                        <h3 className="font-semibold text-slate-700">
                            No sessions found
                        </h3>
                        <p className="mt-1 text-sm text-slate-500">
                            No attendance sessions match this filter.
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[850px] text-left text-sm">
                                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                                    <tr>
                                        <th className="px-5 py-4">Subject</th>
                                        <th className="px-5 py-4">Section</th>
                                        <th className="px-5 py-4">Period</th>
                                        <th className="px-5 py-4">Date</th>
                                        <th className="px-5 py-4">Time</th>
                                        <th className="px-5 py-4">Status</th>
                                        <th className="px-5 py-4 text-center">Action</th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-slate-100">
                                    {filteredSessions.map((session) => (
                                        <tr
                                            key={session._id}
                                            className="hover:bg-slate-50"
                                        >
                                            <td className="px-5 py-4">
                                                <p className="font-semibold text-slate-800">
                                                    {session.subjectId?.name || "N/A"}
                                                </p>
                                                <p className="mt-1 text-xs text-slate-500">
                                                    {session.subjectId?.code || "N/A"}
                                                </p>
                                            </td>

                                            <td className="px-5 py-4">
                                                <p className="font-medium text-slate-700">
                                                    Section {session.sectionId?.name || "N/A"}
                                                </p>
                                                <p className="mt-1 text-xs text-slate-500">
                                                    {session.sectionId?.branchId?.code || "N/A"} ·
                                                    Sem {session.sectionId?.semester || "N/A"}
                                                </p>
                                            </td>

                                            <td className="px-5 py-4 font-medium text-slate-700">
                                                Period {session.period}
                                            </td>

                                            <td className="px-5 py-4 text-slate-600">
                                                {formatDate(session.date)}
                                            </td>

                                            <td className="px-5 py-4 text-slate-600">
                                                {formatTime(session.date)}
                                            </td>

                                            <td className="px-5 py-4">
                                                <span
                                                    className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusStyle(session.status)}`}
                                                >
                                                    {session.status}
                                                </span>
                                            </td>

                                            <td className="px-5 py-4 text-center">
                                                <button
                                                    onClick={() => openSessionDetails(session)}
                                                    className="inline-flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100"
                                                >
                                                    <Eye size={15} />
                                                    View
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                            <p className="text-sm text-slate-500">
                                Page {pagination.currentPage} of{" "}
                                {pagination.totalPages}
                            </p>

                            <div className="flex items-center gap-2">
                                <button
                                    disabled={currentPage <= 1 || loading}
                                    onClick={() => setCurrentPage((page) => page - 1)}
                                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                                >
                                    <ChevronLeft size={16} />
                                    Previous
                                </button>

                                <button
                                    disabled={
                                        currentPage >= pagination.totalPages ||
                                        loading
                                    }
                                    onClick={() => setCurrentPage((page) => page + 1)}
                                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                                >
                                    Next
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Session Details Modal */}
            {selectedSession && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-3 sm:p-6"
                    onClick={closeSessionDetails}
                >
                    <div
                        className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <div className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-white p-5">
                            <div>
                                <h2 className="text-lg font-bold text-slate-800">
                                    Attendance Details
                                </h2>
                                <p className="mt-1 text-sm text-slate-500">
                                    {selectedSession.subjectId?.name || "N/A"}
                                    {" · "}
                                    Section {selectedSession.sectionId?.name || "N/A"}
                                </p>
                            </div>

                            <button
                                onClick={closeSessionDetails}
                                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="space-y-5 p-5">

                            {detailsLoading ? (
                                <div className="py-12 text-center text-slate-500">
                                    <RefreshCw
                                        className="mx-auto mb-3 animate-spin"
                                        size={24}
                                    />
                                    Loading session details...
                                </div>
                            ) : detailsError ? (
                                <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
                                    {detailsError}
                                </div>
                            ) : sessionDetails ? (
                                <>
                                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                                        <div className="rounded-lg bg-slate-50 p-3">
                                            <p className="text-xs text-slate-500">Total Students</p>
                                            <p className="mt-1 text-xl font-bold text-slate-800">
                                                {summary.totalStudents}
                                            </p>
                                        </div>

                                        <div className="rounded-lg bg-green-50 p-3">
                                            <p className="text-xs text-green-700">Present</p>
                                            <p className="mt-1 text-xl font-bold text-green-700">
                                                {summary.present}
                                            </p>
                                        </div>

                                        <div className="rounded-lg bg-red-50 p-3">
                                            <p className="text-xs text-red-700">Absent</p>
                                            <p className="mt-1 text-xl font-bold text-red-700">
                                                {summary.absent}
                                            </p>
                                        </div>

                                        <div className="rounded-lg bg-amber-50 p-3">
                                            <p className="text-xs text-amber-700">Not Marked</p>
                                            <p className="mt-1 text-xl font-bold text-amber-700">
                                                {summary.notMarked}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap gap-4 text-sm text-slate-600">
                                        <span>
                                            <strong>Period:</strong>{" "}
                                            {selectedSession.period}
                                        </span>
                                        <span>
                                            <strong>Date:</strong>{" "}
                                            {formatDate(selectedSession.date)}
                                        </span>
                                        <span>
                                            <strong>Status:</strong>{" "}
                                            {selectedSession.status}
                                        </span>
                                    </div>

                                    <div className="overflow-x-auto rounded-lg border border-slate-200">
                                        <table className="w-full min-w-[500px] text-left text-sm">
                                            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                                                <tr>
                                                    <th className="px-4 py-3">Student</th>
                                                    <th className="px-4 py-3">Roll Number</th>
                                                    <th className="px-4 py-3">Status</th>
                                                </tr>
                                            </thead>

                                            <tbody className="divide-y divide-slate-100">
                                                {attendanceRecords.map((record) => (
                                                    <tr key={record.recordId}>
                                                        <td className="px-4 py-3 font-medium text-slate-800">
                                                            {record.name || "Student"}
                                                        </td>

                                                        <td className="px-4 py-3 text-slate-600">
                                                            {record.rollNumber || "N/A"}
                                                        </td>

                                                        <td className="px-4 py-3">
                                                            <span
                                                                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                                    record.status === "PRESENT"
                                                                        ? "bg-green-100 text-green-700"
                                                                        : record.status === "ABSENT"
                                                                        ? "bg-red-100 text-red-700"
                                                                        : "bg-amber-100 text-amber-700"
                                                                }`}
                                                            >
                                                                {record.status}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>

                                        {attendanceRecords.length === 0 && (
                                            <p className="py-8 text-center text-sm text-slate-500">
                                                No attendance records found.
                                            </p>
                                        )}
                                    </div>
                                </>
                            ) : null}
                        </div>

                        <div className="flex justify-end border-t border-slate-200 p-5">
                            <button
                                onClick={closeSessionDetails}
                                className="rounded-lg bg-slate-800 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-700"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
