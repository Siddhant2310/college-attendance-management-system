
import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import {
    Eye,
    EyeOff,
    LockKeyhole,
    UserRound,
    GraduationCap
} from "lucide-react";

import { useAuth } from "../context/AuthContext";

const Login = () => {
    const navigate = useNavigate();

    const {
        login,
        isAuthenticated,
        user,
        loading: authLoading
    } = useAuth();

    const [loginId, setLoginId] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    // Redirect already authenticated users
    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-slate-500">
                    Checking your account...
                </p>
            </div>
        );
    }

    if (isAuthenticated) {
        if (!["ADMIN", "TEACHER"].includes(user?.role)) {
            return <Navigate to="/student/login" replace />;
        }

        const destination = user.isFirstLogin
            ? "/change-password"
            : user.role === "ADMIN"
                ? "/admin/dashboard"
                : "/teacher/dashboard";

        return <Navigate to={destination} replace />;
    }

    // Handle login form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (!loginId.trim() || !password) {
            setError("Please enter your Login ID and password.");
            return;
        }

        setSubmitting(true);

        try {
            const result = await login(
                loginId.trim(),
                password
            );

            const loggedInUser = result;

            if (!["ADMIN", "TEACHER"].includes(loggedInUser.role)) {
                setError(
                    "Access denied. Please use the Student Login portal."
                );
                return;
            }

            if (loggedInUser.isFirstLogin) {
                navigate("/change-password", { replace: true });
            } else if (loggedInUser.role === "ADMIN") {
                navigate("/admin/dashboard", { replace: true });
            } else {
                navigate("/teacher/dashboard", { replace: true });
            }

        } catch (err) {
            setError(
                err.message || "Unable to login. Please try again."
            );
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen flex bg-slate-50">

            {/* Left branding section */}
            <div className="hidden lg:flex lg:w-1/2 bg-slate-950 text-white relative overflow-hidden">

                <div className="absolute inset-0 opacity-20">
                    <div className="absolute -top-20 -left-20 w-96 h-96 bg-blue-500 rounded-full blur-3xl" />
                    <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-500 rounded-full blur-3xl" />
                </div>

                <div className="relative z-10 flex flex-col justify-between p-14 w-full">

                    <div className="flex items-center gap-3">
                        <div className="bg-blue-600 p-3 rounded-xl">
                            <GraduationCap size={28} />
                        </div>

                        <div>
                            <h1 className="text-xl font-bold">
                                Attendance System
                            </h1>
                            <p className="text-slate-400 text-sm">
                                College Management Portal
                            </p>
                        </div>
                    </div>

                    <div className="max-w-lg">
                        <p className="text-blue-400 font-semibold tracking-widest uppercase text-sm mb-4">
                            Admin & Teacher Portal
                        </p>

                        <h2 className="text-5xl font-bold leading-tight mb-6">
                            Manage attendance.
                            <span className="text-blue-400">
                                {" "}Simplify your day.
                            </span>
                        </h2>

                        <p className="text-slate-400 text-lg leading-relaxed">
                            Manage college records, take attendance,
                            review correction requests and monitor
                            your institution from one place.
                        </p>
                    </div>

                    <p className="text-slate-500 text-sm">
                        Secure access for authorized administrators and faculty.
                    </p>
                </div>
            </div>

            {/* Login section */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-10">

                <div className="w-full max-w-md">

                    {/* Mobile branding */}
                    <div className="lg:hidden flex items-center gap-3 mb-10">
                        <div className="bg-blue-600 text-white p-3 rounded-xl">
                            <GraduationCap size={26} />
                        </div>

                        <div>
                            <h1 className="font-bold text-lg">
                                Attendance System
                            </h1>
                            <p className="text-xs text-slate-500">
                                Admin & Teacher Portal
                            </p>
                        </div>
                    </div>

                    <div className="mb-8">
                        <p className="text-blue-600 font-semibold text-sm mb-2">
                            WELCOME BACK
                        </p>

                        <h2 className="text-3xl font-bold text-slate-900">
                            Admin / Teacher Login
                        </h2>

                        <p className="text-slate-500 mt-2">
                            Enter your credentials to access your account.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">

                        {/* Login ID */}
                        <div>
                            <label
                                htmlFor="loginId"
                                className="block text-sm font-semibold text-slate-700 mb-2"
                            >
                                Login ID
                            </label>

                            <div className="relative">
                                <UserRound
                                    size={19}
                                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                                />

                                <input
                                    id="loginId"
                                    type="text"
                                    value={loginId}
                                    onChange={(e) => setLoginId(e.target.value)}
                                    placeholder="Enter your Login ID"
                                    autoComplete="username"
                                    required
                                    className="w-full border border-slate-300 rounded-xl pl-12 pr-4 py-3.5 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <label
                                htmlFor="password"
                                className="block text-sm font-semibold text-slate-700 mb-2"
                            >
                                Password
                            </label>

                            <div className="relative">
                                <LockKeyhole
                                    size={19}
                                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                                />

                                <input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter your password"
                                    autoComplete="current-password"
                                    required
                                    className="w-full border border-slate-300 rounded-xl pl-12 pr-12 py-3.5 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                />

                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                >
                                    {showPassword
                                        ? <EyeOff size={19} />
                                        : <Eye size={19} />
                                    }
                                </button>
                            </div>
                        </div>

                        {/* Error message */}
                        {error && (
                            <div
                                role="alert"
                                className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm"
                            >
                                {error}
                            </div>
                        )}

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3.5 rounded-xl transition shadow-lg shadow-blue-600/20 disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {submitting ? "Signing in..." : "Sign In"}
                        </button>

                    </form>

                    <div className="mt-8 border-t border-slate-200 pt-6 text-center">
                        <p className="text-sm text-slate-500">
                            Having trouble accessing your account?
                        </p>

                        <p className="text-sm text-slate-700 font-medium mt-1">
                            Contact your college administrator.
                        </p>
                    </div>

                    <p className="text-center text-xs text-slate-400 mt-8">
                        © {new Date().getFullYear()} Attendance System
                    </p>

                </div>
            </div>
        </div>
    );
};

export default Login;
