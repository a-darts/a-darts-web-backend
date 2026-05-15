/*
  Warnings:

  - The values [ABANDONED] on the enum `MatchStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
ALTER TYPE "BracketStatus" ADD VALUE 'CANCELLED';

-- AlterEnum
BEGIN;
CREATE TYPE "MatchStatus_new" AS ENUM ('PENDING', 'IN_PROGRESS', 'FINISHED', 'SUSPENDED', 'CANCELLED');
ALTER TABLE "public"."matches" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "matches" ALTER COLUMN "status" TYPE "MatchStatus_new" USING ("status"::text::"MatchStatus_new");
ALTER TYPE "MatchStatus" RENAME TO "MatchStatus_old";
ALTER TYPE "MatchStatus_new" RENAME TO "MatchStatus";
DROP TYPE "public"."MatchStatus_old";
ALTER TABLE "matches" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;
