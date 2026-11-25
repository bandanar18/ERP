-- CreateEnum
CREATE TYPE "QcTrafficLight" AS ENUM ('GREEN', 'RED', 'GRAY');

-- CreateEnum
CREATE TYPE "QcFrequencyType" AS ENUM ('MONTHLY', 'QUARTERLY', 'SEMIANNUAL', 'PROJECT_BASED');

-- CreateEnum
CREATE TYPE "QcTargetDirection" AS ENUM ('AT_LEAST', 'AT_MOST', 'RANGE');

-- CreateEnum
CREATE TYPE "QcMeasurementStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'LOCKED');

-- CreateEnum
CREATE TYPE "QcUserStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "QcMeasurementInputMode" AS ENUM ('DIRECT_VALUE', 'FORMULA_INPUTS');

-- CreateEnum
CREATE TYPE "QcAggregationMethod" AS ENUM ('LAST_VALUE', 'SUM', 'AVERAGE', 'WEIGHTED_AVERAGE', 'CUMULATIVE_RATIO');

-- CreateEnum
CREATE TYPE "QcPeriodStatus" AS ENUM ('OPEN', 'CLOSED');

-- CreateTable
CREATE TABLE "qc_users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT,
    "password" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "externalId" TEXT,
    "organizationId" TEXT NOT NULL,
    "status" "QcUserStatus" NOT NULL DEFAULT 'ACTIVE',
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "otpExpiresAt" TIMESTAMP(3),
    "otpAttempts" INTEGER NOT NULL DEFAULT 0,
    "lastOtpSentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "qc_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "qc_roles" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "qc_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "qc_permissions" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "qc_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "qc_user_roles" (
    "userId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,

    CONSTRAINT "qc_user_roles_pkey" PRIMARY KEY ("userId","roleId")
);

-- CreateTable
CREATE TABLE "qc_role_permissions" (
    "roleId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,

    CONSTRAINT "qc_role_permissions_pkey" PRIMARY KEY ("roleId","permissionId")
);

