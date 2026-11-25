-- Renombrar tablas core del ERP al prefijo erp_ (conserva datos).
-- Postgres actualiza automáticamente las FK que referencian estas tablas.

ALTER TABLE "users" RENAME TO "erp_users";
ALTER TABLE "roles" RENAME TO "erp_roles";
ALTER TABLE "otp_tokens" RENAME TO "erp_otp_tokens";
ALTER TABLE "password_reset_tokens" RENAME TO "erp_password_reset_tokens";
ALTER TABLE "module_memberships" RENAME TO "erp_module_memberships";
