import React from 'react';
import { NavLink } from 'react-router-dom';

const ParentSidebar = ({ isOpen, setIsOpen }) => {
  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-sm ${
      isActive
        ? 'bg-green-600 text-white shadow-sm'
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
        className={`fixed md:static z-50 top-0 left-0 h-full w-56 sm:w-64 bg-gradient-to-br from-green-800 to-green-900 text-white transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="p-4 h-full flex flex-col">
          {/* Brand */}
          <div className="mb-8">
            <h2 className="text-xl font-bold tracking-wide">Luma 2000 Academy</h2>
          </div>

          {/* Navigation */}
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
              
              <NavLink to="/parent-dashboard/notifications" end className={linkClass} onClick={() => setIsOpen(false)}>
                <i className="bi bi-bell-fill text-lg"></i>
                <span>Notifications</span>
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