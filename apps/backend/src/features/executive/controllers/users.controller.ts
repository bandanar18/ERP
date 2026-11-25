import { Request, Response } from 'express';
import { UsersService } from '../services/admin.service';
import {
  updateUserRolesSchema,
  updateUserScopesSchema,
  updateRolePermissionsSchema,
} from '../interfaces/executive.schemas';
import { validate, sendError } from '../interfaces/executive.errors';

export class UsersController {
  private readonly service = new UsersService();

  findAll = async (_req: Request, res: Response): Promise<void> => {
    try {
      res.status(200).json(await this.service.findAll());
    } catch (error) {
      sendError(res, error, 'Error al obtener usuarios');
    }
  };

  getRoles = async (_req: Request, res: Response): Promise<void> => {
    try {
      res.status(200).json(await this.service.getRoles());
    } catch (error) {
      sendError(res, error, 'Error al obtener roles');
    }
  };

  getPermissions = async (_req: Request, res: Response): Promise<void> => {
    try {
      res.status(200).json(await this.service.getPermissions());
    } catch (error) {
      sendError(res, error, 'Error al obtener permisos');
    }
  };

  updateUserRoles = async (req: Request, res: Response): Promise<void> => {
    try {
      const body = validate(updateUserRolesSchema, req.body);
      const result = await this.service.updateUserRoles(req.params.id as string, body.roles);
      res.status(200).json(result);
    } catch (error) {
      sendError(res, error, 'Error al actualizar roles');
    }
  };

  updateUserScopes = async (req: Request, res: Response): Promise<void> => {
    try {
      const body = validate(updateUserScopesSchema, req.body);
      const result = await this.service.updateUserScopes(req.params.id as string, body.processIds);
      res.status(200).json(result);
    } catch (error) {
      sendError(res, error, 'Error al actualizar scopes');
    }
  };

  updateRolePermissions = async (req: Request, res: Response): Promise<void> => {
    try {
      const body = validate(updateRolePermissionsSchema, req.body);
      const result = await this.service.updateRolePermissions(req.params.id as string, body.permissionIds);
      res.status(200).json(result);
    } catch (error) {
      sendError(res, error, 'Error al actualizar permisos del rol');
    }
  };
}
