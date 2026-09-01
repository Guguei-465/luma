import React, { useEffect, useState, useCallback } from 'react';
import { NavLink } from 'react-router-dom';
import api from '../api/api';


const TeacherSidebar = ({ isOpen, setIsOpen }) => {
  const [unreadCount, setUnreadCount] = useState(0);

  // ==========================================
  // ✅ FETCH UNREAD COUNT — USING CORRECT SPELLING "notifiations"
  // ==========================================
  const fetchUnreadCount = useCallback(async () => {
    try {
      // ✅ SAME SPELLING AS YOUR WORKING CODE: "notifiations"
      const res = await api.get("notifiations/my/unread-count/");
      console.log("🔴 Teacher unread count:", res.data);
      setUnreadCount(res.data?.count || res.data?.unread_count || 0);
    } catch (err) {
      console.log("⚠️ unread-count failed:", err.response?.status);
      // ✅ FALLBACK: fetch list and count unread
      try {
        const listRes = await api.get("notifiations/my/");
        const list = Array.isArray(listRes.data) ? listRes.data : listRes.data?.results || [];
        const unread = list.filter(n => !n.is_read).length;
        setUnreadCount(unread);
      } catch {
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
        ? 'bg-blue-600 text-white shadow-sm'
        : 'text-gray-300 hover:bg-white/10 hover:text-white'
    }`;


  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 md:hidden z-40 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        ></div>
      )}


      {/* Sidebar — Scrollable, no visible scrollbar */}
      <aside
        className={`fixed md:static z-50 top-0 left-0 h-full w-56 sm:w-64 bg-gradient-to-br from-blue-800 to-blue-900 text-white transform transition-transform duration-300 ease-in-out flex flex-col ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="p-4 flex flex-col h-full">
          {/* Brand */}
          <div className="mb-4 shrink-0">
            <h2 className="text-lg font-bold tracking-wide">Luma 2000 Academy</h2>
            <p className="text-xs text-gray-400 mt-1">Teacher Portal</p>
          </div>


          {/* Navigation — Scrollable, NO scrollbar shown */}
          <nav 
            className="flex-1 space-y-1 pr-1 overflow-y-auto hide-scrollbar"
          >
            <NavLink to="/teacher" end className={linkClass} onClick={() => setIsOpen(false)}>
              <i className="bi bi-speedometer2 text-lg"></i>
              <span>Dashboard</span>
            </NavLink>


            <div className="pt-2 mt-2 border-t border-white/10 space-y-1">
              <NavLink to="/teacher/students" end className={linkClass} onClick={() => setIsOpen(false)}>
                <i className="bi bi-people text-lg"></i>
                <span>My Students</span>
              </NavLink>


              <NavLink to="/teacher/assessments" end className={linkClass} onClick={() => setIsOpen(false)}>
                <i className="bi bi-clipboard-data text-lg"></i>
                <span>Assessments & Marks</span>
              </NavLink>


              <NavLink to="/teacher/results" end className={linkClass} onClick={() => setIsOpen(false)}>
                <i className="bi bi-file-text text-lg"></i>
                <span>Submitted Results</span>
              </NavLink>


              <NavLink to="/teacher/class-results" className={linkClass} onClick={() => setIsOpen(false)}>
                <i className="bi bi-table me-2"></i> Class Results Summary
              </NavLink>


              <NavLink to="/teacher/attendance" end className={linkClass} onClick={() => setIsOpen(false)}>
                <i className="bi bi-calendar-check text-lg"></i>
                <span>Attendance</span>
              </NavLink>


              <NavLink to="/teacher/timetable" end className={linkClass} onClick={() => setIsOpen(false)}>
                <i className="bi bi-calendar3 text-lg"></i>
                <span>My Timetable</span>
              </NavLink>


              <NavLink to="/teacher/reports" end className={linkClass} onClick={() => setIsOpen(false)}>
                <i className="bi bi-bar-chart text-lg"></i>
                <span>Reports</span>
              </NavLink>


              {/* 🔔 NOTIFICATIONS — WITH RED UNREAD BADGE */}
              <NavLink to="/teacher/notifications" className={linkClass} onClick={() => setIsOpen(false)}>
                <i className="bi bi-bell-fill me-2"></i>
                Updates & Notifications
                
                {/* ✅ RED BADGE — shows only when unread > 0 */}
                {unreadCount > 0 && (
                  <span className="absolute right-3 top-2 flex items-center justify-center min-w-[18px] h-[18px] bg-red-600 text-white text-[10px] font-bold rounded-full px-1 animate-pulse shadow-md">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </NavLink>
              
              <NavLink to="/teacher/profile" end className={linkClass} onClick={() => setIsOpen(false)}>
                <i className="bi bi-person-circle text-lg"></i>
                <span>My Profile</span>
              </NavLink>
            </div>
          </nav>
        </div>
      </aside>


      {/* HIDE SCROLLBAR ON ALL BROWSERS — STILL SCROLLABLE */}
      <style>{`
        .hide-scrollbar {
          /* Firefox */
          scrollbarWidth: none;
          /* IE & Edge */
          -ms-overflow-style: none;
        }
        /* Chrome, Safari, Opera */
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
          width: 0;
          height: 0;
        }
      `}</style>
    </>
  );
};


export default TeacherSidebar;