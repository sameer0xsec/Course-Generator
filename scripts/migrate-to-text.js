
import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const sql = neon(process.env.DATABASE_URL);

async function main() {
    try {
        console.log('Migrating chapters table content column back to TEXT...');

        // cast to text
        await sql`ALTER TABLE chapters ALTER COLUMN content TYPE text USING content::text;`;

        console.log('Successfully updated chapters table content column to TEXT.');

        // Optional: Try to unwrap existing JSON strings if they match the pattern {"content": "..."}
        // This is complex in SQL, so we'll skip it. The frontend can handle legacy data.

    } catch (error) {
        console.error('Error migrating database:', error);
    }
}

main();
