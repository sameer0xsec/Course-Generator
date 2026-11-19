'use client'

import React, { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

function Explore() {
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const fetchPublicCourses = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch('/api/explore')
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch public courses')
        }

        // Filter out any courses that might not have the required fields
        const validCourses = (data.courses || []).filter(course =>
          course.courseId && course.name
        );

        console.log(`Fetched ${validCourses.length} valid public courses`);
        setCourses(validCourses)
      } catch (err) {
        console.error('Error fetching public courses:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    const checkAdminStatus = async () => {
      try {
        const response = await fetch('/api/admin/check')
        const data = await response.json()
        setIsAdmin(data.isAdmin || false)
      } catch (error) {
        console.error('Error checking admin status:', error)
      }
    }

    fetchPublicCourses()
    checkAdminStatus()
  }, [])

  const handleDeleteCourse = async (courseId, courseName) => {
    if (!courseId) return

    const confirmed = confirm(`Are you sure you want to delete the course "${courseName}"? This action cannot be undone.`)
    if (!confirmed) return

    try {
      const response = await fetch(`/api/courses?courseId=${encodeURIComponent(courseId)}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to delete course: ${response.status} ${response.statusText}`)
      }

      // Remove the course from the state
      setCourses(prevCourses => prevCourses.filter(course => course.courseId !== courseId))

      alert('Course deleted successfully!')
    } catch (err) {
      console.error('Error deleting course:', err)
      // Handle specific error cases
      if (err.message.includes('403')) {
        alert('You do not have permission to delete this course.')
      } else {
        alert(`Error deleting course: ${err.message}`)
      }
    }
  }

  const handleViewCourse = (courseId) => {
    if (courseId) {
      router.push(`/create-course/${courseId}?view=dashboard`)
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-6">Explore Public Courses</h1>
        <p>Loading courses...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-6">Explore Public Courses</h1>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">Error: {error}</p>
          <p className="text-red-600 text-sm mt-2">There might be an issue with the database schema. The application will continue to work with limited functionality.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Explore Public Courses</h1>
      <p className="text-gray-600 mb-4">Discover courses created by our community members.</p>

      {courses.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No public courses available yet.</p>
          <p className="text-gray-500 mt-2">Be the first to create and share a course!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <ExploreCourseCard
              key={course.courseId || course.id}
              course={course}
              isAdmin={isAdmin}
              onDelete={handleDeleteCourse}
              onView={handleViewCourse}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// Separate component for explore course card to manage image error state
function ExploreCourseCard({ course, isAdmin, onDelete, onView }) {
  const [imageError, setImageError] = useState(false);
  
  const imageSrc = imageError ? '/guide-book.png' : (
    course.courseBannerImage ||
    course.courseOutput?.course?.bannerImage ||
    course.courseOutput?.bannerImage ||
    '/guide-book.png'
  );

  return (
    <div
      onClick={() => onView(course.courseId || course.id)}
      className="border rounded-lg shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer relative group"
    >
      {/* Delete button - only for admins */}
      {isAdmin && (
        <button
          onClick={(e) => {
            e.stopPropagation(); // Prevent card click
            onDelete(course.courseId, course.name);
          }}
          className="absolute top-3 right-3 z-10 p-2 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-lg transition-all opacity-0 group-hover:opacity-100"
          title="Delete course"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </button>
      )}

      <div className="relative h-48 w-full">
        <Image
          src={imageSrc}
          alt={course.name || 'Course thumbnail'}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          unoptimized={true}
          onError={() => {
            console.warn('Image load failed for course:', course.courseId || course.id, '- Falling back to default image');
            setImageError(true);
          }}
        />
      </div>
      <div className="p-6">
        <h2 className="text-xl font-semibold mb-2 group-hover:text-indigo-600 transition-colors">{course.name || 'Untitled Course'}</h2>
        <p className="text-gray-600 text-sm mb-4">{course.category || 'Uncategorized'}</p>
        <div className="flex justify-between items-center mt-4">
          <span className="text-xs text-gray-500">
            Created by: {course.userName || course.createdBy || 'Anonymous'}
          </span>
        </div>
      </div>
    </div>
  );
}

export default Explore