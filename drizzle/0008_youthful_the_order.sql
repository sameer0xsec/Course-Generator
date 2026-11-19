ALTER TABLE "courseList" ALTER COLUMN "includeVideo" SET DEFAULT 'Yes';--> statement-breakpoint
ALTER TABLE "chapters" ADD COLUMN "videoId" varchar;--> statement-breakpoint
ALTER TABLE "chapters" ADD COLUMN "createdAt" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "chapters" ADD COLUMN "updatedAt" timestamp DEFAULT now();