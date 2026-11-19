
import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const sql = neon(process.env.DATABASE_URL);

async function main() {
    try {
        console.log('Altering chapters table columns to TEXT to prevent length errors...');

        // update chapterName
        await sql`ALTER TABLE chapters ALTER COLUMN "chapterName" TYPE text;`;
        console.log('Updated chapterName to TEXT');

        // update videoId
        await sql`ALTER TABLE chapters ALTER COLUMN "videoId" TYPE text;`;
        console.log('Updated videoId to TEXT');

        // update duration
        await sql`ALTER TABLE chapters ALTER COLUMN duration TYPE text;`;
        console.log('Updated duration to TEXT');

        // update courseId
        await sql`ALTER TABLE chapters ALTER COLUMN "courseId" TYPE text;`;
        console.log('Updated courseId to TEXT');

        console.log('All columns successfully updated to TEXT.');

    } catch (error) {
        console.error('Error updating database:', error);
    }
}

main();
