
import { useEffect, useState } from "react";
import {
    CheckCircle,
    XCircle,
    Clock,
    RefreshCw,
    FileText,
    User,
    AlertCircle
} from "lucide-react";
import teacherService from "../../services/teacherService";

const getRequests = (data) =>
    data?.requests ||
    data?.correctionRequests ||
    data?.pendingRequests ||
    data?.data?.requests ||
    [];

const getStudentName = (request) =>
    request.studentId?.userId?.name ||
    request.studentId?.name ||
    request.student?.name ||
    request.attendanceRecordId?.studentId?.userId?.name ||
    "Student";

const getRollNumber = (request) =>
    request.studentId?.rollNumber ||
    request.student?.rollNumber ||
    request.attendanceRecordId?.rollNumber ||
    request.rollNumber ||
    "N/A";

const getSubject = (request) =>
    request.sessionId?.subjectId?.name ||
    request.sessionId?.subject?.name ||
    request.attendanceSession?.subject?.name ||
    request.subject?.name ||
    "Subject information unavailable";

const getSection = (request) =>
    request.sessionId?.sectionId?.name ||
    request.sessionId?.section?.name ||
    request.attendanceSession?.section?.name ||
    request.section?.name ||
    "N/A";

const getPeriod = (request) =>
    request.sessionId?.period ??
    request.attendanceSession?.period ??
    request.period ??
    "N/A";

const getCurrentStatus = (request) =>
    request.attendanceRecordId?.status ||
    request.attendanceRecord?.status ||
    request.currentStatus ||
    request.existingStatus ||
    "N/A";

const getRequestedStatus = (request) =>
    request.requestedStatus ||
    request.newStatus ||
    request.requestedAttendanceStatus ||
    "N/A";

const getReason = (request) =>
    request.reason ||
    request.requestRemark ||
    request.remark ||
    request.description ||
    "No reason provided.";

const formatDate = (date) => {
    if (!date) return "N/A";

    return new Date(date).toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });
};

