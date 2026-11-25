import { Request, Response, NextFunction } from 'express';
import { QcUserService } from '../../application/services/qc-user.service.js';
import {
  rolesUpdateSchema,
  scopesUpdateSchema,
  rolePermissionsUpdateSchema,
  createUserSchema,
  updateUserProfileSchema,
  resetUserPasswordSchema,
} from '../../application/dto/qc-admin.dto.js';
import { QcAuthRequest } from '../middleware/qc-auth.middleware.js';

export class QcUserController {
  constructor(private readonly userService: QcUserService) {}

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = createUserSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: 'Datos de creación inválidos.' });
        return;
      }
      res.status(201).json(await this.userService.createUser(parsed.data));
    } catch (error) {
      next(error);
    }
  };

  updateProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = updateUserProfileSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: 'Datos de perfil inválidos.' });
        return;
      }
      res.json(await this.userService.updateProfile(req.params.id as string, parsed.data));
    } catch (error) {
      next(error);
    }
  };

  toggleActive = async (req: QcAuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      res.json(await this.userService.toggleActive(req.params.id as string, req.qcUser?.id));
    } catch (error) {
      next(error);
    }
  };

  resetPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = resetUserPasswordSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: 'La nueva contraseña debe tener al menos 8 caracteres.' });
        return;
      }
      res.json(await this.userService.resetPassword(req.params.id as string, parsed.data.newPassword));
    } catch (error) {
      next(error);
    }
  };

  remove = async (req: QcAuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      res.json(await this.userService.remove(req.params.id as string, req.qcUser?.id));
    } catch (error) {
      next(error);
    }
  };

  findAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      res.json(await this.userService.findAll());
    } catch (error) {
      next(error);
    }
  };

  getRoles = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      res.json(await this.userService.getRoles());
    } catch (error) {
      next(error);
    }
  };

  getPermissions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      res.json(await this.userService.getPermissions());
    } catch (error) {
      next(error);
    }
  };

  updateUserRoles = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = rolesUpdateSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: 'Debe proporcionar al menos un rol.' });
        return;
      }
      res.json(await this.userService.updateUserRoles(req.params.id as string, parsed.data.roles));
    } catch (error) {
      next(error);
    }
  };

  updateUserScopes = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = scopesUpdateSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: 'processIds debe ser un arreglo.' });
        return;
      }
      res.json(
        await this.userService.updateUserScopes(req.params.id as string, parsed.data.processIds),
      );
    } catch (error) {
      next(error);
    }
  };

  updateRolePermissions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = rolePermissionsUpdateSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: 'permissionIds debe ser un arreglo.' });
        return;
      }
      res.json(
        await this.userService.updateRolePermissions(
          req.params.id as string,
          parsed.data.permissionIds,
        ),
      );
    } catch (error) {
      next(error);
    }
  };
}
