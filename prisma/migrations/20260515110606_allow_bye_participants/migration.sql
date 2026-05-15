-- AlterTable
ALTER TABLE "registeredParticipants" ADD COLUMN     "isBye" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "playerId" DROP NOT NULL;
