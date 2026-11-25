export interface PmErpUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roleId: string | null;
  companyId: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type CreatePmErpUser = Omit<PmErpUser, 'id' | 'createdAt' | 'updatedAt'> & { password?: string };
export type UpdatePmErpUser = Partial<CreatePmErpUser>;
