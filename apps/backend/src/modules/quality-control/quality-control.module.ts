import { PrismaClient } from '@prisma/client';
import { Router } from 'express';

// Health
import { HealthController } from './interface/controllers/health.controller.js';
import { createHealthRouter } from './interface/routes/health.routes.js';

// Auth core (infrastructure)
import { QcJwtService } from './infrastructure/auth/qc-jwt.service.js';
import { QcBcryptService } from './infrastructure/auth/qc-bcrypt.service.js';
import { PrismaQcAuthRepository } from './infrastructure/persistence/prisma-qc-auth.repository.js';
import { QcAuthService } from './application/services/qc-auth.service.js';
import { QcAuthController } from './interface/controllers/qc-auth.controller.js';
import { createQcAuthRouter } from './interface/routes/qc-auth.routes.js';
import { createQcAuthMiddleware } from './interface/middleware/qc-auth.middleware.js';
import { createQcScopeMiddleware } from './interface/middleware/qc-scope.middleware.js';

// Procesos
import { PrismaQcProcessRepository } from './infrastructure/persistence/prisma-qc-process.repository.js';
import { QcProcessService } from './application/services/qc-process.service.js';
import { QcProcessController } from './interface/controllers/qc-process.controller.js';
import { createQcProcessRouter } from './interface/routes/qc-process.routes.js';

// Indicadores
import { PrismaQcIndicatorRepository } from './infrastructure/persistence/prisma-qc-indicator.repository.js';
import { QcIndicatorService } from './application/services/qc-indicator.service.js';
import { QcIndicatorController } from './interface/controllers/qc-indicator.controller.js';
import { createQcIndicatorRouter } from './interface/routes/qc-indicator.routes.js';

// Mediciones
import { SemaforoService } from './application/services/semaforo.service.js';
import { PrismaQcMeasurementRepository } from './infrastructure/persistence/prisma-qc-measurement.repository.js';
import { QcMeasurementService } from './application/services/qc-measurement.service.js';
import { QcMeasurementController } from './interface/controllers/qc-measurement.controller.js';
import { createQcMeasurementRouter } from './interface/routes/qc-measurement.routes.js';

// Dashboard
import { PrismaQcDashboardRepository } from './infrastructure/persistence/prisma-qc-dashboard.repository.js';
import { QcDashboardService } from './application/services/qc-dashboard.service.js';
import { QcDashboardController } from './interface/controllers/qc-dashboard.controller.js';
import { createQcDashboardRouter } from './interface/routes/qc-dashboard.routes.js';

// Reports
import { PrismaQcReportRepository } from './infrastructure/persistence/prisma-qc-report.repository.js';
import { QcReportService } from './application/services/qc-report.service.js';
import { QcReportController } from './interface/controllers/qc-report.controller.js';
import { createQcReportRouter } from './interface/routes/qc-report.routes.js';

// Audit-logs
import { PrismaQcAuditRepository } from './infrastructure/persistence/prisma-qc-audit.repository.js';
import { QcAuditLogService } from './application/services/qc-audit.service.js';
import { QcAuditLogController } from './interface/controllers/qc-audit.controller.js';
import { createQcAuditRouter } from './interface/routes/qc-audit.routes.js';

// Admin: indicadores
import { PrismaQcAdminIndicatorRepository } from './infrastructure/persistence/prisma-qc-admin-indicator.repository.js';
import { QcAdminIndicatorService } from './application/services/qc-admin-indicator.service.js';
import { QcAdminIndicatorController } from './interface/controllers/qc-admin-indicator.controller.js';
import { createQcAdminIndicatorRouter } from './interface/routes/qc-admin-indicator.routes.js';

// Admin: procesos
import { PrismaQcAdminProcessRepository } from './infrastructure/persistence/prisma-qc-admin-process.repository.js';
import { QcAdminProcessService } from './application/services/qc-admin-process.service.js';
import { QcAdminProcessController } from './interface/controllers/qc-admin-process.controller.js';
import { createQcAdminProcessRouter } from './interface/routes/qc-admin-process.routes.js';

// Users (RBAC)
import { PrismaQcUserRepository } from './infrastructure/persistence/prisma-qc-user.repository.js';
import { QcUserService } from './application/services/qc-user.service.js';
import { QcUserController } from './interface/controllers/qc-user.controller.js';
import { createQcUserRouter } from './interface/routes/qc-user.routes.js';

// Exports (PDF/XLSX)
import { PrismaQcExportRepository } from './infrastructure/persistence/prisma-qc-export.repository.js';
import { QcExportService } from './application/services/qc-export.service.js';
import { QcExportController } from './interface/controllers/qc-export.controller.js';
import { createQcExportRouter } from './interface/routes/qc-export.routes.js';

