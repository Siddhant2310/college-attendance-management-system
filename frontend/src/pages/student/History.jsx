
import { useEffect, useState } from "react";
import {
    History as HistoryIcon,
    CalendarDays,
    RefreshCw,
    BookOpen
} from "lucide-react";

import studentService from "../../services/studentService";

export default function StudentHistory() {
    const [attendance, setAttendance] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const fetchHistory = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await studentService.getMyAttendance();

            if (response.success) {
                const submittedRecords = (response.attendance || []).filter(
                    (record) => record.session?.status === "SUBMITTED"
                );

                setAttendance(submittedRecords);
            }
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
        fetchHistory();
    }, []);

    const formatDate = (date) => {
        if (!date) return "—";

        return new Date(date).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "long",
            year: "numeric"
        });
    };

    const formatTime = (date) => {
        if (!date) return "—";

        return new Date(date).toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit"
        });
    };

    if (loading) {
        return (
            <div className="flex min-h-[50vh] items-center justify-center">
                <RefreshCw className="animate-spin text-indigo-600" size={30} />
            </div>
        );
    }

    return (
        <div className="space-y-6">

            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">
                        Attendance History
                    </h1>

                    <p className="mt-1 text-sm text-slate-500">
                        View your finalized attendance history.
                    </p>
                </div>

                <button
                    onClick={fetchHistory}
                    className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                    <RefreshCw size={16} />
                    Refresh
                </button>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <p className="text-sm text-slate-500">
                        Finalized Classes
                    </p>

                    <h2 className="mt-2 text-3xl font-bold text-slate-800">
                        {attendance.length}
                    </h2>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <p className="text-sm text-slate-500">
                        Present Classes
                    </p>

                    <h2 className="mt-2 text-3xl font-bold text-green-600">
                        {attendance.filter(
                            (record) => record.status === "PRESENT"
                        ).length}
                    </h2>
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700">
                    {error}
                    <button
                        onClick={fetchHistory}
                        className="ml-2 font-semibold underline"
                    >
                        Retry
                    </button>
                </div>
            )}

            {/* History */}
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

                <div className="flex items-center justify-between border-b border-slate-200 p-5">
                    <div className="flex items-center gap-2">
                        <HistoryIcon className="text-indigo-600" size={21} />

                        <h2 className="font-bold text-slate-800">
                            Finalized Records
                        </h2>
                    </div>

                    <span className="text-sm text-slate-500">
                        {attendance.length} records
                    </span>
                </div>

                {attendance.length > 0 ? (
                    <div className="divide-y divide-slate-100">

                        {attendance.map((record) => (
                            <div
                                key={record.recordId}
                                className="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center"
                            >
                                <div className="flex items-start gap-3">
                                    <div className="rounded-xl bg-indigo-50 p-3 text-indigo-600">
                                        <BookOpen size={21} />
                                    </div>

                                    <div>
                                        <h3 className="font-semibold text-slate-800">
                                            {record.session?.subjectId?.name || "Unknown Subject"}
                                        </h3>

                                        <p className="mt-1 text-sm text-slate-500">
                                            {record.session?.subjectId?.code || "—"}
                                        </p>

                                        <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-500">
                                            <span className="flex items-center gap-1">
                                                <CalendarDays size={13} />
                                                {formatDate(record.session?.date)}
                                            </span>

                                            <span>
                                                Period {record.session?.period ?? "—"}
                                            </span>

                                            <span>
                                                Marked at {formatTime(record.markedAt)}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <span
                                    className={`w-fit rounded-full px-4 py-2 text-xs font-semibold ${
                                        record.status === "PRESENT"
                                            ? "bg-green-100 text-green-700"
                                            : "bg-red-100 text-red-700"
                                    }`}
                                >
                                    {record.status}
                                </span>
                            </div>
                        ))}

                    </div>
                ) : (
                    <div className="p-10 text-center">
                        <HistoryIcon
                            className="mx-auto mb-3 text-slate-300"
                            size={38}
                        />

                        <p className="font-medium text-slate-600">
                            No finalized attendance history yet.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
