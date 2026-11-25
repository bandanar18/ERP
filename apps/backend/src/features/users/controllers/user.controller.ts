import { Request, Response } from 'express';
import { UserService } from '../services/user.service';

export class UserController {
  private readonly service: UserService;

  constructor() {
    this.service = new UserService();
  }

  getAll = async (req: Request, res: Response): Promise<void> => {
    try {
      const { role, companyId, isActive } = req.query;

      const users = await this.service.getAll({
        role: role as string,
        companyId: companyId as string,
        isActive: isActive ? isActive === 'true' : undefined,
      });

      res.status(200).json(users);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Error al obtener usuarios' });
    }
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const user = await this.service.getById(String(id));
      res.status(200).json(user);
    } catch (error: any) {
      if (error.message === 'Usuario no encontrado') {
        res.status(404).json({ error: error.message });
      } else {
        res.status(500).json({ error: error.message || 'Error al obtener usuario' });
      }
    }
  };

  getByRole = async (req: Request, res: Response): Promise<void> => {
    try {
      const { role } = req.params;
      const users = await this.service.getByRole(String(role));
      res.status(200).json(users);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Error al obtener usuarios por rol' });
    }
  };

  update = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const data = req.body;

      if (!data || Object.keys(data).length === 0) {
        res.status(400).json({ error: 'Debe enviar al menos un campo para actualizar' });
        return;
      }

      const user = await this.service.update(String(id), data);
      res.status(200).json(user);
    } catch (error: any) {
      if (error.message === 'Usuario no encontrado') {
        res.status(404).json({ error: error.message });
      } else {
        res.status(500).json({ error: error.message || 'Error al actualizar usuario' });
      }
    }
  };

  delete = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      await this.service.delete(String(id));
      res.status(200).json({ message: 'Usuario eliminado correctamente' });
    } catch (error: any) {
      if (error.message === 'Usuario no encontrado') {
        res.status(404).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Error al eliminar usuario' });
      }
    }
  };
}
