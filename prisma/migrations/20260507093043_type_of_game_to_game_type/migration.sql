/*
  Warnings:

  - You are about to drop the column `infoTypeOfGame` on the `tournaments` table. All the data in the column will be lost.
  - Added the required column `infoGameType` to the `tournaments` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "tournaments" DROP COLUMN "infoTypeOfGame",
ADD COLUMN     "infoGameType" "GameTypes" NOT NULL;
