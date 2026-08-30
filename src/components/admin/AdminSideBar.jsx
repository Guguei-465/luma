import { NavLink } from "react-router-dom";


const AdminSideBar = ({ isOpen, setIsOpen }) => {
  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-sm ${
      isActive
        ? "bg-green-600 text-white shadow-md"
        : "text-gray-300 hover:bg-white/10 hover:text-white"
    }`;


  const sectionHeading =
    "text-gray-300 text-sm font-semibold uppercase tracking-wider px-3 py-2 mt-6 mb-1";


  const navItems = [
    { to: "/admin-dashboard", end: true, icon: "bi bi-speedometer2", label: "Dashboard" },
    { to: "/admin-dashboard/students", icon: "bi bi-people-fill", label: "Students" },
    { to: "/admin-dashboard/teachers", icon: "bi bi-person-workspace", label: "Teachers" },
    { to: "/admin-dashboard/parents", icon: "bi bi-people", label: "Parents" },
  ];


  const financeItems = [
    { to: "/admin-dashboard/fees-structures", icon: "bi bi-receipt", label: "Fee Structures List" },
    { to: "/admin-dashboard/fees-payments", icon: "bi bi-credit-card", label: "Payments List" },
  ];


  const academicItems = [
    { to: "/admin-dashboard/exams", icon: "bi bi-pencil-square", label: "Exams" },
    { to: "/admin-dashboard/class-performance", icon: "bi bi-bar-chart-fill", label: "Class Performance" },
  ];


  const systemItems = [
    { to: "/admin-dashboard/users", icon: "bi bi-person-badge", label: "Users" },
    { to: "/admin-dashboard/notices", icon: "bi bi-megaphone-fill", label: "Notices" },
    { to: "/admin-dashboard/profile", icon: "bi bi-person-fill", label: "Profile" },
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
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 md:hidden z-40 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}


      {/* Sidebar */}
      <aside
        className={`
          fixed md:static
          z-50
          top-0 left-0
          h-screen
          w-64
          bg-green-900
          text-white
          shadow-xl
          transform
          transition-transform
          duration-300
          overflow-y-auto
          ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
      >
        <div className="p-4">
          {/* SCHOOL BRAND */}
          <div className="flex items-center gap-3 px-2 py-3 mb-5">
            <div className="w-10 h-10 rounded-lg bg-green-700 flex items-center justify-center">
              <i className="bi bi-mortarboard-fill text-xl text-white"></i>
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-bold leading-tight text-white">
                Luma 2000 Academy
              </h2>
              <p className="text-xs text-green-300 font-medium">
                Admin Panel
              </p>
            </div>
          </div>


          {/* NAVIGATION */}
          <nav className="space-y-1">
            <p className={sectionHeading}>Main</p>
            {renderLinks(navItems)}


            <p className={sectionHeading}>Finance</p>
            {renderLinks(financeItems)}


            <p className={sectionHeading}>Academic</p>
            {renderLinks(academicItems)}


            <p className={sectionHeading}>System</p>
            {renderLinks(systemItems)}
          </nav>


          {/* FOOTER */}
          <div className="mt-8 pt-5 border-t border-green-800">
            <div className="flex items-center gap-3 px-3 py-3 rounded-lg bg-green-800/50">
              <div className="w-8 h-8 rounded-full bg-green-700 flex items-center justify-center">
                <i className="bi bi-shield-check text-white"></i>
              </div>
              <div>
                <p className="text-sm font-medium text-white">Administrator</p>
                <p className="text-xs text-green-300">School Management System</p>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};


export default AdminSideBar;