// Router compuesto
import { createQcRouter } from './interface/routes/index.js';

export interface QualityControlDeps {
  prisma: PrismaClient;
}

export function createQualityControlRouter(deps: QualityControlDeps): Router {
  // ---- Health ----
  const healthController = new HealthController(deps.prisma);
  const healthRouter = createHealthRouter(healthController);

  // ---- Auth core ----
  const jwtService = new QcJwtService();
  const hasher = new QcBcryptService();
  const qcAuthRepo = new PrismaQcAuthRepository(deps.prisma);

  const authService = new QcAuthService(qcAuthRepo, jwtService, hasher);
  const qcAuthMiddleware = createQcAuthMiddleware(jwtService, authService);
  const qcScopeMiddleware = createQcScopeMiddleware(deps.prisma);

  const authController = new QcAuthController(authService);
  const authRouter = createQcAuthRouter(authController, qcAuthMiddleware);

  // ---- Procesos ----
  const processRepo = new PrismaQcProcessRepository(deps.prisma);
  const processService = new QcProcessService(processRepo);
  const processController = new QcProcessController(processService);
  const processesRouter = createQcProcessRouter(processController, qcAuthMiddleware);

  // ---- Indicadores ----
  const indicatorRepo = new PrismaQcIndicatorRepository(deps.prisma);
  const indicatorService = new QcIndicatorService(indicatorRepo);
  const indicatorController = new QcIndicatorController(indicatorService);
  const indicatorsRouter = createQcIndicatorRouter(indicatorController, qcAuthMiddleware);

  // ---- Mediciones ----
  const semaforoService = new SemaforoService();
  const measurementRepo = new PrismaQcMeasurementRepository(deps.prisma);
  const measurementService = new QcMeasurementService(measurementRepo, semaforoService);
  const measurementController = new QcMeasurementController(measurementService);
  const measurementsRouter = createQcMeasurementRouter(
    measurementController,
    qcAuthMiddleware,
    qcScopeMiddleware,
  );

  // ---- Dashboard ----
  const dashboardRepo = new PrismaQcDashboardRepository(deps.prisma);
  const dashboardService = new QcDashboardService(dashboardRepo);
  const dashboardController = new QcDashboardController(dashboardService);
  const dashboardsRouter = createQcDashboardRouter(dashboardController, qcAuthMiddleware);

  // ---- Reports ----
  const reportRepo = new PrismaQcReportRepository(deps.prisma);
  const reportService = new QcReportService(reportRepo);
  const reportController = new QcReportController(reportService);
  const reportsRouter = createQcReportRouter(reportController, qcAuthMiddleware);

  // ---- Audit-logs ----
  const auditRepo = new PrismaQcAuditRepository(deps.prisma);
  const auditService = new QcAuditLogService(auditRepo);
  const auditController = new QcAuditLogController(auditService);
  const auditLogsRouter = createQcAuditRouter(auditController, qcAuthMiddleware);

  // ---- Admin: indicadores ----
  const adminIndicatorRepo = new PrismaQcAdminIndicatorRepository(deps.prisma);
  const adminIndicatorService = new QcAdminIndicatorService(adminIndicatorRepo);
  const adminIndicatorController = new QcAdminIndicatorController(adminIndicatorService);
  const adminIndicatorsRouter = createQcAdminIndicatorRouter(
    adminIndicatorController,
    qcAuthMiddleware,
  );

  // ---- Admin: procesos ----
  const adminProcessRepo = new PrismaQcAdminProcessRepository(deps.prisma);
  const adminProcessService = new QcAdminProcessService(adminProcessRepo);
  const adminProcessController = new QcAdminProcessController(adminProcessService);
  const adminProcessesRouter = createQcAdminProcessRouter(adminProcessController, qcAuthMiddleware);

  // ---- Users (RBAC) ----
  const userRepo = new PrismaQcUserRepository(deps.prisma);
  const userService = new QcUserService(userRepo, hasher);
  const userController = new QcUserController(userService);
  const usersRouter = createQcUserRouter(userController, qcAuthMiddleware);

  // ---- Exports (PDF/XLSX) ----
  const exportRepo = new PrismaQcExportRepository(deps.prisma);
  const exportService = new QcExportService(exportRepo, indicatorService);
  const exportController = new QcExportController(exportService);
  const exportsRouter = createQcExportRouter(exportController, qcAuthMiddleware);

  return createQcRouter({
    healthRouter,
    authRouter,
    processesRouter,
    indicatorsRouter,
    measurementsRouter,
    dashboardsRouter,
    reportsRouter,
    auditLogsRouter,
    adminIndicatorsRouter,
    adminProcessesRouter,
    usersRouter,
    exportsRouter,
  });
}
