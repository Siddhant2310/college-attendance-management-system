
import { useEffect, useMemo, useState } from "react";
import {
    Users,
    UserPlus,
    Search,
    RefreshCw,
    KeyRound,
    Mail,
    GraduationCap,
    AlertCircle,
    CheckCircle,
    Copy,
    X
} from "lucide-react";

import api from "../../services/api";

const Teachers = () => {
    const [teachers, setTeachers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [resettingEmployee, setResettingEmployee] = useState("");

    const [search, setSearch] = useState("");

    const [message, setMessage] = useState({
        type: "",
        text: ""
    });

    const [temporaryPassword, setTemporaryPassword] = useState(null);

    const [form, setForm] = useState({
        name: "",
        employeeId: "",
        email: ""
    });

    // Fetch all teachers
    const fetchTeachers = async () => {
        try {
            setLoading(true);
            setMessage({ type: "", text: "" });

            const response = await api.get("/admin/teachers");

            setTeachers(response.data.teachers || []);

        } catch (error) {
            setMessage({
                type: "error",
                text: error.response?.data?.message ||
                    "Unable to load teacher data."
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTeachers();
    }, []);

    // Handle form input
    const handleChange = (e) => {
        const { name, value } = e.target;

        setForm((previous) => ({
            ...previous,
            [name]: value
        }));
    };

    // Register teacher
    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            setSubmitting(true);
            setMessage({ type: "", text: "" });
            setTemporaryPassword(null);

            const response = await api.post("/admin/teachers", {
                name: form.name.trim(),
                employeeId: form.employeeId.trim().toUpperCase(),
                email: form.email.trim()
            });

            setTemporaryPassword({
                employeeId: response.data.teacher.employeeId,
                password: response.data.temporaryPassword
            });

            setMessage({
                type: "success",
                text: response.data.message
            });

            setForm({
                name: "",
                employeeId: "",
                email: ""
            });

            await fetchTeachers();

        } catch (error) {
            setMessage({
                type: "error",
                text: error.response?.data?.message ||
                    "Unable to register teacher."
            });
        } finally {
            setSubmitting(false);
        }
    };

    // Reset teacher password
    const handleResetPassword = async (employeeId) => {
        const confirmed = window.confirm(
            `Are you sure you want to reset the password for ${employeeId}?`
        );

        if (!confirmed) return;

        try {
            setResettingEmployee(employeeId);

            const response = await api.post(
                `/admin/teachers/${encodeURIComponent(employeeId)}/reset-password`
            );

            setTemporaryPassword({
                employeeId: response.data.employeeId,
                password: response.data.temporaryPassword
            });

            setMessage({
                type: "success",
                text: response.data.message
            });

        } catch (error) {
            setMessage({
                type: "error",
                text: error.response?.data?.message ||
                    "Unable to reset teacher password."
            });
        } finally {
            setResettingEmployee("");
        }
    };

    // Search teachers
    const filteredTeachers = useMemo(() => {
        const value = search.toLowerCase().trim();

        return teachers.filter((teacher) => {
            const user = teacher.userId || {};

            return (
                (user.name || "").toLowerCase().includes(value) ||
                (teacher.employeeId || "").toLowerCase().includes(value) ||
                (user.email || "").toLowerCase().includes(value)
            );
        });
    }, [teachers, search]);

    const activeTeachers = teachers.filter(
        (teacher) => teacher.isActive && teacher.userId?.isActive !== false
    ).length;

    const inactiveTeachers = teachers.length - activeTeachers;

    return (
        <div className="space-y-8">

            {/* Page Heading */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">
                        Teacher Management
                    </h1>
                    <p className="mt-1 text-sm text-slate-500">
                        Register teachers and manage their login accounts.
                    </p>
                </div>

                <button
                    onClick={fetchTeachers}
                    disabled={loading}
                    className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                    <RefreshCw
                        size={16}
                        className={loading ? "animate-spin" : ""}
                    />
                    Refresh Data
                </button>
            </div>

            {/* Notifications */}
            {message.text && (
                <div className={`flex items-start gap-3 rounded-xl border p-4 ${
                    message.type === "success"
                        ? "border-green-200 bg-green-50 text-green-700"
                        : "border-red-200 bg-red-50 text-red-700"
                }`}>
                    {message.type === "success" ? (
                        <CheckCircle size={20} />
                    ) : (
                        <AlertCircle size={20} />
                    )}

                    <p className="text-sm font-medium">
                        {message.text}
                    </p>

                    <button
                        onClick={() => setMessage({ type: "", text: "" })}
                        className="ml-auto"
                    >
                        <X size={18} />
                    </button>
                </div>
            )}

            {/* Statistics */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">

                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-500">
                                Total Teachers
                            </p>
                            <h2 className="mt-2 text-3xl font-bold text-slate-800">
                                {teachers.length}
                            </h2>
                        </div>
                        <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
                            <Users size={24} />
                        </div>
                    </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-500">
                                Active Teachers
                            </p>
                            <h2 className="mt-2 text-3xl font-bold text-green-600">
                                {activeTeachers}
                            </h2>
                        </div>
                        <div className="rounded-xl bg-green-50 p-3 text-green-600">
                            <GraduationCap size={24} />
                        </div>
                    </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-500">
                                Inactive Teachers
                            </p>
                            <h2 className="mt-2 text-3xl font-bold text-red-600">
                                {inactiveTeachers}
                            </h2>
                        </div>
                        <div className="rounded-xl bg-red-50 p-3 text-red-600">
                            <Users size={24} />
                        </div>
                    </div>
                </div>

            </div>

            {/* Registration Form */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">

                <div className="mb-6 flex items-center gap-3">
                    <div className="rounded-lg bg-blue-50 p-3 text-blue-600">
                        <UserPlus size={22} />
                    </div>

                    <div>
                        <h2 className="text-lg font-bold text-slate-800">
                            Register New Teacher
                        </h2>
                        <p className="text-sm text-slate-500">
                            Create a teacher login account and profile.
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">

                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

                        <div>
                            <label className="mb-2 block text-sm font-semibold text-slate-700">
                                Teacher Name *
                            </label>
                            <input
                                type="text"
                                name="name"
                                value={form.name}
                                onChange={handleChange}
                                placeholder="Enter teacher name"
                                required
                                className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            />
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-semibold text-slate-700">
                                Employee ID *
                            </label>
                            <input
                                type="text"
                                name="employeeId"
                                value={form.employeeId}
                                onChange={handleChange}
                                placeholder="e.g. TCH001"
                                required
                                className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            />
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-semibold text-slate-700">
                                Email Address
                            </label>
                            <input
                                type="email"
                                name="email"
                                value={form.email}
                                onChange={handleChange}
                                placeholder="teacher@example.com (optional)"
                                className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            />
                        </div>

                    </div>

                    <div className="flex justify-end border-t border-slate-100 pt-5">
                        <button
                            type="submit"
                            disabled={submitting}
                            className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            <UserPlus size={18} />
                            {submitting ? "Registering..." : "Register Teacher"}
                        </button>
                    </div>

                </form>
            </div>

            {/* Teacher Directory */}
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm">

                <div className="flex flex-col gap-4 border-b border-slate-200 p-6 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-slate-800">
                            Teacher Directory
                        </h2>
                        <p className="mt-1 text-sm text-slate-500">
                            All registered teacher accounts.
                        </p>
                    </div>

                    <div className="relative w-full sm:w-72">
                        <Search
                            size={18}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                        />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search name or employee ID..."
                            className="w-full rounded-lg border border-slate-300 py-2.5 pl-10 pr-4 outline-none focus:border-blue-500"
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="p-12 text-center text-slate-500">
                        Loading teachers...
                    </div>
                ) : filteredTeachers.length === 0 ? (
                    <div className="p-12 text-center">
                        <Users
                            size={40}
                            className="mx-auto mb-3 text-slate-300"
                        />
                        <p className="font-semibold text-slate-700">
                            No teachers found
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                            Register a teacher or try another search.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">

                            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                                <tr>
                                    <th className="px-6 py-4">Teacher</th>
                                    <th className="px-6 py-4">Employee ID</th>
                                    <th className="px-6 py-4">Email</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Action</th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-slate-100">

                                {filteredTeachers.map((teacher) => {
                                    const user = teacher.userId || {};

                                    const isActive =
                                        teacher.isActive &&
                                        user.isActive !== false;

                                    return (
                                        <tr
                                            key={teacher._id}
                                            className="hover:bg-slate-50"
                                        >
                                            <td className="px-6 py-4">
                                                <div className="font-semibold text-slate-800">
                                                    {user.name || "Unknown"}
                                                </div>
                                                <div className="mt-1 text-xs text-slate-500">
                                                    Teacher Account
                                                </div>
                                            </td>

                                            <td className="px-6 py-4 font-medium text-slate-700">
                                                {teacher.employeeId}
                                            </td>

                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 text-slate-600">
                                                    <Mail size={14} />
                                                    {user.email || "No email"}
                                                </div>
                                            </td>

                                            <td className="px-6 py-4">
                                                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                    isActive
                                                        ? "bg-green-100 text-green-700"
                                                        : "bg-red-100 text-red-700"
                                                }`}>
                                                    {isActive ? "Active" : "Inactive"}
                                                </span>
                                            </td>

                                            <td className="px-6 py-4">
                                                <button
                                                    onClick={() => handleResetPassword(teacher.employeeId)}
                                                    disabled={
                                                        !isActive ||
                                                        resettingEmployee === teacher.employeeId
                                                    }
                                                    className="flex items-center gap-2 rounded-lg border border-blue-200 px-3 py-2 text-xs font-semibold text-blue-600 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
                                                >
                                                    <KeyRound size={14} />
                                                    {resettingEmployee === teacher.employeeId
                                                        ? "Resetting..."
                                                        : "Reset Password"}
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}

                            </tbody>
                        </table>
                    </div>
                )}

                <div className="border-t border-slate-100 px-6 py-4 text-sm text-slate-500">
                    Showing {filteredTeachers.length} of {teachers.length} teachers
                </div>

            </div>

            {/* Temporary Password Modal */}
            {temporaryPassword && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

                    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">

                        <div className="mb-5 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="rounded-xl bg-green-100 p-3 text-green-600">
                                    <KeyRound size={22} />
                                </div>

                                <div>
                                    <h2 className="text-lg font-bold text-slate-800">
                                        Temporary Password
                                    </h2>
                                    <p className="text-xs text-slate-500">
                                        Teacher account credentials
                                    </p>
                                </div>
                            </div>

                            <button
                                onClick={() => setTemporaryPassword(null)}
                                className="text-slate-400 hover:text-slate-700"
                            >
                                <X size={22} />
                            </button>
                        </div>

                        <div className="space-y-4 rounded-xl bg-slate-50 p-4">

                            <div>
                                <p className="text-xs font-semibold text-slate-500">
                                    EMPLOYEE ID
                                </p>
                                <p className="mt-1 font-bold text-slate-800">
                                    {temporaryPassword.employeeId}
                                </p>
                            </div>

                            <div>
                                <p className="text-xs font-semibold text-slate-500">
                                    TEMPORARY PASSWORD
                                </p>

                                <div className="mt-2 flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white p-3">
                                    <code className="break-all font-bold text-blue-700">
                                        {temporaryPassword.password}
                                    </code>

                                    <button
                                        onClick={() => {
                                            navigator.clipboard.writeText(
                                                temporaryPassword.password
                                            );
                                        }}
                                        className="shrink-0 rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                                        title="Copy password"
                                    >
                                        <Copy size={18} />
                                    </button>
                                </div>
                            </div>

                        </div>

                        <p className="mt-4 text-sm text-amber-700">
                            Save this password and share it securely with the teacher. It may not be shown again.
                        </p>

                        <button
                            onClick={() => setTemporaryPassword(null)}
                            className="mt-5 w-full rounded-lg bg-blue-600 py-3 font-semibold text-white hover:bg-blue-700"
                        >
                            Close
                        </button>

                    </div>
                </div>
            )}

        </div>
    );
};

export default Teachers;
