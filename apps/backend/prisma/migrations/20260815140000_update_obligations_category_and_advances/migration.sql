-- AlterTable: convert category from enum to text
ALTER TABLE "pm_project_obligations" ALTER COLUMN "category" TYPE TEXT USING "category"::text;

-- DropEnum if not referenced
DROP TYPE IF EXISTS "PmObligationCategory";

-- AlterTable: add advanceAmount and amortizedAmount
ALTER TABLE "pm_projects" ADD COLUMN IF NOT EXISTS "advanceAmount" DECIMAL(14,2) NOT NULL DEFAULT 0;
ALTER TABLE "pm_projects" ADD COLUMN IF NOT EXISTS "amortizedAmount" DECIMAL(14,2) NOT NULL DEFAULT 0;
