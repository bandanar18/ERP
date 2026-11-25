import { Request, Response } from 'express';
import { UserManagementService } from '../services';

export class UserManagementController {
  private readonly service: UserManagementService;

  constructor() {
    this.service = new UserManagementService();
  }

  getAllUsers = async (req: Request, res: Response): Promise<void> => {
    try {
      const { search, page, limit } = req.query;
      const pageNumber = page ? parseInt(page as string, 10) : 1;
      const limitNumber = limit ? parseInt(limit as string, 10) : 12;
      const searchQuery = search ? String(search) : undefined;

      const result = await this.service.getAllUsers(searchQuery, pageNumber, limitNumber);
      res.json(result);
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ error: 'Error al obtener usuarios' });
    }
  };

  updateRole = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { roleId } = req.body;
      const updatedUser = await this.service.updateUserRole(String(id), roleId);
      res.json(updatedUser);
    } catch (error) {
      console.error('Error updating user role:', error);
      res.status(500).json({ error: 'Error al actualizar el rol del usuario' });
    }
  };

  updateCompany = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { companyId } = req.body;
      const updatedUser = await this.service.updateUserCompany(String(id), companyId);
      res.json(updatedUser);
    } catch (error) {
      console.error('Error updating user company:', error);
      res.status(500).json({ error: 'Error al actualizar la empresa del usuario' });
    }
  };

  getRoles = async (_req: Request, res: Response): Promise<void> => {
    try {
      const roles = await this.service.getAllRoles();
      res.json(roles);
    } catch (error) {
      console.error('Error fetching roles:', error);
      res.status(500).json({ error: 'Error al obtener roles' });
    }
  };

  toggleActive = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const updatedUser = await this.service.toggleUserActive(String(id));
      res.json(updatedUser);
    } catch (error) {
      console.error('Error toggling user active status:', error);
      res.status(500).json({ error: 'Error al cambiar estado del usuario' });
    }
  };
}
