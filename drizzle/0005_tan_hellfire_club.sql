ALTER TABLE "courseList" ALTER COLUMN "isPublic" SET DEFAULT false;--> statement-breakpoint
ALTER TABLE "courseList" ALTER COLUMN "createdAt" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "courseList" ALTER COLUMN "updatedAt" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "courseList" DROP COLUMN "includeVideo";