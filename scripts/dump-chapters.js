
import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const sql = neon(process.env.DATABASE_URL);

async function main() {
    try {
        console.log('Fetching recent chapters...');

        // Fetch last 5 chapters sorted by id desc
        const chapters = await sql`
      SELECT id, "courseId", "chapterName", length(content) as content_length, substring(content, 1, 100) as content_preview 
      FROM chapters 
      ORDER BY id DESC 
      LIMIT 5;
    `;

        console.log('Recent Chapters Data:');
        chapters.forEach(ch => {
            console.log('------------------------------------------------');
            console.log(`ID: ${ch.id}`);
            console.log(`CourseID: ${ch.courseId}`);
            console.log(`Name: ${ch.chapterName}`);
            console.log(`Length: ${ch.content_length}`);
            console.log(`Preview: ${ch.content_preview}`);
        });

    } catch (error) {
        console.error('Error fetching chapters:', error);
    }
}

main();
