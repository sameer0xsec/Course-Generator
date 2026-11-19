
import { NextResponse } from 'next/server';
import { db } from '@/configs/db';
import { CourseList } from '@/configs/schema';

export async function GET() {
    try {
        const courses = await db.select().from(CourseList);
        const creators = [...new Set(courses.map(c => c.createdBy))];

        const adminUsers = process.env.ADMIN_USERS?.split(',') || [];

        return NextResponse.json({
            creators,
            adminUsers,
            matchCount: creators.filter(c => adminUsers.includes(c)).length
        });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
