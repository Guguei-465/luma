// Create context – makes auth state available globally
import { createContext, useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const navigate = useNavigate();

    // Load saved token on page load
    const [token, setToken] = useState(
        () => localStorage.getItem("access") || ""
    );

    // Load & safely parse saved user data
    const [user, setUser] = useState(() => {
        try {
            const stored = localStorage.getItem("user");
            return stored ? JSON.parse(stored) : null;
        } catch {
            localStorage.removeItem("user");
            return null;
        }
    });

    // Persist token to localStorage when it changes
    useEffect(() => {
        if (token) localStorage.setItem("access", token);
        else localStorage.removeItem("access");
    }, [token]);

    // Persist user to localStorage when it changes
    useEffect(() => {
        if (user) localStorage.setItem("user", JSON.stringify(user));
        else localStorage.removeItem("user");
    }, [user]);

    // Logout – clear all data & redirect
    const Logout = useCallback(() => {
        localStorage.removeItem("access");
        localStorage.removeItem("refresh");
        localStorage.removeItem("user");
        setToken("");
        setUser(null);
        navigate("/login");
    }, [navigate]);

    // Auto-logout if token is expired
    useEffect(() => {
        if (!token) return;
        try {
            const decoded = jwtDecode(token);
            const isExpired = decoded.exp * 1000 < Date.now();
            if (isExpired) Logout();
        } catch (err) {
            console.warn("Invalid token, logging out:", err);
            Logout();
        }
    }, [token, Logout]);

    return (
        <AuthContext.Provider value={{
            token,
            setToken,
            user,
            setUser,
            Logout,
            isAuthenticated: !!token && !!user,
            role: user?.role || null
        }}>
            {children}
        </AuthContext.Provider>
    );
};