
import { useEffect, useMemo, useState } from "react";
import {
    UserPlus,
    Users,
    BookOpen,
    GraduationCap,
    Search,
    RefreshCw,
    AlertCircle,
    CheckCircle,
    X,
    ClipboardList
} from "lucide-react";

import api from "../../services/api";

const TeacherAssignments = () => {
    const [teachers, setTeachers] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [sections, setSections] = useState([]);
    const [assignments, setAssignments] = useState([]);

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [search, setSearch] = useState("");

    const [message, setMessage] = useState({
        type: "",
        text: ""
    });

    const [form, setForm] = useState({
        teacherId: "",
        sectionId: "",
        subjectId: ""
    });

    // Fetch all required data
    const fetchData = async () => {
        try {
            setLoading(true);
            setMessage({ type: "", text: "" });

            const [
                teacherResponse,
                subjectResponse,
                sectionResponse,
                assignmentResponse
            ] = await Promise.all([
                api.get("/admin/teachers"),
                api.get("/admin/subjects"),
                api.get("/admin/sections"),
                api.get("/admin/teacher-assignments")
            ]);

            setTeachers(teacherResponse.data.teachers || []);
            setSubjects(subjectResponse.data.subjects || []);
            setSections(sectionResponse.data.sections || []);
            setAssignments(assignmentResponse.data.assignments || []);

        } catch (error) {
            setMessage({
                type: "error",
                text: error.response?.data?.message ||
                    "Unable to load assignment data."
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Active teachers only
    const activeTeachers = useMemo(() => {
        return teachers.filter(
            (teacher) =>
                teacher.isActive &&
                teacher.userId?.isActive !== false
        );
    }, [teachers]);

    // Active sections only
    const activeSections = useMemo(() => {
        return sections.filter((section) => section.isActive);
    }, [sections]);

    // Selected section
    const selectedSection = activeSections.find(
        (section) => section._id === form.sectionId
    );

    // Filter subjects by selected section's branch and semester
    const availableSubjects = useMemo(() => {
        if (!selectedSection) return [];

        return subjects.filter((subject) => {
            const subjectBranchId =
                subject.branchId?._id || subject.branchId;

            const sectionBranchId =
                selectedSection.branchId?._id ||
                selectedSection.branchId;

            return (
                subject.isActive &&
                String(subjectBranchId) === String(sectionBranchId) &&
                Number(subject.semester) === Number(selectedSection.semester)
            );
        });
    }, [subjects, selectedSection]);

    // Handle form changes
    const handleChange = (e) => {
        const { name, value } = e.target;

        setForm((previous) => {
            if (name === "sectionId") {
                return {
                    ...previous,
                    sectionId: value,
                    subjectId: ""
                };
            }

            return {
                ...previous,
                [name]: value
            };
        });
    };

    // Create assignment
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!selectedSection) {
            setMessage({
                type: "error",
                text: "Please select a valid section."
            });
            return;
        }

        try {
            setSubmitting(true);
            setMessage({ type: "", text: "" });

            const response = await api.post(
                "/admin/teacher-assignments",
                {
                    teacherId: form.teacherId,
                    sectionId: form.sectionId,
                    subjectId: form.subjectId,
                    academicYear: selectedSection.academicYear
                }
            );

            setMessage({
                type: "success",
                text: response.data.message ||
                    "Teacher assigned successfully."
            });

            setForm({
                teacherId: "",
                sectionId: "",
                subjectId: ""
            });

            await fetchData();

        } catch (error) {
            setMessage({
                type: "error",
                text: error.response?.data?.message ||
                    "Unable to create teacher assignment."
            });
        } finally {
            setSubmitting(false);
        }
    };

    // Search assignments
    const filteredAssignments = useMemo(() => {
        const value = search.toLowerCase().trim();

        return assignments.filter((assignment) => {
            const teacherName =
                assignment.teacherId?.userId?.name || "";

            const employeeId =
                assignment.teacherId?.employeeId || "";

            const subjectName =
                assignment.subjectId?.name || "";

            const subjectCode =
                assignment.subjectId?.code || "";

            const sectionName =
                assignment.sectionId?.name || "";

            const branchName =
                assignment.sectionId?.branchId?.name || "";

            return [
                teacherName,
                employeeId,
                subjectName,
                subjectCode,
                sectionName,
                branchName,
                assignment.academicYear
            ].some((item) =>
                String(item).toLowerCase().includes(value)
            );
        });
    }, [assignments, search]);

    const activeAssignments = assignments.filter(
        (assignment) => assignment.isActive
    ).length;

    return (
        <div className="space-y-8">

            {/* Page Heading */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">
                        Teacher Assignments
                    </h1>
                    <p className="mt-1 text-sm text-slate-500">
                        Assign subjects and sections to teachers.
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

            {/* Notification */}
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
                        onClick={() => setMessage({
                            type: "",
                            text: ""
                        })}
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
                                Total Assignments
                            </p>
                            <h2 className="mt-2 text-3xl font-bold text-slate-800">
                                {assignments.length}
                            </h2>
                        </div>
                        <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
                            <ClipboardList size={24} />
                        </div>
                    </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-500">
                                Active Assignments
                            </p>
                            <h2 className="mt-2 text-3xl font-bold text-green-600">
                                {activeAssignments}
                            </h2>
                        </div>
                        <div className="rounded-xl bg-green-50 p-3 text-green-600">
                            <CheckCircle size={24} />
                        </div>
                    </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-500">
                                Active Teachers
                            </p>
                            <h2 className="mt-2 text-3xl font-bold text-purple-600">
                                {activeTeachers.length}
                            </h2>
                        </div>
                        <div className="rounded-xl bg-purple-50 p-3 text-purple-600">
                            <Users size={24} />
                        </div>
                    </div>
                </div>

            </div>

            {/* Assignment Form */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">

                <div className="mb-6 flex items-center gap-3">
                    <div className="rounded-lg bg-blue-50 p-3 text-blue-600">
                        <UserPlus size={22} />
                    </div>

                    <div>
                        <h2 className="text-lg font-bold text-slate-800">
                            Create New Assignment
                        </h2>
                        <p className="text-sm text-slate-500">
                            Select a teacher, section and subject.
                        </p>
                    </div>
                </div>

                {loading ? (
                    <p className="py-6 text-center text-slate-500">
                        Loading assignment data...
                    </p>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-5">

                        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

                            {/* Teacher */}
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-slate-700">
                                    Select Teacher *
                                </label>

                                <select
                                    name="teacherId"
                                    value={form.teacherId}
                                    onChange={handleChange}
                                    required
                                    className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 outline-none focus:border-blue-500"
                                >
                                    <option value="">
                                        Choose a teacher
                                    </option>

                                    {activeTeachers.map((teacher) => (
                                        <option
                                            key={teacher._id}
                                            value={teacher._id}
                                        >
                                            {teacher.userId?.name || "Unknown"} ({teacher.employeeId})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Section */}
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-slate-700">
                                    Select Section *
                                </label>

                                <select
                                    name="sectionId"
                                    value={form.sectionId}
                                    onChange={handleChange}
                                    required
                                    className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 outline-none focus:border-blue-500"
                                >
                                    <option value="">
                                        Choose a section
                                    </option>

                                    {activeSections.map((section) => (
                                        <option
                                            key={section._id}
                                            value={section._id}
                                        >
                                            {section.name} - Semester {section.semester} ({section.academicYear})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Subject */}
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-slate-700">
                                    Select Subject *
                                </label>

                                <select
                                    name="subjectId"
                                    value={form.subjectId}
                                    onChange={handleChange}
                                    required
                                    disabled={!form.sectionId || availableSubjects.length === 0}
                                    className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 outline-none focus:border-blue-500 disabled:cursor-not-allowed disabled:bg-slate-100"
                                >
                                    <option value="">
                                        {!form.sectionId
                                            ? "Select section first"
                                            : availableSubjects.length === 0
                                                ? "No matching subjects found"
                                                : "Choose a subject"}
                                    </option>

                                    {availableSubjects.map((subject) => (
                                        <option
                                            key={subject._id}
                                            value={subject._id}
                                        >
                                            {subject.name} ({subject.code})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Academic Year */}
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-slate-700">
                                    Academic Year
                                </label>

                                <input
                                    type="text"
                                    value={selectedSection?.academicYear || ""}
                                    placeholder="Automatically selected"
                                    readOnly
                                    className="w-full rounded-lg border border-slate-300 bg-slate-50 px-4 py-3 text-slate-600 outline-none"
                                />
                            </div>

                        </div>

                        {/* Selected Section Information */}
                        {selectedSection && (
                            <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
                                <p className="text-sm font-semibold text-blue-800">
                                    Selected Section Details
                                </p>

                                <p className="mt-2 text-sm text-blue-700">
                                    Branch: {selectedSection.branchId?.name || "Unknown"}
                                    {" | "}
                                    Semester: {selectedSection.semester}
                                    {" | "}
                                    Academic Year: {selectedSection.academicYear}
                                </p>
                            </div>
                        )}

                        {form.sectionId && availableSubjects.length === 0 && (
                            <p className="text-sm text-amber-700">
                                No active subjects match this section's branch and semester. Please check the subject records.
                            </p>
                        )}

                        <div className="flex justify-end border-t border-slate-100 pt-5">
                            <button
                                type="submit"
                                disabled={
                                    submitting ||
                                    !form.teacherId ||
                                    !form.sectionId ||
                                    !form.subjectId
                                }
                                className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <UserPlus size={18} />
                                {submitting
                                    ? "Assigning..."
                                    : "Assign Teacher"}
                            </button>
                        </div>

                    </form>
                )}

            </div>

            {/* Assignment Directory */}
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm">

                <div className="flex flex-col gap-4 border-b border-slate-200 p-6 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-slate-800">
                            Assignment Directory
                        </h2>
                        <p className="mt-1 text-sm text-slate-500">
                            All teacher-subject-section assignments.
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
                            placeholder="Search assignments..."
                            className="w-full rounded-lg border border-slate-300 py-2.5 pl-10 pr-4 outline-none focus:border-blue-500"
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="p-12 text-center text-slate-500">
                        Loading assignments...
                    </div>
                ) : filteredAssignments.length === 0 ? (
                    <div className="p-12 text-center">
                        <GraduationCap
                            size={40}
                            className="mx-auto mb-3 text-slate-300"
                        />

                        <p className="font-semibold text-slate-700">
                            No assignments found
                        </p>

                        <p className="mt-1 text-sm text-slate-500">
                            Create an assignment using the form above.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">

                            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                                <tr>
                                    <th className="px-6 py-4">Teacher</th>
                                    <th className="px-6 py-4">Subject</th>
                                    <th className="px-6 py-4">Section</th>
                                    <th className="px-6 py-4">Branch</th>
                                    <th className="px-6 py-4">Semester</th>
                                    <th className="px-6 py-4">Academic Year</th>
                                    <th className="px-6 py-4">Status</th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-slate-100">

                                {filteredAssignments.map((assignment) => {
                                    const teacher = assignment.teacherId;
                                    const user = teacher?.userId;
                                    const subject = assignment.subjectId;
                                    const section = assignment.sectionId;
                                    const branch = section?.branchId;

                                    return (
                                        <tr
                                            key={assignment._id}
                                            className="hover:bg-slate-50"
                                        >
                                            <td className="px-6 py-4">
                                                <p className="font-semibold text-slate-800">
                                                    {user?.name || "Unknown"}
                                                </p>
                                                <p className="mt-1 text-xs text-slate-500">
                                                    {teacher?.employeeId || "No ID"}
                                                </p>
                                            </td>

                                            <td className="px-6 py-4">
                                                <p className="font-semibold text-slate-800">
                                                    {subject?.name || "Unknown"}
                                                </p>
                                                <p className="mt-1 text-xs text-slate-500">
                                                    {subject?.code || "No code"}
                                                </p>
                                            </td>

                                            <td className="px-6 py-4 font-medium text-slate-700">
                                                {section?.name || "Unknown"}
                                            </td>

                                            <td className="px-6 py-4 text-slate-600">
                                                {branch?.code || branch?.name || "Unknown"}
                                            </td>

                                            <td className="px-6 py-4 text-slate-600">
                                                {section?.semester || subject?.semester || "-"}
                                            </td>

                                            <td className="px-6 py-4 text-slate-600">
                                                {assignment.academicYear}
                                            </td>

                                            <td className="px-6 py-4">
                                                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                    assignment.isActive
                                                        ? "bg-green-100 text-green-700"
                                                        : "bg-red-100 text-red-700"
                                                }`}>
                                                    {assignment.isActive
                                                        ? "Active"
                                                        : "Inactive"}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}

                            </tbody>
                        </table>
                    </div>
                )}

                <div className="border-t border-slate-100 px-6 py-4 text-sm text-slate-500">
                    Showing {filteredAssignments.length} of {assignments.length} assignments
                </div>

            </div>

        </div>
    );
};

export default TeacherAssignments;
