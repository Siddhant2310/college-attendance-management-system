
import { useEffect, useState } from "react";
import {
    BookOpen,
    CalendarDays,
    CheckCircle2,
    XCircle,
    Clock,
    TrendingUp,
    RefreshCw
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import studentService from "../../services/studentService";

export default function StudentDashboard() {
    const { user } = useAuth();

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const fetchAttendance = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await studentService.getMyAttendance();

            if (response.success) {
                setData(response);
            } else {
                setError("Unable to load attendance.");
            }
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Failed to load attendance. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAttendance();
    }, []);

    const summary = data?.summary;
    const attendance = data?.attendance || [];

    const submittedRecords = attendance.filter(
        (record) => record.session?.status === "SUBMITTED"
    );

    const draftCount = attendance.filter(
        (record) => record.session?.status === "DRAFT"
    ).length;

    const formatDate = (date) => {
        if (!date) return "—";

        return new Date(date).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
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
            <div className="flex min-h-[60vh] items-center justify-center">
                <div className="text-center">
                    <RefreshCw className="mx-auto mb-3 animate-spin text-indigo-600" size={32} />
                    <p className="text-slate-500">Loading your dashboard...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
                <p className="mb-4 text-red-700">{error}</p>
                <button
                    onClick={fetchAttendance}
                    className="rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700"
                >
                    Try Again
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">

            {/* Welcome */}
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                    <p className="text-sm font-medium text-indigo-600">
                        STUDENT PORTAL
                    </p>

                    <h1 className="mt-1 text-2xl font-bold text-slate-800">
                        Welcome, {data?.student?.name || user?.name}!
                    </h1>

                    <p className="mt-1 text-sm text-slate-500">
                        Roll Number: {data?.student?.rollNumber || user?.loginId}
                    </p>
                </div>

                <button
                    onClick={fetchAttendance}
                    className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                    <RefreshCw size={16} />
                    Refresh
                </button>
            </div>

            {/* Attendance Percentage */}
            <div className="rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-600 p-6 text-white shadow-lg">
                <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
                    <div>
                        <p className="text-sm text-indigo-100">
                            Overall Attendance
                        </p>

                        <h2 className="mt-2 text-5xl font-bold">
                            {summary?.attendancePercentage ?? 0}%
                        </h2>

                        <p className="mt-2 text-sm text-indigo-100">
                            Based on submitted attendance sessions
                        </p>
                    </div>

                    <div className="flex h-28 w-28 items-center justify-center rounded-full border-8 border-white/30">
                        <TrendingUp size={42} />
                    </div>
                </div>

                <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/20">
                    <div
                        className="h-full rounded-full bg-white transition-all"
                        style={{
                            width: `${Math.min(summary?.attendancePercentage || 0, 100)}%`
                        }}
                    />
                </div>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

                <StatCard
                    title="Total Classes"
                    value={summary?.totalClasses ?? 0}
                    icon={<BookOpen size={22} />}
                    color="blue"
                />

                <StatCard
                    title="Present"
                    value={summary?.present ?? 0}
                    icon={<CheckCircle2 size={22} />}
                    color="green"
                />

                <StatCard
                    title="Absent"
                    value={summary?.absent ?? 0}
                    icon={<XCircle size={22} />}
                    color="red"
                />

                <StatCard
                    title="Pending Sessions"
                    value={draftCount}
                    icon={<Clock size={22} />}
                    color="amber"
                />

            </div>

            {/* Subject Wise Attendance */}
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-5 flex items-center gap-2">
                    <BookOpen className="text-indigo-600" size={21} />
                    <h2 className="text-lg font-bold text-slate-800">
                        Subject-wise Attendance
                    </h2>
                </div>

                {summary?.subjectWise?.length > 0 ? (
                    <div className="space-y-5">
                        {summary.subjectWise.map((subject) => (
                            <div key={subject.subjectId}>
                                <div className="mb-2 flex flex-wrap justify-between gap-2">
                                    <div>
                                        <p className="font-semibold text-slate-800">
                                            {subject.subjectName}
                                        </p>
                                        <p className="text-xs text-slate-500">
                                            {subject.subjectCode}
                                        </p>
                                    </div>

                                    <p className="font-bold text-indigo-600">
                                        {subject.percentage}%
                                    </p>
                                </div>

                                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                                    <div
                                        className="h-full rounded-full bg-indigo-600"
                                        style={{
                                            width: `${Math.min(subject.percentage, 100)}%`
                                        }}
                                    />
                                </div>

                                <p className="mt-2 text-xs text-slate-500">
                                    Attended: {subject.attended} / {subject.totalClasses}
                                    {" · "}
                                    Absent: {subject.absent}
                                </p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="py-6 text-center text-sm text-slate-500">
                        No submitted attendance available yet.
                    </p>
                )}
            </section>

            {/* Recent Attendance */}
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-5 flex items-center gap-2">
                    <CalendarDays className="text-indigo-600" size={21} />
                    <h2 className="text-lg font-bold text-slate-800">
                        Recent Attendance
                    </h2>
                </div>

                {submittedRecords.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[550px] text-left text-sm">
                            <thead>
                                <tr className="border-b border-slate-200 text-xs text-slate-500">
                                    <th className="px-3 py-3">Subject</th>
                                    <th className="px-3 py-3">Date</th>
                                    <th className="px-3 py-3">Period</th>
                                    <th className="px-3 py-3">Time Marked</th>
                                    <th className="px-3 py-3">Status</th>
                                </tr>
                            </thead>

                            <tbody>
                                {submittedRecords.slice(0, 5).map((record) => (
                                    <tr
                                        key={record.recordId}
                                        className="border-b border-slate-100 last:border-0"
                                    >
                                        <td className="px-3 py-4 font-medium text-slate-800">
                                            {record.session?.subjectId?.code || "—"}
                                        </td>

                                        <td className="px-3 py-4 text-slate-600">
                                            {formatDate(record.session?.date)}
                                        </td>

                                        <td className="px-3 py-4 text-slate-600">
                                            {record.session?.period ?? "—"}
                                        </td>

                                        <td className="px-3 py-4 text-slate-600">
                                            {formatTime(record.markedAt)}
                                        </td>

                                        <td className="px-3 py-4">
                                            <StatusBadge status={record.status} />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className="py-6 text-center text-sm text-slate-500">
                        No finalized attendance records yet.
                    </p>
                )}
            </section>

            {/* Pending Notice */}
            {draftCount > 0 && (
                <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
                    <Clock className="mt-0.5 shrink-0 text-amber-600" size={20} />

                    <div>
                        <p className="font-semibold text-amber-800">
                            Attendance awaiting submission
                        </p>
                        <p className="mt-1 text-sm text-amber-700">
                            {draftCount} attendance session(s) are still in draft.
                            These will not affect your attendance percentage until submitted by your teacher.
                        </p>
                    </div>
                </div>
            )}

        </div>
    );
}

function StatCard({ title, value, icon, color }) {
    const styles = {
        blue: "bg-blue-50 text-blue-600",
        green: "bg-green-50 text-green-600",
        red: "bg-red-50 text-red-600",
        amber: "bg-amber-50 text-amber-600"
    };

    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
                <p className="text-sm text-slate-500">{title}</p>

                <div className={`rounded-xl p-2.5 ${styles[color]}`}>
                    {icon}
                </div>
            </div>

            <p className="mt-4 text-3xl font-bold text-slate-800">
                {value}
            </p>
        </div>
    );
}

function StatusBadge({ status }) {
    const isPresent = status === "PRESENT";

    return (
        <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                isPresent
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
            }`}
        >
            {status}
        </span>
    );
}
