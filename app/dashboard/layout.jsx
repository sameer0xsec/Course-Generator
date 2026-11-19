import React from 'react'
import SideBar from './_components/SideBar'
import Header from './_components/Header'

function DashboardLayout({children}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className='md:w-64 hidden md:block'>
        <SideBar />
      </div>
      <div className='md:ml-64'>
        <Header />
        <div className='p-6 md:p-10'>
          {children}
        </div>      
      </div>        
    </div>
  )
}

export default DashboardLayout