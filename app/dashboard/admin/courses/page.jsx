'use client'

import React, { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

function AdminCourses() {
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const checkAdminAccess = async () => {
      try {
        const response = await fetch('/api/admin/check')
        const data = await response.json()
        
        if (!data.isAdmin) {
          // Redirect to dashboard if not admin
          router.push('/dashboard')
          return
        }
        
        setIsAdmin(true)
        
        // Fetch all courses
        const coursesResponse = await fetch('/api/admin/courses')
        const coursesData = await coursesResponse.json()
        
        if (!coursesResponse.ok) {
          throw new Error(coursesData.error || 'Failed to fetch courses')
        }
        
        setCourses(coursesData.courses || [])
      } catch (err) {
        console.error('Error:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    checkAdminAccess()
  }, [router])

  const handleDeleteCourse = async (courseId, courseName) => {
    if (!courseId) return
    
    const confirmed = confirm(`Are you sure you want to delete the course "${courseName}"? This action cannot be undone.`)
    if (!confirmed) return

    try {
      const response = await fetch(`/api/courses?courseId=${encodeURIComponent(courseId)}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error(`Failed to delete course: ${response.status} ${response.statusText}`)
      }

      // Remove the course from the state
      setCourses(prevCourses => prevCourses.filter(course => course.courseId !== courseId))
      
      alert('Course deleted successfully!')
    } catch (err) {
      console.error('Error deleting course:', err)
      alert(`Error deleting course: ${err.message}`)
    }
  }

  const handleViewCourse = (courseId) => {
    if (courseId) {
      router.push(`/create-course/${courseId}`)
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-6">Manage Courses</h1>
        <p>Loading courses...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-6">Manage Courses</h1>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">Error: {error}</p>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-6">Manage Courses</h1>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">Access denied. You do not have permission to view this page.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Manage Courses</h1>
        <Button onClick={() => router.push('/create-course')}>
          Create New Course
        </Button>
      </div>
      
      {courses.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No courses available yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <div key={course.courseId || course.id} className="border rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
              <h2 className="text-xl font-semibold mb-2">{course.name || 'Untitled Course'}</h2>
              <p className="text-gray-600 text-sm mb-4">{course.category || 'Uncategorized'}</p>
              <div className="flex justify-between items-center mt-4">
                <span className="text-xs text-gray-500">
                  Created by: {course.userName || course.createdBy || 'Anonymous'}
                </span>
              </div>
              <div className="flex justify-between items-center mt-4">
                <span className={`px-2 py-1 rounded text-xs ${course.isPublic ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                  {course.isPublic ? 'Public' : 'Private'}
                </span>
                <div className="flex gap-2">
                  <Button 
                    onClick={() => handleViewCourse(course.courseId || course.id)}
                    size="sm"
                    variant="outline"
                  >
                    View
                  </Button>
                  <Button 
                    onClick={() => handleDeleteCourse(course.courseId, course.name)}
                    size="sm"
                    variant="destructive"
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default AdminCourses