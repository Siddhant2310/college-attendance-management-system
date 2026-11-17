
import { useEffect, useState } from "react";

import {
    Users,
    GraduationCap,
    UserRound,
    Building2,
    Layers,
    ClipboardCheck,
    CheckCircle2,
    XCircle,
    Clock,
    RefreshCw,
    AlertCircle
} from "lucide-react";

import api from "../../services/api";

const Dashboard = () => {
    const [overview, setOverview] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const fetchDashboard = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await api.get("/admin/dashboard/overview");

            setOverview(response.data.overview);

        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Unable to load dashboard data."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboard();
    }, []);

    const statCards = [
        {
            title: "Total Users",
            value: overview?.totalUsers ?? 0,
            icon: Users,
            color: "blue"
        },
        {
            title: "Total Students",
            value: overview?.totalStudents ?? 0,
            icon: GraduationCap,
            color: "violet"
        },
        {
            title: "Total Teachers",
            value: overview?.totalTeachers ?? 0,
            icon: UserRound,
            color: "emerald"
        },
        {
            title: "Total Branches",
            value: overview?.totalBranches ?? 0,
            icon: Building2,
            color: "orange"
        },
        {
            title: "Total Sections",
            value: overview?.totalSections ?? 0,
            icon: Layers,
            color: "pink"
        },
        {
            title: "Submitted Sessions",
            value: overview?.totalSubmittedSessions ?? 0,
            icon: ClipboardCheck,
            color: "cyan"
        }
    ];

    const colorClasses = {
        blue: "bg-blue-100 text-blue-600",
        violet: "bg-violet-100 text-violet-600",
        emerald: "bg-emerald-100 text-emerald-600",
        orange: "bg-orange-100 text-orange-600",
        pink: "bg-pink-100 text-pink-600",
        cyan: "bg-cyan-100 text-cyan-600"
    };

    if (loading) {
        return (
            <div className="flex min-h-[400px] items-center justify-center">
                <div className="text-center">
                    <RefreshCw
                        size={32}
                        className="mx-auto animate-spin text-violet-600"
                    />
                    <p className="mt-4 text-sm text-slate-500">
                        Loading admin dashboard...
                    </p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="rounded-2xl border border-red-200 bg-white p-8 text-center">
                <AlertCircle
                    size={40}
                    className="mx-auto text-red-500"
                />

                <h2 className="mt-4 text-lg font-bold text-slate-800">
                    Dashboard could not load
                </h2>

                <p className="mt-2 text-sm text-red-600">
                    {error}
                </p>

                <button
                    onClick={fetchDashboard}
                    className="mt-5 inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white hover:bg-violet-700"
                >
                    <RefreshCw size={16} />
                    Try Again
                </button>
            </div>
        );
    }

    const attendance = overview?.attendance || {
        totalRecords: 0,
        present: 0,
        absent: 0,
        notMarked: 0,
        attendancePercentage: 0
    };

    const percentage = Number(
        attendance.attendancePercentage || 0
    );

    return (
        <div className="space-y-8">

            {/* Welcome Section */}
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">

                <div>
                    <h1 className="text-2xl font-bold text-slate-900">
                        Dashboard Overview
                    </h1>

                    <p className="mt-1 text-sm text-slate-500">
                        Monitor your college attendance system.
                    </p>
                </div>

                <button
                    onClick={fetchDashboard}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                    <RefreshCw size={16} />
                    Refresh Data
                </button>

            </div>

            {/* Statistics Cards */}
            <section>

                <div className="mb-4">
                    <h2 className="text-lg font-bold text-slate-800">
                        System Statistics
                    </h2>

                    <p className="text-sm text-slate-500">
                        Current active system records
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">

                    {statCards.map((card) => {
                        const Icon = card.icon;

                        return (
                            <div
                                key={card.title}
                                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                            >
                                <div className="flex items-center justify-between">

                                    <div>
                                        <p className="text-sm font-medium text-slate-500">
                                            {card.title}
                                        </p>

                                        <h3 className="mt-3 text-3xl font-bold text-slate-900">
                                            {card.value.toLocaleString()}
                                        </h3>
                                    </div>

                                    <div className={`rounded-xl p-3 ${colorClasses[card.color]}`}>
                                        <Icon size={24} />
                                    </div>

                                </div>
                            </div>
                        );
                    })}

                </div>

            </section>

            {/* Attendance Overview */}
            <section>

                <div className="mb-4">
                    <h2 className="text-lg font-bold text-slate-800">
                        Attendance Overview
                    </h2>

                    <p className="text-sm text-slate-500">
                        Statistics calculated from submitted attendance sessions only.
                    </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

                    {/* Percentage */}
                    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">

                        <div>
                            <p className="text-sm font-medium text-slate-500">
                                Overall Attendance Percentage
                            </p>

                            <h3 className="mt-2 text-4xl font-bold text-violet-700">
                                {percentage.toFixed(2)}%
                            </h3>
                        </div>

                        <div className="rounded-xl bg-violet-50 p-4 text-violet-700">
                            <ClipboardCheck size={32} />
                        </div>

                    </div>

                    {/* Progress Bar */}
                    <div className="mt-6">

                        <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
                            <div
                                className="h-full rounded-full bg-violet-600 transition-all duration-500"
                                style={{
                                    width: `${Math.min(100, Math.max(0, percentage))}%`
                                }}
                            />
                        </div>

                        <div className="mt-2 flex justify-between text-xs text-slate-400">
                            <span>0%</span>
                            <span>100%</span>
                        </div>

                    </div>

                    {/* Attendance Counts */}
                    <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

                        <div className="rounded-xl bg-slate-50 p-4">
                            <p className="text-sm text-slate-500">
                                Total Records
                            </p>

                            <p className="mt-2 text-2xl font-bold text-slate-800">
                                {attendance.totalRecords}
                            </p>
                        </div>

                        <div className="rounded-xl bg-emerald-50 p-4">
                            <div className="flex items-center gap-2 text-emerald-700">
                                <CheckCircle2 size={17} />
                                <p className="text-sm font-medium">Present</p>
                            </div>

                            <p className="mt-2 text-2xl font-bold text-emerald-700">
                                {attendance.present}
                            </p>
                        </div>

                        <div className="rounded-xl bg-red-50 p-4">
                            <div className="flex items-center gap-2 text-red-700">
                                <XCircle size={17} />
                                <p className="text-sm font-medium">Absent</p>
                            </div>

                            <p className="mt-2 text-2xl font-bold text-red-700">
                                {attendance.absent}
                            </p>
                        </div>

                        <div className="rounded-xl bg-amber-50 p-4">
                            <div className="flex items-center gap-2 text-amber-700">
                                <Clock size={17} />
                                <p className="text-sm font-medium">Not Marked</p>
                            </div>

                            <p className="mt-2 text-2xl font-bold text-amber-700">
                                {attendance.notMarked}
                            </p>
                        </div>

                    </div>

                </div>

            </section>

        </div>
    );
};

export default Dashboard;
