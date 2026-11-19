import { UserButton } from '@clerk/nextjs'
import React from 'react'
import AddCourse from './_components/AddCourse'
import CourseList from './_components/CourseList'

function Dashboard() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <AddCourse />
      <div className="mt-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Your Courses</h2>
        <CourseList />
      </div>
    </div>
  )
}

export default Dashboard