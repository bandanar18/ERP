-- CreateEnum
CREATE TYPE "PmProjectStatus" AS ENUM ('PLANNED', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PmValuationStatus" AS ENUM ('POR_VALUAR', 'POR_FACTURAR', 'FACTURADO');

-- CreateTable
CREATE TABLE "pm_roles" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "pm_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pm_users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "externalId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pm_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "module_memberships" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "moduleUserId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "module_memberships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pm_user_scopes" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "companyId" TEXT,
    "projectId" TEXT,

    CONSTRAINT "pm_user_scopes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pm_companies" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "taxId" TEXT,
    "legalName" TEXT,
    "address" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "logoUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pm_companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pm_projects" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "shortName" TEXT,
    "description" TEXT,
    "managerId" TEXT,
    "companyId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "status" "PmProjectStatus" NOT NULL DEFAULT 'PLANNED',
    "offeredAmount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "estimatedCost" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pm_projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pm_physical_progress" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualProgress" TEXT,
    "plannedProgress" TEXT,
    "attentionPoints" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pm_physical_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pm_financial_valuations" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "valuationNumber" TEXT NOT NULL,
    "amountUsd" DECIMAL(65,30) NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "status" "PmValuationStatus" NOT NULL DEFAULT 'POR_VALUAR',
    "invoiceNumber" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pm_financial_valuations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pm_cost_plannings" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "amountUsd" DECIMAL(65,30) NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pm_cost_plannings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pm_gallery_files" (
    "id" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" BIGINT NOT NULL,
    "path" TEXT NOT NULL,
    "uploadDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "module" TEXT NOT NULL DEFAULT 'PROJECT_MANAGEMENT',
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,

    CONSTRAINT "pm_gallery_files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pm_audit_log" (
    "id" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "externalId" TEXT,
    "module" TEXT NOT NULL DEFAULT 'PROJECT_MANAGEMENT',
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "before" JSONB,
    "after" JSONB,
    "ip" TEXT,
    "route" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pm_audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pm_permissions" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "pm_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pm_role_permissions" (
    "roleId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,

    CONSTRAINT "pm_role_permissions_pkey" PRIMARY KEY ("roleId","permissionId")
);

-- CreateTable
CREATE TABLE "pm_user_roles" (
    "userId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,

    CONSTRAINT "pm_user_roles_pkey" PRIMARY KEY ("userId","roleId")
);

-- CreateIndex
CREATE UNIQUE INDEX "pm_roles_code_key" ON "pm_roles"("code");

-- CreateIndex
CREATE UNIQUE INDEX "pm_users_email_key" ON "pm_users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "pm_users_externalId_key" ON "pm_users"("externalId");

-- CreateIndex
CREATE INDEX "module_memberships_module_idx" ON "module_memberships"("module");

-- CreateIndex
CREATE UNIQUE INDEX "module_memberships_userId_module_key" ON "module_memberships"("userId", "module");

-- CreateIndex
CREATE INDEX "pm_user_scopes_userId_idx" ON "pm_user_scopes"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "pm_projects_code_key" ON "pm_projects"("code");

-- CreateIndex
CREATE INDEX "pm_physical_progress_projectId_idx" ON "pm_physical_progress"("projectId");

-- CreateIndex
CREATE INDEX "pm_financial_valuations_projectId_idx" ON "pm_financial_valuations"("projectId");

-- CreateIndex
CREATE INDEX "pm_cost_plannings_projectId_idx" ON "pm_cost_plannings"("projectId");

-- CreateIndex
CREATE INDEX "pm_gallery_files_module_entityType_entityId_idx" ON "pm_gallery_files"("module", "entityType", "entityId");

-- CreateIndex
CREATE INDEX "pm_audit_log_entityType_entityId_idx" ON "pm_audit_log"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "pm_audit_log_module_actorId_createdAt_idx" ON "pm_audit_log"("module", "actorId", "createdAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "pm_permissions_code_key" ON "pm_permissions"("code");

-- AddForeignKey
ALTER TABLE "module_memberships" ADD CONSTRAINT "module_memberships_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pm_user_scopes" ADD CONSTRAINT "pm_user_scopes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "pm_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pm_projects" ADD CONSTRAINT "pm_projects_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "pm_companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pm_projects" ADD CONSTRAINT "pm_projects_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "pm_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pm_physical_progress" ADD CONSTRAINT "pm_physical_progress_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "pm_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pm_financial_valuations" ADD CONSTRAINT "pm_financial_valuations_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "pm_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pm_cost_plannings" ADD CONSTRAINT "pm_cost_plannings_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "pm_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pm_audit_log" ADD CONSTRAINT "pm_audit_log_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "pm_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pm_role_permissions" ADD CONSTRAINT "pm_role_permissions_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "pm_permissions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pm_role_permissions" ADD CONSTRAINT "pm_role_permissions_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "pm_roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pm_user_roles" ADD CONSTRAINT "pm_user_roles_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "pm_roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pm_user_roles" ADD CONSTRAINT "pm_user_roles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "pm_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
