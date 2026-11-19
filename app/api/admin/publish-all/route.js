import { NextResponse } from 'next/server';
import { db } from '@/configs/db';
import { CourseList } from '@/configs/schema';
import { inArray } from 'drizzle-orm';
import { getAuth } from '@clerk/nextjs/server';

const isAdmin = (userId) => {
    const adminUsers = process.env.ADMIN_USERS?.split(',') || [];
    return adminUsers.includes(userId);
};

export async function POST(request) {
    try {
        const { userId } = getAuth(request);
        if (!userId || !isAdmin(userId)) {
            return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
        }
        // Get admin users list
        const adminUsers = process.env.ADMIN_USERS?.split(',') || [];

        if (adminUsers.length === 0) {
            return NextResponse.json({
                success: false,
                message: 'No admin users defined in ADMIN_USERS environment variable'
            }, { status: 400 });
        }

        console.log(`Making courses public for admins: ${adminUsers.join(', ')}`);

        // Update all courses created by admins to be public
        const start = Date.now();

        // Using Drizzle to update
        // equivalent to: UPDATE CourseList SET isPublic = true WHERE createdBy IN (adminUsers)
        const result = await db
            .update(CourseList)
            .set({ isPublic: true })
            .where(inArray(CourseList.createdBy, adminUsers))
            .returning({ id: CourseList.id, name: CourseList.name, courseId: CourseList.courseId });

        const duration = Date.now() - start;

        console.log(`Updated ${result.length} courses to public in ${duration}ms`);

        return NextResponse.json({
            success: true,
            count: result.length,
            updatedCourses: result
        }, { status: 200 });

    } catch (error) {
        console.error('Error publishing admin courses:', error);
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}
