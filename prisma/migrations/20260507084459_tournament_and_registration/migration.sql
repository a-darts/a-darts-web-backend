/*
  Warnings:

  - The values [player,admin] on the enum `UserRole` will be removed. If these variants are still used in the database, this will fail.
  - The values [active,inactive,blocked,deleted] on the enum `UserStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `registratedAt` on the `users` table. All the data in the column will be lost.
  - Added the required column `registeredAt` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "TournamentStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'IN_PROGRESS', 'FINISHED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "GameModes" AS ENUM ('SINGLE', 'WOMEN_SINGLES', 'MEN_SINGLES', 'MIXED_SINGLES', 'YOUTH_SINGLES', 'PAIRS', 'WOMEN_PAIRS', 'MEN_PAIRS', 'MIXED_PAIRS', 'YOUTH_PAIRS', 'TEAMS');

-- CreateEnum
CREATE TYPE "ScheduleTypes" AS ENUM ('K_O');

-- CreateEnum
CREATE TYPE "GameTypes" AS ENUM ('BEST_OF', 'FIRST_TO');

-- CreateEnum
CREATE TYPE "RegistrationStatus" AS ENUM ('OPEN', 'CLOSED');

-- AlterEnum
BEGIN;
CREATE TYPE "UserRole_new" AS ENUM ('PLAYER', 'ADMIN');
ALTER TABLE "users" ALTER COLUMN "role" TYPE "UserRole_new" USING ("role"::text::"UserRole_new");
ALTER TYPE "UserRole" RENAME TO "UserRole_old";
ALTER TYPE "UserRole_new" RENAME TO "UserRole";
DROP TYPE "public"."UserRole_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "UserStatus_new" AS ENUM ('ACTIVE', 'INACTIVE', 'BLOCKED', 'DELETED');
ALTER TABLE "users" ALTER COLUMN "status" TYPE "UserStatus_new" USING ("status"::text::"UserStatus_new");
ALTER TYPE "UserStatus" RENAME TO "UserStatus_old";
ALTER TYPE "UserStatus_new" RENAME TO "UserStatus";
DROP TYPE "public"."UserStatus_old";
COMMIT;

-- AlterTable
ALTER TABLE "users" DROP COLUMN "registratedAt",
ADD COLUMN     "registeredAt" TIMESTAMP(3) NOT NULL;

-- CreateTable
CREATE TABLE "tournaments" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "status" "TournamentStatus" NOT NULL,
    "infoPlace" TEXT NOT NULL,
    "infoDateTime" TIMESTAMP(3) NOT NULL,
    "infoMode" "GameModes" NOT NULL,
    "infoGame" TEXT NOT NULL,
    "infoSchedule" "ScheduleTypes" NOT NULL,
    "infoMaxPlayers" INTEGER NOT NULL,
    "infoTypeOfGame" "GameTypes" NOT NULL,
    "infoNumLegs" INTEGER NOT NULL,
    "infoNumSets" INTEGER NOT NULL,
    "infoRules" TEXT NOT NULL,
    "infoInfo" TEXT NOT NULL,
    "infoFederation" TEXT NOT NULL,
    "registrationHasCheckIn" BOOLEAN NOT NULL,
    "registrationStatus" "RegistrationStatus" NOT NULL,
    "registrationStartsAt" TIMESTAMP(3),
    "registrationEndsAt" TIMESTAMP(3),

    CONSTRAINT "tournaments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "registeredParticipants" (
    "id" UUID NOT NULL,
    "playerId" UUID NOT NULL,
    "registeredAt" TIMESTAMP(3) NOT NULL,
    "checkedInAt" TIMESTAMP(3),
    "tournamentId" UUID NOT NULL,

    CONSTRAINT "registeredParticipants_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "registeredParticipants_playerId_tournamentId_key" ON "registeredParticipants"("playerId", "tournamentId");

-- AddForeignKey
ALTER TABLE "registeredParticipants" ADD CONSTRAINT "registeredParticipants_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "tournaments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
