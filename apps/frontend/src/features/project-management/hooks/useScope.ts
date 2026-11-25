import { usePmAuthStore } from '../store/auth.store';

export const useScope = () => {
  const { user } = usePmAuthStore();
  
  const canAccessCompany = (companyId: string) => {
    return user?.scopes?.companyIds?.includes(companyId) ?? false;
  };
  
  const canAccessProject = (projectId: string) => {
    return user?.scopes?.projectIds?.includes(projectId) ?? false;
  };

  return { canAccessCompany, canAccessProject };
};
