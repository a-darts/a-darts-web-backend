/*
  Warnings:

  - You are about to drop the column `isBye` on the `registeredParticipants` table. All the data in the column will be lost.
  - Made the column `playerId` on table `registeredParticipants` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "registeredParticipants" DROP COLUMN "isBye",
ALTER COLUMN "playerId" SET NOT NULL;
