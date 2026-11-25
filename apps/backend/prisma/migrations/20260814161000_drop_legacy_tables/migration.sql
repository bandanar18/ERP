-- Eliminar tablas legacy del ERP (ya migradas a sus equivalentes pm_*).
-- IF EXISTS + CASCADE: seguro si la tabla no existe y limpia FK dependientes.
-- ⚠️ Verificar antes que la migración de datos legacy → pm_* se completó.

DROP TABLE IF EXISTS "projects" CASCADE;
DROP TABLE IF EXISTS "companies" CASCADE;
DROP TABLE IF EXISTS "avance_fisico" CASCADE;
DROP TABLE IF EXISTS "financial_valuations" CASCADE;
DROP TABLE IF EXISTS "cost_plannings" CASCADE;
DROP TABLE IF EXISTS "file_gallery" CASCADE;
