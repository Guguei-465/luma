import React, { useState } from 'react'
import { Outlet } from 'react-router-dom'
import DashboardNavBar from '../DashboardNavBar'
import ParentSidebar from './ParentSidebar'

const ParentLayout = () => {
    const [isOpen, setIsOpen]=useState(false)
  return (
    <div className='flex h-screen overflow-hidden bg-gray-100'>
      {/* sidebar */}
      <ParentSidebar isOpen={isOpen} setIsOpen={setIsOpen}/>
      {/* main area */}
      <div className='flex flex-col flex-1 h-full'>
        <DashboardNavBar onMenuClick={()=>setIsOpen(true)}/>
        <main className='flex-1 overflow-y-auto p-4 md:p-6'>
            <Outlet/>
        </main>
      </div>
    </div>
  )
}

export default ParentLayout
