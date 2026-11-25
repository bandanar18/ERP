-- AlterTable
ALTER TABLE "pm_project_expenses" ADD COLUMN "obligationPaymentId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "pm_project_expenses_obligationPaymentId_key" ON "pm_project_expenses"("obligationPaymentId");

-- AddForeignKey
ALTER TABLE "pm_project_expenses" ADD CONSTRAINT "pm_project_expenses_obligationPaymentId_fkey" FOREIGN KEY ("obligationPaymentId") REFERENCES "pm_obligation_payments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill existing obligation payments into expenses to maintain full consistency
INSERT INTO "pm_project_expenses" ("id", "projectId", "description", "amountUsd", "expenseDate", "createdById", "obligationPaymentId", "createdAt", "updatedAt")
SELECT 
    gen_random_uuid()::text,
    o."projectId",
    CONCAT('Pago obligación: ', o."description"),
    p."amountUsd",
    p."paidAt",
    p."paidById",
    p."id",
    p."createdAt",
    p."createdAt"
FROM "pm_obligation_payments" p
JOIN "pm_project_obligations" o ON o."id" = p."obligationId"
WHERE NOT EXISTS (
    SELECT 1 FROM "pm_project_expenses" e WHERE e."obligationPaymentId" = p."id"
);
