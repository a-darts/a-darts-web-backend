/*
  Warnings:

  - A unique constraint covering the columns `[userId]` on the table `players` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "players_userId_seasonStartYear_key";

-- CreateIndex
CREATE UNIQUE INDEX "players_userId_key" ON "players"("userId");
