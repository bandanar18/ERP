import { Router } from 'express';
import { ReportsController } from '../controllers/reports.controller.js';
import { authMiddleware } from '../../auth/middleware/auth.middleware.js';

const router = Router();
const controller = new ReportsController();

/**
 * Rutas de reportes e impresión oficial del ERP
 * Autenticación mediante token de sesión (ERP o módulo)
 */
router.post('/project-progress/pdf', authMiddleware, controller.downloadProjectProgressPdf);
router.get('/project-progress/:projectId/pdf', authMiddleware, controller.downloadProjectProgressPdf);
router.post('/financial/pdf', authMiddleware, controller.downloadFinancialReportPdf);

export default router;
