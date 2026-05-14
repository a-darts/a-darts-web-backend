-- CreateEnum
CREATE TYPE "BracketStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'IN_PROGRESS', 'FINISHED');

-- CreateTable
CREATE TABLE "brackets" (
    "id" UUID NOT NULL,
    "status" "BracketStatus" NOT NULL,
    "tournamentId" UUID NOT NULL,

    CONSTRAINT "brackets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bracketPositions" (
    "id" UUID NOT NULL,
    "position" INTEGER NOT NULL,
    "participantId" UUID,
    "bracketId" UUID NOT NULL,

    CONSTRAINT "bracketPositions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "brackets_tournamentId_key" ON "brackets"("tournamentId");

-- CreateIndex
CREATE UNIQUE INDEX "bracketPositions_bracketId_position_key" ON "bracketPositions"("bracketId", "position");

-- AddForeignKey
ALTER TABLE "registeredParticipants" ADD CONSTRAINT "registeredParticipants_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registeredParticipants" ADD CONSTRAINT "registeredParticipants_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "tournaments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "tournaments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_participant1Id_fkey" FOREIGN KEY ("participant1Id") REFERENCES "registeredParticipants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_participant2Id_fkey" FOREIGN KEY ("participant2Id") REFERENCES "registeredParticipants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "brackets" ADD CONSTRAINT "brackets_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "tournaments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bracketPositions" ADD CONSTRAINT "bracketPositions_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "registeredParticipants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bracketPositions" ADD CONSTRAINT "bracketPositions_bracketId_fkey" FOREIGN KEY ("bracketId") REFERENCES "brackets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
