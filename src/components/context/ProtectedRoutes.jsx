import { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { AuthContext } from './AuthContext';

const ProtectedRoutes = ({ children, allowedRoles = [] }) => {
    const { user, isAuthenticated } = useContext(AuthContext);

    // Not logged in at all → go to login
    if (!isAuthenticated || !user) {
        return <Navigate to="/login" replace />;
    }

// Logged in but wrong role → go to access denied
    // Normalize roles so underscores & hyphens are treated the same
    // (backend may return ACADEMIC_COORDINATOR, frontend uses academic-coordinator)
    const normalizeRole = (role) => (role || "").toLowerCase().replaceAll("_", "-");
    const userRole = normalizeRole(user.role);
    if (allowedRoles.length > 0 && !allowedRoles.some((r) => normalizeRole(r) === userRole)) {
        return <Navigate to="/not_authorized" replace />;
    }

    // All good → show content
    return children ?? <Outlet />;
};

export default ProtectedRoutes;