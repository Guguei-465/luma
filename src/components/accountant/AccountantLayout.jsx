import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import DashboardNavBar from "../DashboardNavBar";
import AccountantSidebar from "./AccountantSideBar";

const AccountantLayout = () => {
    // =====================================================
    // SIDEBAR STATE
    // =====================================================
    const [isOpen, setIsOpen] = useState(false);

    // =====================================================
    // OPEN SIDEBAR
    // =====================================================
    const openSidebar = () => {
        setIsOpen(true);
    };

    return (
        <div className="flex h-screen overflow-hidden bg-gray-100">

            {/* =================================================
                ACCOUNTANT SIDEBAR
                ================================================= */}
            <AccountantSidebar
                isOpen={isOpen}
                setIsOpen={setIsOpen}
            />

            {/* =================================================
                MAIN CONTENT AREA
                ================================================= */}
            <div className="flex-1 min-w-0 flex flex-col overflow-hidden">

                {/* =================================================
                    SHARED DASHBOARD NAVBAR

                    DashboardNavBar is shared by all dashboards,
                    so we only pass the menu click handler here.
                    ================================================= */}
                <DashboardNavBar
                    onMenuClick={openSidebar}
                />

                {/* =================================================
                    PAGE CONTENT
                    ================================================= */}
                <main className="flex-1 overflow-y-auto p-4 sm:p-6">
                    <Outlet />
                </main>

            </div>
        </div>
    );
};

export default AccountantLayout;