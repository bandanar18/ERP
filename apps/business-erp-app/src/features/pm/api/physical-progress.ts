import { erpFetch } from './http';
import type { CreatePhysicalProgressDto, PhysicalProgress } from '../types';

const BASE = '/api/physical-progress';

export const physicalProgressService = {
  getByProject: (projectId: string) =>
    erpFetch<{ progress: PhysicalProgress[] }>(BASE, `/project/${projectId}`),

  create: (data: CreatePhysicalProgressDto) =>
    erpFetch<PhysicalProgress>(BASE, '', 'POST', data),
};
