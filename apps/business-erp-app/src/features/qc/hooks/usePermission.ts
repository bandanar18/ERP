import { useQcAuth } from './useQcAuth';
import { QC_ROLES } from '../types';

export const useQcPermission = () => {
  const { user } = useQcAuth();
  const roles = user?.roles ?? [];

  const isAdmin = roles.includes(QC_ROLES.ADMIN);
  const isDirector = roles.includes(QC_ROLES.DIRECTOR);
  const isOwner = roles.includes(QC_ROLES.OWNER);

  return {
    isAdmin,
    isDirector,
    isOwner,
    canSubmitMeasurement: isOwner,
    canReviewMeasurements: isAdmin,
    canManageStructure: isAdmin,
    canManageUsers: isAdmin,
    canManageIndicators: isAdmin,
    canManagePeriods: isAdmin,
  };
};
