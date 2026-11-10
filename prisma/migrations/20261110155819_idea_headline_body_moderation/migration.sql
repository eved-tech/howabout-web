-- CreateEnum
CREATE TYPE "ModerationStatus" AS ENUM ('CLEAR', 'COMPLAINT');

-- AlterTable: add new columns nullable first so existing rows aren't broken
ALTER TABLE "Idea" ADD COLUMN "headline" TEXT;
ALTER TABLE "Idea" ADD COLUMN "body" TEXT;
ALTER TABLE "Idea" ADD COLUMN "moderationStatus" "ModerationStatus";
ALTER TABLE "Idea" ADD COLUMN "reportedAt" TIMESTAMP(3);

-- Backfill existing rows from the old `text` column
UPDATE "Idea" SET "headline" = LEFT("text", 60), "body" = "text" WHERE "headline" IS NULL;

-- Now that every row has a value, make the new columns required
ALTER TABLE "Idea" ALTER COLUMN "headline" SET NOT NULL;
ALTER TABLE "Idea" ALTER COLUMN "body" SET NOT NULL;

-- Drop the old column
ALTER TABLE "Idea" DROP COLUMN "text";
