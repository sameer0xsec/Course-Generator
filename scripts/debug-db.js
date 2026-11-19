
import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const sql = neon(process.env.DATABASE_URL);

async function main() {
    try {
        console.log('--- DB DIAGNOSTIC START ---');

        // 1. Check Schema
        const schema = await sql`
      SELECT column_name, data_type, character_maximum_length, udt_name
      FROM information_schema.columns 
      WHERE table_name = 'chapters' AND column_name = 'content';
    `;
        console.log('1. Column Schema:', schema);

        // 2. Test Insert Large Content
        const largeContent = "Test content ".repeat(1000); // ~13KB
        console.log(`2. Attempting to insert ${largeContent.length} chars...`);

        const testCourseId = 'test-course-' + Date.now();

        try {
            await sql`
            INSERT INTO chapters ("courseId", "chapterId", "chapterName", "content", "videoId", "duration")
            VALUES (${testCourseId}, 999, 'Test Chapter', ${largeContent}, '', '10 mins')
        `;
            console.log('SUCCESS: Inserted large content directly via SQL.');

            // Clean up
            await sql`DELETE FROM chapters WHERE "courseId" = ${testCourseId}`;
            console.log('Cleanup successful.');

        } catch (e) {
            console.error('FAILURE: Insert failed:', e);
        }

        console.log('--- DB DIAGNOSTIC END ---');

    } catch (error) {
        console.error('Global Error:', error);
    }
}

main();
