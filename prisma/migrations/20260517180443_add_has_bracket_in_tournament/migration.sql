/*
  Warnings:

  - Added the required column `hasBracket` to the `tournaments` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "tournaments" ADD COLUMN     "hasBracket" BOOLEAN NOT NULL;
