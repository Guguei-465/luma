import React from 'react';
import { NavLink } from 'react-router-dom';

const TeacherSidebar = ({ isOpen, setIsOpen }) => {
  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-sm ${
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

      {/* Sidebar */}
      <aside
        className={`fixed md:static z-50 top-0 left-0 h-full w-56 sm:w-64 bg-gradient-to-br from-blue-800 to-blue-900 text-white transform transition-transform duration-300 ease-in-out flex flex-col ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="p-4 flex flex-col h-full overflow-hidden">
          {/* Brand */}
          <div className="mb-4 shrink-0">
            <h2 className="text-lg font-bold tracking-wide">Luma 2000 Academy</h2>
            <p className="text-xs text-gray-400 mt-1">Teacher Portal</p>
          </div>

          {/* Navigation — Scrollable if needed */}
          <nav className="flex-1 overflow-y-auto space-y-1 pr-1">
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
            </div>
          </nav>

          {/* ✅ PROFILE — PINNED TO BOTTOM, ALWAYS VISIBLE */}
          <div className="mt-auto pt-3 border-t border-white/10 shrink-0">
            <NavLink to="/teacher/profile" end className={linkClass} onClick={() => setIsOpen(false)}>
              <i className="bi bi-person-circle text-lg"></i>
              <span>My Profile</span>
            </NavLink>
          </div>
        </div>
      </aside>
    </>
  );
};

export default TeacherSidebar;