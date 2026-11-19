import { NextResponse } from 'next/server';
import { db } from '@/configs/db';
import { CourseList } from '@/configs/schema';
import { eq, or } from 'drizzle-orm';
import { getAuth } from '@clerk/nextjs/server';

/**
 * GET /api/user-courses?userId=...&email=...
 * Returns the count and list of courses created by a specific user.
 */
export async function GET(request) {
  try {
    const url = new URL(request.url);
    const createdBy = url.searchParams.get('createdBy');
    const paramUserId = url.searchParams.get('userId');
    const email = url.searchParams.get('email') || (createdBy && createdBy.includes('@') ? createdBy : null);

    // Get userId from query param or auth token
    let authUserId = null;
    try {
      const auth = getAuth(request);
      authUserId = auth.userId;
    } catch (e) { }

    const targetUserId = paramUserId || authUserId || (!createdBy?.includes('@') ? createdBy : null);

    if (!targetUserId && !email) {
      return NextResponse.json({ error: 'Unauthorized or missing user identifier' }, { status: 401 });
    }

    const conditions = [];
    if (targetUserId) {
      conditions.push(eq(CourseList.createdBy, targetUserId));
    }
    if (email) {
      conditions.push(eq(CourseList.createdBy, email));
      conditions.push(eq(CourseList.createdByEmail, email));
    }

    const rows = await db
      .select()
      .from(CourseList)
      .where(conditions.length > 1 ? or(...conditions) : conditions[0]);

    const count = rows.length;
    return NextResponse.json({ ok: true, count, rows }, { status: 200 });
  } catch (err) {
    console.error('Error in /api/user-courses GET:', {
      message: err.message,
      stack: err.stack,
      name: err.name,
    });
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
