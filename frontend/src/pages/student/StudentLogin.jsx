
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, GraduationCap, Lock, User } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export default function StudentLogin() {
    const { login, logout } = useAuth();
    const navigate = useNavigate();

    const [loginId, setLoginId] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (!loginId.trim() || !password) {
            setError("Please enter your roll number and password.");
            return;
        }

        try {
            setLoading(true);

            const loggedInUser = await login(loginId.trim(), password);

            if (loggedInUser?.role !== "STUDENT") {
                logout();
                setError("Access denied. Please use a student account.");
                return;
            }

            if (loggedInUser.isFirstLogin) {
                navigate("/change-password?redirect=/student/dashboard");
            } else {
                navigate("/student/dashboard");
            }
        } catch (err) {
            setError(
                err.response?.data?.message ||
                err.message ||
                "Login failed. Please check your credentials."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10">
            <div className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">

                <div className="bg-gradient-to-r from-blue-700 to-indigo-700 px-8 py-8 text-center text-white">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15">
                        <GraduationCap size={34} />
                    </div>

                    <h1 className="text-2xl font-bold">
                        Student Portal
                    </h1>

                    <p className="mt-2 text-sm text-blue-100">
                        College Attendance Management System
                    </p>
                </div>

                <div className="p-8">
                    <div className="mb-7">
                        <h2 className="text-xl font-bold text-slate-800">
                            Welcome Back
                        </h2>
                        <p className="mt-1 text-sm text-slate-500">
                            Sign in to view your attendance.
                        </p>
                    </div>

                    {error && (
                        <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label
                                htmlFor="loginId"
                                className="mb-2 block text-sm font-medium text-slate-700"
                            >
                                Roll Number
                            </label>

                            <div className="relative">
                                <User
                                    size={18}
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                                />

                                <input
                                    id="loginId"
                                    type="text"
                                    value={loginId}
                                    onChange={(e) => setLoginId(e.target.value)}
                                    placeholder="Enter your roll number"
                                    autoComplete="username"
                                    className="w-full rounded-lg border border-slate-300 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                />
                            </div>
                        </div>

                        <div>
                            <label
                                htmlFor="password"
                                className="mb-2 block text-sm font-medium text-slate-700"
                            >
                                Password
                            </label>

                            <div className="relative">
                                <Lock
                                    size={18}
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                                />

                                <input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter your password"
                                    autoComplete="current-password"
                                    className="w-full rounded-lg border border-slate-300 py-3 pl-10 pr-12 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                />

                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                >
                                    {showPassword ? (
                                        <EyeOff size={18} />
                                    ) : (
                                        <Eye size={18} />
                                    )}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full rounded-lg bg-blue-700 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {loading ? "Signing in..." : "Sign In"}
                        </button>
                    </form>

                    <p className="mt-6 text-center text-xs text-slate-400">
                        Your login credentials are provided by the college administrator.
                    </p>
                </div>
            </div>
        </div>
    );
}
