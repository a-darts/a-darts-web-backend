/*
  Warnings:

  - You are about to drop the column `registrationEndsAt` on the `tournaments` table. All the data in the column will be lost.
  - You are about to drop the column `registrationStartsAt` on the `tournaments` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "registeredParticipants" DROP CONSTRAINT "registeredParticipants_tournamentId_fkey";

-- AlterTable
ALTER TABLE "tournaments" DROP COLUMN "registrationEndsAt",
DROP COLUMN "registrationStartsAt",
ADD COLUMN     "registrationPeriodEndsAt" TIMESTAMP(3),
ADD COLUMN     "registrationPeriodStartsAt" TIMESTAMP(3),
ADD COLUMN     "registrationRegisteredParticipantsIds" TEXT[];

-- CreateIndex
CREATE INDEX "registeredParticipants_playerId_idx" ON "registeredParticipants"("playerId");
