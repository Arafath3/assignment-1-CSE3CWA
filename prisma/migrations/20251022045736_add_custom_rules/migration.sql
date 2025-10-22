-- CreateTable
CREATE TABLE "Scenario" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "sessionDurationSec" INTEGER NOT NULL,
    "task" TEXT NOT NULL,
    "customRules" JSONB,
    "penalties" JSONB,
    "code" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Scenario_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Scenario_code_key" ON "Scenario"("code");
