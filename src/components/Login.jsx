//  
import { useContext, useState } from 'react';
import { AuthContext } from './context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from './api/api';

const Login = () => {
    const { setToken, setUser } = useContext(AuthContext);
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        try {
            const res = await api.post("accounts/login/", { username, password });
            const { access, refresh, user } = res.data;
            const userData = { id: user.id, username: user.username, role: user.role };
            
            setToken(access);
            setUser(userData);
            localStorage.setItem("access", access);
            localStorage.setItem("refresh", refresh);
            localStorage.setItem("user", JSON.stringify(userData));

const routes = {
                SUPER_ADMIN: "/admin-dashboard",
                ACADEMIC_COORDINATOR: "/academic-coordinator",
                ACCOUNTANT: "/accountant",
                TEACHER: "/teacher",
                PARENT: "/parent-dashboard",
            };
            navigate(routes[user.role] || "/");
        } catch (err) {
            setError(err.response?.data?.error || err.response?.data?.detail || "Invalid username or password");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 px-4">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6 sm:p-8">
                {/* Logo & Brand */}
                <div className="flex flex-col items-center mb-8">
                    <div className="w-14 h-14 bg-green-700 rounded-xl flex items-center justify-center shadow-md mb-3">
                        <i className="bi bi-mortarboard-fill text-2xl text-white"></i>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">Luma 2000 Academy</h1>
                    <p className="text-gray-500 text-sm mt-1">Sign in to your account</p>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mb-5 flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-2.5 rounded-lg">
                        <i className="bi bi-exclamation-circle-fill"></i>
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-5">
                    {/* Username — NO extra padding/conflicts */}
                    <div>
                        <label className="block text-sm font-medium text-gray-800 mb-1.5">Username</label>
                        <input
                            type="text"
                            placeholder="Enter your username"
                            required
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-green-600 transition outline-none text-sm"
                        />
                    </div>

                    {/* Password — Fixed positioning + eye icon */}
                    <div className="relative">
                        <label className="block text-sm font-medium text-gray-800 mb-1.5">Password</label>
                        <input
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter your password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-green-600 transition outline-none text-sm"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-8 text-gray-400 hover:text-gray-600 transition"
                        >
                            <i className={`bi ${showPassword ? "bi-eye-slash-fill" : "bi-eye-fill"}`}></i>
                        </button>
                    </div>

                    {/* Sign In Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-2.5 rounded-lg bg-green-700 hover:bg-green-800 text-white font-medium shadow-md transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed mt-2"
                    >
                        {loading ? (
                            <span className="flex items-center justify-center gap-2">
                                <i className="bi bi-arrow-clockwise animate-spin"></i>
                                Signing in...
                            </span>
                        ) : (
                            "Sign In"
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Login;