-- Add name fields to pm_users (managers are displayed in projects and progress)
ALTER TABLE "pm_users" ADD COLUMN "firstName" TEXT;
ALTER TABLE "pm_users" ADD COLUMN "lastName" TEXT;
