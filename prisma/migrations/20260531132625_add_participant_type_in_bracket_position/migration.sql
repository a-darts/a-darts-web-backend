/*
  Warnings:

  - You are about to drop the column `isBye` on the `bracketPositions` table. All the data in the column will be lost.
  - You are about to drop the column `registrationRegisteredParticipantsIds` on the `tournaments` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "bracketPositions" DROP COLUMN "isBye",
ADD COLUMN     "participantType" "ParticipantTypes" NOT NULL DEFAULT 'EMPTY';

-- AlterTable
ALTER TABLE "tournaments" DROP COLUMN "registrationRegisteredParticipantsIds";
