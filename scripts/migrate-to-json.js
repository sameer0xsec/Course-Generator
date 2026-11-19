
import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const sql = neon(process.env.DATABASE_URL);

async function main() {
    try {
        console.log('Migrating chapters table content column to JSON type...');

        // We need to ensure the existing text content is valid JSON before converting
        // But since we are using ::json cast, Postgres will validate it.

        await sql`ALTER TABLE chapters ALTER COLUMN content TYPE json USING content::json;`;

        console.log('Successfully updated chapters table content column to JSON.');
    } catch (error) {
        console.error('Error migrating database:', error);
        console.log('Tip: If specific rows failed, you might need to truncate the table or fix invalid JSON data first.');
    }
}

main();
