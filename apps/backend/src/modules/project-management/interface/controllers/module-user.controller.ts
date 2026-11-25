import { Request, Response } from 'express';
import { ModuleUserService } from '../../application/services/module-user.service.js';
import { ListModuleUsersDto, UpdateModuleUserRoleDto, UpdateModuleUserScopesDto, CreateModuleUserDto } from '../../application/dto/module-user.dto.js';
import { PmError } from '../../errors.js';

export class ModuleUserController {
  constructor(private readonly moduleUserService: ModuleUserService) {}

  async list(req: Request, res: Response) {
    try {
      const filters = ListModuleUsersDto.parse(req.query);
      const users = await this.moduleUserService.listUsers(filters);
      res.json(users);
    } catch (error: any) {
      if (error instanceof PmError) {
        res.status(error.statusCode).json({ message: error.message });
      } else {
        res.status(400).json({ message: error.message });
      }
    }
  }

  async listRoles(_req: Request, res: Response) {
    try {
      const roles = await this.moduleUserService.listRoles();
      res.json(roles);
    } catch (error: any) {
      if (error instanceof PmError) {
        res.status(error.statusCode).json({ message: error.message });
      } else {
        res.status(400).json({ message: error.message });
      }
    }
  }

  async create(req: Request, res: Response) {
    try {
      const dto = CreateModuleUserDto.parse(req.body);
      const user = await this.moduleUserService.createUser({
        email: dto.email,
        firstName: dto.firstName,
        lastName: dto.lastName,
        roleCode: dto.roleCode,
        scopes: dto.scopes,
      });
      res.status(201).json(user);
    } catch (error: any) {
      if (error instanceof PmError) {
        res.status(error.statusCode).json({ message: error.message });
      } else {
        res.status(400).json({ message: error.message });
      }
    }
  }

  async updateRole(req: Request, res: Response) {
    try {
      const { roleCode } = UpdateModuleUserRoleDto.parse(req.body);
      const user = await this.moduleUserService.updateRole(req.params.id as string, roleCode);
      res.json(user);
    } catch (error: any) {
      if (error instanceof PmError) {
        res.status(error.statusCode).json({ message: error.message });
      } else {
        res.status(400).json({ message: error.message });
      }
    }
  }

  async updateScopes(req: Request, res: Response) {
    try {
      const { scopes } = UpdateModuleUserScopesDto.parse(req.body);
      const user = await this.moduleUserService.updateScopes(req.params.id as string, scopes);
      res.json(user);
    } catch (error: any) {
      if (error instanceof PmError) {
        res.status(error.statusCode).json({ message: error.message });
      } else {
        res.status(400).json({ message: error.message });
      }
    }
  }

  async toggleActive(req: Request, res: Response) {
    try {
      const user = await this.moduleUserService.toggleActive(req.params.id as string);
      res.json(user);
    } catch (error: any) {
      if (error instanceof PmError) {
        res.status(error.statusCode).json({ message: error.message });
      } else {
        res.status(400).json({ message: error.message });
      }
    }
  }
}
