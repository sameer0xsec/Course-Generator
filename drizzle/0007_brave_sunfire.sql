ALTER TABLE "courseList" ALTER COLUMN "publish" SET DEFAULT true;--> statement-breakpoint
ALTER TABLE "courseList" ADD COLUMN "includeVideo" varchar DEFAULT 'No' NOT NULL;