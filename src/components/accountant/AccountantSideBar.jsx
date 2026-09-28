import React from "react";
import { NavLink } from "react-router-dom";

const AccountantSideBar = ({ isOpen, setIsOpen }) => {
<<<<<<< HEAD
  const linkClass = ({ isActive }) =>
    `flex items-center gap-4 px-4 py-3 rounded-lg transition-all duration-200 w-full ${
      isActive
        ? "bg-yellow-600 text-white shadow-md"
        : "text-black hover:bg-yellow-200/70 hover:text-black"
    }`;

  const closeSidebar = () => setIsOpen?.(false);

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-[998] md:hidden"
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-[999] h-screen w-64 bg-gradient-to-br from-yellow-500 via-yellow-400 to-yellow-200 shadow-2xl transform transition-transform duration-300 ease-in-out overflow-hidden ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } md:static md:translate-x-0 md:flex-shrink-0 md:shadow-none`}
      >
        <div
          className="h-full p-5 overflow-y-auto overflow-x-hidden"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-black whitespace-nowrap">
              Luma 2000 Academy
            </h2>
            <button
              type="button"
              onClick={closeSidebar}
              aria-label="Close sidebar"
              className="md:hidden flex items-center justify-center w-10 h-10 rounded-full text-black hover:bg-yellow-300 active:scale-95 transition border-0 bg-transparent cursor-pointer"
            >
              <span className="text-4xl leading-none">×</span>
            </button>
          </div>

          {/* Navigation */}
          <nav className="space-y-2">
            <NavLink to="/accountant" end className={linkClass} onClick={closeSidebar}>
              <i className="bi bi-speedometer2 text-xl flex-shrink-0" />
              <span className="whitespace-nowrap">Dashboard</span>
            </NavLink>

            {/* ✅ NEW — Fee Management */}
            <NavLink to="/accountant/fee-management" className={linkClass} onClick={closeSidebar}>
              <i className="bi bi-cash-coin text-xl flex-shrink-0" />
              <span className="whitespace-nowrap">Fee Management</span>
            </NavLink>

            <NavLink to="/accountant/fee-records" className={linkClass} onClick={closeSidebar}>
              <i className="bi bi-journal-text text-xl flex-shrink-0" />
              <span className="whitespace-nowrap">Fee Receipt</span>
            </NavLink>

            <NavLink to="/accountant/record-payment" className={linkClass} onClick={closeSidebar}>
              <i className="bi bi-currency-exchange text-xl flex-shrink-0" />
              <span className="whitespace-nowrap">Record Payment</span>
            </NavLink>

            <NavLink to="/accountant/fee-structure" className={linkClass} onClick={closeSidebar}>
              <i className="bi bi-cash-stack text-xl flex-shrink-0" />
              <span className="whitespace-nowrap">Generate Fee Structure</span>
            </NavLink>

            <NavLink to="/accountant/pending-fees" className={linkClass} onClick={closeSidebar}>
              <i className="bi bi-clock-history text-xl flex-shrink-0" />
              <span className="whitespace-nowrap">Pending Fees</span>
            </NavLink>

            <NavLink to="/accountant/financial-reports" className={linkClass} onClick={closeSidebar}>
              <i className="bi bi-bar-chart-fill text-xl flex-shrink-0" />
              <span className="whitespace-nowrap">Financial Reports</span>
            </NavLink>

            <NavLink to="/accountant/notices" className={linkClass} onClick={closeSidebar}>
              <i className="bi bi-megaphone-fill text-xl flex-shrink-0" />
              <span className="whitespace-nowrap">Send Fee Notice</span>
            </NavLink>

            <NavLink to="/accountant/sent-notices" className={linkClass} onClick={closeSidebar}>
              <i className="bi bi-send-check text-xl flex-shrink-0" />
              <span className="whitespace-nowrap">Sent Notices</span>
            </NavLink>

            <NavLink to="/accountant/profile" className={linkClass} onClick={closeSidebar}>
              <i className="bi bi-person-fill text-xl flex-shrink-0" />
              <span className="whitespace-nowrap">My Profile</span>
            </NavLink>
          </nav>
        </div>
      </aside>
    </>
  );
=======

    // =====================================================
    // NAVIGATION LINK CLASS
    // =====================================================
    const linkClass = ({ isActive }) =>
        `flex items-center gap-4 px-4 py-3 rounded-lg transition-all duration-200 w-full ${
            isActive
                ? "bg-yellow-600 text-white shadow-md"
                : "text-black hover:bg-yellow-200/70 hover:text-black"
        }`;

    // =====================================================
    // CLOSE SIDEBAR
    // =====================================================
    const closeSidebar = () => {
        if (setIsOpen) {
            setIsOpen(false);
        }
    };

    return (
        <>
            {/* =====================================================
                MOBILE OVERLAY
                ===================================================== */}
            {isOpen && (
                <div
                    className="
                        fixed
                        inset-0
                        bg-black/60
                        z-[998]
                        md:hidden
                    "
                    onClick={closeSidebar}
                    aria-hidden="true"
                />
            )}

            {/* =====================================================
                SIDEBAR
                ===================================================== */}
            <aside
                className={`
                    fixed
                    top-0
                    left-0
                    z-[999]
                    h-screen
                    w-64
                    bg-gradient-to-br
                    from-yellow-500
                    via-yellow-400
                    to-yellow-200
                    shadow-2xl

                    transform
                    transition-transform
                    duration-300
                    ease-in-out

                    overflow-hidden

                    ${
                        isOpen
                            ? "translate-x-0"
                            : "-translate-x-full"
                    }

                    md:static
                    md:translate-x-0
                    md:flex-shrink-0
                    md:shadow-none
                `}
            >

                {/* =================================================
                    SCROLLABLE CONTENT
                    ================================================= */}
                <div
                    className="
                        accountant-sidebar-scroll
                        h-full
                        p-5
                        overflow-y-auto
                        overflow-x-hidden
                    "
                    style={{
                        scrollbarWidth: "none",
                        msOverflowStyle: "none",
                    }}
                >

                    {/* =================================================
                        HEADER
                        ================================================= */}
                    <div className="flex items-center justify-between mb-8">

                        {/* Academy name */}
                        <h2 className="text-2xl font-bold text-black whitespace-nowrap">
                            Luma 2000 Academy
                        </h2>

                        {/* =================================================
                            MOBILE CLOSE BUTTON
                            ================================================= */}
                        <button
                            type="button"
                            onClick={closeSidebar}
                            aria-label="Close sidebar"
                            className="
                                md:hidden
                                flex
                                items-center
                                justify-center
                                w-10
                                h-10
                                flex-shrink-0
                                rounded-full
                                text-black
                                hover:bg-yellow-300
                                active:scale-95
                                transition
                                border-0
                                bg-transparent
                                cursor-pointer
                            "
                        >
                            <span className="text-4xl leading-none">
                                ×
                            </span>
                        </button>

                    </div>

                    {/* =================================================
                        NAVIGATION
                        ================================================= */}
                    <nav className="space-y-2">

                        {/* Dashboard */}
                        <NavLink
                            to="/accountant"
                            end
                            className={linkClass}
                            onClick={closeSidebar}
                        >
                            <i className="bi bi-speedometer2 text-xl flex-shrink-0" />

                            <span className="whitespace-nowrap">
                                Dashboard
                            </span>
                        </NavLink>

                        {/* Fee Receipt */}
                        <NavLink
                            to="/accountant/fee-records"
                            className={linkClass}
                            onClick={closeSidebar}
                        >
                            <i className="bi bi-journal-text text-xl flex-shrink-0" />

                            <span className="whitespace-nowrap">
                                Fee Receipt
                            </span>
                        </NavLink>

                        {/* Record Payment */}
                        <NavLink
                            to="/accountant/record-payment"
                            className={linkClass}
                            onClick={closeSidebar}
                        >
                            <i className="bi bi-currency-exchange text-xl flex-shrink-0" />

                            <span className="whitespace-nowrap">
                                Record Payment
                            </span>
                        </NavLink>

                        {/* Generate Fee Structure */}
                        <NavLink
                            to="/accountant/fee-structure"
                            className={linkClass}
                            onClick={closeSidebar}
                        >
                            <i className="bi bi-cash-stack text-xl flex-shrink-0" />

                            <span className="whitespace-nowrap">
                                Generate Fee Structure
                            </span>
                        </NavLink>

                        {/* Pending Fees */}
                        <NavLink
                            to="/accountant/pending-fees"
                            className={linkClass}
                            onClick={closeSidebar}
                        >
                            <i className="bi bi-clock-history text-xl flex-shrink-0" />

                            <span className="whitespace-nowrap">
                                Pending Fees
                            </span>
                        </NavLink>

                        {/* Financial Reports */}
                        <NavLink
                            to="/accountant/financial-reports"
                            className={linkClass}
                            onClick={closeSidebar}
                        >
                            <i className="bi bi-bar-chart-fill text-xl flex-shrink-0" />

                            <span className="whitespace-nowrap">
                                Financial Reports
                            </span>
                        </NavLink>

                        {/* Send Fee Notice */}
                        <NavLink
                            to="/accountant/notices"
                            className={linkClass}
                            onClick={closeSidebar}
                        >
                            <i className="bi bi-megaphone-fill text-xl flex-shrink-0" />

                            <span className="whitespace-nowrap">
                                Send Fee Notice
                            </span>
                        </NavLink>

                        {/* Sent Notices */}
                        <NavLink
                            to="/accountant/sent-notices"
                            className={linkClass}
                            onClick={closeSidebar}
                        >
                            <i className="bi bi-send-check text-xl flex-shrink-0" />

                            <span className="whitespace-nowrap">
                                Sent Notices
                            </span>
                        </NavLink>

                        {/* My Profile */}
                        <NavLink
                            to="/accountant/profile"
                            className={linkClass}
                            onClick={closeSidebar}
                        >
                            <i className="bi bi-person-fill text-xl flex-shrink-0" />

                            <span className="whitespace-nowrap">
                                My Profile
                            </span>
                        </NavLink>

                    </nav>
                </div>
            </aside>
        </>
    );
>>>>>>> 2b3ffb1f22043a22a10cbc412c2c25c04fbce9e1
};

export default AccountantSideBar;