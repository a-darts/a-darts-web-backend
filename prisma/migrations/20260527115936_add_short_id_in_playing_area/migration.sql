/*
  Warnings:

  - A unique constraint covering the columns `[shortId]` on the table `playingAreas` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `shortId` to the `playingAreas` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "playingAreas" ADD COLUMN     "shortId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "playingAreas_shortId_key" ON "playingAreas"("shortId");
