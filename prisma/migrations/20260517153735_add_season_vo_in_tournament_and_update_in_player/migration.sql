/*
  Warnings:

  - You are about to drop the column `seasonEndYear` on the `players` table. All the data in the column will be lost.
  - Added the required column `seasonStartYear` to the `tournaments` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "players" DROP COLUMN "seasonEndYear";

-- AlterTable
ALTER TABLE "tournaments" ADD COLUMN     "seasonStartYear" INTEGER NOT NULL;
