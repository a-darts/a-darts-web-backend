/*
  Warnings:

  - Added the required column `matchIndex` to the `matches` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "matches" ADD COLUMN     "matchIndex" INTEGER NOT NULL;
