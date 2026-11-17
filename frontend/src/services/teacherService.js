
import api from "./api";

const teacherService = {

    // ==============================
    // TEACHER DASHBOARD
    // ==============================

    // Get logged-in teacher's assignments
    getMyAssignments: async () => {
        const response = await api.get("/teacher/assignments");
        return response.data;
    },

    // Get teacher's attendance session history
    getAttendanceSessions: async (params = {}) => {
        const response = await api.get("/teacher/attendance/sessions", {
            params
        });

        return response.data;
    },

    // ==============================
    // ATTENDANCE MANAGEMENT
    // ==============================

    // Create a new attendance session
    createAttendanceSession: async (data) => {
        const response = await api.post(
            "/teacher/attendance/sessions",
            data
        );

        return response.data;
    },

    // Get a specific attendance session with student roster
    getAttendanceSession: async (sessionId) => {
        const response = await api.get(
            `/teacher/attendance/sessions/${sessionId}`
        );

        return response.data;
    },

    // Mark a student PRESENT or ABSENT
    markAttendance: async (sessionId, recordId, status) => {
        const response = await api.patch(
            `/teacher/attendance/sessions/${sessionId}/records/${recordId}`,
            { status }
        );

        return response.data;
    },

    // Submit and finalize attendance
    submitAttendance: async (sessionId) => {
        const response = await api.post(
            `/teacher/attendance/sessions/${sessionId}/submit`
        );

        return response.data;
    },

    // ==============================
    // CORRECTION REQUESTS
    // ==============================

    // Get pending correction requests
    getCorrectionRequests: async () => {
        const response = await api.get(
            "/teacher/attendance/correction-requests"
        );

        return response.data;
    },

    // Approve or reject a correction request
    reviewCorrectionRequest: async (requestId, decision, reviewRemark = "") => {
        const response = await api.patch(
            `/teacher/attendance/correction-requests/${requestId}/review`,
            {
                decision,
                reviewRemark
            }
        );

        return response.data;
    },

    // ==============================
    // AUTHENTICATED TEACHER PROFILE
    // ==============================

    getProfile: async () => {
        const response = await api.get("/auth/me");
        return response.data;
    }
};

export default teacherService;
