export interface TokenPayload {
  userId: string;
  email: string;
  roleName: string;
  isClient: boolean;
  companyId?: string;
  /**
   * Id del usuario del módulo Project Management (pm_users), cuando el token
   * proviene del módulo (PM_JWT_SECRET). Los datos pm_* (p.ej. la FK
   * pm_projects.managerId) referencian pm_users.id, no users.id, por lo que
   * los filtros por planificador deben usar este id cuando exista.
   */
  pmUserId?: string;
  projectIds?: string[];
  /** Código de rol del módulo (PM_ADMIN, PM_GESTION, …) cuando el token es del módulo. */
  pmRoleCode?: string;
}

export type AuthResponse = {
  user: UserResponse;
  accessToken: string;
  refreshToken: string;
};

export type LoginResponse = AuthResponse | PendingRoleResponse | PendingCompanyResponse;

export type PendingRoleResponse = {
  requiresOtp: true;
  message: string;
  email: string;
};

export type PendingCompanyResponse = AuthResponse & {
  pendingCompany: true;
  message: string;
};

export type RoleResponse = {
  id: string;
  name: string;
};

export type CompanyResponse = {
  id: string;
  name: string;
  taxId?: string;
  legalName?: string;
  address?: string;
  phone?: string;
  email?: string;
};

export type UserResponse = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role?: RoleResponse | null;
  isClient: boolean;
  company?: CompanyResponse;
  isActive: boolean;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type RegisterRequest = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  roleName?: string;
  companyId?: string;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type RefreshTokenRequest = {
  refreshToken: string;
};

export type TokenPair = {
  accessToken: string;
  refreshToken: string;
};

export type AssignRequest = {
  roleName?: string;
  companyId?: string | null;
};
