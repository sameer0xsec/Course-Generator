
import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const sql = neon(process.env.DATABASE_URL);

async function main() {
    try {
        console.log('Cleaning up duplicate chapters...');

        // Delete duplicates, keeping the one with max id
        await sql`
      DELETE FROM chapters c1
      USING chapters c2
      WHERE c1.id < c2.id 
      AND c1."courseId" = c2."courseId" 
      AND c1."chapterId" = c2."chapterId";
    `;

        console.log('Duplicates deleted. Adding unique constraint...');

        await sql`CREATE UNIQUE INDEX IF NOT EXISTS "chapters_courseId_chapterId_key" ON chapters ("courseId", "chapterId");`;

        console.log('Successfully added unique index.');
    } catch (error) {
        console.error('Error fixing DB:', error);
    }
}

main();