function StatusBadge({ status }) {
    const normalized = String(status || "").toUpperCase();

    const styles = {
        PRESENT: "bg-green-100 text-green-700",
        ABSENT: "bg-red-100 text-red-700",
        NOT_MARKED: "bg-slate-100 text-slate-700"
    };

    return (
        <span
            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                styles[normalized] || "bg-slate-100 text-slate-600"
            }`}
        >
            {normalized.replace("_", " ")}
        </span>
    );
}

export default function CorrectionRequests() {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [processingId, setProcessingId] = useState(null);
    const [remarks, setRemarks] = useState({});
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    const fetchRequests = async (showRefresh = false) => {
        try {
            if (showRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            setError("");

            const response = await teacherService.getCorrectionRequests();
            setRequests(getRequests(response));
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Unable to load correction requests."
            );
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    const handleReview = async (requestId, decision) => {
        const reviewRemark = remarks[requestId]?.trim() || "";

        try {
            setProcessingId(requestId);
            setError("");
            setMessage("");

            await teacherService.reviewCorrectionRequest(
                requestId,
                decision,
                reviewRemark
            );

            setRequests((previous) =>
                previous.filter((request) => request._id !== requestId)
            );

            setRemarks((previous) => {
                const updated = { ...previous };
                delete updated[requestId];
                return updated;
            });

            setMessage(
                decision === "APPROVED"
                    ? "Correction request approved successfully."
                    : "Correction request rejected successfully."
            );
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Unable to review this correction request."
            );
        } finally {
            setProcessingId(null);
        }
    };

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">
                        Correction Requests
                    </h1>
                    <p className="mt-1 text-sm text-slate-500">
                        Review student requests to correct their attendance.
                    </p>
                </div>

                <button
                    onClick={() => fetchRequests(true)}
                    disabled={refreshing || loading}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
                >
                    <RefreshCw
                        size={16}
                        className={refreshing ? "animate-spin" : ""}
                    />
                    Refresh
                </button>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-500">
                                Pending Requests
                            </p>
                            <p className="mt-2 text-3xl font-bold text-slate-800">
                                {requests.length}
                            </p>
                        </div>
                        <div className="rounded-xl bg-amber-50 p-3 text-amber-600">
                            <Clock size={23} />
                        </div>
                    </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-500">
                                Awaiting Your Review
                            </p>
                            <p className="mt-2 text-3xl font-bold text-slate-800">
                                {requests.length}
                            </p>
                        </div>
                        <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
                            <FileText size={23} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Messages */}
            {error && (
                <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    <AlertCircle size={18} />
                    {error}
                </div>
            )}

            {message && (
                <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700">
                    <CheckCircle size={18} />
                    {message}
                </div>
            )}

            {/* Requests */}
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 p-5">
                    <h2 className="text-lg font-semibold text-slate-800">
                        Student Requests
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                        Approve or reject each request after reviewing the details.
                    </p>
                </div>

                {loading ? (
                    <div className="p-12 text-center text-slate-500">
                        <RefreshCw
                            size={25}
                            className="mx-auto mb-3 animate-spin"
                        />
                        Loading correction requests...
                    </div>
                ) : requests.length === 0 ? (
                    <div className="p-12 text-center">
                        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-50 text-green-600">
                            <CheckCircle size={28} />
                        </div>
                        <h3 className="font-semibold text-slate-800">
                            No Pending Requests
                        </h3>
                        <p className="mt-1 text-sm text-slate-500">
                            There are no correction requests waiting for your review.
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {requests.map((request) => {
                            const requestId = request._id;
                            const isProcessing = processingId === requestId;

                            return (
                                <div key={requestId} className="p-5">
                                    <div className="flex flex-col justify-between gap-4 lg:flex-row">
                                        {/* Student Details */}
                                        <div className="min-w-0 flex-1 space-y-4">
                                            <div className="flex items-start gap-3">
                                                <div className="rounded-full bg-blue-50 p-3 text-blue-600">
                                                    <User size={21} />
                                                </div>

                                                <div>
                                                    <h3 className="font-semibold text-slate-800">
                                                        {getStudentName(request)}
                                                    </h3>
                                                    <p className="text-sm text-slate-500">
                                                        Roll Number: {getRollNumber(request)}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 gap-3 rounded-lg bg-slate-50 p-4 sm:grid-cols-2">
                                                <div>
                                                    <p className="text-xs text-slate-500">
                                                        Subject
                                                    </p>
                                                    <p className="mt-1 text-sm font-medium text-slate-800">
                                                        {getSubject(request)}
                                                    </p>
                                                </div>

                                                <div>
                                                    <p className="text-xs text-slate-500">
                                                        Section / Period
                                                    </p>
                                                    <p className="mt-1 text-sm font-medium text-slate-800">
                                                        Section {getSection(request)} · Period {getPeriod(request)}
                                                    </p>
                                                </div>

                                                <div>
                                                    <p className="text-xs text-slate-500">
                                                        Current Attendance
                                                    </p>
                                                    <div className="mt-1">
                                                        <StatusBadge status={getCurrentStatus(request)} />
                                                    </div>
                                                </div>

                                                <div>
                                                    <p className="text-xs text-slate-500">
                                                        Requested Attendance
                                                    </p>
                                                    <div className="mt-1">
                                                        <StatusBadge status={getRequestedStatus(request)} />
                                                    </div>
                                                </div>
                                            </div>

                                            <div>
                                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                                    Student's Reason
                                                </p>
                                                <p className="mt-1 text-sm text-slate-700">
                                                    {getReason(request)}
                                                </p>
                                            </div>

                                            <p className="text-xs text-slate-400">
                                                Requested on:{" "}
                                                {formatDate(
                                                    request.createdAt ||
                                                    request.requestedAt
                                                )}
                                            </p>
                                        </div>

                                        {/* Review Actions */}
                                        <div className="w-full lg:max-w-sm">
                                            <label
                                                htmlFor={`remark-${requestId}`}
                                                className="mb-2 block text-sm font-medium text-slate-700"
                                            >
                                                Review Remark (Optional)
                                            </label>

                                            <textarea
                                                id={`remark-${requestId}`}
                                                rows={3}
                                                value={remarks[requestId] || ""}
                                                onChange={(e) =>
                                                    setRemarks((previous) => ({
                                                        ...previous,
                                                        [requestId]: e.target.value
                                                    }))
                                                }
                                                placeholder="Add a remark for your decision..."
                                                disabled={isProcessing}
                                                className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50"
                                            />

                                            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                                                <button
                                                    onClick={() =>
                                                        handleReview(requestId, "APPROVED")
                                                    }
                                                    disabled={isProcessing}
                                                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-green-700 disabled:opacity-50"
                                                >
                                                    <CheckCircle size={16} />
                                                    {isProcessing ? "Processing..." : "Approve"}
                                                </button>

                                                <button
                                                    onClick={() =>
                                                        handleReview(requestId, "REJECTED")
                                                    }
                                                    disabled={isProcessing}
                                                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
                                                >
                                                    <XCircle size={16} />
                                                    {isProcessing ? "Processing..." : "Reject"}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
