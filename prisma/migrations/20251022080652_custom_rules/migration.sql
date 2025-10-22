-- AlterTable
ALTER TABLE "Session" ADD COLUMN     "elapsedSec" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "scenarioCode" TEXT,
ADD COLUMN     "startAt" TIMESTAMP(3),
ADD COLUMN     "work" TEXT NOT NULL DEFAULT '';
