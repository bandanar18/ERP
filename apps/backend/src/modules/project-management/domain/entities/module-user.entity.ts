export interface PmUser {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  externalId: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  roles?: {
    roleId: string;
    role?: {
      id: string;
      code: string;
      description?: string | null;
    }
  }[];
  scopes?: {
    id: string;
    companyId: string | null;
    projectId: string | null;
  }[];
}
