-- Add username field to pm_users (registration wizard step 2 — "Nombre de usuario")
ALTER TABLE "pm_users" ADD COLUMN "username" TEXT;

-- Unique index (PostgreSQL permite múltiples NULLs, así que los usuarios
-- existentes sin username no entran en conflicto)
CREATE UNIQUE INDEX "pm_users_username_key" ON "pm_users"("username");
