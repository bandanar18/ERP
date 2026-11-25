import { erpFetch } from './http';
import type { Company, CreateCompanyDto } from '../types';

/**
 * Servicio de empresas del módulo PM.
 * Espeja `companyService` del frontend web (`/api/companies`).
 */
const BASE = '/api/companies';

export const companyService = {
  /** GET /api/companies */
  getAll: () => erpFetch<Company[]>(BASE, ''),

  /** GET /api/companies/:id */
  getById: (id: string) => erpFetch<Company>(BASE, `/${id}`),

  /** POST /api/companies */
  create: (payload: CreateCompanyDto) => erpFetch<Company>(BASE, '', 'POST', payload),

  /** PUT /api/companies/:id */
  update: (id: string, payload: Partial<CreateCompanyDto>) =>
    erpFetch<Company>(BASE, `/${id}`, 'PUT', payload),
};