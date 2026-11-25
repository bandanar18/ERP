import { ErpUser, ErpRole, PmCompany } from '@prisma/client';

export type UserWithRelations = ErpUser & {
  role?: ErpRole | null;
  company?: PmCompany | null;
};

export interface UserResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  role?: {
    id: string;
    name: string;
  } | null;
  company?: {
    id: string;
    name: string;
  } | null;
}

export interface UserListResponse extends UserResponse {}

export interface GetUsersQuery {
  role?: string;
  companyId?: string;
  isActive?: boolean;
}

export interface UpdateUserRequest {
  firstName?: string;
  lastName?: string;
  roleId?: string;
  companyId?: string | null;
  isActive?: boolean;
}
