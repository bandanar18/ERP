-- Add phone field to pm_users table
ALTER TABLE "pm_users" ADD COLUMN IF NOT EXISTS "phone" TEXT;
