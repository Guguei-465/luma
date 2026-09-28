import React, { useEffect, useState, useCallback } from 'react';
import { NavLink } from 'react-router-dom';
import api from '../api/api';


const ParentSidebar = ({ isOpen, setIsOpen }) => {
  const [unreadCount, setUnreadCount] = useState(0);

  // ==========================================
  // ✅ USING EXACT SPELLINGS FROM YOUR WORKING CODE
  // ==========================================
  const fetchUnreadCount = useCallback(async () => {
    try {
      // ✅ SAME TYPO SPELLINGS AS ParentNotifications.jsx:
      // "notifiations" NOT "notifications"
      const res = await api.get("notifiations/my/unread-count/");
      console.log("🔴 Unread count response:", res.data);
      setUnreadCount(res.data?.count || res.data?.unread_count || 0);
    } catch (err) {
      console.log("⚠️ unread-count failed:", err.response?.status);
      // ✅ FALLBACK: use the list endpoint with SAME spelling
      try {
        const listRes = await api.get("notifiations/my/");
        console.log("📋 Notifications list:", listRes.data);
        const list = Array.isArray(listRes.data) ? listRes.data : listRes.data?.results || [];
        const unread = list.filter(n => !n.is_read).length;
        setUnreadCount(unread);
      } catch (fallbackErr) {
        console.log("❌ Both endpoints failed:", fallbackErr.response?.status);
        setUnreadCount(0);
      }
    }
  }, []);

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 60000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);


  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-sm relative ${
      isActive
        ? 'bg-green-600 text-white shadow-sm'
        : 'text-gray-300 hover:bg-white/10 hover:text-white'
    }`;


  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 md:hidden z-40 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        ></div>
      )}

      <aside
        className={`fixed md:static z-50 top-0 left-0 h-full w-56 sm:w-64 bg-gradient-to-br from-green-800 to-green-900 text-white transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="p-4 h-full flex flex-col">
          <div className="mb-8">
            <h2 className="text-xl font-bold tracking-wide">Luma 2000 Academy</h2>
          </div>

          <nav className="flex-1 space-y-1.5">
            <NavLink to="/parent-dashboard" end className={linkClass} onClick={() => setIsOpen(false)}>
              <i className="bi bi-speedometer2 text-lg"></i>
              <span>Dashboard</span>
            </NavLink>

            <div className="pt-3 mt-3 border-t border-white/10 space-y-1.5">
              <NavLink to="/parent-dashboard/my-children" end className={linkClass} onClick={() => setIsOpen(false)}>
                <i className="bi bi-people-fill text-lg"></i>
                <span>My Children</span>
              </NavLink>

              <NavLink to="/parent-dashboard/fees" end className={linkClass} onClick={() => setIsOpen(false)}>
                <i className="bi bi-cash-stack text-lg"></i>
                <span>Fees</span>
              </NavLink>

              <NavLink to="/parent-dashboard/attendance" end className={linkClass} onClick={() => setIsOpen(false)}>
                <i className="bi bi-calendar-check-fill text-lg"></i>
                <span>Attendance</span>
              </NavLink>

              <NavLink to="/parent-dashboard/report-cards" end className={linkClass} onClick={() => setIsOpen(false)}>
                <i className="bi bi-file-earmark-text-fill text-lg"></i>
                <span>Report Cards</span>
              </NavLink>
              
              {/* 🔔 NOTIFICATIONS WITH RED BADGE */}
              <NavLink to="/parent-dashboard/notifications" end className={linkClass} onClick={() => setIsOpen(false)}>
                <i className="bi bi-bell-fill text-lg"></i>
                <span>Notifications</span>
                {unreadCount > 0 && (
                  <span className="absolute right-3 top-2 flex items-center justify-center min-w-[18px] h-[18px] bg-red-600 text-white text-[10px] font-bold rounded-full px-1 animate-pulse shadow-md">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </NavLink>

              <NavLink to="/parent-dashboard/profile" end className={linkClass} onClick={() => setIsOpen(false)}>
                <i className="bi bi-person-circle text-lg"></i>
                <span>My Profile</span>
              </NavLink>
            </div>
          </nav>
        </div>
      </aside>
    </>
  );
};

export default ParentSidebar;