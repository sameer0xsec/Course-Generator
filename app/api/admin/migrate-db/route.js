import { NextResponse } from 'next/server';
import { db } from '@/configs/db';
import { sql } from 'drizzle-orm';
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
        console.log('Running database migration: add createdByEmail column...');

        // Add the createdByEmail column if it doesn't exist
        await db.execute(sql`
      ALTER TABLE "courseList" 
      ADD COLUMN IF NOT EXISTS "createdByEmail" VARCHAR;
    `);

        // Migrate existing data: copy email from createdBy to createdByEmail
        // (for old records that used email in createdBy field)
        await db.execute(sql`
      UPDATE "courseList" 
      SET "createdByEmail" = "createdBy" 
      WHERE "createdByEmail" IS NULL 
        AND "createdBy" LIKE '%@%';
    `);

        console.log('Migration completed successfully');

        return NextResponse.json({
            success: true,
            message: 'Database migration completed successfully'
        }, { status: 200 });

    } catch (error) {
        console.error('Migration error:', error);
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}
