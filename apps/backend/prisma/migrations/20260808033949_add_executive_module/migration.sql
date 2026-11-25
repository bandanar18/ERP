-- CreateEnum
CREATE TYPE "ExecutiveTrafficLight" AS ENUM ('GREEN', 'RED', 'GRAY');

-- CreateEnum
CREATE TYPE "ExecutiveFrequencyType" AS ENUM ('MONTHLY', 'QUARTERLY', 'SEMIANNUAL', 'PROJECT_BASED');

-- CreateEnum
CREATE TYPE "ExecutiveTargetDirection" AS ENUM ('AT_LEAST', 'AT_MOST', 'RANGE');

-- CreateEnum
CREATE TYPE "ExecutiveMeasurementStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'LOCKED');

-- CreateEnum
CREATE TYPE "ExecutiveUserStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "ExecutiveMeasurementInputMode" AS ENUM ('DIRECT_VALUE', 'FORMULA_INPUTS');

-- CreateEnum
CREATE TYPE "ExecutiveAggregationMethod" AS ENUM ('LAST_VALUE', 'SUM', 'AVERAGE', 'WEIGHTED_AVERAGE', 'CUMULATIVE_RATIO');

-- CreateTable
CREATE TABLE "executive_organization" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "executive_organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "executive_process" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "parentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "executive_process_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "executive_project" (
    "id" TEXT NOT NULL,
    "processId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "executive_project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "executive_user_process_assignment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "processId" TEXT NOT NULL,
    "subprocessId" TEXT,
    "projectId" TEXT,

    CONSTRAINT "executive_user_process_assignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "executive_indicator" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "processId" TEXT NOT NULL,
    "subprocessId" TEXT,
    "projectId" TEXT,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "activeVersionId" TEXT,
    "chartType" TEXT NOT NULL DEFAULT 'LINE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "executive_indicator_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "executive_indicator_version" (
    "id" TEXT NOT NULL,
    "indicatorId" TEXT NOT NULL,
    "frequency" "ExecutiveFrequencyType" NOT NULL,
    "direction" "ExecutiveTargetDirection" NOT NULL,
    "formula" TEXT,
    "inputMode" "ExecutiveMeasurementInputMode" NOT NULL DEFAULT 'DIRECT_VALUE',
    "displayAsPercent" BOOLEAN NOT NULL DEFAULT false,
    "aggregation" "ExecutiveAggregationMethod" NOT NULL DEFAULT 'LAST_VALUE',
    "effectiveFrom" TIMESTAMP(3) NOT NULL,
    "effectiveTo" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "executive_indicator_version_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "executive_indicator_target" (
    "id" TEXT NOT NULL,
    "versionId" TEXT NOT NULL,
    "targetValue" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "thresholds" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "executive_indicator_target_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "executive_reporting_period" (
    "id" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "executive_reporting_period_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "executive_measurement" (
    "id" TEXT NOT NULL,
    "indicatorVersionId" TEXT NOT NULL,
    "periodId" TEXT NOT NULL,
    "value" DOUBLE PRECISION,
    "status" "ExecutiveMeasurementStatus" NOT NULL DEFAULT 'DRAFT',
    "trafficLight" "ExecutiveTrafficLight",
    "submittedById" TEXT NOT NULL,
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "observation" TEXT,
    "analysisInternal" TEXT,
    "analysisExternal" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "executive_measurement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "executive_measurement_input" (
    "id" TEXT NOT NULL,
    "measurementId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "executive_measurement_input_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "executive_action_plan" (
    "id" TEXT NOT NULL,
    "measurementId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "dates" TEXT NOT NULL,
    "progress" DOUBLE PRECISION NOT NULL,
    "ownerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "executive_action_plan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "executive_user" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT,
    "status" "ExecutiveUserStatus" NOT NULL DEFAULT 'ACTIVE',
    "externalId" TEXT,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "executive_user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "executive_role" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "executive_role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "executive_permission" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "executive_permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "executive_user_role" (
    "userId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,

    CONSTRAINT "executive_user_role_pkey" PRIMARY KEY ("userId","roleId")
);

-- CreateTable
CREATE TABLE "executive_role_permission" (
    "roleId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,

    CONSTRAINT "executive_role_permission_pkey" PRIMARY KEY ("roleId","permissionId")
);

