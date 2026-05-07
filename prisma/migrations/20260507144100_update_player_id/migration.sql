/*
  Warnings:

  - The primary key for the `players` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - A unique constraint covering the columns `[userId,seasonStartYear]` on the table `players` will be added. If there are existing duplicate values, this will fail.
  - The required column `id` was added to the `players` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- AlterTable
ALTER TABLE "players" DROP CONSTRAINT "players_pkey",
ADD COLUMN     "id" UUID NOT NULL,
ADD CONSTRAINT "players_pkey" PRIMARY KEY ("id");

-- CreateIndex
CREATE UNIQUE INDEX "players_userId_seasonStartYear_key" ON "players"("userId", "seasonStartYear");
