
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
    GraduationCap,
    LayoutDashboard,
    ClipboardCheck,
    History,
    MessageSquareWarning,
    UserRound,
    LogOut,
    Menu,
    X
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";

export default function StudentLayout() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const navigation = [
        {
            name: "Dashboard",
            path: "/student/dashboard",
            icon: LayoutDashboard
        },
        {
            name: "My Attendance",
            path: "/student/attendance",
            icon: ClipboardCheck
        },
        {
            name: "Attendance History",
            path: "/student/history",
            icon: History
        },
        {
            name: "Correction Requests",
            path: "/student/corrections",
            icon: MessageSquareWarning
        },
        {
            name: "My Profile",
            path: "/student/profile",
            icon: UserRound
        }
    ];

    const handleLogout = () => {
        logout();
        navigate("/student/login", { replace: true });
    };

    return (
        <div className="min-h-screen bg-slate-100">

            {/* Mobile Header */}
            <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4 lg:hidden">
                <div className="flex items-center gap-2">
                    <GraduationCap className="text-blue-700" size={28} />
                    <span className="font-bold text-slate-800">
                        Student Portal
                    </span>
                </div>

                <button
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
                    aria-label="Toggle navigation"
                >
                    {sidebarOpen ? <X size={23} /> : <Menu size={23} />}
                </button>
            </header>

            {/* Mobile Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-30 bg-black/40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-slate-200 bg-white transition-transform duration-300 lg:translate-x-0 ${
                    sidebarOpen ? "translate-x-0" : "-translate-x-full"
                }`}
            >
                {/* Logo */}
                <div className="flex h-20 items-center gap-3 border-b border-slate-100 px-6">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-700 text-white">
                        <GraduationCap size={27} />
                    </div>

                    <div>
                        <h1 className="font-bold text-slate-800">
                            Attendance
                        </h1>
                        <p className="text-xs text-slate-500">
                            Student Portal
                        </p>
                    </div>
                </div>

                {/* Student Information */}
                <div className="mx-4 mt-6 rounded-xl bg-blue-50 p-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-700 font-bold text-white">
                            {user?.name?.charAt(0)?.toUpperCase() || "S"}
                        </div>

                        <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-slate-800">
                                {user?.name}
                            </p>
                            <p className="truncate text-xs text-slate-500">
                                {user?.loginId}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 space-y-1 overflow-y-auto px-4 py-7">
                    <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Main Menu
                    </p>

                    {navigation.map((item) => {
                        const Icon = item.icon;

                        return (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                end
                                onClick={() => setSidebarOpen(false)}
                                className={({ isActive }) =>
                                    `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
                                        isActive
                                            ? "bg-blue-700 text-white shadow-md shadow-blue-200"
                                            : "text-slate-600 hover:bg-slate-100 hover:text-blue-700"
                                    }`
                                }
                            >
                                <Icon size={19} />
                                {item.name}
                            </NavLink>
                        );
                    })}
                </nav>

                {/* Logout */}
                <div className="border-t border-slate-100 p-4">
                    <button
                        onClick={handleLogout}
                        className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-red-600 transition hover:bg-red-50"
                    >
                        <LogOut size={19} />
                        Logout
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="min-h-screen lg:ml-72">

                {/* Desktop Header */}
                <header className="hidden h-20 items-center justify-between border-b border-slate-200 bg-white px-8 lg:flex">
                    <div>
                        <h2 className="text-lg font-semibold text-slate-800">
                            College Attendance Management
                        </h2>
                        <p className="text-xs text-slate-500">
                            Student Portal
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="text-right">
                            <p className="text-sm font-semibold text-slate-800">
                                {user?.name}
                            </p>
                            <p className="text-xs text-slate-500">
                                Student
                            </p>
                        </div>

                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700">
                            {user?.name?.charAt(0)?.toUpperCase() || "S"}
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <div className="p-5 sm:p-7 lg:p-8">
                    <Outlet />
                </div>

            </main>
        </div>
    );
}
