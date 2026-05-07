/*
  Warnings:

  - The values [K_O] on the enum `ScheduleTypes` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ScheduleTypes_new" AS ENUM ('KO');
ALTER TABLE "tournaments" ALTER COLUMN "infoSchedule" TYPE "ScheduleTypes_new" USING ("infoSchedule"::text::"ScheduleTypes_new");
ALTER TYPE "ScheduleTypes" RENAME TO "ScheduleTypes_old";
ALTER TYPE "ScheduleTypes_new" RENAME TO "ScheduleTypes";
DROP TYPE "public"."ScheduleTypes_old";
COMMIT;
