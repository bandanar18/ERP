import { Request, Response } from 'express';
import { ReportsService } from '../services/reports.service.js';
import { prisma } from '../../../prisma/prisma.js';

export class ReportsController {
  private readonly service = new ReportsService();

  /**
   * Genera el PDF del Reporte Oficial de Avance Físico del Proyecto
   * POST /api/reports/project-progress/pdf  (con payload en body)
   * GET  /api/reports/project-progress/:projectId/pdf  (carga directa de BD)
   */
  downloadProjectProgressPdf = async (req: Request, res: Response) => {
    try {
      let payload = req.body;
      const projectId = req.params.projectId || req.query.projectId || payload?.project?.id;

      // Si no hay payload o viene incompleto pero hay projectId, cargar de la base de datos
      if ((!payload || !payload.project) && projectId) {
        const pmProject = await prisma.pmProject.findUnique({
          where: { id: String(projectId) },
          include: {
            pm_companies: true,
            pm_users: true,
            pm_physical_progress: {
              orderBy: { date: 'asc' },
            },
          },
        });

        if (!pmProject) {
          return res.status(404).json({ error: 'Proyecto no encontrado' });
        }

        payload = {
          project: {
            id: pmProject.id,
            projectCode: pmProject.code,
            projectName: pmProject.fullName,
            fullName: pmProject.fullName,
            startDate: pmProject.startDate,
            endDate: pmProject.endDate,
            status: pmProject.status,
            actualPhysicalProgress: pmProject.actualPhysicalProgress,
            plannedPhysicalProgress: pmProject.plannedPhysicalProgress,
            company: {
              name: pmProject.pm_companies?.name,
              legalName: pmProject.pm_companies?.name,
            },
            manager: {
              managerName: [pmProject.pm_users?.firstName, pmProject.pm_users?.lastName].filter(Boolean).join(' ') || pmProject.pm_users?.email || 'No asignado',
              name: [pmProject.pm_users?.firstName, pmProject.pm_users?.lastName].filter(Boolean).join(' ') || pmProject.pm_users?.email || 'No asignado',
            },
          },
          progressList: pmProject.pm_physical_progress.map((p) => ({
            id: p.id,
            date: p.date,
            startDate: p.startDate,
            endDate: p.endDate,
            actualProgress: p.actualProgress,
            plannedProgress: p.plannedProgress,
            attentionPoints: p.attentionPoints,
          })),
        };
      }

      if (!payload || !payload.project) {
        return res.status(400).json({ error: 'Faltan datos del proyecto para generar el reporte' });
      }

      const pdfBuffer = await this.service.generateProjectProgressPdf(payload);
      const code = payload.project.projectCode || payload.project.code || 'PROYECTO';
      const filename = `Reporte_Avance_${code}_${new Date().toISOString().split('T')[0]}.pdf`;

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', pdfBuffer.length);
      return res.end(pdfBuffer);
    } catch (error) {
      console.error('[ReportsController] Error generando PDF de avance físico:', error);
      return res.status(500).json({ error: 'Error al generar el reporte PDF de avance físico' });
    }
  };

  /**
   * Genera el PDF del Reporte Financiero de Pagos y Cuentas por Pagar
   * POST /api/reports/financial/pdf
   */
  downloadFinancialReportPdf = async (req: Request, res: Response) => {
    try {
      const payload = req.body;
      if (!payload) {
        return res.status(400).json({ error: 'Faltan datos financieros para generar el reporte' });
      }

      const pdfBuffer = await this.service.generateFinancialReportPdf(payload);
      const code = payload.isProjectMode
        ? (payload.project?.projectCode || payload.project?.code || 'PROYECTO')
        : 'CONSOLIDADO';
      const filename = `Reporte_Financiero_Pagos_${code}_${new Date().toISOString().split('T')[0]}.pdf`;

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', pdfBuffer.length);
      return res.end(pdfBuffer);
    } catch (error) {
      console.error('[ReportsController] Error generando PDF financiero:', error);
      return res.status(500).json({ error: 'Error al generar el reporte PDF financiero' });
    }
  };
}
