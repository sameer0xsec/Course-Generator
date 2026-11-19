'use client'
import React, { useEffect, useState } from 'react'
import Image from 'next/image'
import { HomeIcon, Squares2X2Icon, ShieldCheckIcon, ArrowRightStartOnRectangleIcon, UserIcon } from '@heroicons/react/24/outline';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Progress } from '@/components/ui/progress';
import { SignOutButton, useUser } from '@clerk/nextjs';

function SideBar() {
  const baseMenu = [
    {
      id: 1,
      name: 'Home',
      icon: <HomeIcon />,
      path: '/dashboard'
    },
    {
      id: 2,
      name: 'Explore Courses',
      icon: <Squares2X2Icon />,
      path: '/dashboard/explore'
    },
    {
      id: 4,
      name: 'Upgrade Plan',
      icon: <ShieldCheckIcon />,
      path: '/dashboard/upgrade'
    },
    {
      id: 5,
      name: 'Logout',
      icon: <ArrowRightStartOnRectangleIcon />,
      action: 'logout'
    }
  ];

  const [adminMenuItem, setAdminMenuItem] = useState(null);
  const path = usePathname();
  const { user } = useUser();
  const [courseCount, setCourseCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchCourseCount = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const userIdParam = user.id ? `userId=${encodeURIComponent(user.id)}` : '';
      const emailParam = user.primaryEmailAddress?.emailAddress
        ? `&email=${encodeURIComponent(user.primaryEmailAddress.emailAddress)}`
        : '';

      const response = await fetch(`/api/user-courses?${userIdParam}${emailParam}`);

      if (response.ok) {
        const data = await response.json();
        setCourseCount(data.count || 0);
      } else {
        console.error('Failed to fetch course count:', response.status);
      }
    } catch (error) {
      console.error('Error fetching course count:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const response = await fetch('/api/admin/check');
        const data = await response.json();

        // Set admin menu item if user is admin
        if (data.isAdmin) {
          setAdminMenuItem({
            id: 100,
            name: 'Admin Dashboard',
            icon: <UserIcon />,
            path: '/dashboard/admin'
          });
        } else {
          setAdminMenuItem(null);
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
        setAdminMenuItem(null);
      }
    };

    if (user) {
      fetchCourseCount();
      checkAdminStatus();
    } else {
      setLoading(false);
    }
  }, [user]);

  // Removed course limit - allow unlimited courses for all users
  // Calculate progress percentage (removed limit reference)
  const progressPercentage = courseCount > 0 ? 100 : 0; // Always show full progress since there's no limit

  // Build the complete menu
  const completeMenu = adminMenuItem ? [...baseMenu.slice(0, 3), adminMenuItem, ...baseMenu.slice(3)] : baseMenu;

  return (
    <div className='fixed h-full md:w-64 p-5 shadow-xl bg-white'>
      <Image src="/logo.svg" alt="Logo" width={220} height={50} className='mb-4'/>
      <hr className='mb-5 border-gray-200'/>

      <ul>
        {completeMenu.map((item) => {
          if (item.action === 'logout') {
            return (
              <SignOutButton key={item.id} redirectUrl="/">
                <div className='flex items-center gap-2 cursor-pointer mb-2 p-3 rounded-lg text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors duration-200'>
                  <div className="text-2xl">{item.icon}</div>
                  <h2>{item.name}</h2>
                </div>
              </SignOutButton>
            );
          }
          
          const isActive = path === item.path;
          return (
            <Link href={item.path} key={item.id}>
            <div
                className={`flex items-center gap-2 cursor-pointer mb-2 p-3 rounded-lg transition-colors duration-200 ${
                  isActive ? 'bg-indigo-100 text-indigo-700 font-medium' : 'text-gray-700 hover:bg-indigo-50 hover:text-indigo-600'
                }`}
              >
                <div className="text-2xl">{item.icon}</div>
                <h2>{item.name}</h2>
              </div>
            </Link>
          )
        })}
      </ul>

      <div className='absolute bottom-10 w-[80%] bg-indigo-50 rounded-lg p-4 shadow-inner'>
        <Progress value={progressPercentage} className="bg-white" />
        {loading ? (
          <h2 className='text-sm my-2 text-gray-600'>Loading course count...</h2>
        ) : (
          <>
            <h2 className='text-sm my-2 font-medium text-gray-800'>{courseCount} Courses Created</h2>
            <h2 className='text-xs text-indigo-600'>Keep creating amazing courses!</h2>
            {/* Removed upgrade button since there's no longer a course limit */}
          </>
        )}
      </div>

    </div>
  )
}

export default SideBar