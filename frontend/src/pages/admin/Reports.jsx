
import { useEffect, useMemo, useState } from "react";
import {
    BarChart3,
    BookOpen,
    CalendarDays,
    Users,
    Download,
    RefreshCw,
    Search,
    Filter
} from "lucide-react";
import api from "../../services/api";

const tabs = [
    { id: "sections", label: "Section-wise", icon: Users },
    { id: "subjects", label: "Subject-wise", icon: BookOpen },
    { id: "students", label: "Student-wise", icon: Users },
    { id: "daily", label: "Daily Reports", icon: CalendarDays }
];

const exportCSV = (rows, filename) => {
    if (!rows.length) return;

    const headers = Object.keys(rows[0]);
    const csv = [
        headers.join(","),
        ...rows.map((row) =>
            headers.map((header) =>
                `"${String(row[header] ?? "").replace(/"/g, '""')}"`
            ).join(",")
        )
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csv], {
        type: "text/csv;charset=utf-8;"
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
};

const formatDate = (date) => {
    if (!date) return "-";

    return new Date(date).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
};

const percentageColor = (value) => {
    if (Number(value) >= 75) return "text-green-600 bg-green-50";
    if (Number(value) >= 60) return "text-yellow-700 bg-yellow-50";
    return "text-red-600 bg-red-50";
};

function StatCard({ title, value, description }) {
    return (
        <div className="bg-white border border-gray-200 rounded-xl p-5">
            <p className="text-sm text-gray-500">{title}</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-2">
                {value}
            </h3>
            <p className="text-xs text-gray-400 mt-1">{description}</p>
        </div>
    );
}

export default function Reports() {
    const [activeTab, setActiveTab] = useState("sections");
    const [reports, setReports] = useState([]);
    const [branches, setBranches] = useState([]);
    const [sections, setSections] = useState([]);

    const [branchId, setBranchId] = useState("");
    const [semester, setSemester] = useState("");
    const [sectionId, setSectionId] = useState("");
    const [rollNumber, setRollNumber] = useState("");
    const [search, setSearch] = useState("");

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        const loadFilters = async () => {
            try {
                const [branchResponse, sectionResponse] = await Promise.all([
                    api.get("/admin/branches"),
                    api.get("/admin/sections")
                ]);

                setBranches(branchResponse.data.branches || []);
                setSections(sectionResponse.data.sections || []);
            } catch (err) {
                console.error("Report filter loading error:", err);
            }
        };

        loadFilters();
    }, []);

    const fetchReports = async () => {
        setLoading(true);
        setError("");

        try {
            let response;

            if (activeTab === "sections") {
                response = await api.get("/admin/dashboard/sections");
            } else if (activeTab === "subjects") {
                response = await api.get("/admin/dashboard/subjects");
            } else if (activeTab === "daily") {
                response = await api.get("/admin/dashboard/daily", {
                    params: {
                        ...(branchId && { branchId }),
                        ...(semester && { semester })
                    }
                });
            } else {
                response = await api.get("/admin/dashboard/students", {
                    params: {
                        ...(branchId && { branchId }),
                        ...(semester && { semester }),
                        ...(sectionId && { sectionId }),
                        ...(rollNumber.trim() && {
                            rollNumber: rollNumber.trim()
                        })
                    }
                });
            }

            setReports(response.data.reports || []);
        } catch (err) {
            console.error("Reports loading error:", err);
            setReports([]);
            setError(
                err.response?.data?.message ||
                "Unable to load attendance reports."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReports();
    }, [activeTab, branchId, semester, sectionId]);

    const filteredSections = useMemo(() => {
        return sections.filter((section) => {
            const matchesBranch =
                !branchId ||
                String(section.branchId?._id || section.branchId) === branchId;

            const matchesSemester =
                !semester || String(section.semester) === semester;

            return matchesBranch && matchesSemester;
        });
    }, [sections, branchId, semester]);

    const filteredReports = useMemo(() => {
        return reports.filter((item) => {
            const searchText = search.toLowerCase();

            const text = Object.values(item)
                .map((value) => String(value ?? ""))
                .join(" ")
                .toLowerCase();

            if (activeTab === "sections" || activeTab === "subjects") {
                const matchesBranch =
                    !branchId ||
                    item.branchCode ===
                    branches.find((branch) => branch._id === branchId)?.code;

                const matchesSemester =
                    !semester || String(item.semester) === semester;

                return matchesBranch && matchesSemester &&
                    text.includes(searchText);
            }

            return text.includes(searchText);
        });
    }, [reports, search, activeTab, branchId, semester, branches]);

    const summary = useMemo(() => {
        const totalRecords = filteredReports.reduce(
            (sum, item) => sum + Number(item.totalRecords || item.totalStudentsMarked || 0),
            0
        );

        const present = filteredReports.reduce(
            (sum, item) => sum + Number(item.present || 0),
            0
        );

        const absent = filteredReports.reduce(
            (sum, item) => sum + Number(item.absent || 0),
            0
        );

        const percentage = totalRecords
            ? ((present / totalRecords) * 100).toFixed(2)
            : "0.00";

        return {
            count: filteredReports.length,
            totalRecords,
            present,
            absent,
            percentage
        };
    }, [filteredReports]);

    const getExportRows = () => {
        return filteredReports.map((item) => {
            if (activeTab === "sections") {
                return {
                    Branch: item.branchName,
                    "Branch Code": item.branchCode,
                    Semester: item.semester,
                    Section: item.section,
                    "Academic Year": item.academicYear,
                    Students: item.totalStudents,
                    "Submitted Classes": item.totalSubmittedClasses,
                    "Total Records": item.totalRecords,
                    Present: item.present,
                    Absent: item.absent,
                    "Attendance Percentage": item.attendancePercentage
                };
            }

            if (activeTab === "subjects") {
                return {
                    Subject: item.subjectName,
                    Code: item.subjectCode,
                    Branch: item.branchName,
                    Semester: item.semester,
                    "Submitted Sessions": item.totalSubmittedSessions,
                    "Total Records": item.totalRecords,
                    Present: item.present,
                    Absent: item.absent,
                    "Attendance Percentage": item.attendancePercentage
                };
            }

            if (activeTab === "students") {
                return {
                    "Student Name": item.studentName,
                    "Roll Number": item.rollNumber,
                    "Submitted Classes": item.totalSubmittedClasses,
                    "Total Records": item.totalRecords,
                    Present: item.present,
                    Absent: item.absent,
                    "Attendance Percentage": item.attendancePercentage
                };
            }

            return {
                Date: formatDate(item.date),
                "Total Sessions": item.totalSessions,
                "Students Marked": item.totalStudentsMarked,
                Present: item.present,
                Absent: item.absent,
                "Attendance Percentage": item.attendancePercentage
            };
        });
    };

    const exportReport = () => {
        exportCSV(getExportRows(), `${activeTab}-attendance-report.csv`);
    };

    const clearFilters = () => {
        setBranchId("");
        setSemester("");
        setSectionId("");
        setRollNumber("");
        setSearch("");
    };

    const activeLabel =
        tabs.find((tab) => tab.id === activeTab)?.label || "Reports";

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        Attendance Reports
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Analyse attendance across your college.
                    </p>
                </div>

                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={fetchReports}
                        disabled={loading}
                        className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
                    >
                        <RefreshCw size={16} />
                        Refresh
                    </button>

                    <button
                        onClick={exportReport}
                        disabled={!filteredReports.length}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                    >
                        <Download size={16} />
                        Export CSV
                    </button>
                </div>
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3">
                <BarChart3 className="text-blue-600 shrink-0 mt-1" size={20} />
                <div>
                    <p className="font-semibold text-blue-900 text-sm">
                        Submitted sessions only
                    </p>
                    <p className="text-sm text-blue-800 mt-1">
                        Attendance percentages are calculated from submitted
                        sessions. Draft sessions are excluded.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                <StatCard
                    title="Report Entries"
                    value={summary.count}
                    description={`${activeLabel} records`}
                />
                <StatCard
                    title="Total Records"
                    value={summary.totalRecords}
                    description="Attendance records"
                />
                <StatCard
                    title="Present"
                    value={summary.present}
                    description="Students marked present"
                />
                <StatCard
                    title="Attendance Percentage"
                    value={`${summary.percentage}%`}
                    description="Based on displayed records"
                />
            </div>

            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <div className="flex flex-wrap gap-2 p-4 border-b border-gray-200">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;

                        return (
                            <button
                                key={tab.id}
                                onClick={() => {
                                    setActiveTab(tab.id);
                                    setSearch("");
                                }}
                                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
                                    activeTab === tab.id
                                        ? "bg-blue-600 text-white"
                                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                }`}
                            >
                                <Icon size={16} />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                <div className="p-4 space-y-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                        <Filter size={17} />
                        Report Filters
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        <select
                            value={branchId}
                            onChange={(e) => {
                                setBranchId(e.target.value);
                                setSectionId("");
                            }}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                        >
                            <option value="">All Branches</option>
                            {branches.map((branch) => (
                                <option key={branch._id} value={branch._id}>
                                    {branch.name} ({branch.code})
                                </option>
                            ))}
                        </select>

                        <select
                            value={semester}
                            onChange={(e) => {
                                setSemester(e.target.value);
                                setSectionId("");
                            }}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                        >
                            <option value="">All Semesters</option>
                            {[1, 2, 3, 4, 5, 6, 7, 8].map((number) => (
                                <option key={number} value={number}>
                                    Semester {number}
                                </option>
                            ))}
                        </select>

                        {activeTab === "students" && (
                            <>
                                <select
                                    value={sectionId}
                                    onChange={(e) => setSectionId(e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                                >
                                    <option value="">All Sections</option>
                                    {filteredSections.map((section) => (
                                        <option
                                            key={section._id}
                                            value={section._id}
                                        >
                                            Section {section.name}
                                        </option>
                                    ))}
                                </select>

                                <input
                                    value={rollNumber}
                                    onChange={(e) => setRollNumber(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") fetchReports();
                                    }}
                                    placeholder="Search roll number"
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                                />
                            </>
                        )}

                        <div className="relative">
                            <Search
                                size={16}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                            />
                            <input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search report..."
                                className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2 text-sm"
                            />
                        </div>
                    </div>

                    <button
                        onClick={clearFilters}
                        className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                        Clear filters
                    </button>
                </div>

                {error && (
                    <div className="mx-4 mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm">
                        {error}
                    </div>
                )}

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-600">
                            {activeTab === "sections" && (
                                <tr>
                                    <th className="p-4">Branch</th>
                                    <th className="p-4">Semester</th>
                                    <th className="p-4">Section</th>
                                    <th className="p-4">Students</th>
                                    <th className="p-4">Classes</th>
                                    <th className="p-4">Present</th>
                                    <th className="p-4">Absent</th>
                                    <th className="p-4">Attendance</th>
                                </tr>
                            )}

                            {activeTab === "subjects" && (
                                <tr>
                                    <th className="p-4">Subject</th>
                                    <th className="p-4">Branch</th>
                                    <th className="p-4">Semester</th>
                                    <th className="p-4">Sessions</th>
                                    <th className="p-4">Present</th>
                                    <th className="p-4">Absent</th>
                                    <th className="p-4">Attendance</th>
                                </tr>
                            )}

                            {activeTab === "students" && (
                                <tr>
                                    <th className="p-4">Student</th>
                                    <th className="p-4">Roll Number</th>
                                    <th className="p-4">Classes</th>
                                    <th className="p-4">Present</th>
                                    <th className="p-4">Absent</th>
                                    <th className="p-4">Attendance</th>
                                </tr>
                            )}

                            {activeTab === "daily" && (
                                <tr>
                                    <th className="p-4">Date</th>
                                    <th className="p-4">Sessions</th>
                                    <th className="p-4">Students Marked</th>
                                    <th className="p-4">Present</th>
                                    <th className="p-4">Absent</th>
                                    <th className="p-4">Attendance</th>
                                </tr>
                            )}
                        </thead>

                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan="8" className="p-8 text-center text-gray-500">
                                        Loading reports...
                                    </td>
                                </tr>
                            ) : filteredReports.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="p-8 text-center text-gray-500">
                                        No attendance reports found.
                                    </td>
                                </tr>
                            ) : (
                                filteredReports.map((item, index) => (
                                    <tr key={item.studentId || item.section || item.subjectCode || item.date || index}
                                        className="hover:bg-gray-50">

                                        {activeTab === "sections" && (
                                            <>
                                                <td className="p-4">
                                                    <p className="font-medium text-gray-900">{item.branchName}</p>
                                                    <p className="text-xs text-gray-500">{item.branchCode}</p>
                                                </td>
                                                <td className="p-4">{item.semester}</td>
                                                <td className="p-4 font-medium">Section {item.section}</td>
                                                <td className="p-4">{item.totalStudents}</td>
                                                <td className="p-4">{item.totalSubmittedClasses}</td>
                                                <td className="p-4 text-green-600">{item.present}</td>
                                                <td className="p-4 text-red-600">{item.absent}</td>
                                            </>
                                        )}

                                        {activeTab === "subjects" && (
                                            <>
                                                <td className="p-4">
                                                    <p className="font-medium text-gray-900">{item.subjectName}</p>
                                                    <p className="text-xs text-gray-500">{item.subjectCode}</p>
                                                </td>
                                                <td className="p-4">{item.branchCode}</td>
                                                <td className="p-4">{item.semester}</td>
                                                <td className="p-4">{item.totalSubmittedSessions}</td>
                                                <td className="p-4 text-green-600">{item.present}</td>
                                                <td className="p-4 text-red-600">{item.absent}</td>
                                            </>
                                        )}

                                        {activeTab === "students" && (
                                            <>
                                                <td className="p-4 font-medium text-gray-900">{item.studentName}</td>
                                                <td className="p-4">{item.rollNumber}</td>
                                                <td className="p-4">{item.totalSubmittedClasses}</td>
                                                <td className="p-4 text-green-600">{item.present}</td>
                                                <td className="p-4 text-red-600">{item.absent}</td>
                                            </>
                                        )}

                                        {activeTab === "daily" && (
                                            <>
                                                <td className="p-4 font-medium">{formatDate(item.date)}</td>
                                                <td className="p-4">{item.totalSessions}</td>
                                                <td className="p-4">{item.totalStudentsMarked}</td>
                                                <td className="p-4 text-green-600">{item.present}</td>
                                                <td className="p-4 text-red-600">{item.absent}</td>
                                            </>
                                        )}

                                        <td className="p-4">
                                            <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${percentageColor(item.attendancePercentage)}`}>
                                                {Number(item.attendancePercentage || 0).toFixed(2)}%
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="p-4 border-t border-gray-200 text-xs text-gray-500">
                    Showing {filteredReports.length} of {reports.length} report entries.
                </div>
            </div>
        </div>
    );
}
