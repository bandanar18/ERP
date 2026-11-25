-- CreateTable
CREATE TABLE "avance_fisico" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "avanceReal" TEXT,
    "avancePlanificado" TEXT,
    "puntosAtencion" TEXT,
    "fechaInicio" TIMESTAMP(3),
    "fechaFin" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "avance_fisico_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "avance_fisico_projectId_idx" ON "avance_fisico"("projectId");

-- AddForeignKey
ALTER TABLE "avance_fisico" ADD CONSTRAINT "avance_fisico_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
