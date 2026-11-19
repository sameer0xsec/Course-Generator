ALTER TABLE "courseList" ALTER COLUMN "courseOutput" SET DATA TYPE jsonb;--> statement-breakpoint
ALTER TABLE "courseList" ALTER COLUMN "isPublic" SET DEFAULT false;--> statement-breakpoint
ALTER TABLE "courseList" ALTER COLUMN "createdAt" SET DATA TYPE timestamp;--> statement-breakpoint
ALTER TABLE "courseList" ALTER COLUMN "createdAt" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "courseList" ALTER COLUMN "updatedAt" SET DATA TYPE timestamp;--> statement-breakpoint
ALTER TABLE "courseList" ALTER COLUMN "updatedAt" SET DEFAULT now();