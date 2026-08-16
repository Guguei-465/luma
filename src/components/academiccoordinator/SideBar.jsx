import React from "react";
import { NavLink } from "react-router-dom";

const SideBar = ({ isOpen, setIsOpen }) => {
  const linkClass = ({ isActive }) =>
    `flex items-center gap-4 px-3 py-2.5 rounded-lg transition-all duration-200 ${
      isActive
        ? "bg-green-600 text-white shadow-md"
        : "text-gray-200 hover:bg-white/10 hover:text-white"
    }`;

  const sectionHeading =
    "text-gray-300 text-sm font-semibold uppercase tracking-wider px-3 py-2 mt-6 mb-1";

  const closeSidebar = () => {
    setIsOpen(false);
  };

  return (
    <>
      {/* MOBILE BACKDROP */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`
          fixed top-0 left-0 bottom-0
          w-64
          bg-gradient-to-br from-green-800 to-blue-900
          text-white
          z-50
          transform
          transition-transform
          duration-300
          ease-in-out
          md:relative
          md:translate-x-0
          md:flex-shrink-0
          ${
            isOpen
              ? "translate-x-0"
              : "-translate-x-full md:translate-x-0"
          }
        `}
      >
        <div className="h-full flex flex-col">
          {/* HEADER */}
          <div className="p-5 border-b border-white/20">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">
                Luma 2000 Academy
              </h2>

              {/* MOBILE CLOSE BUTTON */}
              <button
                type="button"
                onClick={closeSidebar}
                className="md:hidden text-white text-2xl hover:text-gray-300"
                aria-label="Close sidebar"
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>
          </div>

          {/* NAVIGATION */}
          <div className="flex-1 overflow-y-auto p-5">
            <nav className="space-y-1">

              {/* Dashboard */}
              <NavLink
                to="/academic-coordinator"
                end
                className={linkClass}
                onClick={closeSidebar}
              >
                <i className="bi bi-speedometer2 text-lg"></i>
                Dashboard
              </NavLink>

              {/* Academic Management */}
              <p className={sectionHeading}>
                Academic Management
              </p>

              <NavLink
                to="/academic-coordinator/teachers"
                className={linkClass}
                onClick={closeSidebar}
              >
                <i className="bi bi-people-fill text-lg"></i>
                Teachers
              </NavLink>

              <NavLink
                to="/academic-coordinator/students"
                className={linkClass}
                onClick={closeSidebar}
              >
                <i className="bi bi-people-fill text-lg"></i>
                Students
              </NavLink>

              <NavLink
                to="/academic-coordinator/subjects"
                className={linkClass}
                onClick={closeSidebar}
              >
                <i className="bi bi-book-fill text-lg"></i>
                Subjects
              </NavLink>

              <NavLink
                to="/academic-coordinator/classes"
                className={linkClass}
                onClick={closeSidebar}
              >
                <i className="bi bi-building text-lg"></i>
                Classes
              </NavLink>

              <NavLink
                to="/academic-coordinator/assessments"
                className={linkClass}
                onClick={closeSidebar}
              >
                <i className="bi bi-clipboard-check text-lg"></i>
                Assessments
              </NavLink>

              <NavLink
                to="/academic-coordinator/timetable"
                className={linkClass}
                onClick={closeSidebar}
              >
                <i className="bi bi-calendar3 text-lg"></i>
                Timetable
              </NavLink>

              <NavLink
                to="/academic-coordinator/reports"
                className={linkClass}
                onClick={closeSidebar}
              >
                <i className="bi bi-clipboard-check text-lg"></i>
                Reports
              </NavLink>

              {/* Results & Grading */}
              <p className={sectionHeading}>
                Results & Grading
              </p>

              <NavLink
                to="/academic-coordinator/academic-results"
                className={linkClass}
                onClick={closeSidebar}
              >
                <i className="bi bi-upload text-lg"></i>
                Result Submissions
              </NavLink>

              <NavLink
                to="/academic-coordinator/grade-scales"
                className={linkClass}
                onClick={closeSidebar}
              >
                <i className="bi bi-award-fill text-lg"></i>
                Grade Scales
              </NavLink>

              <NavLink
                to="/academic-coordinator/learning-outcomes"
                className={linkClass}
                onClick={closeSidebar}
              >
                <i className="bi bi-mortarboard-fill text-lg"></i>
                Learning Outcomes
              </NavLink>

              {/* Account */}
              <p className={sectionHeading}>
                Account
              </p>

              <NavLink
                to="/academic-coordinator/profile"
                className={linkClass}
                onClick={closeSidebar}
              >
                <i className="bi bi-person-fill text-lg"></i>
                My Profile
              </NavLink>

            </nav>
          </div>
        </div>
      </aside>
    </>
  );
};

export default SideBar;