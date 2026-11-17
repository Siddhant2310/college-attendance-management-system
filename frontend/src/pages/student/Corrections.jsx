
import { useEffect, useState, useRef } from "react";
import {
    ClipboardCheck,
    Clock,
    Send,
    RefreshCw,
    AlertCircle,
    CheckCircle,
    XCircle,
    History
} from "lucide-react";

import studentService from "../../services/studentService";

export default function StudentCorrections() {
    const [attendance, setAttendance] = useState([]);
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submittingId, setSubmittingId] = useState(null);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [forms, setForms] = useState({});

    // Prevent older API calls from overwriting newer results.
    const fetchRequestId = useRef(0);

    const fetchData = async () => {
        const requestId = ++fetchRequestId.current;

        try {
            setLoading(true);
            setError("");

            // Fetch both APIs independently.
            const results = await Promise.allSettled([
                studentService.getMyAttendance(),
                studentService.getMyCorrectionRequests()
            ]);

            // Ignore outdated requests.
            if (requestId !== fetchRequestId.current) return;

            const [attendanceResult, requestResult] = results;
            const errors = [];

            // Attendance API result
            if (attendanceResult.status === "fulfilled") {
                const response = attendanceResult.value;

                if (response.success) {
                    setAttendance(
                        (response.attendance || []).filter(
                            (record) => record.session?.status === "DRAFT"
                        )
                    );
                } else {
                    errors.push("Unable to load attendance records.");
                }
            } else {
                console.error(
                    "Attendance API Error:",
                    attendanceResult.reason
                );
                errors.push("Unable to load attendance records.");
            }

            // Correction history API result
            if (requestResult.status === "fulfilled") {
                const response = requestResult.value;

                if (response.success) {
                    setRequests(response.requests || []);
                } else {
                    errors.push("Unable to load correction history.");
                }
            } else {
                console.error(
                    "Correction History API Error:",
                    requestResult.reason
                );
                errors.push("Unable to load correction history.");
            }

            if (errors.length > 0) {
                setError(errors.join(" "));
            }

        } finally {
            if (requestId === fetchRequestId.current) {
                setLoading(false);
            }
        }
    };

    useEffect(() => {
        fetchData();

        return () => {
            // Invalidate pending requests when component unmounts.
            fetchRequestId.current += 1;
        };
    }, []);

    const updateForm = (recordId, field, value) => {
        setForms((previous) => ({
            ...previous,
            [recordId]: {
                ...previous[recordId],
                [field]: value
            }
        }));
    };

    const submitRequest = async (record) => {
        const form = forms[record.recordId] || {};
        const requestedStatus = form.requestedStatus;
        const reason = (form.reason || "").trim();

        setError("");
        setSuccess("");

        if (!requestedStatus) {
            setError("Please select the correct attendance status.");
            return;
        }

        if (!reason) {
            setError("Please enter a reason for your correction request.");
            return;
        }

        if (reason.length > 500) {
            setError("Reason cannot exceed 500 characters.");
            return;
        }

        if (requestedStatus === record.status) {
            setError(
                "The requested status is already the current status."
            );
            return;
        }

        try {
            setSubmittingId(record.recordId);

            const response = await studentService.requestCorrection(
                record.recordId,
                requestedStatus,
                reason
            );

            setSuccess(
                response.message ||
                "Correction request submitted successfully."
            );

            setForms((previous) => ({
                ...previous,
                [record.recordId]: {
                    requestedStatus: "",
                    reason: ""
                }
            }));

            await fetchData();

        } catch (err) {
            console.error("Submit Correction Error:", err);

            setError(
                err.response?.data?.message ||
                "Unable to submit correction request."
            );
        } finally {
            setSubmittingId(null);
        }
    };

    const formatDate = (date) => {
        if (!date) return "—";

        return new Date(date).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric"
        });
    };

    const statusStyle = (status) => {
        if (status === "APPROVED") {
            return "bg-green-100 text-green-700";
        }

        if (status === "REJECTED") {
            return "bg-red-100 text-red-700";
        }

        return "bg-amber-100 text-amber-700";
    };

    if (loading) {
        return (
            <div className="flex min-h-[50vh] items-center justify-center">
                <RefreshCw
                    className="animate-spin text-indigo-600"
                    size={30}
                />
            </div>
        );
    }

    return (
        <div className="space-y-8">

            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-800">
                    Correction Requests
                </h1>

                <p className="mt-1 text-sm text-slate-500">
                    Request attendance corrections and track your requests.
                </p>
            </div>

            {/* Information */}
            <div className="flex gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4">
                <AlertCircle
                    className="mt-0.5 shrink-0 text-blue-600"
                    size={20}
                />

                <p className="text-sm text-blue-800">
                    You can request corrections only for attendance sessions
                    that are still in draft. Your teacher will review your request.
                </p>
            </div>

            {/* Feedback */}
            {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    {error}
                </div>
            )}

            {success && (
                <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
                    {success}
                </div>
            )}

            {/* Eligible Attendance Records */}
            <section className="space-y-4">

                <div className="flex flex-wrap items-center justify-between gap-3">
                    <h2 className="font-bold text-slate-800">
                        Eligible Attendance Records
                    </h2>

                    <button
                        onClick={fetchData}
                        className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
                    >
                        <RefreshCw size={15} />
                        Refresh
                    </button>
                </div>

                {attendance.length > 0 ? (
                    attendance.map((record) => {
                        const form = forms[record.recordId] || {};
                        const isSubmitting =
                            submittingId === record.recordId;

                        return (
                            <div
                                key={record.recordId}
                                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                            >
                                <div className="flex flex-wrap items-start justify-between gap-3">

                                    <div>
                                        <h3 className="font-semibold text-slate-800">
                                            {record.session?.subjectId?.name ||
                                                "Unknown Subject"}
                                        </h3>

                                        <p className="mt-1 text-sm text-slate-500">
                                            {record.session?.subjectId?.code || "—"}
                                        </p>

                                        <p className="mt-2 text-xs text-slate-500">
                                            {formatDate(record.session?.date)}
                                            {" · "}
                                            Period {record.session?.period ?? "—"}
                                        </p>
                                    </div>

                                    <span className="flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1.5 text-xs font-semibold text-amber-700">
                                        <Clock size={13} />
                                        DRAFT
                                    </span>

                                </div>

                                <div className="my-4 border-t border-slate-100" />

                                <p className="mb-3 text-sm text-slate-600">
                                    Current attendance status:{" "}
                                    <span className="font-bold text-slate-800">
                                        {record.status.replace("_", " ")}
                                    </span>
                                </p>

                                <label className="mb-2 block text-sm font-medium text-slate-700">
                                    Request status
                                </label>

                                <select
                                    value={form.requestedStatus || ""}
                                    onChange={(e) =>
                                        updateForm(
                                            record.recordId,
                                            "requestedStatus",
                                            e.target.value
                                        )
                                    }
                                    className="mb-4 w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                                >
                                    <option value="">
                                        Select correct status
                                    </option>
                                    <option value="PRESENT">Present</option>
                                    <option value="ABSENT">Absent</option>
                                </select>

                                <label className="mb-2 block text-sm font-medium text-slate-700">
                                    Reason for correction
                                </label>

                                <textarea
                                    rows={3}
                                    maxLength={500}
                                    value={form.reason || ""}
                                    onChange={(e) =>
                                        updateForm(
                                            record.recordId,
                                            "reason",
                                            e.target.value
                                        )
                                    }
                                    placeholder="Explain why this attendance record needs correction..."
                                    className="w-full resize-y rounded-xl border border-slate-300 px-3 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                                />

                                <div className="mt-1 text-right text-xs text-slate-400">
                                    {(form.reason || "").length}/500
                                </div>

                                <button
                                    onClick={() => submitRequest(record)}
                                    disabled={isSubmitting}
                                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                                >
                                    {isSubmitting ? (
                                        <RefreshCw
                                            size={17}
                                            className="animate-spin"
                                        />
                                    ) : (
                                        <Send size={17} />
                                    )}

                                    {isSubmitting
                                        ? "Submitting..."
                                        : "Submit Request"}
                                </button>
                            </div>
                        );
                    })
                ) : (
                    <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
                        <ClipboardCheck
                            className="mx-auto mb-3 text-slate-300"
                            size={40}
                        />

                        <h3 className="font-semibold text-slate-700">
                            No eligible records
                        </h3>

                        <p className="mt-1 text-sm text-slate-500">
                            There are currently no draft attendance records
                            available for correction.
                        </p>
                    </div>
                )}
            </section>

            {/* Correction Request History */}
            <section className="space-y-4">

                <div className="flex items-center gap-2">
                    <History
                        className="text-indigo-600"
                        size={21}
                    />

                    <h2 className="font-bold text-slate-800">
                        My Correction Request History
                    </h2>
                </div>

                {requests.length > 0 ? (
                    requests.map((request) => {
                        const record = request.attendanceRecordId;
                        const session = record?.sessionId;
                        const subject = session?.subjectId;

                        return (
                            <div
                                key={request._id}
                                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                            >
                                <div className="flex flex-wrap items-start justify-between gap-3">

                                    <div>
                                        <h3 className="font-semibold text-slate-800">
                                            {subject?.name || "Unknown Subject"}
                                        </h3>

                                        <p className="mt-1 text-sm text-slate-500">
                                            {subject?.code || "—"}
                                            {" · "}
                                            Period {session?.period ?? "—"}
                                        </p>

                                        <p className="mt-1 text-xs text-slate-500">
                                            Request date:{" "}
                                            {formatDate(request.createdAt)}
                                        </p>
                                    </div>

                                    <span
                                        className={`rounded-full px-3 py-1.5 text-xs font-semibold ${statusStyle(request.status)}`}
                                    >
                                        {request.status}
                                    </span>

                                </div>

                                <div className="my-4 border-t border-slate-100" />

                                
<div className="grid gap-3 sm:grid-cols-2">

    <div>
        <p className="text-xs text-slate-500">
            Original attendance status
        </p>

        <p className="mt-1 font-semibold text-slate-800">
            {request.originalStatus || "Not recorded"}
        </p>
    </div>


                                    <div>
                                        <p className="text-xs text-slate-500">
                                            Requested status
                                        </p>

                                        <p className="mt-1 font-semibold text-indigo-700">
                                            {request.requestedStatus}
                                        </p>
                                    </div>

                                </div>

                                <div className="mt-4">
                                    <p className="text-xs text-slate-500">
                                        Your reason
                                    </p>

                                    <p className="mt-1 text-sm text-slate-700">
                                        {request.reason}
                                    </p>
                                </div>

                                {request.status !== "PENDING" && (
                                    <div className="mt-4 rounded-xl bg-slate-50 p-3">

                                        <div className="flex items-center gap-2">
                                            {request.status === "APPROVED" ? (
                                                <CheckCircle
                                                    size={17}
                                                    className="text-green-600"
                                                />
                                            ) : (
                                                <XCircle
                                                    size={17}
                                                    className="text-red-600"
                                                />
                                            )}

                                            <p className="text-sm font-semibold text-slate-700">
                                                Teacher's Review
                                            </p>
                                        </div>

                                        <p className="mt-2 text-sm text-slate-600">
                                            {request.reviewRemark ||
                                                "No review remark provided."}
                                        </p>

                                        <p className="mt-2 text-xs text-slate-500">
                                            Reviewed on:{" "}
                                            {formatDate(request.reviewedAt)}
                                        </p>

                                    </div>
                                )}
                            </div>
                        );
                    })
                ) : (
                    <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
                        <History
                            className="mx-auto mb-3 text-slate-300"
                            size={36}
                        />

                        <h3 className="font-semibold text-slate-700">
                            No correction requests yet
                        </h3>

                        <p className="mt-1 text-sm text-slate-500">
                            Your submitted correction requests will appear here.
                        </p>
                    </div>
                )}

            </section>
        </div>
    );
}
