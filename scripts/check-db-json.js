
import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const sql = neon(process.env.DATABASE_URL);

async function main() {
    try {
        console.log('Checking chapters table schema...');

        // Query to check column type
        const result = await sql`
      SELECT column_name, data_type, character_maximum_length, udt_name
      FROM information_schema.columns 
      WHERE table_name = 'chapters' AND column_name = 'content';
    `;

        console.log('Column Schema:', result);
    } catch (error) {
        console.error('Error checking DB:', error);
    }
}

main();
