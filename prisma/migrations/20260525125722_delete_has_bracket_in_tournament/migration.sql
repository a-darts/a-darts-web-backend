/*
  Warnings:

  - You are about to drop the column `hasBracket` on the `tournaments` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "BoardStatus" AS ENUM ('AVAILABLE', 'OCCUPIED', 'DISABLED');

-- AlterTable
ALTER TABLE "tournaments" DROP COLUMN "hasBracket";

-- CreateTable
CREATE TABLE "playingAreas" (
    "id" UUID NOT NULL,
    "tournamentId" UUID NOT NULL,

    CONSTRAINT "playingAreas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "boards" (
    "id" UUID NOT NULL,
    "number" INTEGER NOT NULL,
    "status" "BoardStatus" NOT NULL,
    "matchId" UUID,
    "playingAreaId" UUID NOT NULL,

    CONSTRAINT "boards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tournamentResults" (
    "id" UUID NOT NULL,
    "tournamentId" UUID NOT NULL,
    "participantId" UUID NOT NULL,
    "playerId" UUID NOT NULL,
    "finalPosition" INTEGER NOT NULL,
    "matchesWon" INTEGER NOT NULL,
    "matchesLost" INTEGER NOT NULL,
    "setsWon" INTEGER NOT NULL,
    "setsLost" INTEGER NOT NULL,
    "legsWon" INTEGER NOT NULL,
    "legsLost" INTEGER NOT NULL,

    CONSTRAINT "tournamentResults_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "playingAreas_tournamentId_key" ON "playingAreas"("tournamentId");

-- CreateIndex
CREATE UNIQUE INDEX "boards_playingAreaId_number_key" ON "boards"("playingAreaId", "number");

-- CreateIndex
CREATE UNIQUE INDEX "tournamentResults_tournamentId_participantId_key" ON "tournamentResults"("tournamentId", "participantId");

-- AddForeignKey
ALTER TABLE "playingAreas" ADD CONSTRAINT "playingAreas_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "tournaments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "boards" ADD CONSTRAINT "boards_playingAreaId_fkey" FOREIGN KEY ("playingAreaId") REFERENCES "playingAreas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "boards" ADD CONSTRAINT "boards_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "matches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournamentResults" ADD CONSTRAINT "tournamentResults_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "tournaments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournamentResults" ADD CONSTRAINT "tournamentResults_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "registeredParticipants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournamentResults" ADD CONSTRAINT "tournamentResults_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE CASCADE;
