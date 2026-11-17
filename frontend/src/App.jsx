
import {
    Suspense,
    lazy,
    useState,
    useEffect
} from "react";

import {
    BrowserRouter,
    Routes,
    Route,
    Navigate,
    Outlet,
    useNavigate,
    useLocation
} from "react-router-dom";

import { useAuth } from "./context/AuthContext";

// ==========================================
// LAZY LOADED PAGES
// ==========================================

// Login Pages
const Login = lazy(() => import("./pages/Login"));
const StudentLogin = lazy(() => import("./pages/student/StudentLogin"));

// Admin Pages
const AdminDashboard = lazy(() => import("./pages/admin/Dashboard"));
const BranchesSections = lazy(() => import("./pages/admin/BranchesSections"));
const Students = lazy(() => import("./pages/admin/Students"));
const Teachers = lazy(() => import("./pages/admin/Teachers"));
const TeacherAssignments = lazy(() => import("./pages/admin/TeacherAssignments"));
const Subjects = lazy(() => import("./pages/admin/Subjects"));
const Reports = lazy(() => import("./pages/admin/Reports"));
const AuditLogs = lazy(() => import("./pages/admin/AuditLogs"));

// Teacher Pages
const Dashboard = lazy(() => import("./pages/teacher/Dashboard"));
const TakeAttendance = lazy(() => import("./pages/teacher/TakeAttendance"));
const AttendanceHistory = lazy(() => import("./pages/teacher/AttendanceHistory"));
const CorrectionRequests = lazy(() => import("./pages/teacher/CorrectionRequests"));
const Profile = lazy(() => import("./pages/teacher/Profile"));

// Student Pages
const StudentDashboard = lazy(() => import("./pages/student/Dashboard"));
const StudentAttendance = lazy(() => import("./pages/student/Attendance"));
const StudentHistory = lazy(() => import("./pages/student/History"));
const StudentCorrections = lazy(() => import("./pages/student/Corrections"));

// Layouts
const TeacherLayout = lazy(() => import("./layouts/TeacherLayout"));
const StudentLayout = lazy(() => import("./layouts/StudentLayout"));
const AdminLayout = lazy(() => import("./layouts/AdminLayout"));


// ==========================================
// DYNAMIC BROWSER TAB TITLE
// ==========================================

const DynamicPageTitle = () => {
    const location = useLocation();

    useEffect(() => {
        const path = location.pathname;

        if (path.startsWith("/admin")) {
            document.title =
                "Admin Portal | College Attendance System";
        } else if (path.startsWith("/teacher")) {
            document.title =
                "Teacher Portal | College Attendance System";
        } else if (path.startsWith("/student")) {
            document.title =
                "Student Portal | College Attendance System";
        } else if (path === "/change-password") {
            document.title =
                "Change Password | College Attendance System";
        } else {
            document.title =
                "College Attendance System";
        }
    }, [location.pathname]);

    return null;
};


// ==========================================
// LOADING SCREEN
// ==========================================

const LoadingScreen = () => (
    <div className="flex min-h-screen items-center justify-center">
        <p className="text-slate-500">
            Loading your account...
        </p>
    </div>
);


// ==========================================
// TEACHER PROTECTED ROUTE
// ==========================================

const TeacherProtectedRoute = () => {
    const { user, isAuthenticated, loading } = useAuth();

    if (loading) return <LoadingScreen />;

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (user?.role !== "TEACHER") {
        return <Navigate to="/login" replace />;
    }

    if (user?.isFirstLogin) {
        return <Navigate to="/change-password" replace />;
    }

    return <Outlet />;
};


// ==========================================
// STUDENT PROTECTED ROUTE
// ==========================================

const StudentProtectedRoute = () => {
    const { user, isAuthenticated, loading } = useAuth();

    if (loading) return <LoadingScreen />;

    if (!isAuthenticated) {
        return <Navigate to="/student/login" replace />;
    }

    if (user?.role !== "STUDENT") {
        return <Navigate to="/student/login" replace />;
    }

    if (user?.isFirstLogin) {
        return <Navigate to="/change-password" replace />;
    }

    return <Outlet />;
};


// ==========================================
// ADMIN PROTECTED ROUTE
// ==========================================

const AdminProtectedRoute = () => {
    const { user, isAuthenticated, loading } = useAuth();

    if (loading) return <LoadingScreen />;

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (user?.role !== "ADMIN") {
        return <Navigate to="/login" replace />;
    }

    if (user?.isFirstLogin) {
        return <Navigate to="/change-password" replace />;
    }

    return <Outlet />;
};


// ==========================================
// SHARED PASSWORD CHANGE ROUTE
// ==========================================

const PasswordChangeRoute = () => {
    const { user, isAuthenticated, loading } = useAuth();

    if (loading) return <LoadingScreen />;

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (!["ADMIN", "TEACHER", "STUDENT"].includes(user?.role)) {
        return <Navigate to="/login" replace />;
    }

    if (!user?.isFirstLogin) {
        const destination =
            user?.role === "STUDENT"
                ? "/student/dashboard"
                : user?.role === "ADMIN"
                    ? "/admin/dashboard"
                    : "/teacher/dashboard";

        return <Navigate to={destination} replace />;
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">

                <h1 className="mb-2 text-2xl font-bold text-slate-800">
                    Change Your Password
                </h1>

                <p className="mb-6 text-sm text-slate-500">
                    Please replace your temporary password before continuing.
                </p>

                <PasswordChangeForm />

            </div>
        </div>
    );
};


