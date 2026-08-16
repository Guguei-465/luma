import { useState } from "react";
import { Outlet } from "react-router-dom";
import AcademicCoordinatorSidebar from "./SideBar";
import DashboardNavBar from "../DashboardNavBar";

const AcademicCoLayout = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">

      {/* Sidebar */}
      <AcademicCoordinatorSidebar
        isOpen={isOpen}
        setIsOpen={setIsOpen}
      />

      {/* Main Content */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">

        {/* Top Navbar */}
        <DashboardNavBar
          onMenuClick={() => setIsOpen(true)}
        />

        {/* Main Page */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>

      </div>
    </div>
  );
};

export default AcademicCoLayout;