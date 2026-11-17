
import { useState } from "react";

import {
    LayoutDashboard,
    Building2,
    GraduationCap,
    Users,
    BookOpen,
    ClipboardList,
    FileBarChart,
    ScrollText,
    LogOut,
    Menu,
    X,
    ChevronRight,
    ShieldCheck
} from "lucide-react";

import {
    NavLink,
    Outlet,
    useLocation,
    useNavigate
} from "react-router-dom";

import { useAuth } from "../context/AuthContext";

const navigation = [
    {
        name: "Dashboard",
        path: "/admin/dashboard",
        icon: LayoutDashboard
    },
    {
        name: "Branches & Sections",
        path: "/admin/branches-sections",
        icon: Building2
    },
    {
        name: "Students",
        path: "/admin/students",
        icon: GraduationCap
    },
    {
        name: "Teachers",
        path: "/admin/teachers",
        icon: Users
    },
    {
        name: "Subjects",
        path: "/admin/subjects",
        icon: BookOpen
    },
    {
        name: "Teacher Assignments",
        path: "/admin/teacher-assignments",
        icon: ClipboardList
    },
    {
        name: "Attendance Reports",
        path: "/admin/reports",
        icon: FileBarChart
    },
    {
        name: "Audit Logs",
        path: "/admin/audit-logs",
        icon: ScrollText
    }
];

const AdminLayout = () => {
    const { user, logout } = useAuth();

    const navigate = useNavigate();
    const location = useLocation();

    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const currentPage = navigation.find(
        (item) => item.path === location.pathname
    );

    const handleLogout = () => {
        logout();
        navigate("/login", { replace: true });
    };

    const closeMobileMenu = () => {
        setMobileMenuOpen(false);
    };

    const SidebarContent = () => (
        <div className="flex h-full flex-col">

            {/* Brand */}
            <div className="flex h-20 items-center gap-3 border-b border-slate-800 px-6">

                <div className="rounded-xl bg-violet-600 p-2.5 text-white">
                    <ShieldCheck size={25} />
                </div>

                <div>
                    <h1 className="text-lg font-bold text-white">
                        Attendance
                    </h1>

                    <p className="text-xs text-slate-400">
                        Administration Portal
                    </p>
                </div>

            </div>

            {/* Navigation */}
            <div className="flex-1 px-4 py-6">

                <p className="mb-4 px-3 text-xs font-semibold uppercase tracking-widest text-slate-500">
                    Administration
                </p>

                <nav className="space-y-2">

                    {navigation.map((item) => {
                        const Icon = item.icon;

                        return (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                onClick={closeMobileMenu}
                                className={({ isActive }) =>
                                    `flex items-center justify-between rounded-xl px-3 py-3 transition ${
                                        isActive
                                            ? "bg-violet-600 text-white shadow-lg shadow-violet-900/30"
                                            : "text-slate-400 hover:bg-slate-800 hover:text-white"
                                    }`
                                }
                            >
                                {({ isActive }) => (
                                    <>
                                        <div className="flex items-center gap-3">
                                            <Icon size={19} />

                                            <span className="text-sm font-medium">
                                                {item.name}
                                            </span>
                                        </div>

                                        {isActive && (
                                            <ChevronRight size={17} />
                                        )}
                                    </>
                                )}
                            </NavLink>
                        );
                    })}

                </nav>

            </div>

            {/* Admin Information */}
            <div className="border-t border-slate-800 p-4">

                <div className="mb-3 flex items-center gap-3 rounded-xl bg-slate-800 p-3">

                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-600 font-bold text-white">
                        {user?.name?.charAt(0)?.toUpperCase() || "A"}
                    </div>

                    <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-white">
                            {user?.name || "Administrator"}
                        </p>

                        <p className="truncate text-xs text-slate-400">
                            {user?.loginId || "Admin"}
                        </p>
                    </div>

                </div>

                <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-slate-400 transition hover:bg-slate-800 hover:text-red-400"
                >
                    <LogOut size={19} />

                    <span className="text-sm font-medium">
                        Logout
                    </span>
                </button>

            </div>

        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50">

            {/* Desktop Sidebar */}
            <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 bg-slate-950 lg:block">
                <SidebarContent />
            </aside>

            {/* Mobile Overlay */}
            {mobileMenuOpen && (
                <div
                    className="fixed inset-0 z-50 bg-black/50 lg:hidden"
                    onClick={closeMobileMenu}
                />
            )}

            {/* Mobile Sidebar */}
            <aside
                className={`fixed inset-y-0 left-0 z-50 w-72 transform bg-slate-950 transition-transform duration-300 lg:hidden ${
                    mobileMenuOpen
                        ? "translate-x-0"
                        : "-translate-x-full"
                }`}
            >

                <div className="absolute right-4 top-5">
                    <button
                        onClick={closeMobileMenu}
                        className="text-slate-400 hover:text-white"
                        aria-label="Close navigation menu"
                    >
                        <X size={22} />
                    </button>
                </div>

                <SidebarContent />

            </aside>

            {/* Main Content */}
            <div className="lg:ml-72">

                {/* Top Navbar */}
                <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-8">

                    <div className="flex items-center gap-3">

                        <button
                            onClick={() => setMobileMenuOpen(true)}
                            className="rounded-lg p-2 hover:bg-slate-100 lg:hidden"
                            aria-label="Open navigation menu"
                        >
                            <Menu size={23} />
                        </button>

                        <div>
                            <h2 className="font-bold text-slate-900">
                                {currentPage?.name || "Admin Portal"}
                            </h2>

                            <p className="mt-1 text-xs text-slate-500">
                                College Attendance Management System
                            </p>
                        </div>

                    </div>

                    <div className="flex items-center gap-3">

                        <div className="hidden text-right sm:block">
                            <p className="text-sm font-semibold text-slate-800">
                                {user?.name || "Administrator"}
                            </p>

                            <p className="text-xs text-slate-500">
                                System Administrator
                            </p>
                        </div>

                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-100 font-bold text-violet-700">
                            {user?.name?.charAt(0)?.toUpperCase() || "A"}
                        </div>

                    </div>

                </header>

                {/* Page Content */}
                <main className="mx-auto max-w-[1600px] p-4 sm:p-6 lg:p-8">
                    <Outlet />
                </main>

                {/* Footer */}
                <footer className="border-t border-slate-200 px-6 py-5 text-center text-xs text-slate-400">
                    Attendance Management System
                </footer>

            </div>

        </div>
    );
};

export default AdminLayout;
