-- DropForeignKey
ALTER TABLE "matches" DROP CONSTRAINT "matches_participant1Id_fkey";

-- DropForeignKey
ALTER TABLE "matches" DROP CONSTRAINT "matches_participant2Id_fkey";

-- DropIndex
DROP INDEX "matches_tournamentId_participant1Id_participant2Id_key";

-- AlterTable
ALTER TABLE "matches" ALTER COLUMN "participant1Id" DROP NOT NULL,
ALTER COLUMN "participant2Id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_participant1Id_fkey" FOREIGN KEY ("participant1Id") REFERENCES "registeredParticipants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_participant2Id_fkey" FOREIGN KEY ("participant2Id") REFERENCES "registeredParticipants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