-- CreateTable
CREATE TABLE "executive_audit_log" (
    "id" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "before" JSONB,
    "after" JSONB,
    "ip" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "executive_audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "executive_organization_code_key" ON "executive_organization"("code");

-- CreateIndex
CREATE INDEX "executive_user_process_assignment_userId_processId_subproce_idx" ON "executive_user_process_assignment"("userId", "processId", "subprocessId", "projectId");

-- CreateIndex
CREATE INDEX "executive_indicator_organizationId_processId_subprocessId_p_idx" ON "executive_indicator"("organizationId", "processId", "subprocessId", "projectId");

-- CreateIndex
CREATE UNIQUE INDEX "executive_measurement_indicatorVersionId_periodId_key" ON "executive_measurement"("indicatorVersionId", "periodId");

-- CreateIndex
CREATE UNIQUE INDEX "executive_user_email_key" ON "executive_user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "executive_user_externalId_key" ON "executive_user"("externalId");

-- CreateIndex
CREATE UNIQUE INDEX "executive_role_code_key" ON "executive_role"("code");

-- CreateIndex
CREATE UNIQUE INDEX "executive_permission_code_key" ON "executive_permission"("code");

-- CreateIndex
CREATE INDEX "executive_audit_log_entityType_entityId_createdAt_idx" ON "executive_audit_log"("entityType", "entityId", "createdAt" DESC);

-- AddForeignKey
ALTER TABLE "executive_process" ADD CONSTRAINT "executive_process_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "executive_organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "executive_process" ADD CONSTRAINT "executive_process_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "executive_process"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "executive_project" ADD CONSTRAINT "executive_project_processId_fkey" FOREIGN KEY ("processId") REFERENCES "executive_process"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "executive_user_process_assignment" ADD CONSTRAINT "executive_user_process_assignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "executive_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "executive_user_process_assignment" ADD CONSTRAINT "executive_user_process_assignment_processId_fkey" FOREIGN KEY ("processId") REFERENCES "executive_process"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "executive_user_process_assignment" ADD CONSTRAINT "executive_user_process_assignment_subprocessId_fkey" FOREIGN KEY ("subprocessId") REFERENCES "executive_process"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "executive_user_process_assignment" ADD CONSTRAINT "executive_user_process_assignment_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "executive_project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "executive_indicator" ADD CONSTRAINT "executive_indicator_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "executive_organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "executive_indicator" ADD CONSTRAINT "executive_indicator_processId_fkey" FOREIGN KEY ("processId") REFERENCES "executive_process"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "executive_indicator" ADD CONSTRAINT "executive_indicator_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "executive_project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "executive_indicator_version" ADD CONSTRAINT "executive_indicator_version_indicatorId_fkey" FOREIGN KEY ("indicatorId") REFERENCES "executive_indicator"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "executive_indicator_target" ADD CONSTRAINT "executive_indicator_target_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "executive_indicator_version"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "executive_measurement" ADD CONSTRAINT "executive_measurement_indicatorVersionId_fkey" FOREIGN KEY ("indicatorVersionId") REFERENCES "executive_indicator_version"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "executive_measurement" ADD CONSTRAINT "executive_measurement_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "executive_reporting_period"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "executive_measurement" ADD CONSTRAINT "executive_measurement_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "executive_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "executive_measurement" ADD CONSTRAINT "executive_measurement_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "executive_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "executive_measurement_input" ADD CONSTRAINT "executive_measurement_input_measurementId_fkey" FOREIGN KEY ("measurementId") REFERENCES "executive_measurement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "executive_action_plan" ADD CONSTRAINT "executive_action_plan_measurementId_fkey" FOREIGN KEY ("measurementId") REFERENCES "executive_measurement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "executive_action_plan" ADD CONSTRAINT "executive_action_plan_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "executive_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "executive_user" ADD CONSTRAINT "executive_user_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "executive_organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "executive_user_role" ADD CONSTRAINT "executive_user_role_userId_fkey" FOREIGN KEY ("userId") REFERENCES "executive_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "executive_user_role" ADD CONSTRAINT "executive_user_role_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "executive_role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "executive_role_permission" ADD CONSTRAINT "executive_role_permission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "executive_role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "executive_role_permission" ADD CONSTRAINT "executive_role_permission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "executive_permission"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "executive_audit_log" ADD CONSTRAINT "executive_audit_log_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "executive_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
