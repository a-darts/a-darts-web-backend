/*
  Warnings:

  - The values [PAIRS,WOMEN_PAIRS,MEN_PAIRS,MIXED_PAIRS,YOUTH_PAIRS,TEAMS] on the enum `GameModes` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "GameModes_new" AS ENUM ('SINGLE', 'WOMEN_SINGLES', 'MEN_SINGLES', 'MIXED_SINGLES', 'YOUTH_SINGLES', 'OTHER');
ALTER TABLE "tournaments" ALTER COLUMN "infoMode" TYPE "GameModes_new" USING ("infoMode"::text::"GameModes_new");
ALTER TYPE "GameModes" RENAME TO "GameModes_old";
ALTER TYPE "GameModes_new" RENAME TO "GameModes";
DROP TYPE "public"."GameModes_old";
COMMIT;
