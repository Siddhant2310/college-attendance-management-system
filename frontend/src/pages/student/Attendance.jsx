
import { useEffect, useState } from "react";
import {
    CalendarDays,
    RefreshCw,
    BookOpen,
    Filter
} from "lucide-react";

import studentService from "../../services/studentService";

export default function StudentAttendance() {
    const [attendance, setAttendance] = useState([]);
    const [filter, setFilter] = useState("ALL");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const fetchAttendance = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await studentService.getMyAttendance();

            if (response.success) {
                setAttendance(response.attendance || []);
            }
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Unable to load attendance records."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAttendance();
    }, []);

    const filteredAttendance = attendance.filter((record) => {
        if (filter === "ALL") return true;

        if (filter === "DRAFT") {
            return record.session?.status === "DRAFT";
        }

        if (filter === "SUBMITTED") {
            return record.session?.status === "SUBMITTED";
        }

        return record.status === filter;
    });

    const formatDate = (date) => {
        if (!date) return "—";

        return new Date(date).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric"
        });
    };

    const getStatusStyle = (status) => {
        const styles = {
            PRESENT: "bg-green-100 text-green-700",
            ABSENT: "bg-red-100 text-red-700",
            NOT_MARKED: "bg-amber-100 text-amber-700"
        };

        return styles[status] || "bg-slate-100 text-slate-600";
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

            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">
                        My Attendance
                    </h1>
                    <p className="mt-1 text-sm text-slate-500">
                        View your complete attendance records.
                    </p>
                </div>

                <button
                    onClick={fetchAttendance}
                    className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                    <RefreshCw size={16} />
                    Refresh
                </button>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white p-4">
                <Filter size={18} className="mr-1 text-slate-500" />

                {[
                    ["ALL", "All Records"],
                    ["SUBMITTED", "Finalized"],
                    ["DRAFT", "Pending"],
                    ["PRESENT", "Present"],
                    ["ABSENT", "Absent"]
                ].map(([value, label]) => (
                    <button
                        key={value}
                        onClick={() => setFilter(value)}
                        className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                            filter === value
                                ? "bg-indigo-600 text-white"
                                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {error && (
                <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700">
                    {error}
                    <button
                        onClick={fetchAttendance}
                        className="ml-2 font-semibold underline"
                    >
                        Retry
                    </button>
                </div>
            )}

            {/* Attendance Records */}
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-200 p-5">
                    <div className="flex items-center gap-2">
                        <CalendarDays className="text-indigo-600" size={20} />
                        <h2 className="font-bold text-slate-800">
                            Attendance Records
                        </h2>
                    </div>

                    <span className="text-sm text-slate-500">
                        {filteredAttendance.length} records
                    </span>
                </div>

                {filteredAttendance.length > 0 ? (
                    <div className="divide-y divide-slate-100">
                        {filteredAttendance.map((record) => (
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

                                        <p className="mt-1 text-xs text-slate-500">
                                            {formatDate(record.session?.date)}
                                            {" · "}
                                            Period {record.session?.period ?? "—"}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                                    <span
                                        className={`rounded-full px-3 py-1.5 text-xs font-semibold ${getStatusStyle(record.status)}`}
                                    >
                                        {record.status.replace("_", " ")}
                                    </span>

                                    <span
                                        className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                                            record.session?.status === "SUBMITTED"
                                                ? "bg-blue-100 text-blue-700"
                                                : "bg-amber-100 text-amber-700"
                                        }`}
                                    >
                                        {record.session?.status === "SUBMITTED"
                                            ? "FINALIZED"
                                            : "DRAFT"}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="p-10 text-center">
                        <CalendarDays
                            className="mx-auto mb-3 text-slate-300"
                            size={36}
                        />
                        <p className="font-medium text-slate-600">
                            No attendance records found.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
