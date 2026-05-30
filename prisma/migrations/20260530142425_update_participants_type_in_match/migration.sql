/*
  Warnings:

  - You are about to drop the column `isParticipant1Bye` on the `matches` table. All the data in the column will be lost.
  - You are about to drop the column `isParticipant2Bye` on the `matches` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "ParticipantTypes" AS ENUM ('REGISTERED', 'BYE', 'EMPTY');

-- AlterTable
ALTER TABLE "matches" DROP COLUMN "isParticipant1Bye",
DROP COLUMN "isParticipant2Bye",
ADD COLUMN     "participant1Type" "ParticipantTypes" NOT NULL DEFAULT 'EMPTY',
ADD COLUMN     "participant2Type" "ParticipantTypes" NOT NULL DEFAULT 'EMPTY';
