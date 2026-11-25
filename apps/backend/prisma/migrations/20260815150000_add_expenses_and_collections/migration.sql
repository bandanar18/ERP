-- CreateTable
CREATE TABLE "pm_project_expenses" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amountUsd" DECIMAL(14,2) NOT NULL,
    "expenseDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pm_project_expenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pm_project_collections" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "reference" TEXT,
    "amountUsd" DECIMAL(14,2) NOT NULL,
    "collectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pm_project_collections_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "pm_project_expenses_projectId_idx" ON "pm_project_expenses"("projectId");

-- CreateIndex
CREATE INDEX "pm_project_collections_projectId_idx" ON "pm_project_collections"("projectId");

-- AddForeignKey
ALTER TABLE "pm_project_expenses" ADD CONSTRAINT "pm_project_expenses_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "pm_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pm_project_collections" ADD CONSTRAINT "pm_project_collections_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "pm_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
