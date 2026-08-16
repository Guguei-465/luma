import { NavLink } from "react-router-dom";

const AdminSubNav = ({ items, title }) => {
  return (
    <div className="mb-6">
      {title && (
        <div className="mb-3 flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-teal-600">
            {title}
          </span>
          <span className="h-px flex-1 bg-teal-100"></span>
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                isActive
                  ? "bg-teal-600 text-white border-teal-600 shadow-sm"
                  : "bg-white text-gray-700 border-gray-200 hover:bg-teal-50 hover:border-teal-300 hover:text-teal-700"
              }`
            }
          >
            {item.icon && <i className={item.icon}></i>}
            {item.label}
          </NavLink>
        ))}
      </div>
    </div>
  );
};

export default AdminSubNav;
