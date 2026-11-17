
import { useEffect, useMemo, useState } from "react";
import {
    Users,
    UserPlus,
    Search,
    RefreshCw,
    KeyRound,
    GraduationCap,
    Mail,
    AlertCircle,
    CheckCircle,
    Copy,
    X,
    FileSpreadsheet,
    Download,
    Upload,
    FileUp,
    ShieldCheck
} from "lucide-react";

import * as XLSX from "xlsx";
import api from "../../services/api";

const Students = () => {
    const [students, setStudents] = useState([]);
    const [branches, setBranches] = useState([]);
    const [sections, setSections] = useState([]);

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [resettingRoll, setResettingRoll] = useState("");

    const [search, setSearch] = useState("");

    const [message, setMessage] = useState({
        type: "",
        text: ""
    });

    const [temporaryPassword, setTemporaryPassword] = useState(null);

    // Bulk import states
    const [excelFile, setExcelFile] = useState(null);
    const [previewData, setPreviewData] = useState(null);
    const [importing, setImporting] = useState(false);
    const [previewLoading, setPreviewLoading] = useState(false);

    const [form, setForm] = useState({
        name: "",
        rollNumber: "",
        email: "",
        branchId: "",
        sectionId: ""
    });

    // Fetch students, branches and sections
    const fetchData = async () => {
        try {
            setLoading(true);

            const [studentResponse, branchResponse, sectionResponse] =
                await Promise.all([
                    api.get("/admin/students"),
                    api.get("/admin/branches"),
                    api.get("/admin/sections")
                ]);

            setStudents(studentResponse.data.students || []);
            setBranches(branchResponse.data.branches || []);
            setSections(sectionResponse.data.sections || []);

        } catch (error) {
            setMessage({
                type: "error",
                text:
                    error.response?.data?.message ||
                    "Unable to load student data."
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Sections belonging to selected branch
    const availableSections = useMemo(() => {
        if (!form.branchId) return [];

        return sections.filter((section) => {
            const branchId =
                section.branchId?._id || section.branchId;

            return String(branchId) === String(form.branchId);
        });
    }, [sections, form.branchId]);

    // Handle registration form changes
    const handleChange = (e) => {
        const { name, value } = e.target;

        setForm((previous) => ({
            ...previous,
            [name]: value
        }));
    };

    // Register one student
    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            setSubmitting(true);
            setMessage({ type: "", text: "" });
            setTemporaryPassword(null);

            const response = await api.post("/admin/students", {
                name: form.name.trim(),
                rollNumber: form.rollNumber.trim().toUpperCase(),
                email: form.email.trim(),
                sectionId: form.sectionId
            });

            setTemporaryPassword({
                rollNumber: response.data.student.rollNumber,
                password: response.data.temporaryPassword
            });

            setMessage({
                type: "success",
                text: response.data.message
            });

            setForm({
                name: "",
                rollNumber: "",
                email: "",
                branchId: "",
                sectionId: ""
            });

            await fetchData();

        } catch (error) {
            setMessage({
                type: "error",
                text:
                    error.response?.data?.message ||
                    "Unable to register student."
            });
        } finally {
            setSubmitting(false);
        }
    };

    // Reset student password
    const handleResetPassword = async (rollNumber) => {
        const confirmed = window.confirm(
            `Are you sure you want to reset the password for ${rollNumber}?`
        );

        if (!confirmed) return;

        try {
            setResettingRoll(rollNumber);

            const response = await api.post(
                `/admin/students/${encodeURIComponent(rollNumber)}/reset-password`
            );

            setTemporaryPassword({
                rollNumber: response.data.rollNumber,
                password: response.data.temporaryPassword
            });

            setMessage({
                type: "success",
                text: response.data.message
            });

            await fetchData();

        } catch (error) {
            setMessage({
                type: "error",
                text:
                    error.response?.data?.message ||
                    "Unable to reset student password."
            });
        } finally {
            setResettingRoll("");
        }
    };

    // Download Excel template
    const downloadTemplate = () => {
        const headers = [
            "Name",
            "Roll Number",
            "Email",
            "Branch Code",
            "Section",
            "Semester",
            "Academic Year"
        ];

        const worksheet = XLSX.utils.aoa_to_sheet([headers]);

        worksheet["!cols"] = [
            { wch: 25 },
            { wch: 18 },
            { wch: 30 },
            { wch: 15 },
            { wch: 12 },
            { wch: 12 },
            { wch: 18 }
        ];

        const workbook = XLSX.utils.book_new();

        XLSX.utils.book_append_sheet(
            workbook,
            worksheet,
            "Students"
        );

        XLSX.writeFile(workbook, "Student_Import_Template.xlsx");
    };

    // Select Excel file
    const handleFileChange = (e) => {
        const file = e.target.files?.[0];

        setPreviewData(null);
        setMessage({ type: "", text: "" });

        if (!file) {
            setExcelFile(null);
            return;
        }

        const extension = file.name
            .slice(file.name.lastIndexOf("."))
            .toLowerCase();

        if (![".xlsx", ".xls"].includes(extension)) {
            setExcelFile(null);
            e.target.value = "";

            setMessage({
                type: "error",
                text: "Please select an .xlsx or .xls Excel file."
            });

            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            setExcelFile(null);
            e.target.value = "";

            setMessage({
                type: "error",
                text: "File size must not exceed 5 MB."
            });

            return;
        }

        setExcelFile(file);
    };

    // Upload Excel and get preview
    const handlePreviewImport = async () => {
        if (!excelFile) {
            setMessage({
                type: "error",
                text: "Please select an Excel file first."
            });
            return;
        }

        try {
            setPreviewLoading(true);
            setPreviewData(null);
            setMessage({ type: "", text: "" });

            const formData = new FormData();
            formData.append("file", excelFile);

            const response = await api.post(
                "/admin/students/import/preview",
                formData
            );

            setPreviewData(response.data);

            setMessage({
                type: "success",
                text: response.data.message
            });

        } catch (error) {
            // Backend also returns preview details when all rows are invalid.
            const errorData = error.response?.data;

            if (errorData?.preview) {
                setPreviewData(errorData);
            }

            setMessage({
                type: "error",
                text:
                    errorData?.message ||
                    "Unable to validate the Excel file."
            });

        } finally {
            setPreviewLoading(false);
        }
    };

    // Download credentials workbook
    const downloadCredentials = (credentials) => {
        const rows = credentials.map((student) => ({
            "Student Name": student.name,
            "Roll Number": student.rollNumber,
            "Email": student.email || "",
            "Temporary Password": student.temporaryPassword
        }));

        const worksheet = XLSX.utils.json_to_sheet(rows);

        worksheet["!cols"] = [
            { wch: 25 },
            { wch: 18 },
            { wch: 30 },
            { wch: 25 }
        ];

        const workbook = XLSX.utils.book_new();

        XLSX.utils.book_append_sheet(
            workbook,
            worksheet,
            "Student Credentials"
        );

        XLSX.writeFile(
            workbook,
            "Student_Temporary_Credentials.xlsx"
        );
    };

    // Confirm bulk import
    const handleConfirmImport = async () => {
        if (!previewData?.importId || previewData.validCount === 0) {
            return;
        }

        const confirmed = window.confirm(
            `Import ${previewData.validCount} valid student records? Invalid rows will be skipped.`
        );

        if (!confirmed) return;

        try {
            setImporting(true);
            setMessage({ type: "", text: "" });

            const response = await api.post(
                "/admin/students/import/confirm",
                {
                    importId: previewData.importId
                }
            );

            // Generate the credentials Excel immediately.
            downloadCredentials(response.data.credentials || []);

            setMessage({
                type: "success",
                text: `${response.data.importedCount} students imported successfully. Credentials Excel downloaded.`
            });

            // Clear temporary import data.
            setExcelFile(null);
            setPreviewData(null);

            const fileInput = document.getElementById(
                "student-excel-file"
            );

            if (fileInput) fileInput.value = "";

            await fetchData();

        } catch (error) {
            setMessage({
                type: "error",
                text:
                    error.response?.data?.message ||
                    "Unable to import students."
            });
        } finally {
            setImporting(false);
        }
    };

    // Cancel preview
    const cancelPreview = () => {
        setPreviewData(null);
        setExcelFile(null);

        const fileInput = document.getElementById(
            "student-excel-file"
        );

        if (fileInput) fileInput.value = "";
    };

    // Filter students
    const filteredStudents = useMemo(() => {
        const value = search.toLowerCase().trim();

        return students.filter((student) => {
            const user = student.userId || {};

            const name = user.name || "";
            const rollNumber = student.rollNumber || "";
            const email = user.email || "";

            return (
                name.toLowerCase().includes(value) ||
                rollNumber.toLowerCase().includes(value) ||
                email.toLowerCase().includes(value)
            );
        });
    }, [students, search]);

    const activeStudents = students.filter(
        (student) => student.isActive
    ).length;

    const inactiveStudents = students.length - activeStudents;

    const closePasswordModal = () => {
        setTemporaryPassword(null);
    };

    return (
        <div className="space-y-8">

            {/* Page Heading */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">
                        Student Management
                    </h1>
                    <p className="mt-1 text-sm text-slate-500">
                        Register students and manage their academic accounts.
                    </p>
                </div>

                <button
                    onClick={fetchData}
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
                <div
                    className={`flex items-start gap-3 rounded-xl border p-4 ${
                        message.type === "success"
                            ? "border-green-200 bg-green-50 text-green-700"
                            : "border-red-200 bg-red-50 text-red-700"
                    }`}
                >
                    {message.type === "success" ? (
                        <CheckCircle size={20} />
                    ) : (
                        <AlertCircle size={20} />
                    )}

                    <p className="text-sm font-medium">
                        {message.text}
                    </p>

                    <button
                        onClick={() =>
                            setMessage({ type: "", text: "" })
                        }
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
                                Total Students
                            </p>
                            <h2 className="mt-2 text-3xl font-bold text-slate-800">
                                {students.length}
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
                                Active Students
                            </p>
                            <h2 className="mt-2 text-3xl font-bold text-green-600">
                                {activeStudents}
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
                                Inactive Students
                            </p>
                            <h2 className="mt-2 text-3xl font-bold text-red-600">
                                {inactiveStudents}
                            </h2>
                        </div>
                        <div className="rounded-xl bg-red-50 p-3 text-red-600">
                            <Users size={24} />
                        </div>
                    </div>
                </div>

            </div>

            {/* Bulk Excel Import */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">

                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-green-50 p-3 text-green-600">
                            <FileSpreadsheet size={23} />
                        </div>

                        <div>
                            <h2 className="text-lg font-bold text-slate-800">
                                Bulk Import Students
                            </h2>
                            <p className="text-sm text-slate-500">
                                Register multiple students using an Excel file.
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={downloadTemplate}
                        className="flex items-center justify-center gap-2 rounded-lg border border-green-200 px-4 py-2.5 text-sm font-semibold text-green-700 hover:bg-green-50"
                    >
                        <Download size={17} />
                        Download Excel Template
                    </button>
                </div>

                <div className="rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-6">

                    <div className="flex flex-col items-center text-center">
                        <div className="mb-3 rounded-full bg-blue-100 p-4 text-blue-600">
                            <Upload size={26} />
                        </div>

                        <h3 className="font-semibold text-slate-800">
                            Upload Student Excel File
                        </h3>

                        <p className="mt-1 text-sm text-slate-500">
                            Supported formats: .xlsx and .xls
                        </p>

                        <p className="text-xs text-slate-400">
                            Maximum file size: 5 MB
                        </p>

                        <input
                            id="student-excel-file"
                            type="file"
                            accept=".xlsx,.xls"
                            onChange={handleFileChange}
                            className="mt-5 block w-full max-w-sm text-sm text-slate-600 file:mr-4 file:rounded-lg file:border-0 file:bg-blue-600 file:px-4 file:py-2.5 file:font-semibold file:text-white hover:file:bg-blue-700"
                        />

                        {excelFile && (
                            <div className="mt-4 flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm text-slate-700 shadow-sm">
                                <FileSpreadsheet
                                    size={18}
                                    className="text-green-600"
                                />
                                <span className="font-medium">
                                    {excelFile.name}
                                </span>
                                <span className="text-xs text-slate-400">
                                    ({(excelFile.size / 1024).toFixed(1)} KB)
                                </span>
                            </div>
                        )}

                        <button
                            type="button"
                            onClick={handlePreviewImport}
                            disabled={!excelFile || previewLoading}
                            className="mt-5 flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <FileUp size={18} />
                            {previewLoading
                                ? "Validating Excel..."
                                : "Upload & Preview"}
                        </button>
                    </div>
                </div>

                {/* Preview Results */}
                {previewData && (
                    <div className="mt-6 space-y-5">

                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h3 className="text-lg font-bold text-slate-800">
                                    Import Preview
                                </h3>
                                <p className="text-sm text-slate-500">
                                    Review the records before confirming import.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={cancelPreview}
                                disabled={importing}
                                className="flex items-center gap-2 self-start rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                            >
                                <X size={16} />
                                Cancel
                            </button>
                        </div>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">

                            <div className="rounded-lg border border-slate-200 p-4">
                                <p className="text-sm text-slate-500">
                                    Total Rows
                                </p>
                                <p className="mt-1 text-2xl font-bold text-slate-800">
                                    {previewData.totalRows ?? 0}
                                </p>
                            </div>

                            <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                                <p className="text-sm text-green-700">
                                    Valid Rows
                                </p>
                                <p className="mt-1 text-2xl font-bold text-green-700">
                                    {previewData.validCount ?? 0}
                                </p>
                            </div>

                            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                                <p className="text-sm text-red-700">
                                    Invalid Rows
                                </p>
                                <p className="mt-1 text-2xl font-bold text-red-700">
                                    {previewData.invalidCount ?? 0}
                                </p>
                            </div>

                        </div>

                        <div className="overflow-x-auto rounded-xl border border-slate-200">
                            <table className="w-full min-w-[900px] text-left text-sm">

                                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                                    <tr>
                                        <th className="px-4 py-3">Excel Row</th>
                                        <th className="px-4 py-3">Student</th>
                                        <th className="px-4 py-3">Roll Number</th>
                                        <th className="px-4 py-3">Email</th>
                                        <th className="px-4 py-3">Section</th>
                                        <th className="px-4 py-3">Status / Errors</th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-slate-100">
                                    {(previewData.preview || []).map((row) => (
                                        <tr key={row.rowNumber}>
                                            <td className="px-4 py-3 text-slate-500">
                                                {row.rowNumber}
                                            </td>

                                            <td className="px-4 py-3 font-medium text-slate-800">
                                                {row.name || "-"}
                                            </td>

                                            <td className="px-4 py-3">
                                                {row.rollNumber || "-"}
                                            </td>

                                            <td className="px-4 py-3">
                                                {row.email || "-"}
                                            </td>

                                            <td className="px-4 py-3">
                                                {row.branchCode || "-"} / {row.sectionName || "-"}
                                            </td>

                                            <td className="px-4 py-3">
                                                {row.valid ? (
                                                    <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                                                        <CheckCircle size={13} />
                                                        Valid
                                                    </span>
                                                ) : (
                                                    <div className="space-y-1">
                                                        <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
                                                            <AlertCircle size={13} />
                                                            Invalid
                                                        </span>

                                                        {(row.errors || []).map((error, index) => (
                                                            <p
                                                                key={index}
                                                                className="text-xs text-red-600"
                                                            >
                                                                • {error}
                                                            </p>
                                                        ))}
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>

                            </table>
                        </div>

                        {previewData.invalidCount > 0 && (
                            <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-800">
                                <AlertCircle size={20} className="shrink-0" />
                                <p className="text-sm">
                                    Invalid rows will not be imported. Only the valid rows will be created when you confirm.
                                </p>
                            </div>
                        )}

                        <div className="flex flex-col gap-3 rounded-xl bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">

                            <div className="flex items-start gap-2 text-sm text-slate-600">
                                <ShieldCheck
                                    size={19}
                                    className="shrink-0 text-green-600"
                                />
                                <span>
                                    Temporary passwords will be generated and downloaded in a separate credentials Excel file.
                                </span>
                            </div>

                            <button
                                type="button"
                                onClick={handleConfirmImport}
                                disabled={
                                    importing ||
                                    !previewData.importId ||
                                    previewData.validCount === 0
                                }
                                className="flex shrink-0 items-center justify-center gap-2 rounded-lg bg-green-600 px-6 py-3 font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <CheckCircle size={18} />
                                {importing
                                    ? "Importing Students..."
                                    : `Confirm Import (${previewData.validCount || 0})`}
                            </button>
                        </div>

                    </div>
                )}

            </div>

            {/* Individual Student Registration */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">

                <div className="mb-6 flex items-center gap-3">
                    <div className="rounded-lg bg-blue-50 p-3 text-blue-600">
                        <UserPlus size={22} />
                    </div>

                    <div>
                        <h2 className="text-lg font-bold text-slate-800">
                            Register New Student
                        </h2>
                        <p className="text-sm text-slate-500">
                            Create an individual student login account and academic profile.
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">

                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

                        <div>
                            <label className="mb-2 block text-sm font-semibold text-slate-700">
                                Student Name *
                            </label>
                            <input
                                type="text"
                                name="name"
                                value={form.name}
                                onChange={handleChange}
                                placeholder="Enter student name"
                                required
                                className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            />
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-semibold text-slate-700">
                                Roll Number *
                            </label>
                            <input
                                type="text"
                                name="rollNumber"
                                value={form.rollNumber}
                                onChange={handleChange}
                                placeholder="e.g. 24001001001"
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
                                placeholder="student@example.com (optional)"
                                className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            />
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-semibold text-slate-700">
                                Branch *
                            </label>
                            <select
                                name="branchId"
                                value={form.branchId}
                                onChange={(e) => {
                                    setForm((previous) => ({
                                        ...previous,
                                        branchId: e.target.value,
                                        sectionId: ""
                                    }));
                                }}
                                required
                                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            >
                                <option value="">Select Branch</option>

                                {branches.map((branch) => (
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
                            <label className="mb-2 block text-sm font-semibold text-slate-700">
                                Section *
                            </label>
                            <select
                                name="sectionId"
                                value={form.sectionId}
                                onChange={handleChange}
                                required
                                disabled={!form.branchId}
                                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                            >
                                <option value="">
                                    {form.branchId
                                        ? "Select Section"
                                        : "Select Branch First"}
                                </option>

                                {availableSections.map((section) => (
                                    <option
                                        key={section._id}
                                        value={section._id}
                                    >
                                        Section {section.name} - Semester {section.semester} ({section.academicYear})
                                    </option>
                                ))}
                            </select>
                        </div>

                    </div>

                    <div className="flex justify-end border-t border-slate-100 pt-5">
                        <button
                            type="submit"
                            disabled={submitting}
                            className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            <UserPlus size={18} />
                            {submitting ? "Registering..." : "Register Student"}
                        </button>
                    </div>

                </form>
            </div>

            {/* Student Directory */}
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm">

                <div className="flex flex-col gap-4 border-b border-slate-200 p-6 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-slate-800">
                            Student Directory
                        </h2>
                        <p className="mt-1 text-sm text-slate-500">
                            All registered student accounts.
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
                            placeholder="Search name or roll number..."
                            className="w-full rounded-lg border border-slate-300 py-2.5 pl-10 pr-4 outline-none focus:border-blue-500"
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="p-12 text-center text-slate-500">
                        Loading students...
                    </div>
                ) : filteredStudents.length === 0 ? (
                    <div className="p-12 text-center">
                        <Users
                            size={40}
                            className="mx-auto mb-3 text-slate-300"
                        />
                        <p className="font-semibold text-slate-700">
                            No students found
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                            Register a student or try another search.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">

                            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                                <tr>
                                    <th className="px-6 py-4">Student</th>
                                    <th className="px-6 py-4">Roll Number</th>
                                    <th className="px-6 py-4">Branch & Section</th>
                                    <th className="px-6 py-4">Semester</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Action</th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-slate-100">

                                {filteredStudents.map((student) => {
                                    const user = student.userId || {};
                                    const section = student.sectionId || {};
                                    const branch = section.branchId || {};

                                    return (
                                        <tr
                                            key={student._id}
                                            className="hover:bg-slate-50"
                                        >
                                            <td className="px-6 py-4">
                                                <div className="font-semibold text-slate-800">
                                                    {user.name || "Unknown"}
                                                </div>
                                                <div className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                                                    <Mail size={12} />
                                                    {user.email || "No email"}
                                                </div>
                                            </td>

                                            <td className="px-6 py-4 font-medium text-slate-700">
                                                {student.rollNumber}
                                            </td>

                                            <td className="px-6 py-4">
                                                <div className="font-medium text-slate-700">
                                                    {branch.name || "Unknown"}
                                                </div>
                                                <div className="mt-1 text-xs text-slate-500">
                                                    Section {section.name || "-"}
                                                </div>
                                            </td>

                                            <td className="px-6 py-4 text-slate-600">
                                                {section.semester
                                                    ? `Semester ${section.semester}`
                                                    : "-"}
                                                <div className="mt-1 text-xs text-slate-400">
                                                    {section.academicYear || ""}
                                                </div>
                                            </td>

                                            <td className="px-6 py-4">
                                                <span
                                                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                        student.isActive
                                                            ? "bg-green-100 text-green-700"
                                                            : "bg-red-100 text-red-700"
                                                    }`}
                                                >
                                                    {student.isActive
                                                        ? "Active"
                                                        : "Inactive"}
                                                </span>
                                            </td>

                                            <td className="px-6 py-4">
                                                <button
                                                    onClick={() =>
                                                        handleResetPassword(student.rollNumber)
                                                    }
                                                    disabled={
                                                        !student.isActive ||
                                                        resettingRoll === student.rollNumber
                                                    }
                                                    className="flex items-center gap-2 rounded-lg border border-blue-200 px-3 py-2 text-xs font-semibold text-blue-600 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
                                                >
                                                    <KeyRound size={14} />
                                                    {resettingRoll === student.rollNumber
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
                    Showing {filteredStudents.length} of {students.length} students
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
                                        Student account credentials
                                    </p>
                                </div>
                            </div>

                            <button
                                onClick={closePasswordModal}
                                className="text-slate-400 hover:text-slate-700"
                            >
                                <X size={22} />
                            </button>
                        </div>

                        <div className="space-y-4 rounded-xl bg-slate-50 p-4">

                            <div>
                                <p className="text-xs font-semibold text-slate-500">
                                    ROLL NUMBER
                                </p>
                                <p className="mt-1 font-bold text-slate-800">
                                    {temporaryPassword.rollNumber}
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
                            Save this password and share it securely with the student. It may not be shown again.
                        </p>

                        <button
                            onClick={closePasswordModal}
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

export default Students;
