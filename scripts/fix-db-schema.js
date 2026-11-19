
import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const sql = neon(process.env.DATABASE_URL);

async function main() {
    try {
        console.log('Altering chapters table content column to TEXT...');
        await sql`ALTER TABLE chapters ALTER COLUMN content TYPE text;`;
        console.log('Successfully updated chapters table content column type.');
    } catch (error) {
        console.error('Error updating database:', error);
    }
}

main();
