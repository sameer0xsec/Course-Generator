-- Add createdByEmail column to courseList table
ALTER TABLE "courseList" ADD COLUMN IF NOT EXISTS "createdByEmail" VARCHAR;

-- Update existing records: copy email from createdBy to createdByEmail
-- (since old records used email in createdBy field)
UPDATE "courseList" 
SET "createdByEmail" = "createdBy" 
WHERE "createdByEmail" IS NULL 
  AND "createdBy" LIKE '%@%';

-- Optional: Add a comment to document the change
COMMENT ON COLUMN "courseList"."createdBy" IS 'Clerk user ID';
COMMENT ON COLUMN "courseList"."createdByEmail" IS 'User email address for display';
