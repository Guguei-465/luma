import { NavLink } from "react-router-dom";

const AdminSideBar = ({ isOpen, setIsOpen }) => {
  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium ${
      isActive
        ? "bg-green-700 text-teal-700 shadow-md"
        : "text-white hover:bg-gree600/15 hover:text-green-950"
    }`;

  const sectionTitle =
    "px-4 mt-6 mb-2 text-[11px] font-bold uppercase tracking-widest text-teal-200";

  const navItems = [
    {
      to: "/admin-dashboard",
      end: true,
      icon: "bi bi-speedometer2",
      label: "Dashboard",
    },
    {
      to: "/admin-dashboard/students",
      icon: "bi bi-people-fill",
      label: "Students",
    },
    {
      to: "/admin-dashboard/teachers",
      icon: "bi bi-person-workspace",
      label: "Teachers",
    },
    {
      to: "/admin-dashboard/parents",
      icon: "bi bi-people",
      label: "Parents",
    },
  ];

  const financeItems = [
    {
      to: "/admin-dashboard/fees-structures",
      icon: "bi bi-receipt",
      label: "Fee Structures List",
    },
    {
      to: "/admin-dashboard/fees-payments",
      icon: "bi bi-credit-card",
      label: "Payments List",
    },
  ];

  const academicItems = [
    {
      to: "/admin-dashboard/attendance",
      icon: "bi bi-calendar-check",
      label: "Attendance",
    },
    {
      to: "/admin-dashboard/exams",
      icon: "bi bi-pencil-square",
      label: "Exams",
    },
  ];

  const systemItems = [
    {
      to: "/admin-dashboard/users",
      icon: "bi bi-person-badge",
      label: "Users",
    },
    {
      to: "/admin-dashboard/notices",
      icon: "bi bi-megaphone-fill",
      label: "Notices",
    },
    {
      to: "/admin-dashboard/profile",
      icon: "bi bi-person-fill",
      label: "Profile",
    },
  ];

  const renderLinks = (items) =>
    items.map((item) => (
      <NavLink
        key={item.to}
        to={item.to}
        end={item.end}
        className={linkClass}
        onClick={() => setIsOpen(false)}
      >
        <i className={`${item.icon} text-lg`}></i>
        <span>{item.label}</span>
      </NavLink>
    ));

  return (
    <>
      {/* =====================================================
          MOBILE OVERLAY
      ===================================================== */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 md:hidden z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* =====================================================
          SIDEBAR
      ===================================================== */}
      <aside
        className={`
          fixed md:static
          z-50
          top-0 left-0
          h-screen
          w-64
          bg-gradient-to-b from-teal-950 via-teal-800 to-teal-600
          text-white
          shadow-xl
          transform
          transition-transform
          duration-300
          overflow-y-auto
          ${
            isOpen
              ? "translate-x-0"
              : "-translate-x-full md:translate-x-0"
          }
        `}
      >
        <div className="p-4">

          {/* =================================================
              SCHOOL BRAND
          ================================================= */}
          <div className="flex items-center gap-3 px-2 py-3 mb-5">

            <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center shadow-sm">
              <i className="bi bi-mortarboard-fill text-2xl text-white"></i>
            </div>

            <div className="min-w-0">
              <h2 className="text-base font-bold leading-tight text-white">
                Luma 2000 Academy
              </h2>

              <p className="text-[10px] font-semibold text-teal-200 uppercase tracking-widest mt-1">
                Admin Panel
              </p>
            </div>

          </div>

          {/* =================================================
              MAIN
          ================================================= */}
          <nav className="space-y-1">

            <p className={sectionTitle}>
              Main
            </p>

            {renderLinks(navItems)}

            {/* =================================================
                FINANCE
            ================================================= */}
            <p className={sectionTitle}>
              Finance
            </p>

            {renderLinks(financeItems)}

            {/* =================================================
                ACADEMIC
            ================================================= */}
            <p className={sectionTitle}>
              Academic
            </p>

            {renderLinks(academicItems)}

            {/* =================================================
                SYSTEM
            ================================================= */}
            <p className={sectionTitle}>
              System
            </p>

            {renderLinks(systemItems)}

          </nav>

          {/* =================================================
              ADMIN FOOTER
          ================================================= */}
          <div className="mt-8 pt-5 border-t border-white/10">

            <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-white/10">

              <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
                <i className="bi bi-shield-check text-white"></i>
              </div>

              <div>
                <p className="text-xs font-semibold text-white">
                  Administrator
                </p>

                <p className="text-[10px] text-teal-200">
                  School Management System
                </p>
              </div>

            </div>

          </div>

        </div>
      </aside>
    </>
  );
};

export default AdminSideBar;