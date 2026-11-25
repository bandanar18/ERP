import { PmFinancialValuation } from '../entities/financial-valuation.entity.js';

export interface IFinancialValuationRepository {
  create(data: Omit<PmFinancialValuation, 'id' | 'createdAt' | 'updatedAt'>): Promise<PmFinancialValuation>;
  update(id: string, data: Partial<Omit<PmFinancialValuation, 'id' | 'createdAt' | 'updatedAt'>>): Promise<PmFinancialValuation>;
  findById(id: string): Promise<PmFinancialValuation | null>;
  findByProjectId(projectId: string): Promise<PmFinancialValuation[]>;
}
