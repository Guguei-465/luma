import React, { useState } from 'react'
import { Outlet } from 'react-router-dom'
import DashboardNavBar from '../DashboardNavBar'
import AccountantSidebar from './AccountantSideBar'

const AccountantLayout = () => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100">

      {/* Sidebar */}
      <AccountantSidebar
        isOpen={isOpen}
        setIsOpen={setIsOpen}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">

        <DashboardNavBar
          isOpen={isOpen}
          setIsOpen={setIsOpen}
          title="Accountant Dashboard"
        />

        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>

      </div>

    </div>
  )
}

export default AccountantLayout