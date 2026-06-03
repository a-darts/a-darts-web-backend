-- CreateEnum
CREATE TYPE "PlayerStatus" AS ENUM ('ACTIVE', 'DELETED');

-- AlterTable
ALTER TABLE "players" ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "status" "PlayerStatus" NOT NULL DEFAULT 'ACTIVE';
