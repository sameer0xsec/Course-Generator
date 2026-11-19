'use client'

import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { HiMiniBookOpen, HiMiniUserGroup, HiMiniChartBar } from "react-icons/hi2"
import { useRouter } from 'next/navigation'

function AdminDashboard() {
  const [stats, setStats] = useState({
    totalCourses: 0,
    publicCourses: 0,
    totalUsers: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // First check if user is admin
        const adminCheckResponse = await fetch('/api/admin/check')
        const adminCheckData = await adminCheckResponse.json()
        
        if (!adminCheckData.isAdmin) {
          // Redirect to dashboard if not admin
          router.push('/dashboard')
          return
        }
        
        setIsAdmin(true)
        
        // Fetch stats
        const coursesResponse = await fetch('/api/admin/stats')
        const coursesData = await coursesResponse.json()
        
        if (coursesResponse.ok) {
          setStats(coursesData)
        } else {
          throw new Error(coursesData.error || 'Failed to fetch stats')
        }
      } catch (error) {
        console.error('Error fetching stats:', error)
        setError(error.message)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [router])

  if (loading) {
    return (
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
        <p>Loading dashboard...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">Error: {error}</p>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">Access denied. You do not have permission to view this page.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
            <HiMiniBookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalCourses}
            </div>
            <p className="text-xs text-muted-foreground">
              All courses in the system
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Public Courses</CardTitle>
            <HiMiniChartBar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.publicCourses}
            </div>
            <p className="text-xs text-muted-foreground">
              Courses visible in Explore
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <HiMiniUserGroup className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalUsers}
            </div>
            <p className="text-xs text-muted-foreground">
              Registered users
            </p>
          </CardContent>
        </Card>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button 
            className="p-4 border rounded-lg hover:bg-gray-50 transition-colors text-left"
            onClick={() => window.location.href = '/dashboard/admin/courses'}
          >
            <h3 className="font-medium mb-2">Manage Courses</h3>
            <p className="text-sm text-gray-600">View, edit, or delete all courses in the system</p>
          </button>
          
          <button 
            className="p-4 border rounded-lg hover:bg-gray-50 transition-colors text-left"
            onClick={() => window.location.href = '/dashboard/admin/users'}
          >
            <h3 className="font-medium mb-2">Manage Users</h3>
            <p className="text-sm text-gray-600">View and manage user accounts</p>
          </button>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard