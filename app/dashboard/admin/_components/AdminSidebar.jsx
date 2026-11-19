'use client'

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { HiMiniHome, HiMiniBookOpen, HiMiniPower, HiMiniUserGroup } from "react-icons/hi2";
import { SignOutButton } from '@clerk/nextjs'

function AdminSidebar() {
  const Menu = [
    {
      id: 1,
      name: 'Admin Dashboard',
      icon: <HiMiniHome />,
      path: '/dashboard/admin'
    },
    {
      id: 2,
      name: 'Manage Courses',
      icon: <HiMiniBookOpen />,
      path: '/dashboard/admin/courses'
    },
    {
      id: 3,
      name: 'Manage Users',
      icon: <HiMiniUserGroup />,
      path: '/dashboard/admin/users'
    },
    {
      id: 4,
      name: 'Logout',
      icon: <HiMiniPower />,
      action: 'logout'
    }
  ]

  const path = usePathname()

  return (
    <div className='w-64 min-h-screen bg-gray-800 text-white p-5'>
      <div className="flex items-center gap-2 mb-8">
        <Image src="/logo.svg" alt="Logo" width={40} height={40} />
        <h1 className="text-xl font-bold">Admin Panel</h1>
      </div>
      
      <ul>
        {Menu.map((item) => {
          if (item.action === 'logout') {
            return (
              <SignOutButton key={item.id} redirectUrl="/">
                <div className='flex items-center gap-3 cursor-pointer mb-2 p-3 rounded-lg text-gray-300 hover:bg-gray-700 hover:text-white transition-colors duration-200'>
                  <div className="text-xl">{item.icon}</div>
                  <h2>{item.name}</h2>
                </div>
              </SignOutButton>
            )
          }
          
          const isActive = path === item.path
          return (
            <Link href={item.path} key={item.id}>
              <div
                className={`flex items-center gap-3 cursor-pointer mb-2 p-3 rounded-lg transition-colors duration-200 ${
                  isActive 
                    ? 'bg-indigo-600 text-white font-medium' 
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                <div className="text-xl">{item.icon}</div>
                <h2>{item.name}</h2>
              </div>
            </Link>
          )
        })}
      </ul>
    </div>
  )
}

export default AdminSidebar