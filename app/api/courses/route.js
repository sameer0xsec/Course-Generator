import { NextResponse } from 'next/server';
import { db } from '@/configs/db';
import { CourseList, Chapters } from '@/configs/schema';
import { eq, or } from 'drizzle-orm';
import { getAuth } from '@clerk/nextjs/server';

// This is a simple admin check - in a real application, you would have a more robust admin system
const isAdmin = (userId) => {
  // For demo purposes, we'll check if the user is in our admin list
  const adminUsers = process.env.ADMIN_USERS?.split(',') || []
  return adminUsers.includes(userId)
}

/**
 * POST /api/courses
 * Creates a new course entry in the database
 */
export async function POST(request) {
  try {
    const { userId } = getAuth(request);

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Remove course limit - allow unlimited courses for all users
    // Previously: Check if user has reached the course limit (5 courses)
    // Allow unlimited courses for all users
    const body = await request.json();

    if (!body || !body.courseId || !body.name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // No need to handle timestamps manually — handled by DB
    const insertData = {
      courseId: body.courseId,
      name: body.name,
      category: body.category || 'General',
      level: body.level || 'Beginner',
      duration: body.duration || null,
      includeVideo: body.includeVideo || 'No',
      courseOutput: body.courseOutput || {},
      createdBy: body.createdBy || userId, // Use authenticated user ID
      createdByEmail: body.createdByEmail || null, // Store email separately
      userName: body.userName || null,
      userProfileImage: body.userProfileImage || null,
      courseBannerImage: body.courseBannerImage || '/guide-book.png',
      publish: body.publish ?? true,
      isPublic: body.isPublic ?? false, // Default to false so course is editable initially
    };

    const result = await db.insert(CourseList).values(insertData).returning();
    return NextResponse.json({ ok: true, result }, { status: 200 });
  } catch (error) {
    console.error('Error inserting course:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * PUT /api/courses
 * Updates an existing course
 */
export async function PUT(request) {
  try {
    const body = await request.json();
    if (!body.courseId) {
      return NextResponse.json({ error: 'Missing courseId' }, { status: 400 });
    }

    const updateData = {};

    if (body.courseOutput !== undefined) updateData.courseOutput = body.courseOutput;
    if (body.isPublic !== undefined) updateData.isPublic = body.isPublic;
    if (body.courseBannerImage !== undefined) updateData.courseBannerImage = body.courseBannerImage;
    if (body.publish !== undefined) updateData.publish = body.publish;
    if (body.duration !== undefined) updateData.duration = body.duration;

    // Auto-updated by DB, no need to send updatedAt

    const result = await db
      .update(CourseList)
      .set(updateData)
      .where(eq(CourseList.courseId, body.courseId))
      .returning();

    return NextResponse.json({ ok: true, result }, { status: 200 });
  } catch (error) {
    console.error('Error updating course:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * GET /api/courses
 * Fetch courses
 */
export async function GET(request) {
  try {
    const url = new URL(request.url);
    const courseId = url.searchParams.get('courseId');
    const createdBy = url.searchParams.get('createdBy');
    const userId = url.searchParams.get('userId');
    const userEmail = url.searchParams.get('userEmail');
    const publicOnly = url.searchParams.get('publicOnly') === 'true';

    // Unified search for user's courses (supports both ID and Email legacy data)
    if (userId && userEmail) {
      const rows = await db
        .select()
        .from(CourseList)
        .where(
          or(
            eq(CourseList.createdBy, userId),       // Matches new logic (Clerk ID)
            eq(CourseList.createdBy, userEmail),    // Matches old logic (stored email in createdBy)
            eq(CourseList.createdByEmail, userEmail) // Matches explicit email column
          )
        );
      return NextResponse.json({ ok: true, rows }, { status: 200 });
    }

    if (createdBy) {
      const rows = await db
        .select()
        .from(CourseList)
        .where(eq(CourseList.createdBy, createdBy));
      return NextResponse.json({ ok: true, rows }, { status: 200 });
    }

    if (publicOnly) {
      const rows = await db
        .select()
        .from(CourseList)
        .where(eq(CourseList.isPublic, true));
      return NextResponse.json({ ok: true, rows }, { status: 200 });
    }

    if (courseId) {
      const rows = await db
        .select()
        .from(CourseList)
        .where(eq(CourseList.courseId, courseId));
      return NextResponse.json({ ok: true, rows }, { status: 200 });
    }

    // Default: return all courses
    const rows = await db.select().from(CourseList);
    return NextResponse.json({ ok: true, rows }, { status: 200 });
  } catch (error) {
    console.error('Error fetching courses:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * DELETE /api/courses?courseId=...
 * Deletes a course and its associated chapters
 */
export async function DELETE(request) {
  try {
    const { userId } = getAuth(request);

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const courseId = url.searchParams.get('courseId');

    if (!courseId) {
      return NextResponse.json({ error: 'Missing courseId' }, { status: 400 });
    }

    // Check if user is admin or owns the course
    const course = await db
      .select()
      .from(CourseList)
      .where(eq(CourseList.courseId, courseId))
      .limit(1);

    if (course.length === 0) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    const courseData = course[0];

    // Allow deletion if user is admin or owns the course
    if (!isAdmin(userId) && courseData.createdBy !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // First delete associated chapters
    await db.delete(Chapters).where(eq(Chapters.courseId, courseId));

    // Then delete the course itself
    const result = await db.delete(CourseList).where(eq(CourseList.courseId, courseId)).returning();

    return NextResponse.json({ ok: true, result }, { status: 200 });
  } catch (error) {
    console.error('Error deleting course:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}