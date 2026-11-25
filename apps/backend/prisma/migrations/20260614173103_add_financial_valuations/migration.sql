-- CreateEnum
CREATE TYPE "ValuationStatus" AS ENUM ('POR_VALUAR', 'POR_FACTURAR', 'FACTURADO');

-- CreateTable
CREATE TABLE "financial_valuations" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "valuationNumber" TEXT NOT NULL,
    "amountUsd" DECIMAL(65,30) NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "status" "ValuationStatus" NOT NULL DEFAULT 'POR_VALUAR',
    "invoiceNumber" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "financial_valuations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "financial_valuations_projectId_idx" ON "financial_valuations"("projectId");

-- AddForeignKey
ALTER TABLE "financial_valuations" ADD CONSTRAINT "financial_valuations_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
