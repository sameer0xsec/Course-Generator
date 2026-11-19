'use client'

import React, { useEffect, useState } from 'react'
import AdminSidebar from './_components/AdminSidebar'
import { useRouter } from 'next/navigation'

export default function AdminLayout({ children }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    const checkAdminAccess = async () => {
      try {
        const response = await fetch('/api/admin/check')
        const data = await response.json()
        
        if (!data.isAdmin) {
          // Redirect to dashboard if not admin
          router.push('/dashboard')
        } else {
          setIsAdmin(true)
        }
      } catch (error) {
        console.error('Error checking admin access:', error)
        router.push('/dashboard')
      } finally {
        setLoading(false)
      }
    }

    checkAdminAccess()
  }, [router])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Access denied. Redirecting...</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <main className="flex-1 p-8 bg-gray-50">
        {children}
      </main>
    </div>
  )
}