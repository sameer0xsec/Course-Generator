CREATE TABLE "chapters" (
	"id" serial PRIMARY KEY NOT NULL,
	"courseId" varchar NOT NULL,
	"chapterId" integer NOT NULL,
	"chapterName" varchar,
	"content" json NOT NULL
);
--> statement-breakpoint
ALTER TABLE "courseList" ALTER COLUMN "courseOutput" SET DATA TYPE json;--> statement-breakpoint
ALTER TABLE "courseList" ADD COLUMN "courseBannerImage" varchar DEFAULT '/placeholder.jpg';--> statement-breakpoint
ALTER TABLE "courseList" ADD COLUMN "publish" boolean DEFAULT false;