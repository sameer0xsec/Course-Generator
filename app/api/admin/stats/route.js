import { NextResponse } from 'next/server'
import { db } from '@/configs/db'
import { CourseList } from '@/configs/schema'
import { eq } from 'drizzle-orm'
import { getAuth } from '@clerk/nextjs/server'

// This is a simple admin check - in a real application, you would have a more robust admin system
const isAdmin = (userId) => {
  // For demo purposes, we'll check if the user is in our admin list
  const adminUsers = process.env.ADMIN_USERS?.split(',') || []
  return adminUsers.includes(userId)
}

export async function GET(request) {
  try {
    const { userId } = getAuth(request)
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Check if user is admin
    if (!isAdmin(userId)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    
    // Fetch total courses
    const allCourses = await db.select().from(CourseList)
    const totalCourses = allCourses.length
    
    // Fetch public courses
    const publicCoursesQuery = await db
      .select()
      .from(CourseList)
      .where(eq(CourseList.isPublic, true))
    const publicCourses = publicCoursesQuery.length
    
    // For demo, we'll just return a fixed number of users
    // In a real application, you would have a users table
    const totalUsers = 10 // Placeholder value
    
    return NextResponse.json({
      totalCourses,
      publicCourses,
      totalUsers
    }, { status: 200 })
  } catch (error) {
    console.error('Error fetching admin stats:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}