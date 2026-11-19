import { NextResponse } from 'next/server'
import { getAuth } from '@clerk/nextjs/server'

// This is a simple admin check - in a real application, you would have a more robust admin system
const isAdmin = (userId) => {
  // For demo purposes, we'll check if the user is in our admin list
  const adminUsers = process.env.ADMIN_USERS?.split(',') || []
  return adminUsers.includes(userId)
}

// Mock user data - in a real application, this would come from your database
const mockUsers = [
  { id: 'user_1', name: 'Admin User', email: 'admin@example.com', role: 'Admin', status: 'Active' },
  { id: 'user_2', name: 'John Doe', email: 'john@example.com', role: 'User', status: 'Active' },
  { id: 'user_3', name: 'Jane Smith', email: 'jane@example.com', role: 'User', status: 'Active' },
  { id: 'user_4', name: 'Bob Johnson', email: 'bob@example.com', role: 'User', status: 'Inactive' },
]

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
    
    // In a real application, you would fetch users from your database
    // For this demo, we'll return mock data
    return NextResponse.json({ ok: true, users: mockUsers }, { status: 200 })
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}