
import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const sql = neon(process.env.DATABASE_URL);

async function main() {
    try {
        console.log('Checking chapters table schema...');

        // Query to check column type
        const result = await sql`
      SELECT column_name, data_type, character_maximum_length 
      FROM information_schema.columns 
      WHERE table_name = 'chapters' AND column_name = 'content';
    `;

        console.log('Column Schema:', result);

        if (result.length > 0) {
            const col = result[0];
            console.log(`Current type: ${col.data_type}`);
            console.log(`Max Length: ${col.character_maximum_length}`);

            if (col.data_type !== 'text' && col.character_maximum_length !== null) {
                console.log('Attempting to fix column type again...');
                await sql`ALTER TABLE chapters ALTER COLUMN content TYPE text;`;
                console.log('Fix command executed.');

                // Verify
                const result2 = await sql`
                SELECT column_name, data_type, character_maximum_length 
                FROM information_schema.columns 
                WHERE table_name = 'chapters' AND column_name = 'content';
            `;
                console.log('New Column Schema:', result2);
            }
        } else {
            console.log('Table "chapters" or column "content" not found!');
            // List all tables
            const tables = await sql`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`;
            console.log('Available tables:', tables);
        }

    } catch (error) {
        console.error('Error checking DB:', error);
    }
}

main();
