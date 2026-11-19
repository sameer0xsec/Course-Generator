"use client"
import { Button } from '@/components/ui/button';
import { useUser } from '@clerk/nextjs'
import Link from 'next/link';
import React from 'react'

function AddCourse() {
    const { user } = useUser();

    return (
        <div className='flex items-center justify-between bg-white rounded-xl shadow-lg p-6 mb-8'>
            <div>
                <h2 className='text-2xl text-gray-800'>Hello, 
                    <span className='font-bold text-indigo-600'> {user?.fullName}</span>       
                </h2> 
                <p className='text-sm text-gray-600 mt-2'>Create new course with AI, Share with friends and earn from it !</p>
            </div>
            <Link href={'/create-course'}>
                <Button className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg shadow-md hover:shadow-lg transition-all duration-300">
                    + Create AI Course
                </Button>
            </Link>
        </div>
    )
}

export default AddCourse