'use client'
import { SignIn } from '@clerk/nextjs'

export default function Page() {
  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-pink-600 via-indigo-900 to-blue-600 text-white">
      {/* subtle decorative accents */}
      <div className="pointer-events-none absolute -left-40 -top-40 w-96 h-96 rounded-full bg-gradient-to-tr from-pink-400 to-indigo-400 opacity-20 blur-3xl transform rotate-12 mix-blend-screen"></div>
      <div className="pointer-events-none absolute -right-40 -bottom-40 w-96 h-96 rounded-full bg-gradient-to-br from-blue-400 to-pink-500 opacity-18 blur-3xl mix-blend-screen"></div>

      <div className="container mx-auto px-10 py-16">
        <div className="flex flex-col md:flex-row items-center gap-50">
          {/* Left: Large title & subtitle */}
          <aside className="flex items-center">
            <div className="max-w-2xl pl-6 md:pl-12">
              <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold leading-tight">
                AI Course Generator
              </h1>
              <p className="mt-4 text-lg sm:text-xl text-white">Your Personalized Course Generator</p>
            </div>

          </aside>

          {/* Right: Sign-in card aligned right */}
          <main className="md:w-5/12 lg:w-4/12 flex justify-end">
            <div className="w-full max-w-md">
              <div className="relative">
                <div className="absolute -inset-0 rounded-2xl blur-xl opacity-10 bg-gradient-to-br from-pink-600 to-blue-500"></div>

                <div className="relative bg-white/95 backdrop-blur-sm border border-gray-100 rounded-2xl shadow-2xl p-6 transition-transform transform hover:-translate-y-1">
                  <div className="mb-4 animate-fallInRight">
                    <div className="rounded-md overflow-hidden">
                      <SignIn />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}