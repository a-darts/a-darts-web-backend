/*
  Warnings:

  - A unique constraint covering the columns `[matchId]` on the table `boards` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "boards_matchId_key" ON "boards"("matchId");
