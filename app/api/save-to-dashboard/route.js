import { db } from '@/configs/db';
import { CourseList, Chapters } from '@/configs/schema';
import { getAuth } from '@clerk/nextjs/server';
import { eq, and } from 'drizzle-orm';

// ✅ Safe conversion to Date objects (not strings)
const safeToDate = (value) => {
  try {
    if (!value) return new Date();

    if (typeof value === 'object' && ('seconds' in value || '_seconds' in value)) {
      const sec = value.seconds ?? value._seconds;
      const nsec = value.nanoseconds ?? value._nanoseconds ?? 0;
      return new Date(sec * 1000 + Math.floor(nsec / 1e6));
    }

    if (value instanceof Date && !isNaN(value)) return value;

    const parsed = new Date(value);
    if (!isNaN(parsed)) return parsed;

    return new Date();
  } catch {
    return new Date();
  }
};

export async function POST(request) {
  try {
    const { userId } = getAuth(request);

    if (!userId) {
      return new Response('Unauthorized', { status: 401 });
    }

    const { courseId, courseData } = await request.json();

    // Prepare the data to insert/update
    const saveData = {
      courseId: courseId,
      name: courseData.title,
      category: courseData.category,
      level: 'Beginner', // Default level
      duration: courseData.duration || null,
      includeVideo: courseData.courseOutput?.course?.chapters?.some(chapter => chapter.videoId) ? 'Yes' : 'No',
      courseOutput: courseData.courseOutput,
      createdBy: userId,
      isPublic: true, // Automatically make course public as per requirement
      courseBannerImage: courseData.courseBannerImage || courseData.imageUrl || courseData.courseOutput?.course?.courseBannerImage || '/guide-book.png'
    };

    console.log("Attempting to save/update course to dashboard:", JSON.stringify(saveData, null, 2));

    let result;

    // Check if course exists
    const existingCourse = await db.select().from(CourseList).where(
      and(
        eq(CourseList.courseId, courseId),
        eq(CourseList.createdBy, userId)
      )
    );

    if (existingCourse.length > 0) {
      console.log("Course exists, updating to Public...");
      result = await db.update(CourseList)
        .set(saveData)
        .where(eq(CourseList.courseId, courseId))
        .returning();

      // Clear existing chapters to prevent duplicates before re-inserting
      try {
        await db.delete(Chapters).where(eq(Chapters.courseId, courseId));
        console.log("Cleared existing chapters for update");
      } catch (delError) {
        console.warn("Failed to clear chapters:", delError);
      }
    } else {
      console.log("Course does not exist, inserting new...");
      result = await db.insert(CourseList).values(saveData).returning();
    }

    console.log("Course successfully saved/updated to dashboard:", result[0]);

    // If the course has chapters with video IDs, also save them to the chapters table
    if (courseData.courseOutput?.course?.chapters) {
      try {
        const chapters = courseData.courseOutput.course.chapters;
        for (let i = 0; i < chapters.length; i++) {
          const chapter = chapters[i];
          if (chapter.name || chapter.content || chapter.videoId) {
            const chapterInsertData = {
              courseId: courseId,
              chapterId: i + 1,
              chapterName: chapter.name || '',
              content: typeof chapter.content === 'string' ? chapter.content : (chapter.content?.content || ''),
              videoId: chapter.videoId || '',
              duration: chapter.duration || '' // Add duration field
              // ✅ Remove manual handling of createdAt/updatedAt - let Drizzle handle it
            };

            await db.insert(Chapters).values(chapterInsertData);
            console.log(`Successfully inserted chapter ${i + 1} to chapters table`);
          }
        }
      } catch (chapterError) {
        console.error("Error saving chapters to chapters table:", chapterError);
        // Continue even if chapter saving fails
      }
    }

    return new Response(JSON.stringify({
      message: 'Course saved to your dashboard and automatically made public in Explore!',
      course: result[0]
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error saving course to dashboard:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}