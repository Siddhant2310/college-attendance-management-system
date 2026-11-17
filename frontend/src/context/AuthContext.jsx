
import {
    createContext,
    useContext,
    useEffect,
    useState
} from "react";

import api from "../services/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);

    const [token, setToken] = useState(
        localStorage.getItem("attendanceToken")
    );

    const [loading, setLoading] = useState(true);

    // Restore the logged-in user's session after page refresh
    useEffect(() => {
        const restoreSession = async () => {
            const savedToken = localStorage.getItem("attendanceToken");
            const savedUser = localStorage.getItem("attendanceUser");

            if (!savedToken) {
                setLoading(false);
                return;
            }

            try {
                // Verify the saved token with the backend
                const response = await api.get("/auth/me");

                setUser(response.data.user);
                setToken(savedToken);

                localStorage.setItem(
                    "attendanceUser",
                    JSON.stringify(response.data.user)
                );

            } catch (error) {

                if (
                    error.response?.status === 401 ||
                    error.response?.status === 403
                ) {
                    // Invalid token or access denied
                    localStorage.removeItem("attendanceToken");
                    localStorage.removeItem("attendanceUser");

                    setUser(null);
                    setToken(null);

                } else {
                    // Backend unavailable or server error
                    // Preserve the existing frontend session

                    if (savedUser) {
                        try {
                            const cachedUser = JSON.parse(savedUser);

                            setUser(cachedUser);
                            setToken(savedToken);

                        } catch (parseError) {
                            console.error(
                                "Unable to restore cached user:",
                                parseError
                            );

                            setUser(null);
                            setToken(null);
                        }
                    } else {
                        setUser(null);
                        setToken(null);
                    }

                    console.error(
                        "Unable to verify session. Backend may be unavailable.",
                        error
                    );
                }

            } finally {
                setLoading(false);
            }
        };

        restoreSession();

    }, []);

    // Login
    const login = async (loginId, password) => {
        try {
            const response = await api.post("/auth/login", {
                loginId,
                password
            });

            const {
                token: newToken,
                user: loggedInUser
            } = response.data;

            localStorage.setItem(
                "attendanceToken",
                newToken
            );

            localStorage.setItem(
                "attendanceUser",
                JSON.stringify(loggedInUser)
            );

            setToken(newToken);
            setUser(loggedInUser);

            return loggedInUser;

        } catch (error) {
            throw new Error(
                error.response?.data?.message ||
                "Unable to connect to server. Please try again."
            );
        }
    };

    // Logout
    const logout = () => {
        localStorage.removeItem("attendanceToken");
        localStorage.removeItem("attendanceUser");

        setUser(null);
        setToken(null);
    };

    // Change temporary or existing password
    const changePassword = async (
        currentPassword,
        newPassword
    ) => {
        try {
            const response = await api.put(
                "/auth/change-password",
                {
                    currentPassword,
                    newPassword
                }
            );

            const updatedUser = {
                ...user,
                isFirstLogin: false
            };

            localStorage.setItem(
                "attendanceUser",
                JSON.stringify(updatedUser)
            );

            setUser(updatedUser);

            return response.data;

        } catch (error) {
            throw new Error(
                error.response?.data?.message ||
                "Password change failed."
            );
        }
    };

    const value = {
        user,
        token,
        loading,

        isAuthenticated: Boolean(token && user),

        login,
        logout,
        changePassword
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

// Custom hook for accessing authentication
export const useAuth = () => {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error(
            "useAuth must be used inside AuthProvider"
        );
    }

    return context;
};
