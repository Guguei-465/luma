import React from "react";
import { NavLink } from "react-router-dom";

const AccountantSideBar = ({ isOpen, setIsOpen }) => {
  const linkClass = ({ isActive }) =>
    `flex items-center gap-4 px-3 py-3 rounded-lg transition ${
      isActive
        ? "bg-yellow-600 text-white shadow-md"
        : "text-yellow-900 hover:bg-yellow-200/60 hover:text-white"
    }`;

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 md:hidden z-40"
          onClick={() => setIsOpen(false)}
        ></div>
      )}

      <aside
        className={`fixed md:static z-50 top-0 left-0 h-full w-64 bg-gradient-to-br from-yellow-900 to-yellow-500 text-black transform transition-transform duration-300 ${
          isOpen
            ? "translate-x-0"
            : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="p-5">
          <h2 className="text-2xl font-bold mb-8 text-yellow-950">
            Luma 2000 Academy
          </h2>

          <nav className="space-y-2">
            <NavLink to="/accountant" end className={linkClass} onClick={() => setIsOpen(false)}>
              <i className="bi bi-speedometer2"></i> Dashboard
            </NavLink>
            <NavLink to="/accountant/fee-records" className={linkClass} onClick={() => setIsOpen(false)}>
              <i className="bi bi-journal-text"></i> Fee Receipt
            </NavLink>
            <NavLink to="/accountant/record-payment" className={linkClass} onClick={() => setIsOpen(false)}>
              <i className="bi bi-currency-exchange"></i> Record Payment
            </NavLink>
             <NavLink to="/accountant/fee-structure" className={linkClass} onClick={() => setIsOpen(false)}>
              <i className="bi bi-currency-exchange"></i> Generate Fee Structure
            </NavLink>
            <NavLink to="/accountant/pending-fees" className={linkClass} onClick={() => setIsOpen(false)}>
              <i className="bi bi-clock-history"></i> Pending Fees
            </NavLink>
            
            <NavLink to="/accountant/financial-reports" className={linkClass} onClick={() => setIsOpen(false)}>
              <i className="bi bi-bar-chart-fill"></i> Financial Reports
            </NavLink>
            <NavLink to="/accountant/notices" className={linkClass} onClick={() => setIsOpen(false)}>
              <i className="bi bi-megaphone-fill"></i> Send Fee Notice
            </NavLink>
            <NavLink to="/accountant/sent-notices" className={linkClass} onClick={() => setIsOpen(false)}>
              <i className="bi bi-send-check"></i> Sent Notices
            </NavLink>
            <NavLink to="/accountant/profile" className={linkClass} onClick={() => setIsOpen(false)}>
              <i className="bi bi-person-fill"></i> My Profile
            </NavLink>
          </nav>
        </div>
      </aside>
    </>
  );
};

export default AccountantSideBar;