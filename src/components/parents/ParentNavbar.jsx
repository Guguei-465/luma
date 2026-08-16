import { useContext } from "react";
import { FaBell, FaBars, FaHome } from "react-icons/fa";
import UserAvatar from "../UseAvata";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

const ParentNavbar = ({ onToggle, unreadCount = 0 }) => {
  const { user, Logout } = useContext(AuthContext);
  const navigate = useNavigate();

  return (
    <nav className="w-full bg-white shadow-sm border-b border-gray-100 px-4 py-3">
      <div className="flex items-center justify-between">
        {/* Left: Toggle + Title */}
        <div className="flex items-center gap-2">
          <button
            className="p-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
            onClick={onToggle}
            aria-label="Toggle sidebar"
          >
            <FaBars size={18} />
          </button>

          <button
            className="p-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors lg:hidden"
            onClick={() => navigate("/parent/dashboard")}
            aria-label="Home"
          >
            <FaHome size={18} />
          </button>

          <h5 className="text-lg font-semibold text-gray-800 hidden lg:block">
            Parent Portal
          </h5>
        </div>

        {/* Right: Notifications + Profile + Logout */}
        <div className="flex items-center gap-3">
          <button
            className="relative p-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
            onClick={() => navigate("/parent/notifications")}
            aria-label="Notifications"
          >
            <FaBell size={18} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-4 h-4 flex items-center justify-center rounded-full">
                {unreadCount}
              </span>
            )}
          </button>

          <div className="flex items-center gap-2">
            <UserAvatar user={user} size={36} />
            <div className="hidden md:block">
              <p className="text-sm font-medium text-gray-800">
                {user?.first_name || user?.username}
              </p>
              <p className="text-xs text-gray-500">Parent</p>
            </div>
          </div>

          <button
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors"
            onClick={Logout}
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

export default ParentNavbar;