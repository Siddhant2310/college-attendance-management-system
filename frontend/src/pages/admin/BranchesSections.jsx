
import { useEffect, useState } from "react";
import {
    GitBranch,
    Layers,
    Plus,
    RefreshCw,
    Building2,
    GraduationCap,
    AlertCircle,
    CheckCircle2
} from "lucide-react";

import api from "../../services/api";

const BranchesSections = () => {
    const [branches, setBranches] = useState([]);
    const [sections, setSections] = useState([]);

    const [loading, setLoading] = useState(true);
    const [submittingBranch, setSubmittingBranch] = useState(false);
    const [submittingSection, setSubmittingSection] = useState(false);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [branchForm, setBranchForm] = useState({
        name: "",
        code: ""
    });

    const [sectionForm, setSectionForm] = useState({
        name: "",
        branchId: "",
        semester: "",
        academicYear: ""
    });

    // Fetch branches and sections
    const fetchData = async () => {
        setLoading(true);
        setError("");

        try {
            const [branchResponse, sectionResponse] = await Promise.all([
                api.get("/admin/branches"),
                api.get("/admin/sections")
            ]);

            setBranches(branchResponse.data.branches || []);
            setSections(sectionResponse.data.sections || []);
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Unable to load branches and sections."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Create branch
    const handleBranchSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        setSubmittingBranch(true);

        try {
            const response = await api.post("/admin/branches", {
                name: branchForm.name.trim(),
                code: branchForm.code.trim().toUpperCase()
            });

            setSuccess(response.data.message || "Branch created successfully.");

            setBranchForm({
                name: "",
                code: ""
            });

            await fetchData();
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Unable to create branch."
            );
        } finally {
            setSubmittingBranch(false);
        }
    };

    // Create section
    const handleSectionSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        setSubmittingSection(true);

        try {
            const response = await api.post("/admin/sections", {
                name: sectionForm.name.trim(),
                branchId: sectionForm.branchId,
                semester: Number(sectionForm.semester),
                academicYear: sectionForm.academicYear.trim()
            });

            setSuccess(response.data.message || "Section created successfully.");

            setSectionForm({
                name: "",
                branchId: "",
                semester: "",
                academicYear: ""
            });

            await fetchData();
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Unable to create section."
            );
        } finally {
            setSubmittingSection(false);
        }
    };

    return (
        <div className="space-y-8">

            {/* Page Header */}
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">
                        Branches & Sections
                    </h1>
                    <p className="mt-1 text-sm text-slate-500">
                        Manage college branches and academic sections.
                    </p>
                </div>

                <button
                    onClick={fetchData}
                    disabled={loading}
                    className="flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                    <RefreshCw size={16} />
                    Refresh Data
                </button>
            </div>

            {/* Notifications */}
            {error && (
                <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    <AlertCircle size={19} className="mt-0.5 shrink-0" />
                    {error}
                </div>
            )}

            {success && (
                <div className="flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
                    <CheckCircle2 size={19} className="mt-0.5 shrink-0" />
                    {success}
                </div>
            )}

            {/* Summary Cards */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-500">
                                Total Branches
                            </p>
                            <h2 className="mt-2 text-3xl font-bold text-slate-900">
                                {branches.length}
                            </h2>
                        </div>

                        <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
                            <GitBranch size={25} />
                        </div>
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-500">
                                Total Sections
                            </p>
                            <h2 className="mt-2 text-3xl font-bold text-slate-900">
                                {sections.length}
                            </h2>
                        </div>

                        <div className="rounded-xl bg-purple-50 p-3 text-purple-600">
                            <Layers size={25} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Creation Forms */}
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">

                {/* Add Branch */}
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="mb-6 flex items-center gap-3">
                        <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
                            <Building2 size={22} />
                        </div>

                        <div>
                            <h2 className="text-lg font-bold text-slate-900">
                                Add New Branch
                            </h2>
                            <p className="text-sm text-slate-500">
                                Register a college department.
                            </p>
                        </div>
                    </div>

                    <form onSubmit={handleBranchSubmit} className="space-y-4">

                        <div>
                            <label className="mb-2 block text-sm font-semibold text-slate-700">
                                Branch Name
                            </label>

                            <input
                                type="text"
                                value={branchForm.name}
                                onChange={(e) =>
                                    setBranchForm({
                                        ...branchForm,
                                        name: e.target.value
                                    })
                                }
                                placeholder="e.g. Computer Science and Engineering"
                                required
                                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            />
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-semibold text-slate-700">
                                Branch Code
                            </label>

                            <input
                                type="text"
                                value={branchForm.code}
                                onChange={(e) =>
                                    setBranchForm({
                                        ...branchForm,
                                        code: e.target.value.toUpperCase()
                                    })
                                }
                                placeholder="e.g. CSE"
                                required
                                className="w-full rounded-xl border border-slate-300 px-4 py-3 uppercase outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={submittingBranch}
                            className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                        >
                            <Plus size={18} />
                            {submittingBranch ? "Adding Branch..." : "Add Branch"}
                        </button>
                    </form>
                </div>

                {/* Add Section */}
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="mb-6 flex items-center gap-3">
                        <div className="rounded-xl bg-purple-50 p-3 text-purple-600">
                            <GraduationCap size={22} />
                        </div>

                        <div>
                            <h2 className="text-lg font-bold text-slate-900">
                                Add New Section
                            </h2>
                            <p className="text-sm text-slate-500">
                                Create a section under a branch.
                            </p>
                        </div>
                    </div>

                    <form onSubmit={handleSectionSubmit} className="space-y-4">

                        <div>
                            <label className="mb-2 block text-sm font-semibold text-slate-700">
                                Section Name
                            </label>

                            <input
                                type="text"
                                value={sectionForm.name}
                                onChange={(e) =>
                                    setSectionForm({
                                        ...sectionForm,
                                        name: e.target.value.toUpperCase()
                                    })
                                }
                                placeholder="e.g. C"
                                required
                                className="w-full rounded-xl border border-slate-300 px-4 py-3 uppercase outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
                            />
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-semibold text-slate-700">
                                Branch
                            </label>

                            <select
                                value={sectionForm.branchId}
                                onChange={(e) =>
                                    setSectionForm({
                                        ...sectionForm,
                                        branchId: e.target.value
                                    })
                                }
                                required
                                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
                            >
                                <option value="">Select Branch</option>

                                {branches.map((branch) => (
                                    <option key={branch._id} value={branch._id}>
                                        {branch.name} ({branch.code})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-slate-700">
                                    Semester
                                </label>

                                <select
                                    value={sectionForm.semester}
                                    onChange={(e) =>
                                        setSectionForm({
                                            ...sectionForm,
                                            semester: e.target.value
                                        })
                                    }
                                    required
                                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
                                >
                                    <option value="">Select Semester</option>

                                    {[1, 2, 3, 4, 5, 6, 7, 8].map((semester) => (
                                        <option key={semester} value={semester}>
                                            Semester {semester}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-semibold text-slate-700">
                                    Academic Year
                                </label>

                                <input
                                    type="text"
                                    value={sectionForm.academicYear}
                                    onChange={(e) =>
                                        setSectionForm({
                                            ...sectionForm,
                                            academicYear: e.target.value
                                        })
                                    }
                                    placeholder="2026-27"
                                    required
                                    className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={submittingSection || branches.length === 0}
                            className="flex w-full items-center justify-center gap-2 rounded-xl bg-purple-600 px-4 py-3 font-semibold text-white hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            <Plus size={18} />
                            {submittingSection ? "Adding Section..." : "Add Section"}
                        </button>

                        {branches.length === 0 && !loading && (
                            <p className="text-xs text-amber-600">
                                Add a branch first before creating a section.
                            </p>
                        )}
                    </form>
                </div>
            </div>

            {/* Branch List */}
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-200 p-5">
                    <h2 className="text-lg font-bold text-slate-900">
                        Branch Directory
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                        All registered college branches.
                    </p>
                </div>

                {loading ? (
                    <div className="p-8 text-center text-slate-500">
                        Loading branches...
                    </div>
                ) : branches.length === 0 ? (
                    <div className="p-8 text-center text-slate-500">
                        No branches found. Add your first branch above.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                                <tr>
                                    <th className="px-6 py-4">Branch Name</th>
                                    <th className="px-6 py-4">Branch Code</th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-slate-100">
                                {branches.map((branch) => (
                                    <tr key={branch._id} className="hover:bg-slate-50">
                                        <td className="px-6 py-4 font-semibold text-slate-800">
                                            {branch.name}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="rounded-lg bg-blue-50 px-3 py-1 font-semibold text-blue-700">
                                                {branch.code}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Section List */}
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-200 p-5">
                    <h2 className="text-lg font-bold text-slate-900">
                        Section Directory
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                        All registered academic sections.
                    </p>
                </div>

                {loading ? (
                    <div className="p-8 text-center text-slate-500">
                        Loading sections...
                    </div>
                ) : sections.length === 0 ? (
                    <div className="p-8 text-center text-slate-500">
                        No sections found. Add your first section above.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                                <tr>
                                    <th className="px-6 py-4">Section</th>
                                    <th className="px-6 py-4">Branch</th>
                                    <th className="px-6 py-4">Semester</th>
                                    <th className="px-6 py-4">Academic Year</th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-slate-100">
                                {sections.map((section) => (
                                    <tr key={section._id} className="hover:bg-slate-50">
                                        <td className="px-6 py-4 font-semibold text-slate-800">
                                            {section.name}
                                        </td>
                                        <td className="px-6 py-4 text-slate-600">
                                            {section.branchId?.name || "Unknown"}
                                            {section.branchId?.code
                                                ? ` (${section.branchId.code})`
                                                : ""}
                                        </td>
                                        <td className="px-6 py-4 text-slate-600">
                                            Semester {section.semester}
                                        </td>
                                        <td className="px-6 py-4 text-slate-600">
                                            {section.academicYear}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

        </div>
    );
};

export default BranchesSections;
