import { NextResponse } from 'next/server'
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
      return NextResponse.json({ isAdmin: false }, { status: 200 })
    }
    
    return NextResponse.json({ isAdmin: isAdmin(userId) }, { status: 200 })
  } catch (error) {
    console.error('Error checking admin status:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}