-- CreateTable
CREATE TABLE "qc_otp_tokens" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "userId" TEXT,
    "code" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "qc_otp_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "qc_password_reset_tokens" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "qc_password_reset_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "qc_organizations" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "qc_organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "qc_processes" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "parentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "qc_processes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "qc_projects" (
    "id" TEXT NOT NULL,
    "processId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "qc_projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "qc_user_process_assignments" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "processId" TEXT NOT NULL,
    "subprocessId" TEXT,
    "projectId" TEXT,

    CONSTRAINT "qc_user_process_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "qc_indicators" (
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

    CONSTRAINT "qc_indicators_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "qc_indicator_versions" (
    "id" TEXT NOT NULL,
    "indicatorId" TEXT NOT NULL,
    "frequency" "QcFrequencyType" NOT NULL,
    "direction" "QcTargetDirection" NOT NULL,
    "formula" TEXT,
    "inputMode" "QcMeasurementInputMode" NOT NULL DEFAULT 'DIRECT_VALUE',
    "displayAsPercent" BOOLEAN NOT NULL DEFAULT false,
    "aggregation" "QcAggregationMethod" NOT NULL DEFAULT 'LAST_VALUE',
    "effectiveFrom" TIMESTAMP(3) NOT NULL,
    "effectiveTo" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "qc_indicator_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "qc_indicator_targets" (
    "id" TEXT NOT NULL,
    "versionId" TEXT NOT NULL,
    "targetValue" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "thresholds" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "qc_indicator_targets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "qc_reporting_periods" (
    "id" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "status" "QcPeriodStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "qc_reporting_periods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "qc_measurements" (
    "id" TEXT NOT NULL,
    "indicatorVersionId" TEXT NOT NULL,
    "periodId" TEXT NOT NULL,
    "value" DOUBLE PRECISION,
    "status" "QcMeasurementStatus" NOT NULL DEFAULT 'DRAFT',
    "trafficLight" "QcTrafficLight",
    "submittedById" TEXT NOT NULL,
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "observation" TEXT,
    "analysisInternal" TEXT,
    "analysisExternal" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "qc_measurements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "qc_measurement_inputs" (
    "id" TEXT NOT NULL,
    "measurementId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "qc_measurement_inputs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "qc_action_plans" (
    "id" TEXT NOT NULL,
    "measurementId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "dates" TEXT NOT NULL,
    "progress" DOUBLE PRECISION NOT NULL,
    "ownerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "qc_action_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "qc_audit_logs" (
    "id" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "before" JSONB,
    "after" JSONB,
    "ip" TEXT,
    "route" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "qc_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "qc_users_email_key" ON "qc_users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "qc_users_username_key" ON "qc_users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "qc_users_externalId_key" ON "qc_users"("externalId");

-- CreateIndex
CREATE UNIQUE INDEX "qc_roles_code_key" ON "qc_roles"("code");

-- CreateIndex
CREATE UNIQUE INDEX "qc_permissions_code_key" ON "qc_permissions"("code");

-- CreateIndex
CREATE UNIQUE INDEX "qc_password_reset_tokens_token_key" ON "qc_password_reset_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "qc_organizations_code_key" ON "qc_organizations"("code");

-- CreateIndex
CREATE INDEX "qc_processes_organizationId_parentId_idx" ON "qc_processes"("organizationId", "parentId");

-- CreateIndex
CREATE INDEX "qc_user_process_assignments_userId_processId_subprocessId_p_idx" ON "qc_user_process_assignments"("userId", "processId", "subprocessId", "projectId");

-- CreateIndex
CREATE INDEX "qc_indicators_organizationId_processId_subprocessId_project_idx" ON "qc_indicators"("organizationId", "processId", "subprocessId", "projectId");

-- CreateIndex
CREATE INDEX "qc_indicator_versions_indicatorId_idx" ON "qc_indicator_versions"("indicatorId");

-- CreateIndex
CREATE INDEX "qc_indicator_targets_versionId_idx" ON "qc_indicator_targets"("versionId");

-- CreateIndex
CREATE INDEX "qc_measurements_periodId_idx" ON "qc_measurements"("periodId");

-- CreateIndex
CREATE UNIQUE INDEX "qc_measurements_indicatorVersionId_periodId_key" ON "qc_measurements"("indicatorVersionId", "periodId");

-- CreateIndex
CREATE INDEX "qc_measurement_inputs_measurementId_idx" ON "qc_measurement_inputs"("measurementId");

-- CreateIndex
CREATE INDEX "qc_action_plans_measurementId_idx" ON "qc_action_plans"("measurementId");

-- CreateIndex
CREATE INDEX "qc_audit_logs_entityType_entityId_createdAt_idx" ON "qc_audit_logs"("entityType", "entityId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "qc_audit_logs_actorId_createdAt_idx" ON "qc_audit_logs"("actorId", "createdAt" DESC);

-- AddForeignKey
ALTER TABLE "qc_users" ADD CONSTRAINT "qc_users_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "qc_organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "qc_user_roles" ADD CONSTRAINT "qc_user_roles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "qc_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "qc_user_roles" ADD CONSTRAINT "qc_user_roles_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "qc_roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "qc_role_permissions" ADD CONSTRAINT "qc_role_permissions_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "qc_roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "qc_role_permissions" ADD CONSTRAINT "qc_role_permissions_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "qc_permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "qc_otp_tokens" ADD CONSTRAINT "qc_otp_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "qc_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "qc_password_reset_tokens" ADD CONSTRAINT "qc_password_reset_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "qc_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "qc_processes" ADD CONSTRAINT "qc_processes_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "qc_organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "qc_processes" ADD CONSTRAINT "qc_processes_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "qc_processes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "qc_projects" ADD CONSTRAINT "qc_projects_processId_fkey" FOREIGN KEY ("processId") REFERENCES "qc_processes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "qc_user_process_assignments" ADD CONSTRAINT "qc_user_process_assignments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "qc_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "qc_user_process_assignments" ADD CONSTRAINT "qc_user_process_assignments_processId_fkey" FOREIGN KEY ("processId") REFERENCES "qc_processes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "qc_user_process_assignments" ADD CONSTRAINT "qc_user_process_assignments_subprocessId_fkey" FOREIGN KEY ("subprocessId") REFERENCES "qc_processes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "qc_user_process_assignments" ADD CONSTRAINT "qc_user_process_assignments_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "qc_projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "qc_indicators" ADD CONSTRAINT "qc_indicators_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "qc_organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "qc_indicators" ADD CONSTRAINT "qc_indicators_processId_fkey" FOREIGN KEY ("processId") REFERENCES "qc_processes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "qc_indicators" ADD CONSTRAINT "qc_indicators_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "qc_projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "qc_indicator_versions" ADD CONSTRAINT "qc_indicator_versions_indicatorId_fkey" FOREIGN KEY ("indicatorId") REFERENCES "qc_indicators"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "qc_indicator_targets" ADD CONSTRAINT "qc_indicator_targets_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "qc_indicator_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "qc_measurements" ADD CONSTRAINT "qc_measurements_indicatorVersionId_fkey" FOREIGN KEY ("indicatorVersionId") REFERENCES "qc_indicator_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "qc_measurements" ADD CONSTRAINT "qc_measurements_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "qc_reporting_periods"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "qc_measurements" ADD CONSTRAINT "qc_measurements_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "qc_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "qc_measurements" ADD CONSTRAINT "qc_measurements_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "qc_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "qc_measurement_inputs" ADD CONSTRAINT "qc_measurement_inputs_measurementId_fkey" FOREIGN KEY ("measurementId") REFERENCES "qc_measurements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "qc_action_plans" ADD CONSTRAINT "qc_action_plans_measurementId_fkey" FOREIGN KEY ("measurementId") REFERENCES "qc_measurements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "qc_action_plans" ADD CONSTRAINT "qc_action_plans_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "qc_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "qc_audit_logs" ADD CONSTRAINT "qc_audit_logs_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "qc_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

