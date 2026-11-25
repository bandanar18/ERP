-- AlterTable
ALTER TABLE "pm_projects" ADD COLUMN IF NOT EXISTS "actualPhysicalProgress" TEXT;
ALTER TABLE "pm_projects" ADD COLUMN IF NOT EXISTS "plannedPhysicalProgress" TEXT;
