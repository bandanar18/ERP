CREATE TYPE "PmObligationCategory" AS ENUM ('EQUIPOS','VIATICOS','ALQUILERES','COMBUSTIBLE','FACTURAS','OTROS');
CREATE TYPE "PmObligationStatus" AS ENUM ('PENDIENTE','PARCIAL','PAGADO');

CREATE TABLE "pm_project_obligations" (
  "id" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "category" "PmObligationCategory" NOT NULL,
  "description" TEXT NOT NULL,
  "supplier" TEXT,
  "invoiceNumber" TEXT,
  "amountUsd" DECIMAL(14,2) NOT NULL,
  "dueDate" TIMESTAMP(3),
  "status" "PmObligationStatus" NOT NULL DEFAULT 'PENDIENTE',
  "paidAt" TIMESTAMP(3),
  "createdById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "pm_project_obligations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "pm_obligation_payments" (
  "id" TEXT NOT NULL,
  "obligationId" TEXT NOT NULL,
  "amountUsd" DECIMAL(14,2) NOT NULL,
  "paidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "paidById" TEXT,
  "note" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "pm_obligation_payments_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "pm_project_obligations_projectId_status_idx" ON "pm_project_obligations"("projectId","status");
CREATE INDEX "pm_obligation_payments_obligationId_idx" ON "pm_obligation_payments"("obligationId");

ALTER TABLE "pm_project_obligations" ADD CONSTRAINT "pm_project_obligations_projectId_fkey"
  FOREIGN KEY ("projectId") REFERENCES "pm_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "pm_obligation_payments" ADD CONSTRAINT "pm_obligation_payments_obligationId_fkey"
  FOREIGN KEY ("obligationId") REFERENCES "pm_project_obligations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Rol nuevo (idempotente, no depende del seed)
INSERT INTO "pm_roles" ("id","code","description")
SELECT gen_random_uuid()::text, 'PM_ADMIN_FINANCIERO', 'Administrador financiero (cuentas por pagar)'
WHERE NOT EXISTS (SELECT 1 FROM "pm_roles" WHERE "code" = 'PM_ADMIN_FINANCIERO');
