'use client'
import React, { useEffect, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import Link from 'next/link'
import Image from 'next/image'
import { BookOpenIcon } from '@heroicons/react/24/outline'

function CourseList() {
  const { user } = useUser()
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    const fetchCourses = async () => {
      if (!user?.primaryEmailAddress?.emailAddress) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        // Pass both ID and Email to API to find courses created by either identifier (legacy support)
        const userId = encodeURIComponent(user.id);
        const userEmail = encodeURIComponent(user.primaryEmailAddress.emailAddress);
        const response = await fetch(`/api/courses?userId=${userId}&userEmail=${userEmail}`)

        if (!response.ok) {
          throw new Error(`Failed to fetch courses: ${response.status} ${response.statusText}`)
        }

        const data = await response.json()
        console.log("Courses fetched from API:", data.rows); // Debug: Log fetched courses
        setCourses(data.rows || [])
      } catch (err) {
        console.error('Error fetching courses:', err)
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

    if (user) {
      fetchCourses()
      checkAdminStatus()
    }
  }, [user])

  const handleDeleteCourse = async (courseId, courseName, courseCreator) => {
    if (!courseId) return;

    // Check if user can delete this course (is admin or owner)
    const isCourseOwner = courseCreator === user?.primaryEmailAddress?.emailAddress;
    if (!isAdmin && !isCourseOwner) {
      alert('You do not have permission to delete this course.');
      return;
    }

    // Confirm deletion
    const confirmed = confirm(`Are you sure you want to delete the course "${courseName}"? This action cannot be undone.`);
    if (!confirmed) return;

    try {
      const response = await fetch(`/api/courses?courseId=${encodeURIComponent(courseId)}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to delete course: ${response.status} ${response.statusText}`);
      }

      // Remove the course from the state
      setCourses(prevCourses => prevCourses.filter(course => course.courseId !== courseId));

      // Show success message
      alert('Course deleted successfully!');
    } catch (err) {
      console.error('Error deleting course:', err);
      // Handle specific error cases
      if (err.message.includes('403')) {
        alert('You do not have permission to delete this course.');
      } else {
        alert(`Error deleting course: ${err.message}`);
      }
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-xl shadow-md p-6 animate-pulse">
            <div className="h-48 bg-gray-200 rounded-lg mb-4"></div>
            <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <p className="text-red-700">Error loading courses: {error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    )
  }

  if (courses.length === 0) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 text-center">
        <h3 className="text-xl font-medium text-blue-800 mb-2">No courses yet</h3>
        <p className="text-blue-600 mb-4">Create your first AI-powered course to get started!</p>
        <Link href="/create-course">
          <button className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
            + Create AI Course
          </button>
        </Link>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {courses.map((course) => {
        // Debug: Log course data to see what's available
        console.log('Course data:', course);

        // Determine the image source with fallbacks
        const imageSrc = course.courseBannerImage ||
          course.courseOutput?.course?.bannerImage ||
          course.courseOutput?.bannerImage ||
          '/guide-book.png';

        // Debug: Log the image source being used
        console.log('Image source for course:', course.courseId || course.id, imageSrc);

        // Check if user can delete this course (only admin can delete)
        const canDelete = isAdmin;

        return (
          <CourseCard
            key={course.courseId || course.id}
            course={course}
            canDelete={canDelete}
            onDelete={handleDeleteCourse}
          />
        );
      })}
    </div>
  )
}

// Separate component for course card to manage image error state
function CourseCard({ course, canDelete, onDelete }) {
  const [imageError, setImageError] = useState(false);
  
  const imageSrc = imageError ? '/guide-book.png' : (
    course.courseBannerImage ||
    course.courseOutput?.course?.bannerImage ||
    course.courseOutput?.bannerImage ||
    '/guide-book.png'
  );

  return (
    <Link
      href={`/create-course/${course.courseId || course.id}?view=dashboard`}
      className="block group"
    >
      <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer relative">
        {/* Delete button - only for admins, positioned absolutely */}
        {canDelete && (
          <button
            onClick={(e) => {
              e.preventDefault(); // Prevent navigation when clicking delete
              e.stopPropagation();
              onDelete(course.courseId, course.name || course.courseOutput?.course?.name || 'Untitled Course', course.createdBy);
            }}
            className="absolute top-3 right-3 z-10 p-2 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-lg transition-all opacity-0 group-hover:opacity-100"
            title="Delete course"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </button>
        )}

        <div className="relative h-48">
          <Image
            src={imageSrc}
            alt={course.name || course.courseOutput?.course?.name || 'Course thumbnail'}
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
          <h3 className="font-bold text-lg mb-2 line-clamp-2 group-hover:text-indigo-600 transition-colors">
            {course.name || course.courseOutput?.course?.name || 'Untitled Course'}
          </h3>
          <p className="text-gray-600 text-sm mb-4 line-clamp-2">
            {course.courseOutput?.course?.description || course.description || 'No description available'}
          </p>
          <div className="flex justify-between items-center">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800">
              {course.category || 'General'}
            </span>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 text-sm text-gray-500">
                <BookOpenIcon className="w-4 h-4" />
                <span>{course?.courseOutput?.course?.chapters?.length || 0} Chapters</span>
              </div>
              <span className="text-sm text-gray-500">
                {course.level || 'Beginner'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default CourseList