// ==========================================
// PASSWORD CHANGE FORM
// ==========================================

const PasswordChangeForm = () => {
    const { changePassword, logout, user } = useAuth();

    const navigate = useNavigate();
    const location = useLocation();

    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const defaultDestination =
        user?.role === "STUDENT"
            ? "/student/dashboard"
            : user?.role === "ADMIN"
                ? "/admin/dashboard"
                : "/teacher/dashboard";

    const requestedDestination = new URLSearchParams(
        location.search
    ).get("redirect");

    const destination =
        requestedDestination === defaultDestination
            ? requestedDestination
            : defaultDestination;

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError("");

        if (newPassword.length < 8) {
            setError("New password must contain at least 8 characters.");
            return;
        }

        if (newPassword !== confirmPassword) {
            setError("New passwords do not match.");
            return;
        }

        setLoading(true);

        try {
            await changePassword(currentPassword, newPassword);
            navigate(destination, { replace: true });

        } catch (err) {
            setError(
                err.response?.data?.message ||
                err.message ||
                "Unable to update password."
            );

        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">

            <input
                type="password"
                placeholder="Current password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full rounded-lg border border-slate-300 p-3 outline-none focus:ring-2 focus:ring-blue-500"
            />

            <input
                type="password"
                placeholder="New password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                autoComplete="new-password"
                className="w-full rounded-lg border border-slate-300 p-3 outline-none focus:ring-2 focus:ring-blue-500"
            />

            <input
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
                className="w-full rounded-lg border border-slate-300 p-3 outline-none focus:ring-2 focus:ring-blue-500"
            />

            {error && (
                <p className="text-sm text-red-600">
                    {error}
                </p>
            )}

            <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-blue-600 p-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
                {loading ? "Updating..." : "Update Password"}
            </button>

            <button
                type="button"
                onClick={logout}
                className="w-full text-sm text-slate-500 hover:text-red-600"
            >
                Logout
            </button>

        </form>
    );
};


// ==========================================
// MAIN APPLICATION
// ==========================================

function App() {
    return (
        <BrowserRouter>

            <DynamicPageTitle />

            <Suspense fallback={<LoadingScreen />}>

                <Routes>

                    {/* Login Routes */}

                    <Route
                        path="/login"
                        element={<Login />}
                    />

                    <Route
                        path="/student/login"
                        element={<StudentLogin />}
                    />


                    {/* Shared Password Change */}

                    <Route
                        path="/change-password"
                        element={<PasswordChangeRoute />}
                    />


                    {/* Admin Portal */}

                    <Route element={<AdminProtectedRoute />}>

                        <Route element={<AdminLayout />}>

                            <Route
                                path="/admin/dashboard"
                                element={<AdminDashboard />}
                            />

                            <Route
                                path="/admin/branches-sections"
                                element={<BranchesSections />}
                            />

                            <Route
                                path="/admin/students"
                                element={<Students />}
                            />

                            <Route
                                path="/admin/teachers"
                                element={<Teachers />}
                            />

                            <Route
                                path="/admin/subjects"
                                element={<Subjects />}
                            />

                            <Route
                                path="/admin/teacher-assignments"
                                element={<TeacherAssignments />}
                            />

                            <Route
                                path="/admin/reports"
                                element={<Reports />}
                            />

                            <Route
                                path="/admin/audit-logs"
                                element={<AuditLogs />}
                            />

                        </Route>

                    </Route>


                    {/* Teacher Portal */}

                    <Route element={<TeacherProtectedRoute />}>

                        <Route element={<TeacherLayout />}>

                            <Route
                                path="/teacher/dashboard"
                                element={<Dashboard />}
                            />

                            <Route
                                path="/teacher/take-attendance"
                                element={<TakeAttendance />}
                            />

                            <Route
                                path="/teacher/history"
                                element={<AttendanceHistory />}
                            />

                            <Route
                                path="/teacher/corrections"
                                element={<CorrectionRequests />}
                            />

                            <Route
                                path="/teacher/profile"
                                element={<Profile />}
                            />

                        </Route>

                    </Route>


                    {/* Student Portal */}

                    <Route element={<StudentProtectedRoute />}>

                        <Route element={<StudentLayout />}>

                            <Route
                                path="/student/dashboard"
                                element={<StudentDashboard />}
                            />

                            <Route
                                path="/student/attendance"
                                element={<StudentAttendance />}
                            />

                            <Route
                                path="/student/history"
                                element={<StudentHistory />}
                            />

                            <Route
                                path="/student/corrections"
                                element={<StudentCorrections />}
                            />

                        </Route>

                    </Route>


                    {/* Default Route */}

                    <Route
                        path="/"
                        element={<Navigate to="/login" replace />}
                    />


                    {/* Unknown Routes */}

                    <Route
                        path="*"
                        element={<Navigate to="/" replace />}
                    />

                </Routes>

            </Suspense>

        </BrowserRouter>
    );
}

export default App;
