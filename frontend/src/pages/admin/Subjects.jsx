
import { useEffect, useState } from "react";
import {
    BookOpen,
    Plus,
    RefreshCw,
    Search,
    AlertCircle,
    CheckCircle,
    X
} from "lucide-react";
import api from "../../services/api";

const Subjects = () => {
    const [subjects, setSubjects] = useState([]);
    const [branches, setBranches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [search, setSearch] = useState("");

    const [form, setForm] = useState({
        name: "",
        code: "",
        branchId: "",
        semester: ""
    });

    const fetchData = async () => {
        setLoading(true);
        setError("");

        try {
            const [subjectRes, branchRes] = await Promise.all([
                api.get("/admin/subjects"),
                api.get("/admin/branches")
            ]);

            setSubjects(subjectRes.data.subjects || []);
            setBranches(branchRes.data.branches || []);
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Unable to load subjects. Please refresh."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;

        setForm((prev) => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        if (!form.name.trim() || !form.code.trim() ||
            !form.branchId || !form.semester) {
            setError("Please fill in all required fields.");
            return;
        }

        setSaving(true);

        try {
            const response = await api.post("/admin/subjects", {
                name: form.name.trim(),
                code: form.code.trim().toUpperCase(),
                branchId: form.branchId,
                semester: Number(form.semester)
            });

            setSuccess(
                response.data.message || "Subject created successfully."
            );

            setForm({
                name: "",
                code: "",
                branchId: "",
                semester: ""
            });

            await fetchData();
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Unable to create subject."
            );
        } finally {
            setSaving(false);
        }
    };

    const filteredSubjects = subjects.filter((subject) => {
        const text = `${subject.name} ${subject.code} ${
            subject.branchId?.name || ""
        } ${subject.semester}`.toLowerCase();

        return text.includes(search.toLowerCase());
    });

    const activeSubjects = subjects.filter(
        (subject) => subject.isActive !== false
    ).length;

    const inactiveSubjects = subjects.length - activeSubjects;

    return (
        <div className="space-y-6">

            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">
                        Subject Management
                    </h1>
                    <p className="mt-1 text-sm text-slate-500">
                        Create and manage college subjects.
                    </p>
                </div>

                <button
                    onClick={fetchData}
                    disabled={loading}
                    className="flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                    <RefreshCw size={16} />
                    Refresh Data
                </button>
            </div>

            {error && (
                <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    <AlertCircle size={18} />
                    {error}
                </div>
            )}

            {success && (
                <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
                    <CheckCircle size={18} />
                    {success}
                </div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">

                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                    <p className="text-sm text-slate-500">Total Subjects</p>
                    <h2 className="mt-2 text-3xl font-bold text-slate-800">
                        {subjects.length}
                    </h2>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                    <p className="text-sm text-slate-500">Active Subjects</p>
                    <h2 className="mt-2 text-3xl font-bold text-green-600">
                        {activeSubjects}
                    </h2>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                    <p className="text-sm text-slate-500">Inactive Subjects</p>
                    <h2 className="mt-2 text-3xl font-bold text-red-600">
                        {inactiveSubjects}
                    </h2>
                </div>

            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">

                {/* Create Subject Form */}

                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-1">

                    <div className="mb-5 flex items-center gap-3">
                        <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
                            <Plus size={20} />
                        </div>

                        <div>
                            <h2 className="font-semibold text-slate-800">
                                Register New Subject
                            </h2>
                            <p className="text-xs text-slate-500">
                                Add a subject to a branch and semester.
                            </p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">

                        <div>
                            <label className="mb-1 block text-sm font-medium text-slate-700">
                                Subject Name *
                            </label>
                            <input
                                name="name"
                                value={form.name}
                                onChange={handleChange}
                                placeholder="e.g. Database Management System"
                                required
                                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            />
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-medium text-slate-700">
                                Subject Code *
                            </label>
                            <input
                                name="code"
                                value={form.code}
                                onChange={handleChange}
                                placeholder="e.g. BCS501"
                                required
                                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm uppercase outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            />
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-medium text-slate-700">
                                Branch *
                            </label>
                            <select
                                name="branchId"
                                value={form.branchId}
                                onChange={handleChange}
                                required
                                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500"
                            >
                                <option value="">Select Branch</option>
                                {branches
                                    .filter((branch) => branch.isActive !== false)
                                    .map((branch) => (
                                        <option
                                            key={branch._id}
                                            value={branch._id}
                                        >
                                            {branch.name} ({branch.code})
                                        </option>
                                    ))}
                            </select>
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-medium text-slate-700">
                                Semester *
                            </label>
                            <select
                                name="semester"
                                value={form.semester}
                                onChange={handleChange}
                                required
                                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500"
                            >
                                <option value="">Select Semester</option>
                                {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                                    <option key={sem} value={sem}>
                                        Semester {sem}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <button
                            type="submit"
                            disabled={saving || loading}
                            className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <Plus size={17} />
                            {saving ? "Registering..." : "Register Subject"}
                        </button>

                    </form>
                </div>

                {/* Subject Directory */}

                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-2">

                    <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                        <div>
                            <h2 className="font-semibold text-slate-800">
                                Subject Directory
                            </h2>
                            <p className="text-xs text-slate-500">
                                All registered college subjects.
                            </p>
                        </div>

                        <div className="relative">
                            <Search
                                size={17}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                            />
                            <input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search subjects..."
                                className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-500 sm:w-56"
                            />
                            {search && (
                                <button
                                    type="button"
                                    onClick={() => setSearch("")}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400"
                                >
                                    <X size={15} />
                                </button>
                            )}
                        </div>
                    </div>

                    {loading ? (
                        <div className="py-12 text-center text-sm text-slate-500">
                            Loading subjects...
                        </div>
                    ) : filteredSubjects.length === 0 ? (
                        <div className="py-12 text-center">
                            <BookOpen
                                size={35}
                                className="mx-auto mb-3 text-slate-300"
                            />
                            <p className="font-medium text-slate-600">
                                No subjects found
                            </p>
                            <p className="mt-1 text-sm text-slate-400">
                                Register a new subject to get started.
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead>
                                    <tr className="border-b border-slate-200 text-xs uppercase text-slate-500">
                                        <th className="px-3 py-3">Subject</th>
                                        <th className="px-3 py-3">Code</th>
                                        <th className="px-3 py-3">Branch</th>
                                        <th className="px-3 py-3">Semester</th>
                                        <th className="px-3 py-3">Status</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {filteredSubjects.map((subject) => (
                                        <tr
                                            key={subject._id}
                                            className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                                        >
                                            <td className="px-3 py-4 font-medium text-slate-800">
                                                {subject.name}
                                            </td>

                                            <td className="px-3 py-4 font-semibold text-blue-700">
                                                {subject.code}
                                            </td>

                                            <td className="px-3 py-4 text-slate-600">
                                                {subject.branchId?.code || "—"}
                                            </td>

                                            <td className="px-3 py-4 text-slate-600">
                                                {subject.semester}
                                            </td>

                                            <td className="px-3 py-4">
                                                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                                                    subject.isActive === false
                                                        ? "bg-red-50 text-red-700"
                                                        : "bg-green-50 text-green-700"
                                                }`}>
                                                    {subject.isActive === false
                                                        ? "Inactive"
                                                        : "Active"}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    <div className="mt-4 border-t border-slate-100 pt-3 text-xs text-slate-500">
                        Showing {filteredSubjects.length} of {subjects.length} subjects
                    </div>

                </div>

            </div>

        </div>
    );
};

export default Subjects;
