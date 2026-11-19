'use client'

import React from 'react'
import { useUser } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'

function GetUserId() {
  const { user } = useUser()
  
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
        <h1 className="text-2xl font-bold mb-4">User Not Logged In</h1>
        <p className="text-gray-600 mb-4">Please log in to see your user ID</p>
      </div>
    )
  }
  
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    alert('User ID copied to clipboard!')
  }
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
      <h1 className="text-2xl font-bold mb-4">Your User Information</h1>
      <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-md">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">User ID:</label>
          <div className="p-3 bg-gray-100 rounded-md font-mono text-sm break-all">
            {user.id}
          </div>
          <Button 
            onClick={() => copyToClipboard(user.id)}
            className="mt-2 w-full"
          >
            Copy User ID to Clipboard
          </Button>
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Email:</label>
          <div className="p-3 bg-gray-100 rounded-md text-sm">
            {user.primaryEmailAddress?.emailAddress}
          </div>
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Full Name:</label>
          <div className="p-3 bg-gray-100 rounded-md text-sm">
            {user.fullName}
          </div>
        </div>
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h2 className="font-semibold mb-2">Instructions:</h2>
          <ol className="list-decimal pl-5 space-y-1 text-sm">
            <li>Copy your User ID using the button above</li>
            <li>Open your .env.local file</li>
            <li>Find the line that says: ADMIN_USERS=your_actual_user_id_here</li>
            <li>Replace "your_actual_user_id_here" with your actual User ID</li>
            <li>Save the file and restart your development server</li>
          </ol>
        </div>
      </div>
    </div>
  )
}

export default GetUserId