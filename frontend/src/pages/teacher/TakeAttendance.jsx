
import { useEffect, useMemo, useState } from "react";
import {
    ClipboardCheck,
    Users,
    CheckCircle2,
    XCircle,
    Clock,
    Plus,
    RefreshCw,
    Send,
    LoaderCircle,
    AlertCircle,
    BookOpen
} from "lucide-react";
import teacherService from "../../services/teacherService";

// Helper functions
const getId = (value) => {
    if (!value) return "";
    if (typeof value === "string") return value;
    return value._id || value.id || "";
};

const getAssignments = (data) => data?.assignments || [];

const getSessionId = (data) =>
    getId(data?.session) ||
    getId(data?.attendanceSession) ||
    data?.sessionId ||
    data?.attendanceSessionId ||
    getId(data);

const getRecords = (data) =>
    data?.attendance ||
    data?.records ||
    data?.attendanceRecords ||
    data?.attendanceSession?.records ||
    [];

const getStudentName = (record) =>
    record.name ||
    record.studentId?.userId?.name ||
    record.student?.name ||
    "Student";

const getRollNumber = (record) =>
    record.rollNumber ||
    record.studentId?.rollNumber ||
    record.student?.rollNumber ||
    "N/A";

const getAssignmentSubject = (assignment) =>
    assignment.subjectId || assignment.subject || {};

const getAssignmentSection = (assignment) =>
    assignment.sectionId || assignment.section || {};

