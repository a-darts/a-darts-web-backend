/*
  Warnings:

  - A unique constraint covering the columns `[shortId]` on the table `boards` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `shortId` to the `boards` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "boards" ADD COLUMN     "shortId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "boards_shortId_key" ON "boards"("shortId");
