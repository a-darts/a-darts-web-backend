/*
  Warnings:

  - Added the required column `isBye` to the `bracketPositions` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "bracketPositions" ADD COLUMN     "isBye" BOOLEAN NOT NULL;
