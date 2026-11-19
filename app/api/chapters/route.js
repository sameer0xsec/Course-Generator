import { NextResponse } from 'next/server';
import { db } from '@/configs/db';
import { Chapters } from '@/configs/schema';
import { eq, and, asc } from 'drizzle-orm';

// Helper function to retry database operations
const retryOperation = async (operation, maxRetries = 3, delay = 1000) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      console.error(`Attempt ${i + 1} failed:`, error.message);
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i))); // Exponential backoff
    }
  }
};

// Helper function to extract raw string content
const extractContentString = (content) => {
  // If it's already a clean string (not JSON), return it
  if (typeof content === 'string') {
    // Try to parse it just in case it's a JSON string
    try {
      if (content.trim().startsWith('{') || content.trim().startsWith('[')) {
        const parsed = JSON.parse(content);
        return extractContentString(parsed);
      }
    } catch (e) { }
    return content;
  }

  if (content && typeof content === 'object') {
    if (content.content) return extractContentString(content.content);
    // If it's an object but has no 'content' key, verify if we should just stringify it
    // But we prefer raw text if possible. 
    return JSON.stringify(content);
  }
  return String(content || '');
};

export async function POST(request) {
  try {
    const body = await request.json();

    if (!body || !body.courseId || body.chapterId === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Extract raw string to save
    const rawContentString = extractContentString(body.content || '');

    // Ensure all params are defined strings or null
    // We treat empty strings or undefined as null for optional fields to keep DB clean
    const courseId = String(body.courseId);
    const chapterId = parseInt(body.chapterId);
    const chapterName = String(body.chapterName || '');
    const content = rawContentString;
    const videoId = (body.videoId && String(body.videoId).trim() !== '') ? String(body.videoId) : null;
    const duration = (body.duration && String(body.duration).trim() !== '') ? String(body.duration) : null;

    // LOG as requested
    console.log("Debug Insert Values:", {
      courseId,
      chapterId,
      chapterName,
      contentLength: content.length,
      videoId,
      duration
    });

    try {
      const insertData = {
        courseId,
        chapterId,
        chapterName,
        content,
        videoId,
        duration
      };

      // Use standard Drizzle ORM insert
      const insertResult = await retryOperation(() => db.insert(Chapters)
        .values(insertData)
        .onConflictDoUpdate({
          target: [Chapters.courseId, Chapters.chapterId],
          set: {
            chapterName: insertData.chapterName,
            content: insertData.content,
            videoId: insertData.videoId,
            duration: insertData.duration,
            updatedAt: new Date()
          }
        })
      );

      console.log("Successfully upserted chapter using Drizzle ORM");
      return NextResponse.json({ ok: true, result: insertResult }, { status: 200 });
    } catch (dbError) {
      console.error('Database insertion error:', {
        message: dbError.message,
        code: dbError.code
      });
      return NextResponse.json({
        error: `Database Error: ${dbError.message}`
      }, { status: 400 });
    }
  } catch (err) {
    console.error('Error in /api/chapters POST:', err);
    return NextResponse.json({ error: `Server Error: ${err.message}` }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();

    if (!body || !body.courseId || body.chapterId === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Sanitization similar to POST
    const rawContentString = extractContentString(body.content || '');
    const courseId = String(body.courseId);
    const chapterId = parseInt(body.chapterId);
    const chapterName = String(body.chapterName || '');
    const content = rawContentString;
    const videoId = (body.videoId && String(body.videoId).trim() !== '') ? String(body.videoId) : null;
    const duration = (body.duration && String(body.duration).trim() !== '') ? String(body.duration) : null;

    console.log("Debug Update Values:", { courseId, chapterId });

    try {
      const updateData = {
        chapterName,
        content,
        videoId,
        duration,
        updatedAt: new Date()
      };

      const updateResult = await retryOperation(() => db
        .update(Chapters)
        .set(updateData)
        .where(and(
          eq(Chapters.courseId, courseId),
          eq(Chapters.chapterId, chapterId)
        )));

      console.log("Successfully updated chapter using Drizzle ORM");
      return NextResponse.json({ ok: true, result: updateResult }, { status: 200 });
    } catch (dbError) {
      console.error('Database update error:', dbError);
      return NextResponse.json({
        error: `Database Update Error: ${dbError.message}`
      }, { status: 400 });
    }
  } catch (err) {
    console.error('Error in /api/chapters PUT:', err);
    return NextResponse.json({ error: `Server Error: ${err.message}` }, { status: 500 });
  }

}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');

    if (!courseId) {
      return NextResponse.json({ error: 'Missing courseId' }, { status: 400 });
    }

    const rows = await db
      .select()
      .from(Chapters)
      .where(eq(Chapters.courseId, courseId))
      .orderBy(asc(Chapters.chapterId));

    return NextResponse.json({ ok: true, rows }, { status: 200 });

  } catch (err) {
    console.error('Error in /api/chapters GET:', err);
    return NextResponse.json({ error: `Server Error: ${err.message}` }, { status: 500 });
  }
}