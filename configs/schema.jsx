import { boolean, json, jsonb, pgTable, serial, varchar, integer, timestamp, text, uniqueIndex } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const CourseList = pgTable('courseList', {
  id: serial('id').primaryKey(),
  courseId: varchar('courseId').notNull(),
  name: varchar('name').notNull(),
  category: varchar('category').notNull(),
  level: varchar('level').notNull(),
  includeVideo: varchar('includeVideo').notNull().default('Yes'),
  courseOutput: json('courseOutput').notNull(),
  createdBy: varchar('createdBy').notNull(), // Clerk user ID
  createdByEmail: varchar('createdByEmail'), // Email address for display
  userName: varchar('userName'),
  userProfileImage: varchar('userProfileImage'),
  courseBannerImage: varchar('courseBannerImage').default('/guide-book.png'),
  publish: boolean('publish').default(true),
  isPublic: boolean('isPublic').default(false),
  duration: varchar('duration'),

  // ✅ Correct usage — handled by Postgres
  createdAt: timestamp('createdAt').default(sql`now()`),
  updatedAt: timestamp('updatedAt').default(sql`now()`),
});

export const Chapters = pgTable('chapters', {
  id: serial('id').primaryKey(),
  courseId: varchar('courseId').notNull(),
  chapterId: integer('chapterId').notNull(),
  chapterName: varchar('chapterName'),
  content: text("content").notNull(),
  videoId: varchar('videoId'),
  duration: varchar('duration'), // Add duration field for chapter duration
  createdAt: timestamp('createdAt').default(sql`now()`),
  updatedAt: timestamp('updatedAt').default(sql`now()`),
}, (table) => [
  uniqueIndex('chapters_courseId_chapterId_key').on(table.courseId, table.chapterId),
]);