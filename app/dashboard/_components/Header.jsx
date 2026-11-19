'use client'

import { UserButton, useUser } from '@clerk/nextjs'
import Image from 'next/image'
import React, { useEffect, useState } from 'react'

function Header() {
  const { user } = useUser()
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (user) {
        try {
          console.log('Checking admin status for user:', user.id)
          const response = await fetch('/api/admin/check')
          const data = await response.json()
          console.log('Admin check response:', data)
          setIsAdmin(data.isAdmin || false)
        } catch (error) {
          console.error('Error checking admin status:', error)
        }
      }
    }

    checkAdminStatus()
  }, [user])

  return (
    <div className='flex justify-between items-center p-5 shadow-sm'>
        <Image src = {'/favicon.svg'} alt='favicon' width={53} height={40}/>
        <div className='flex items-center gap-4'>
          {isAdmin && (
            <span className='bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium'>
              Admin
            </span>
          )}
          <UserButton />
        </div>
    </div>
  )
}

export default Header