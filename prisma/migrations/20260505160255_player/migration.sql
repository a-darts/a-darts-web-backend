-- CreateTable
CREATE TABLE "players" (
    "userId" UUID NOT NULL,
    "registrationNumber" TEXT NOT NULL,
    "federation" TEXT NOT NULL,
    "seasonStartYear" INTEGER NOT NULL,
    "seasonEndYear" INTEGER NOT NULL,

    CONSTRAINT "players_pkey" PRIMARY KEY ("userId")
);

-- AddForeignKey
ALTER TABLE "players" ADD CONSTRAINT "players_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