// Main component
const TakeAttendance = () => {
    const [assignments, setAssignments] = useState([]);
    const [draftSessions, setDraftSessions] = useState([]);

    const [selectedAssignment, setSelectedAssignment] = useState("");
    const [period, setPeriod] = useState("1");

    const [sessionId, setSessionId] = useState(null);
    const [session, setSession] = useState(null);
    const [records, setRecords] = useState([]);

    const [loadingAssignments, setLoadingAssignments] = useState(true);
    const [creating, setCreating] = useState(false);
    const [loadingSession, setLoadingSession] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [markingId, setMarkingId] = useState(null);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // Load assignments and existing draft sessions
    const loadAssignments = async () => {
        setLoadingAssignments(true);
        setError("");

        try {
            const response = await teacherService.getMyAssignments();
            const list = getAssignments(response);

            setAssignments(list);

            if (list.length > 0) {
                setSelectedAssignment((previous) =>
                    previous || getId(list[0]._id)
                );
            }

            const sessionsResponse =
                await teacherService.getAttendanceSessions({
                    limit: 50
                });

            const allSessions = sessionsResponse.sessions || [];

            const drafts = allSessions.filter(
                (item) => item.status === "DRAFT"
            );

            setDraftSessions(drafts);
        } catch (err) {
            setError(
                err.response?.data?.message ||
                err.message ||
                "Unable to load assignments or attendance sessions."
            );
        } finally {
            setLoadingAssignments(false);
        }
    };

    useEffect(() => {
        loadAssignments();
    }, []);

    // Selected assignment details
    const currentAssignment = assignments.find(
        (item) => getId(item._id) === selectedAssignment
    );

    const subject = currentAssignment
        ? getAssignmentSubject(currentAssignment)
        : {};

    const section = currentAssignment
        ? getAssignmentSection(currentAssignment)
        : {};

    // Attendance summary
    const summary = useMemo(() => {
        return records.reduce(
            (result, record) => {
                const status = record.status;

                if (status === "PRESENT") result.present++;
                else if (status === "ABSENT") result.absent++;
                else result.notMarked++;

                return result;
            },
            { present: 0, absent: 0, notMarked: 0 }
        );
    }, [records]);

    // Load an existing attendance session
    const loadSession = async (id) => {
        setLoadingSession(true);
        setError("");
        setSuccess("");

        try {
            const response =
                await teacherService.getAttendanceSession(id);

            const loadedRecords = getRecords(response);

            const loadedSession =
                response.session ||
                response.attendanceSession ||
                response;

            setSession(loadedSession);
            setRecords(loadedRecords);
            setSessionId(id);

            if (loadedSession.period) {
                setPeriod(String(loadedSession.period));
            }
        } catch (err) {
            setError(
                err.response?.data?.message ||
                err.message ||
                "Unable to load attendance session."
            );
        } finally {
            setLoadingSession(false);
        }
    };

    // Create a new attendance session
    const handleCreateSession = async (event) => {
        event.preventDefault();

        if (!currentAssignment) {
            setError("Please select an assignment.");
            return;
        }

        if (!period || Number(period) < 1) {
            setError("Please enter a valid period number.");
            return;
        }

        setCreating(true);
        setError("");
        setSuccess("");
        setSessionId(null);
        setSession(null);
        setRecords([]);

        try {
            const response =
                await teacherService.createAttendanceSession({
                    subjectId: getId(
                        currentAssignment.subjectId ||
                        currentAssignment.subject
                    ),
                    sectionId: getId(
                        currentAssignment.sectionId ||
                        currentAssignment.section
                    ),
                    period: Number(period)
                });

            const newSessionId = getSessionId(response);

            if (!newSessionId) {
                throw new Error(
                    "Session was created, but its ID was not returned."
                );
            }

            setSuccess("Attendance session created successfully.");

            await loadSession(newSessionId);
            await loadAssignments();
        } catch (err) {
            setError(
                err.response?.data?.message ||
                err.message ||
                "Unable to create attendance session."
            );
        } finally {
            setCreating(false);
        }
    };

    // Mark student attendance
    const handleMarkAttendance = async (record, status) => {
        const recordId = getId(record._id || record.recordId);

        if (!sessionId || !recordId || session?.status === "SUBMITTED") {
            return;
        }

        setMarkingId(recordId);
        setError("");
        setSuccess("");

        try {
            await teacherService.markAttendance(
                sessionId,
                recordId,
                status
            );

            setRecords((previous) =>
                previous.map((item) =>
                    getId(item._id || item.recordId) === recordId
                        ? { ...item, status }
                        : item
                )
            );
        } catch (err) {
            setError(
                err.response?.data?.message ||
                err.message ||
                "Unable to update attendance."
            );
        } finally {
            setMarkingId(null);
        }
    };

    // Submit and lock attendance
    const handleSubmitAttendance = async () => {
        if (!sessionId) return;

        const confirmed = window.confirm(
            "Are you sure you want to submit attendance? All remaining Not Marked students will automatically be marked Absent. You cannot edit this session afterward."
        );

        if (!confirmed) return;

        setSubmitting(true);
        setError("");
        setSuccess("");

        try {
            await teacherService.submitAttendance(sessionId);

            setSuccess("Attendance submitted successfully.");

            await loadSession(sessionId);
            await loadAssignments();
        } catch (err) {
            setError(
                err.response?.data?.message ||
                err.message ||
                "Unable to submit attendance."
            );
        } finally {
            setSubmitting(false);
        }
    };

    const isSubmitted = session?.status === "SUBMITTED";

    return (
        <div className="space-y-6">

            {/* Page Header */}
            <div>
                <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
                    <span>Teacher Portal</span>
                    <span>/</span>
                    <span className="text-slate-800 font-medium">
                        Take Attendance
                    </span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">
                            Take Attendance
                        </h1>
                        <p className="text-sm text-slate-500 mt-1">
                            Create a session and mark student attendance.
                        </p>
                    </div>

                    <button
                        onClick={loadAssignments}
                        disabled={loadingAssignments}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                    >
                        <RefreshCw
                            size={16}
                            className={loadingAssignments ? "animate-spin" : ""}
                        />
                        Refresh
                    </button>
                </div>
            </div>

            {/* Notifications */}
            {error && (
                <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    <AlertCircle size={19} className="shrink-0 mt-0.5" />
                    <p>{error}</p>
                </div>
            )}

            {success && (
                <div className="flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
                    <CheckCircle2 size={19} className="shrink-0 mt-0.5" />
                    <p>{success}</p>
                </div>
            )}

            {/* Existing Draft Sessions */}
            {!sessionId && draftSessions.length > 0 && (
                <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-7 shadow-sm">
                    <h2 className="font-bold text-lg text-slate-900 mb-1">
                        Existing Draft Sessions
                    </h2>

                    <p className="text-sm text-slate-500 mb-5">
                        Open an unfinished attendance session to continue or submit it.
                    </p>

                    <div className="space-y-3">
                        {draftSessions.map((draft) => (
                            <div
                                key={draft._id}
                                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl border border-slate-200 p-4"
                            >
                                <div>
                                    <p className="font-semibold text-slate-800">
                                        {draft.subjectId?.name ||
                                            draft.subjectId?.code ||
                                            "Subject"}
                                    </p>

                                    <p className="text-sm text-slate-500 mt-1">
                                        Section {draft.sectionId?.name || "N/A"}
                                        {" • "}
                                        Period {draft.period}
                                    </p>

                                    <p className="text-xs text-slate-400 mt-1">
                                        {draft.date
                                            ? new Date(draft.date).toLocaleString()
                                            : ""}
                                    </p>
                                </div>

                                <button
                                    onClick={() => loadSession(draft._id)}
                                    disabled={loadingSession}
                                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {loadingSession ? (
                                        <LoaderCircle size={16} className="animate-spin" />
                                    ) : (
                                        <ClipboardCheck size={16} />
                                    )}
                                    Open Session
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Create Session */}
            {!sessionId && (
                <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-7 shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
                            <ClipboardCheck size={22} />
                        </div>

                        <div>
                            <h2 className="font-bold text-lg text-slate-900">
                                Create Attendance Session
                            </h2>
                            <p className="text-sm text-slate-500">
                                Select your assigned subject and section.
                            </p>
                        </div>
                    </div>

                    {loadingAssignments ? (
                        <div className="flex items-center gap-2 py-6 text-slate-500">
                            <LoaderCircle className="animate-spin" size={19} />
                            Loading assignments...
                        </div>
                    ) : assignments.length === 0 ? (
                        <div className="rounded-xl bg-amber-50 p-4 text-sm text-amber-700">
                            No active assignments found. Contact the administrator.
                        </div>
                    ) : (
                        <form
                            onSubmit={handleCreateSession}
                            className="space-y-5"
                        >
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Assigned Subject and Section
                                </label>

                                <select
                                    value={selectedAssignment}
                                    onChange={(e) =>
                                        setSelectedAssignment(e.target.value)
                                    }
                                    required
                                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                >
                                    {assignments.map((assignment) => {
                                        const sub = getAssignmentSubject(assignment);
                                        const sec = getAssignmentSection(assignment);

                                        return (
                                            <option
                                                key={getId(assignment._id)}
                                                value={getId(assignment._id)}
                                            >
                                                {sub.name ||
                                                    sub.subjectName ||
                                                    sub.title ||
                                                    sub.code ||
                                                    "Subject"}
                                                {" - "}
                                                {sec.name || sec.section || "Section"}
                                            </option>
                                        );
                                    })}
                                </select>
                            </div>

                            {currentAssignment && (
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <div className="rounded-xl bg-slate-50 p-4">
                                        <p className="text-xs text-slate-500 mb-1">
                                            Subject
                                        </p>
                                        <p className="font-semibold text-sm text-slate-800">
                                            {subject.name ||
                                                subject.subjectName ||
                                                subject.title ||
                                                subject.code ||
                                                "N/A"}
                                        </p>
                                        <p className="text-xs text-slate-500 mt-1">
                                            {subject.code || ""}
                                        </p>
                                    </div>

                                    <div className="rounded-xl bg-slate-50 p-4">
                                        <p className="text-xs text-slate-500 mb-1">
                                            Section
                                        </p>
                                        <p className="font-semibold text-sm text-slate-800">
                                            {section.name || section.section || "N/A"}
                                        </p>
                                        <p className="text-xs text-slate-500 mt-1">
                                            {section.branchId?.code ||
                                                section.branchCode ||
                                                ""}
                                        </p>
                                    </div>

                                    <div className="rounded-xl bg-slate-50 p-4">
                                        <p className="text-xs text-slate-500 mb-1">
                                            Academic Year
                                        </p>
                                        <p className="font-semibold text-sm text-slate-800">
                                            {currentAssignment.academicYear ||
                                                section.academicYear ||
                                                "N/A"}
                                        </p>
                                        <p className="text-xs text-slate-500 mt-1">
                                            Semester {section.semester || "N/A"}
                                        </p>
                                    </div>
                                </div>
                            )}

                            <div className="max-w-xs">
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Period Number
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    value={period}
                                    onChange={(e) => setPeriod(e.target.value)}
                                    required
                                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                    placeholder="Enter period number"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={creating || !selectedAssignment}
                                className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                            >
                                {creating ? (
                                    <>
                                        <LoaderCircle className="animate-spin" size={18} />
                                        Creating Session...
                                    </>
                                ) : (
                                    <>
                                        <Plus size={18} />
                                        Create Attendance Session
                                    </>
                                )}
                            </button>
                        </form>
                    )}
                </div>
            )}

            {/* Session Loading */}
            {loadingSession && (
                <div className="flex items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white p-10 text-slate-500">
                    <LoaderCircle className="animate-spin" />
                    Loading student roster...
                </div>
            )}

            {/* Attendance Session */}
            {sessionId && !loadingSession && (
                <>
                    {/* Session Information */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <BookOpen size={18} className="text-blue-600" />
                                    <span className="text-sm font-semibold text-slate-500">
                                        Attendance Session
                                    </span>
                                </div>

                                <h2 className="text-xl font-bold text-slate-900">
                                    {session?.subjectId?.name ||
                                        subject.name ||
                                        subject.subjectName ||
                                        subject.title ||
                                        subject.code ||
                                        "Attendance"}
                                </h2>

                                <p className="text-sm text-slate-500 mt-1">
                                    Section {session?.sectionId?.name ||
                                        section.name ||
                                        section.section ||
                                        "N/A"}
                                    {" • "}
                                    Period {session?.period || period}
                                </p>
                            </div>

                            <span
                                className={`w-fit rounded-full px-3 py-1.5 text-xs font-bold ${
                                    isSubmitted
                                        ? "bg-green-100 text-green-700"
                                        : "bg-amber-100 text-amber-700"
                                }`}
                            >
                                {session?.status || "DRAFT"}
                            </span>
                        </div>
                    </div>

                    {/* Summary Cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                        <SummaryCard
                            title="Total Students"
                            value={records.length}
                            icon={<Users size={20} />}
                            color="blue"
                        />
                        <SummaryCard
                            title="Present"
                            value={summary.present}
                            icon={<CheckCircle2 size={20} />}
                            color="green"
                        />
                        <SummaryCard
                            title="Absent"
                            value={summary.absent}
                            icon={<XCircle size={20} />}
                            color="red"
                        />
                        <SummaryCard
                            title="Not Marked"
                            value={summary.notMarked}
                            icon={<Clock size={20} />}
                            color="amber"
                        />
                    </div>

                    {/* Student Roster */}
                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 p-5">
                            <div>
                                <h2 className="font-bold text-lg text-slate-900">
                                    Student Attendance
                                </h2>
                                <p className="text-sm text-slate-500 mt-1">
                                    Mark each student as Present or Absent.
                                </p>
                            </div>

                            <span className="text-sm font-semibold text-slate-600">
                                {records.length} Students
                            </span>
                        </div>

                        {records.length === 0 ? (
                            <div className="p-10 text-center text-slate-500">
                                No student records found for this session.
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[650px] text-left">
                                    <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                                        <tr>
                                            <th className="px-5 py-4">Student</th>
                                            <th className="px-5 py-4">Roll Number</th>
                                            <th className="px-5 py-4">Status</th>
                                            <th className="px-5 py-4 text-right">Action</th>
                                        </tr>
                                    </thead>

                                    <tbody className="divide-y divide-slate-100">
                                        {records.map((record) => {
                                            const recordId = getId(
                                                record._id || record.recordId
                                            );
                                            const status = record.status || "NOT_MARKED";
                                            const busy = markingId === recordId;

                                            return (
                                                <tr
                                                    key={recordId}
                                                    className="hover:bg-slate-50"
                                                >
                                                    <td className="px-5 py-4">
                                                        <p className="font-semibold text-sm text-slate-800">
                                                            {getStudentName(record)}
                                                        </p>
                                                    </td>

                                                    <td className="px-5 py-4 text-sm text-slate-600">
                                                        {getRollNumber(record)}
                                                    </td>

                                                    <td className="px-5 py-4">
                                                        <StatusBadge status={status} />
                                                    </td>

                                                    <td className="px-5 py-4">
                                                        <div className="flex justify-end gap-2">
                                                            <button
                                                                onClick={() =>
                                                                    handleMarkAttendance(
                                                                        record,
                                                                        "PRESENT"
                                                                    )
                                                                }
                                                                disabled={
                                                                    busy ||
                                                                    isSubmitted ||
                                                                    status === "PRESENT"
                                                                }
                                                                className="rounded-lg bg-green-50 px-3 py-2 text-xs font-semibold text-green-700 hover:bg-green-100 disabled:opacity-40"
                                                            >
                                                                {busy ? "Saving..." : "Present"}
                                                            </button>

                                                            <button
                                                                onClick={() =>
                                                                    handleMarkAttendance(
                                                                        record,
                                                                        "ABSENT"
                                                                    )
                                                                }
                                                                disabled={
                                                                    busy ||
                                                                    isSubmitted ||
                                                                    status === "ABSENT"
                                                                }
                                                                className="rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-40"
                                                            >
                                                                Absent
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* Submit Footer */}
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-slate-100 bg-slate-50 p-5">
                            <div className="text-sm text-slate-600">
                                {isSubmitted
                                    ? "This attendance session has been submitted and locked."
                                    : `${summary.notMarked} student(s) still not marked.`}
                            </div>

                            {!isSubmitted && (
                                <button
                                    onClick={handleSubmitAttendance}
                                    disabled={submitting || records.length === 0}
                                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {submitting ? (
                                        <>
                                            <LoaderCircle className="animate-spin" size={18} />
                                            Submitting...
                                        </>
                                    ) : (
                                        <>
                                            <Send size={17} />
                                            Submit Attendance
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                    </div>

                    <button
                        onClick={() => {
                            setSessionId(null);
                            setSession(null);
                            setRecords([]);
                            setError("");
                            setSuccess("");
                        }}
                        className="text-sm font-semibold text-blue-600 hover:text-blue-800"
                    >
                        + Back to Sessions
                    </button>
                </>
            )}
        </div>
    );
};

// Summary card
const SummaryCard = ({ title, value, icon, color }) => {
    const styles = {
        blue: "bg-blue-50 text-blue-600",
        green: "bg-green-50 text-green-600",
        red: "bg-red-50 text-red-600",
        amber: "bg-amber-50 text-amber-600"
    };

    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div
                className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${styles[color]}`}
            >
                {icon}
            </div>
            <p className="text-sm text-slate-500">{title}</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
        </div>
    );
};

// Attendance status badge
const StatusBadge = ({ status }) => {
    const styles = {
        PRESENT: "bg-green-100 text-green-700",
        ABSENT: "bg-red-100 text-red-700",
        NOT_MARKED: "bg-slate-100 text-slate-600"
    };

    const labels = {
        PRESENT: "Present",
        ABSENT: "Absent",
        NOT_MARKED: "Not Marked"
    };

    return (
        <span
            className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${
                styles[status] || styles.NOT_MARKED
            }`}
        >
            {labels[status] || status}
        </span>
    );
};

export default TakeAttendance;
