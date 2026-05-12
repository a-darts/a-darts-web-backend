/*
  Warnings:

  - You are about to drop the column `matchScoreParticipant1Legs` on the `matches` table. All the data in the column will be lost.
  - You are about to drop the column `matchScoreParticipant1Sets` on the `matches` table. All the data in the column will be lost.
  - You are about to drop the column `matchScoreParticipant2Legs` on the `matches` table. All the data in the column will be lost.
  - You are about to drop the column `matchScoreParticipant2Sets` on the `matches` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "matches" DROP COLUMN "matchScoreParticipant1Legs",
DROP COLUMN "matchScoreParticipant1Sets",
DROP COLUMN "matchScoreParticipant2Legs",
DROP COLUMN "matchScoreParticipant2Sets",
ADD COLUMN     "matchScoreParticipant1LegsWon" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "matchScoreParticipant1SetsWon" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "matchScoreParticipant2LegsWon" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "matchScoreParticipant2SetsWon" INTEGER NOT NULL DEFAULT 0;
