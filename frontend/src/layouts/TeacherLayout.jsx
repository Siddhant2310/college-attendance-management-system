
import { useState } from "react";
import {
    LayoutDashboard,
    ClipboardCheck,
    History,
    MessageSquareWarning,
    UserRound,
    LogOut,
    GraduationCap,
    Menu,
    X,
    ChevronRight
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
        path: "/teacher/dashboard",
        icon: LayoutDashboard
    },
    {
        name: "Take Attendance",
        path: "/teacher/take-attendance",
        icon: ClipboardCheck
    },
    {
        name: "Attendance History",
        path: "/teacher/history",
        icon: History
    },
    {
        name: "Correction Requests",
        path: "/teacher/corrections",
        icon: MessageSquareWarning
    },
    {
        name: "My Profile",
        path: "/teacher/profile",
        icon: UserRound
    }
];

const TeacherLayout = () => {
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
        <div className="flex flex-col h-full">

            {/* Brand */}
            <div className="h-20 px-6 flex items-center gap-3 border-b border-slate-800">
                <div className="bg-blue-600 p-2.5 rounded-xl text-white">
                    <GraduationCap size={25} />
                </div>

                <div>
                    <h1 className="text-white font-bold text-lg">
                        Attendance
                    </h1>
                    <p className="text-slate-400 text-xs">
                        Teacher Portal
                    </p>
                </div>
            </div>

            {/* Navigation */}
            <div className="flex-1 px-4 py-6">

                <p className="text-xs uppercase tracking-widest text-slate-500 font-semibold px-3 mb-4">
                    Main Menu
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
                                    `flex items-center justify-between px-3 py-3 rounded-xl transition ${
                                        isActive
                                            ? "bg-blue-600 text-white shadow-lg shadow-blue-900/30"
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

            {/* Teacher information */}
            <div className="p-4 border-t border-slate-800">

                <div className="flex items-center gap-3 p-3 mb-3 rounded-xl bg-slate-800">

                    <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
                        {user?.name?.charAt(0)?.toUpperCase() || "T"}
                    </div>

                    <div className="min-w-0">
                        <p className="text-white text-sm font-semibold truncate">
                            {user?.name || "Teacher"}
                        </p>

                        <p className="text-slate-400 text-xs truncate">
                            {user?.loginId || "Faculty Member"}
                        </p>
                    </div>
                </div>

                <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3 py-3 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-xl transition"
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
            <aside className="hidden lg:block fixed inset-y-0 left-0 w-72 bg-slate-950 z-40">
                <SidebarContent />
            </aside>

            {/* Mobile Sidebar Overlay */}
            {mobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-50 lg:hidden"
                    onClick={closeMobileMenu}
                />
            )}

            {/* Mobile Sidebar */}
            <aside
                className={`fixed inset-y-0 left-0 w-72 bg-slate-950 z-50 transform transition-transform duration-300 lg:hidden ${
                    mobileMenuOpen
                        ? "translate-x-0"
                        : "-translate-x-full"
                }`}
            >
                <div className="absolute top-5 right-4">
                    <button
                        onClick={closeMobileMenu}
                        className="text-slate-400 hover:text-white"
                    >
                        <X size={22} />
                    </button>
                </div>

                <SidebarContent />
            </aside>

            {/* Main Content */}
            <div className="lg:ml-72">

                {/* Top Navbar */}
                <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-8 sticky top-0 z-30">

                    <div className="flex items-center gap-3">

                        <button
                            onClick={() => setMobileMenuOpen(true)}
                            className="lg:hidden p-2 rounded-lg hover:bg-slate-100"
                            aria-label="Open navigation menu"
                        >
                            <Menu size={23} />
                        </button>

                        <div>
                            <h2 className="font-bold text-slate-900">
                                {currentPage?.name || "Teacher Portal"}
                            </h2>

                            <p className="text-xs text-slate-500 mt-1">
                                Attendance Management System
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">

                        <div className="hidden sm:block text-right">
                            <p className="text-sm font-semibold text-slate-800">
                                {user?.name || "Teacher"}
                            </p>

                            <p className="text-xs text-slate-500">
                                Faculty
                            </p>
                        </div>

                        <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                            {user?.name?.charAt(0)?.toUpperCase() || "T"}
                        </div>

                    </div>
                </header>

                {/* Page Content */}
                <main className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto">
                    <Outlet />
                </main>

                {/* Footer */}
                <footer className="px-6 py-5 border-t border-slate-200 text-center text-xs text-slate-400">
                    Attendance Management System
                </footer>

            </div>
        </div>
    );
};

export default TeacherLayout;
