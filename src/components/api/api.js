import axios from "axios";

// Create reusable axios instance
const api = axios.create({
    baseURL: "https://ryacksonfungo.alwaysdata.net/api/",
    headers: {
        "Content-Type": "application/json"
    }
});

// Auto-attach JWT token to protected routes
api.interceptors.request.use((config) => {
    const access = localStorage.getItem("access");
    // Skip auth header only for login endpoint
    if (access && !config.url.includes("accounts/login/")) {
        config.headers.Authorization = `Bearer ${access}`;
    }
    return config;
}, (error) => Promise.reject(error));

// Track refresh requests to avoid multiple concurrent refreshes
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach((prom) => {
        if (error) prom.reject(error);
        else prom.resolve(token);
    });
    failedQueue = [];
};

// Auto-handle 401 expired tokens with refresh-token flow
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Skip login & refresh endpoints (avoid infinite loops)
        const isAuthEndpoint =
            originalRequest?.url?.includes("accounts/login/") ||
            originalRequest?.url?.includes("accounts/refresh/");

        if (
            error.response?.status === 401 &&
            !originalRequest?._retry &&
            !isAuthEndpoint
        ) {
            const refreshToken = localStorage.getItem("refresh");

            if (refreshToken) {
                if (isRefreshing) {
                    // Queue the request until refresh completes
                    return new Promise((resolve, reject) => {
                        failedQueue.push({ resolve, reject });
                    }).then((token) => {
                        originalRequest.headers.Authorization = `Bearer ${token}`;
                        return api(originalRequest);
                    });
                }

                originalRequest._retry = true;
                isRefreshing = true;

                try {
                    const { data } = await api.post("accounts/refresh/", {
                        refresh: refreshToken,
                    });
                    const newAccess = data.access;

                    localStorage.setItem("access", newAccess);
                    api.defaults.headers.common.Authorization = `Bearer ${newAccess}`;
                    processQueue(null, newAccess);

                    originalRequest.headers.Authorization = `Bearer ${newAccess}`;
                    return api(originalRequest);
                } catch (refreshErr) {
                    processQueue(refreshErr, null);
                    // Refresh failed → force logout
                    localStorage.removeItem("access");
                    localStorage.removeItem("refresh");
                    localStorage.removeItem("user");
                    window.location.href = "/login";
                    return Promise.reject(refreshErr);
                } finally {
                    isRefreshing = false;
                }
            }
        }

        // No refresh token available → logout
        if (error.response?.status === 401) {
            localStorage.removeItem("access");
            localStorage.removeItem("refresh");
            localStorage.removeItem("user");
            window.location.href = "/login";
        }

        return Promise.reject(error);
    }
);

export default api;