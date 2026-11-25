import { Router } from 'express';
import rateLimit from 'express-rate-limit';

import { AuthController } from '../controllers/auth.controller';
import { ProcessesController } from '../controllers/processes.controller';
import { IndicatorsController } from '../controllers/indicators.controller';
import { MeasurementsController } from '../controllers/measurements.controller';
import { DashboardController } from '../controllers/dashboard.controller';
import { ReportsController } from '../controllers/reports.controller';
import { ExportsController } from '../controllers/exports.controller';
import {
  AdminIndicatorsController,
  AdminProcessesController,
} from '../controllers/admin.controller';
import { UsersController } from '../controllers/users.controller';
import { AuditLogController } from '../controllers/audit-log.controller';

import { executiveAuthMiddleware } from '../middleware/auth.middleware';
import { checkExecutiveRoles } from '../middleware/roles.middleware';
import { indicatorScopeMiddleware } from '../middleware/scope.middleware';

/**
 * MÓDULO EJECUTIVO — Rutas (montado en /api/executive).
 * Todos los endpoints usan el auth JWT PROPIO del módulo.
 */

const loginLimiter = rateLimit({
  windowMs: 60_000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiados intentos. Intenta de nuevo en un minuto.', code: 'EXECUTIVE_RATE_LIMITED' },
});

const registerLimiter = rateLimit({
  windowMs: 60_000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiados intentos. Intenta de nuevo en un minuto.', code: 'EXECUTIVE_RATE_LIMITED' },
});

const auth = new AuthController();
const processes = new ProcessesController();
const indicators = new IndicatorsController();
const measurements = new MeasurementsController();
const dashboard = new DashboardController();
const reports = new ReportsController();
const exportsController = new ExportsController();
const adminIndicators = new AdminIndicatorsController();
const adminProcesses = new AdminProcessesController();
const users = new UsersController();
const auditLog = new AuditLogController();

const router = Router();

// ─── /auth ─────────────────────────────────────────────────────────────────
const authRouter = Router();
authRouter.post('/login', loginLimiter, auth.login);
authRouter.post('/register', registerLimiter, auth.register);
authRouter.get('/me', executiveAuthMiddleware, auth.me);
// @deprecated Duplicado de /me — se conserva por compatibilidad
authRouter.get('/me/context', executiveAuthMiddleware, auth.meContext);
authRouter.get('/me/redirect', executiveAuthMiddleware, auth.meRedirect);
router.use('/auth', authRouter);

// ─── /processes ────────────────────────────────────────────────────────────
const processesRouter = Router();
processesRouter.get('/', executiveAuthMiddleware, processes.getProcesses);
processesRouter.get('/mine', executiveAuthMiddleware, processes.getMyProcesses);
router.use('/processes', processesRouter);

// ─── /indicators ───────────────────────────────────────────────────────────
const indicatorsRouter = Router();
indicatorsRouter.get(
  '/:id/procurement-distribution',
  executiveAuthMiddleware,
  indicatorScopeMiddleware,
  indicators.getProcurementDistribution,
);
indicatorsRouter.get('/:id/chart', executiveAuthMiddleware, indicatorScopeMiddleware, indicators.getChart);
indicatorsRouter.get('/:id', executiveAuthMiddleware, indicatorScopeMiddleware, indicators.getIndicator);
router.use('/indicators', indicatorsRouter);

// ─── /measurements ─────────────────────────────────────────────────────────
const measurementsRouter = Router();
measurementsRouter.post(
  '/',
  executiveAuthMiddleware,
  indicatorScopeMiddleware,
  measurements.submitMeasurement,
);
measurementsRouter.get('/', executiveAuthMiddleware, measurements.findAll);
measurementsRouter.patch(
  '/:id/review',
  executiveAuthMiddleware,
  checkExecutiveRoles(['ADMIN', 'DIRECTOR']),
  measurements.reviewMeasurement,
);
router.use('/measurements', measurementsRouter);

