
import { useEffect, useState } from "react";
import {
    User,
    Mail,
    ShieldCheck,
    BadgeCheck,
    RefreshCw,
    AlertCircle,
    CalendarDays
} from "lucide-react";
import teacherService from "../../services/teacherService";

export default function Profile() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const fetchProfile = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await teacherService.getProfile();

            setUser(response.user || response.data?.user || null);
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Unable to load profile information."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProfile();
    }, []);

    if (loading) {
        return (
            <div className="flex min-h-64 items-center justify-center text-slate-500">
                <RefreshCw size={22} className="mr-2 animate-spin" />
                Loading profile...
            </div>
        );
    }

    if (error || !user) {
        return (
            <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-700">
                <div className="flex items-center gap-2">
                    <AlertCircle size={20} />
                    {error || "Profile information not found."}
                </div>

                <button
                    onClick={fetchProfile}
                    className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                >
                    Try Again
                </button>
            </div>
        );
    }

    const profileItems = [
        {
            label: "Full Name",
            value: user.name || "Not available",
            icon: User
        },
        {
            label: "Employee ID / Login ID",
            value: user.loginId || user.employeeId || "Not available",
            icon: BadgeCheck
        },
        {
            label: "Email Address",
            value: user.email || "Not provided",
            icon: Mail
        },
        {
            label: "Account Role",
            value: user.role || "TEACHER",
            icon: ShieldCheck
        },
        {
            label: "Account Status",
            value: user.isActive === false ? "Inactive" : "Active",
            icon: BadgeCheck
        },
        {
            label: "Password Setup",
            value: user.isFirstLogin ? "Password change required" : "Completed",
            icon: ShieldCheck
        }
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">
                        My Profile
                    </h1>
                    <p className="mt-1 text-sm text-slate-500">
                        View your account and faculty information.
                    </p>
                </div>

                <button
                    onClick={fetchProfile}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
                >
                    <RefreshCw size={16} />
                    Refresh
                </button>
            </div>

            {/* Profile Banner */}
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="h-28 bg-gradient-to-r from-blue-700 to-indigo-600" />

                <div className="px-6 pb-6">
                    <div className="-mt-12 flex flex-col gap-4 sm:flex-row sm:items-end">
                        <div className="flex h-24 w-24 items-center justify-center rounded-2xl border-4 border-white bg-blue-100 text-3xl font-bold text-blue-700 shadow-sm">
                            {user.name?.charAt(0)?.toUpperCase() || "T"}
                        </div>

                        <div className="pb-1">
                            <h2 className="text-xl font-bold text-slate-800">
                                {user.name || "Faculty Member"}
                            </h2>
                            <p className="mt-1 text-sm text-slate-500">
                                Faculty · {user.loginId || "Teacher Account"}
                            </p>
                        </div>

                        <div className="sm:ml-auto sm:pb-2">
                            <span className="inline-flex items-center gap-2 rounded-full bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700">
                                <span className="h-2 w-2 rounded-full bg-green-500" />
                                {user.isActive === false ? "Inactive" : "Active Account"}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Information */}
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 p-5">
                    <h3 className="text-lg font-semibold text-slate-800">
                        Account Information
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                        Information associated with your login account.
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-2">
                    {profileItems.map((item) => {
                        const Icon = item.icon;

                        return (
                            <div
                                key={item.label}
                                className="flex items-start gap-3 rounded-lg border border-slate-100 p-4"
                            >
                                <div className="rounded-lg bg-slate-100 p-2.5 text-slate-600">
                                    <Icon size={19} />
                                </div>

                                <div className="min-w-0">
                                    <p className="text-xs font-medium text-slate-500">
                                        {item.label}
                                    </p>
                                    <p className="mt-1 break-words text-sm font-semibold text-slate-800">
                                        {item.value}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4">
                <CalendarDays size={20} className="mt-0.5 text-blue-600" />
                <div>
                    <p className="text-sm font-semibold text-blue-800">
                        Profile information
                    </p>
                    <p className="mt-1 text-sm text-blue-700">
                        Your account information is managed by the administrator.
                        Contact the administrator if any details need to be updated.
                    </p>
                </div>
            </div>
        </div>
    );
}
