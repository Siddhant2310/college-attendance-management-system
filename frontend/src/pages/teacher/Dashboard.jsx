
import { useEffect, useState } from "react";
import {
    BookOpen,
    ClipboardCheck,
    Clock,
    Users,
    ArrowRight,
    CalendarDays,
    RefreshCw
} from "lucide-react";
import { Link } from "react-router-dom";

import teacherService from "../../services/teacherService";
import { useAuth } from "../../context/AuthContext";

const Dashboard = () => {
    const { user } = useAuth();

    const [assignments, setAssignments] = useState([]);
    const [sessions, setSessions] = useState([]);
    const [correctionCount, setCorrectionCount] = useState(0);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Load dashboard data
    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            setError("");

            const [
                assignmentResponse,
                sessionResponse,
                correctionResponse
            ] = await Promise.all([
                teacherService.getMyAssignments(),
                teacherService.getAttendanceSessions({ page: 1, limit: 5 }),
                teacherService.getCorrectionRequests()
            ]);

            setAssignments(assignmentResponse.assignments || []);
            setSessions(sessionResponse.sessions || []);
            setCorrectionCount(
                correctionResponse.totalRequests ??
                correctionResponse.requests?.length ??
                0
            );

        } catch (err) {
            setError(
                err.response?.data?.message ||
                err.message ||
                "Unable to load dashboard data."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const draftSessions = sessions.filter(
        (session) => session.status === "DRAFT"
    ).length;

    const submittedSessions = sessions.filter(
        (session) => session.status === "SUBMITTED"
    ).length;

    const stats = [
        {
            title: "Total Assignments",
            value: assignments.length,
            icon: BookOpen,
            color: "blue"
        },
        {
            title: "Recent Sessions",
            value: sessions.length,
            icon: ClipboardCheck,
            color: "purple"
        },
        {
            title: "Draft Sessions",
            value: draftSessions,
            icon: Clock,
            color: "amber"
        },
        {
            title: "Pending Corrections",
            value: correctionCount,
            icon: Users,
            color: "green"
        }
    ];

    const colorClasses = {
        blue: "bg-blue-50 text-blue-600",
        purple: "bg-purple-50 text-purple-600",
        amber: "bg-amber-50 text-amber-600",
        green: "bg-green-50 text-green-600"
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric"
        });
    };

    const getStatusStyle = (status) => {
        if (status === "SUBMITTED") {
            return "bg-green-100 text-green-700";
        }

        return "bg-amber-100 text-amber-700";
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-96">
                <p className="text-slate-500">Loading dashboard...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8">

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <p className="text-sm text-slate-500">
                        Teacher Portal / Dashboard
                    </p>

                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">
                        Welcome, {user?.name || "Teacher"}!
                    </h1>

                    <p className="text-slate-500 mt-2">
                        Here's an overview of your teaching activity.
                    </p>
                </div>

                <button
                    onClick={fetchDashboardData}
                    className="flex items-center justify-center gap-2 border border-slate-200 bg-white px-4 py-2.5 rounded-xl hover:bg-slate-50"
                >
                    <RefreshCw size={17} />
                    Refresh
                </button>
            </div>

            {/* Error */}
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl">
                    {error}
                    <button
                        onClick={fetchDashboardData}
                        className="ml-3 underline font-semibold"
                    >
                        Retry
                    </button>
                </div>
            )}

            {/* Statistics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">

                {stats.map((stat) => {
                    const Icon = stat.icon;

                    return (
                        <div
                            key={stat.title}
                            className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm"
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-slate-500">
                                        {stat.title}
                                    </p>

                                    <h2 className="text-3xl font-bold mt-2">
                                        {stat.value}
                                    </h2>
                                </div>

                                <div className={`p-3 rounded-xl ${colorClasses[stat.color]}`}>
                                    <Icon size={23} />
                                </div>
                            </div>
                        </div>
                    );
                })}

            </div>

            {/* Quick Actions */}
            <div>
                <h2 className="text-lg font-bold text-slate-900 mb-4">
                    Quick Actions
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                    <Link
                        to="/teacher/take-attendance"
                        className="group bg-blue-600 text-white p-6 rounded-2xl hover:bg-blue-700 transition"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <ClipboardCheck size={28} />
                                <h3 className="text-xl font-bold mt-4">
                                    Take Attendance
                                </h3>
                                <p className="text-blue-100 text-sm mt-2">
                                    Create a session and mark student attendance.
                                </p>
                            </div>

                            <ArrowRight className="group-hover:translate-x-1 transition" />
                        </div>
                    </Link>

                    <Link
                        to="/teacher/history"
                        className="group bg-white border border-slate-200 p-6 rounded-2xl hover:border-blue-300 transition"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <CalendarDays size={28} className="text-blue-600" />
                                <h3 className="text-xl font-bold mt-4">
                                    Attendance History
                                </h3>
                                <p className="text-slate-500 text-sm mt-2">
                                    View your previous attendance sessions.
                                </p>
                            </div>

                            <ArrowRight className="text-slate-400 group-hover:translate-x-1 transition" />
                        </div>
                    </Link>

                </div>
            </div>

            {/* Assignments */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6">

                <div className="flex items-center justify-between mb-5">
                    <div>
                        <h2 className="text-lg font-bold">
                            My Assignments
                        </h2>
                        <p className="text-sm text-slate-500 mt-1">
                            Subjects and sections assigned to you.
                        </p>
                    </div>

                    <BookOpen className="text-blue-600" />
                </div>

                {assignments.length === 0 ? (
                    <p className="text-slate-500 text-sm">
                        No active assignments found.
                    </p>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                        {assignments.map((assignment) => (
                            <div
                                key={assignment._id}
                                className="border border-slate-200 rounded-xl p-5"
                            >
                                <h3 className="font-bold text-slate-900">
                                    {assignment.subjectId?.name}
                                </h3>

                                <p className="text-sm text-blue-600 font-medium mt-1">
                                    {assignment.subjectId?.code}
                                </p>

                                <div className="mt-4 space-y-2 text-sm text-slate-600">
                                    <p>
                                        Branch: {assignment.subjectId?.branchId?.code}
                                    </p>

                                    <p>
                                        Semester: {assignment.subjectId?.semester}
                                    </p>

                                    <p>
                                        Section: {assignment.sectionId?.name}
                                    </p>

                                    <p>
                                        Academic Year: {assignment.academicYear}
                                    </p>
                                </div>
                            </div>
                        ))}

                    </div>
                )}
            </div>

            {/* Recent Sessions */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6">

                <div className="flex items-center justify-between mb-5">
                    <div>
                        <h2 className="text-lg font-bold">
                            Recent Attendance Sessions
                        </h2>

                        <p className="text-sm text-slate-500 mt-1">
                            Your latest attendance activity.
                        </p>
                    </div>

                    <Link
                        to="/teacher/history"
                        className="text-sm font-semibold text-blue-600 hover:text-blue-700"
                    >
                        View All
                    </Link>
                </div>

                {sessions.length === 0 ? (
                    <p className="text-slate-500 text-sm">
                        No attendance sessions created yet.
                    </p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">

                            <thead>
                                <tr className="border-b border-slate-200 text-slate-500">
                                    <th className="py-3 pr-4">Subject</th>
                                    <th className="py-3 pr-4">Section</th>
                                    <th className="py-3 pr-4">Period</th>
                                    <th className="py-3 pr-4">Date</th>
                                    <th className="py-3">Status</th>
                                </tr>
                            </thead>

                            <tbody>
                                {sessions.map((session) => (
                                    <tr
                                        key={session._id}
                                        className="border-b border-slate-100 last:border-0"
                                    >
                                        <td className="py-4 pr-4 font-medium">
                                            {session.subjectId?.name}
                                        </td>

                                        <td className="py-4 pr-4">
                                            {session.sectionId?.name}
                                        </td>

                                        <td className="py-4 pr-4">
                                            {session.period}
                                        </td>

                                        <td className="py-4 pr-4 whitespace-nowrap">
                                            {formatDate(session.date)}
                                        </td>

                                        <td className="py-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusStyle(session.status)}`}>
                                                {session.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>

                        </table>
                    </div>
                )}
            </div>

        </div>
    );
};

export default Dashboard;
