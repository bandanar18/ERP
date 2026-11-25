import { z } from 'zod';

export const ListModuleUsersDto = z.object({
  role: z.string().optional()
});

export const UpdateModuleUserRoleDto = z.object({
  roleCode: z.string()
});

export const UpdateModuleUserScopesDto = z.object({
  scopes: z.array(z.object({
    companyId: z.string().nullable().optional(),
    projectId: z.string().nullable().optional()
  }))
});

export const CreateModuleUserDto = z.object({
  email: z.string().email('Email inválido'),
  firstName: z.string().min(1, 'Nombre requerido').optional(),
  lastName: z.string().min(1, 'Apellido requerido').optional(),
  roleCode: z.string().min(1, 'Rol requerido'),
  scopes: z.array(z.object({
    companyId: z.string().nullable().optional(),
    projectId: z.string().nullable().optional()
  })).optional(),
});

export type ListModuleUsersType = z.infer<typeof ListModuleUsersDto>;
export type UpdateModuleUserRoleType = z.infer<typeof UpdateModuleUserRoleDto>;
export type UpdateModuleUserScopesType = z.infer<typeof UpdateModuleUserScopesDto>;
export type CreateModuleUserType = z.infer<typeof CreateModuleUserDto>;
