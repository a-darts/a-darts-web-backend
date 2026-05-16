/*
  Warnings:

  - Added the required column `isParticipant1Bye` to the `matches` table without a default value. This is not possible if the table is not empty.
  - Added the required column `isParticipant2Bye` to the `matches` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
ALTER TYPE "MatchStatus" ADD VALUE 'READY';

-- AlterTable
ALTER TABLE "matches" ADD COLUMN     "isParticipant1Bye" BOOLEAN NOT NULL,
ADD COLUMN     "isParticipant2Bye" BOOLEAN NOT NULL;
