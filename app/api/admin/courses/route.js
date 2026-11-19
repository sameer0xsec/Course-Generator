import { NextResponse } from 'next/server'
import { db } from '@/configs/db'
import { CourseList } from '@/configs/schema'
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
    
    // Fetch all courses
    const courses = await db.select().from(CourseList)
    
    return NextResponse.json({ ok: true, courses }, { status: 200 })
  } catch (error) {
    console.error('Error fetching courses:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}