'use client'

import React, { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

function Hero() {
  const router = useRouter()
  // No video functionality needed

  const handleExplore = () => {
    router.push('/dashboard/explore')
  }

  const handleGetStarted = () => {
    router.push('/dashboard')
  }

  return (
    <section className="relative w-full min-h-screen flex items-center justify-center overflow-hidden pt-16 pb-16">
      {/* Static gradient background */}
      <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 z-0"></div>
      
      {/* Gradient overlay to make text more readable */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 bg-opacity-70 z-10"></div>
      
      {/* Content */}
      <div className="relative z-20 mx-auto w-full max-w-screen-xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center pt-16 pb-8">
          <h1 className="text-5xl font-bold text-white sm:text-6xl md:text-7xl dark:text-white mb-6">
            <span className="block">Transform Learning</span>
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 mt-2">With AI-Powered Courses</span>
          </h1>

          <p className="mt-6 text-xl text-pretty text-gray-200 sm:text-2xl/relaxed dark:text-gray-200 max-w-2xl mx-auto">
            Create personalized, engaging courses in minutes. Our AI technology helps educators and content creators build interactive learning experiences tailored to every student.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4 sm:mt-12">
            <button
              className="inline-block rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 px-8 py-4 font-semibold text-white shadow-lg transition-all hover:from-cyan-600 hover:to-blue-700 transform hover:scale-105 duration-300"
              onClick={handleGetStarted}
            >
              Start Creating Courses
            </button>
            
            <button
              className="inline-block rounded-lg border-2 border-white/30 bg-white/10 px-8 py-4 font-semibold text-white shadow-lg backdrop-blur-sm transition-all hover:bg-white/20 hover:scale-105 duration-300"
              onClick={handleExplore}
            >
              Explore Courses
            </button>
          </div>
          
          <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="bg-white/10 backdrop-blur-sm p-6 rounded-xl border border-white/20">
              <div className="text-cyan-400 text-3xl font-bold">AI-Powered</div>
              <h3 className="text-white text-lg font-semibold mt-2">Smart Content Generation</h3>
              <p className="text-gray-300 mt-2">Generate engaging course content with our advanced AI technology</p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm p-6 rounded-xl border border-white/20">
              <div className="text-cyan-400 text-3xl font-bold">Customizable</div>
              <h3 className="text-white text-lg font-semibold mt-2">Personalized Learning Paths</h3>
              <p className="text-gray-300 mt-2">Create tailored courses that adapt to individual learning styles</p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm p-6 rounded-xl border border-white/20">
              <div className="text-cyan-400 text-3xl font-bold">Interactive</div>
              <h3 className="text-white text-lg font-semibold mt-2">Engaging Experiences</h3>
              <p className="text-gray-300 mt-2">Build courses with multimedia content and interactive elements</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Hero