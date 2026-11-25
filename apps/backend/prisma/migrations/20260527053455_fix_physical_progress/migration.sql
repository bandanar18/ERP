/*
  Warnings:

  - You are about to drop the column `avancePlanificado` on the `avance_fisico` table. All the data in the column will be lost.
  - You are about to drop the column `avanceReal` on the `avance_fisico` table. All the data in the column will be lost.
  - You are about to drop the column `fecha` on the `avance_fisico` table. All the data in the column will be lost.
  - You are about to drop the column `fechaFin` on the `avance_fisico` table. All the data in the column will be lost.
  - You are about to drop the column `fechaInicio` on the `avance_fisico` table. All the data in the column will be lost.
  - You are about to drop the column `puntosAtencion` on the `avance_fisico` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "avance_fisico" DROP COLUMN "avancePlanificado",
DROP COLUMN "avanceReal",
DROP COLUMN "fecha",
DROP COLUMN "fechaFin",
DROP COLUMN "fechaInicio",
DROP COLUMN "puntosAtencion",
ADD COLUMN     "actualProgress" TEXT,
ADD COLUMN     "attentionPoints" TEXT,
ADD COLUMN     "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "endDate" TIMESTAMP(3),
ADD COLUMN     "plannedProgress" TEXT,
ADD COLUMN     "startDate" TIMESTAMP(3);