// ─── /dashboard ────────────────────────────────────────────────────────────
const dashboardRouter = Router();
dashboardRouter.get(
  '/summary',
  executiveAuthMiddleware,
  checkExecutiveRoles(['ADMIN', 'DIRECTOR']),
  dashboard.getSummary,
);
dashboardRouter.get(
  '/admin/summary',
  executiveAuthMiddleware,
  checkExecutiveRoles(['ADMIN']),
  dashboard.getAdminSummary,
);
dashboardRouter.get(
  '/director/summary',
  executiveAuthMiddleware,
  checkExecutiveRoles(['DIRECTOR']),
  dashboard.getDirectorSummary,
);
dashboardRouter.get('/owner/summary', executiveAuthMiddleware, dashboard.getOwnerSummary);
dashboardRouter.get(
  '/matrix',
  executiveAuthMiddleware,
  checkExecutiveRoles(['ADMIN', 'DIRECTOR']),
  dashboard.getConsolidatedMatrix,
);
dashboardRouter.get('/active-period', executiveAuthMiddleware, dashboard.getActivePeriod);
dashboardRouter.get(
  '/director/trend',
  executiveAuthMiddleware,
  checkExecutiveRoles(['ADMIN', 'DIRECTOR']),
  dashboard.getComplianceTrend,
);
router.use('/dashboard', dashboardRouter);

// ─── /reports ──────────────────────────────────────────────────────────────
const reportsRouter = Router();
reportsRouter.get(
  '/performance',
  executiveAuthMiddleware,
  checkExecutiveRoles(['ADMIN', 'DIRECTOR']),
  reports.getPerformanceReport,
);
router.use('/reports', reportsRouter);

// ─── /exports ──────────────────────────────────────────────────────────────
const exportsRouter = Router();
exportsRouter.get(
  '/pdf',
  executiveAuthMiddleware,
  checkExecutiveRoles(['ADMIN', 'DIRECTOR']),
  exportsController.exportPdf,
);
exportsRouter.get(
  '/xlsx',
  executiveAuthMiddleware,
  checkExecutiveRoles(['ADMIN', 'DIRECTOR']),
  exportsController.exportXlsx,
);
router.use('/exports', exportsRouter);

// ─── /admin ────────────────────────────────────────────────────────────────
const adminRouter = Router();
adminRouter.get(
  '/indicators',
  executiveAuthMiddleware,
  checkExecutiveRoles(['ADMIN']),
  adminIndicators.findAll,
);
adminRouter.get(
  '/indicators/:id',
  executiveAuthMiddleware,
  checkExecutiveRoles(['ADMIN']),
  adminIndicators.findOne,
);
adminRouter.post(
  '/indicators',
  executiveAuthMiddleware,
  checkExecutiveRoles(['ADMIN']),
  adminIndicators.create,
);
adminRouter.patch(
  '/indicators/:id',
  executiveAuthMiddleware,
  checkExecutiveRoles(['ADMIN']),
  adminIndicators.update,
);
adminRouter.get(
  '/processes',
  executiveAuthMiddleware,
  checkExecutiveRoles(['ADMIN']),
  adminProcesses.findAll,
);
adminRouter.get(
  '/processes/:id',
  executiveAuthMiddleware,
  checkExecutiveRoles(['ADMIN']),
  adminProcesses.findOne,
);
adminRouter.post(
  '/processes',
  executiveAuthMiddleware,
  checkExecutiveRoles(['ADMIN']),
  adminProcesses.create,
);
adminRouter.patch(
  '/processes/:id',
  executiveAuthMiddleware,
  checkExecutiveRoles(['ADMIN']),
  adminProcesses.update,
);
router.use('/admin', adminRouter);

// ─── /users (RBAC del módulo) ──────────────────────────────────────────────
const usersRouter = Router();
usersRouter.get('/', executiveAuthMiddleware, checkExecutiveRoles(['ADMIN']), users.findAll);
usersRouter.get('/roles', executiveAuthMiddleware, checkExecutiveRoles(['ADMIN']), users.getRoles);
usersRouter.get(
  '/permissions',
  executiveAuthMiddleware,
  checkExecutiveRoles(['ADMIN']),
  users.getPermissions,
);
usersRouter.patch(
  '/:id/roles',
  executiveAuthMiddleware,
  checkExecutiveRoles(['ADMIN']),
  users.updateUserRoles,
);
usersRouter.patch(
  '/:id/scopes',
  executiveAuthMiddleware,
  checkExecutiveRoles(['ADMIN']),
  users.updateUserScopes,
);
usersRouter.patch(
  '/roles/:id/permissions',
  executiveAuthMiddleware,
  checkExecutiveRoles(['ADMIN']),
  users.updateRolePermissions,
);
router.use('/users', usersRouter);

// ─── /audit-logs ───────────────────────────────────────────────────────────
const auditRouter = Router();
auditRouter.get(
  '/',
  executiveAuthMiddleware,
  checkExecutiveRoles(['ADMIN', 'DIRECTOR']),
  auditLog.findAll,
);
router.use('/audit-logs', auditRouter);

export default router;
