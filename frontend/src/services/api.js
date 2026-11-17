
import axios from "axios";

const api = axios.create({
    baseURL: "http://localhost:3001/api/v1",
    headers: {
        "Content-Type": "application/json"
    },
    timeout: 15000
});

// Attach JWT token to every request when available
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("attendanceToken");

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error) => Promise.reject(error)
);

// Handle authentication and network errors
api.interceptors.response.use(
    (response) => response,
    (error) => {

        // Handle expired or invalid authentication only
        if (error.response?.status === 401) {
            localStorage.removeItem("attendanceToken");
            localStorage.removeItem("attendanceUser");

            if (window.location.pathname !== "/login") {
                window.location.href = "/login";
            }
        }

        // Backend unavailable or network error
        if (!error.response) {
            console.error(
                "Backend server is unavailable. Please try again later."
            );
        }

        return Promise.reject(error);
    }
);
export default api;
