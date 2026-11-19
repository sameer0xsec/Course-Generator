import { NextResponse } from 'next/server';
import { db } from '@/configs/db';
import { CourseList } from '@/configs/schema';
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
        console.log('Making ALL courses public...');

        const start = Date.now();

        // Update ALL courses to be public
        const result = await db
            .update(CourseList)
            .set({ isPublic: true })
            .returning({ id: CourseList.id, name: CourseList.name, courseId: CourseList.courseId });

        const duration = Date.now() - start;

        console.log(`Updated ${result.length} courses to public in ${duration}ms`);

        return NextResponse.json({
            success: true,
            count: result.length,
            message: `Successfully made ${result.length} courses public`,
            updatedCourses: result
        }, { status: 200 });

    } catch (error) {
        console.error('Error publishing all courses:', error);
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}
