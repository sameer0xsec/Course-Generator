import { NextResponse } from 'next/server';
import { db } from '@/configs/db';
import { CourseList } from '@/configs/schema';
import { eq } from 'drizzle-orm';

/**
 * GET /api/explore
 * Returns all public courses for the Explore page
 */
export async function GET() {
  try {
    console.log("Attempting to fetch courses for explore page");
    
    // Always fetch public courses - the isPublic field should exist based on schema
    try {
      const publicCourses = await db
        .select()
        .from(CourseList)
        .where(eq(CourseList.isPublic, true))
        .orderBy(CourseList.createdAt || CourseList.id); // Order by creation date or id
      
      console.log(`Successfully fetched ${publicCourses.length} public courses`);
      
      // Add additional debugging information
      publicCourses.forEach((course, index) => {
        console.log(`Course ${index + 1}:`, {
          id: course.courseId,
          name: course.name,
          createdBy: course.createdBy,
          isPublic: course.isPublic,
          createdAt: course.createdAt
        });
      });
      
      return NextResponse.json({ ok: true, courses: publicCourses }, { status: 200 });
    } catch (queryError) {
      console.error("DB Query Error when fetching public courses:", {
        error: queryError.message,
        code: queryError.code,
        detail: queryError.detail,
        hint: queryError.hint,
        stack: queryError.stack
      });
      
      // Fallback: fetch all courses and filter in memory
      try {
        const allCourses = await db
          .select()
          .from(CourseList)
          .orderBy(CourseList.createdAt || CourseList.id);
        
        // Filter courses with isPublic = true in memory
        const publicCourses = allCourses.filter(course => course.isPublic === true);
        console.log(`Successfully fetched ${publicCourses.length} public courses (fallback filter)`);
        
        return NextResponse.json({ ok: true, courses: publicCourses }, { status: 200 });
      } catch (fallbackError) {
        console.error("Fallback query also failed:", fallbackError);
        // Return empty array as last resort
        return NextResponse.json({ ok: true, courses: [] }, { status: 200 });
      }
    }
  } catch (err) {
    console.error('Error fetching courses for explore page:', {
      message: err.message,
      stack: err.stack,
      name: err.name
    });
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}