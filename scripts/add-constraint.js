
import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const sql = neon(process.env.DATABASE_URL);

async function main() {
    try {
        console.log('Validating/Adding Unique Constraint on (courseId, chapterId)...');

        // First, check if there are duplicates that would block the constraint
        // If so, we might need to delete them or let the user know.
        // For now, we will attempt to add the unique index.

        // Using explicit SQL to add constraint
        await sql`CREATE UNIQUE INDEX IF NOT EXISTS "chapters_courseId_chapterId_key" ON chapters ("courseId", "chapterId");`;

        console.log('Successfully added unique index on (courseId, chapterId).');
    } catch (error) {
        console.error('Error adding constraint:', error);
    }
}

main();
