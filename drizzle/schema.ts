import { pgTable, serial, varchar, integer, json } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const chapters = pgTable("chapters", {
	id: serial().primaryKey().notNull(),
	courseId: varchar().notNull(),
	chapterId: integer().notNull(),
	content: json().notNull(),
	videoId: varchar(),
});

export const courseList = pgTable("courseList", {
	id: serial().primaryKey().notNull(),
	courseId: varchar().notNull(),
	name: varchar().notNull(),
	category: varchar().notNull(),
	level: varchar().notNull(),
	includeVideo: varchar().default('Yes').notNull(),
	courseOutput: json().notNull(),
	createdBy: varchar().notNull(),
	userName: varchar(),
	userProfileImage: varchar(),
	publish: varchar().default('false'),
	courseBannerImage: varchar(),
});