
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { pgTable, serial, varchar, integer, text, timestamp } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const Chapters = pgTable('chapters', {
    id: serial('id').primaryKey(),
    courseId: varchar('courseId').notNull(),
    chapterId: integer('chapterId').notNull(),
    chapterName: varchar('chapterName'),
    content: text("content").notNull(),
    videoId: varchar('videoId'),
    duration: varchar('duration'),
    createdAt: timestamp('createdAt').default(sql`now()`),
    updatedAt: timestamp('updatedAt').default(sql`now()`),
});

const client = neon(process.env.DATABASE_URL);
const db = drizzle(client, { schema: { Chapters } });

async function main() {
    console.log('Testing Drizzle ORM Insert with NULL videoId...');

    const courseId = 'test-orm-course-2';
    const chapterId = 999;
    const content = 'Test Content';
    const videoId = null; // Testing NULL
    const duration = '10 min';

    try {
        await db.insert(Chapters).values({
            courseId,
            chapterId,
            chapterName: 'Test Chapter',
            content,
            videoId,
            duration,
            updatedAt: new Date()
        }).onConflictDoUpdate({
            target: [Chapters.courseId, Chapters.chapterId],
            set: {
                content,
                videoId,
                duration,
                updatedAt: new Date()
            }
        });
        console.log('SUCCESS: ORM Insert worked with NULL videoId.');
    } catch (error) {
        console.error('FAILURE: ORM Insert failed:', error);
    }
}

main();
