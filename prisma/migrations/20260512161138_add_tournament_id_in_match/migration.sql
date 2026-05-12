/*
  Warnings:

  - A unique constraint covering the columns `[tournamentId,participant1Id,participant2Id]` on the table `matches` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `tournamentId` to the `matches` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "matches" ADD COLUMN     "tournamentId" UUID NOT NULL;

-- CreateIndex
CREATE INDEX "matches_participant1Id_idx" ON "matches"("participant1Id");

-- CreateIndex
CREATE INDEX "matches_participant2Id_idx" ON "matches"("participant2Id");

-- CreateIndex
CREATE INDEX "matches_tournamentId_idx" ON "matches"("tournamentId");

-- CreateIndex
CREATE UNIQUE INDEX "matches_tournamentId_participant1Id_participant2Id_key" ON "matches"("tournamentId", "participant1Id", "participant2Id");
