import { usePmAuth } from './usePmAuth';

/** Alcance (scopes) del usuario: qué empresas y proyectos puede ver. */
export const useScope = () => {
  const { user } = usePmAuth();

  const canAccessCompany = (companyId: string) =>
    user?.scopes?.companyIds?.includes(companyId) ?? false;

  const canAccessProject = (projectId: string) =>
    user?.scopes?.projectIds?.includes(projectId) ?? false;

  return { canAccessCompany, canAccessProject };
};
