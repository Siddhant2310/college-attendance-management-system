
import api from "./api";

const studentService = {
    getMyAttendance: async () => {
        const response = await api.get("/student/attendance/my");
        return response.data;
    },

    requestCorrection: async (recordId, requestedStatus, reason) => {
        const response = await api.post(
            `/student/attendance/${recordId}/correction-requests`,
            {
                requestedStatus,
                reason
            }
        );

        return response.data;
    },

    // Get student's correction request history
    getMyCorrectionRequests: async () => {
        const response = await api.get(
            "/student/attendance/correction-requests"
        );

        return response.data;
    }
};

export default studentService;
