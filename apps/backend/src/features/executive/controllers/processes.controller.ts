import { Response } from 'express';
import { ProcessesService } from '../services/processes.service';
import { ExecutiveAuthRequest } from '../middleware/auth.middleware';
import { sendError } from '../interfaces/executive.errors';

export class ProcessesController {
  private readonly service = new ProcessesService();

  getProcesses = async (_req: ExecutiveAuthRequest, res: Response): Promise<void> => {
    try {
      const processes = await this.service.getProcesses();
      res.status(200).json(processes);
    } catch (error) {
      sendError(res, error, 'Error al obtener procesos');
    }
  };

  getMyProcesses = async (req: ExecutiveAuthRequest, res: Response): Promise<void> => {
    try {
      const processes = await this.service.getMyProcesses(req.executiveUser!.id);
      res.status(200).json(processes);
    } catch (error) {
      sendError(res, error, 'Error al obtener mis procesos');
    }
  };
}
