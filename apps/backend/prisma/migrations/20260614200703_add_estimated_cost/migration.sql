-- AlterTable
ALTER TABLE "projects" ADD COLUMN     "estimatedCost" DECIMAL(65,30) NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "cost_plannings" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "amountUsd" DECIMAL(65,30) NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cost_plannings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "cost_plannings_projectId_idx" ON "cost_plannings"("projectId");

-- AddForeignKey
ALTER TABLE "cost_plannings" ADD CONSTRAINT "cost_plannings_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
