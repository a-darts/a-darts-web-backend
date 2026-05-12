-- CreateEnum
CREATE TYPE "MatchStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'FINISHED', 'SUSPENDED', 'ABANDONED');

-- AlterTable
ALTER TABLE "tournaments" ADD COLUMN     "matchesIds" TEXT[];

-- CreateTable
CREATE TABLE "matches" (
    "id" UUID NOT NULL,
    "round" INTEGER NOT NULL,
    "boardNumber" INTEGER,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "status" "MatchStatus" NOT NULL DEFAULT 'PENDING',
    "participant1Id" UUID NOT NULL,
    "participant2Id" UUID NOT NULL,
    "matchScoreParticipant1Sets" INTEGER NOT NULL DEFAULT 0,
    "matchScoreParticipant1Legs" INTEGER NOT NULL DEFAULT 0,
    "matchScoreParticipant2Sets" INTEGER NOT NULL DEFAULT 0,
    "matchScoreParticipant2Legs" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "matches_pkey" PRIMARY KEY ("id")
);
