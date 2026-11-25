import { CompanyRepository } from '../repositories/company.repository';
import {
  CreateCompanyRequest,
  UpdateCompanyRequest,
  CompanyResponse,
  CompanyListResponse,
  CompanyWithRelations,
} from '../interfaces/company.types';

const companyToResponse = (company: CompanyWithRelations): CompanyResponse => ({
  id: company.id,
  name: company.name,
  taxId: company.taxId ?? undefined,
  legalName: company.legalName ?? undefined,
  address: company.address ?? undefined,
  phone: company.phone ?? undefined,
  email: company.email ?? undefined,
  logoUrl: company.logoUrl ?? undefined,
  createdAt: company.createdAt,
  updatedAt: company.updatedAt,
});

const OPTIONAL_FIELDS = ['taxId', 'legalName', 'address', 'phone', 'email', 'logoUrl'] as const;

const normalizeCompanyUpdate = (data: UpdateCompanyRequest): UpdateCompanyRequest => {
  const next: UpdateCompanyRequest = { ...data };

  if (typeof next.name === 'string') next.name = next.name.trim();
  for (const field of OPTIONAL_FIELDS) {
    if (typeof next[field] === 'string') {
      const value = next[field].trim();
      next[field] = value.length > 0 ? value : null;
    }
  }

  return next;
};

const companyToListResponse = (company: CompanyWithRelations): CompanyListResponse => ({
  ...companyToResponse(company),
  _count: company._count
    ? { users: company._count.users, projects: company._count.pm_projects }
    : undefined,
});

export class CompanyService {
  private readonly repository: CompanyRepository;

  constructor() {
    this.repository = new CompanyRepository();
  }

  async getAll(): Promise<CompanyListResponse[]> {
    const companies = await this.repository.findAll(true);
    return companies.map(companyToListResponse);
  }

  async getById(id: string): Promise<CompanyResponse> {
    const company = await this.repository.findById(id);
    if (!company) {
      throw new Error('Empresa no encontrada');
    }
    return companyToResponse(company);
  }

  async create(data: CreateCompanyRequest): Promise<CompanyListResponse> {
    // Validar que venga el nombre
    if (!data || !data.name) {
      throw new Error('El nombre de la empresa es obligatorio');
    }

    // Verificar si ya existe empresa con el mismo nombre
    const existingByName = await this.repository.findByName(data.name);
    if (existingByName) {
      throw new Error('Ya existe una empresa con ese nombre');
    }

    // Verificar si ya existe empresa con el mismo taxId
    if (data.taxId) {
      const existingByTaxId = await this.repository.findByTaxId(data.taxId);
      if (existingByTaxId) {
        throw new Error('Ya existe una empresa con ese RUC/RIF');
      }
    }

    const company = await this.repository.create(data);
    return companyToListResponse(company);
  }

  async update(id: string, data: UpdateCompanyRequest): Promise<CompanyListResponse> {
    data = normalizeCompanyUpdate(data);

    // Verificar que la empresa existe
    const exists = await this.repository.exists(id);
    if (!exists) {
      throw new Error('Empresa no encontrada');
    }

    // Si se cambia el nombre, verificar que no exista otra con ese nombre
    if (data.name) {
      const existingByName = await this.repository.findByName(data.name);
      if (existingByName && existingByName.id !== id) {
        throw new Error('Ya existe una empresa con ese nombre');
      }
    }

    // Si se cambia el taxId, verificar que no exista otra con ese taxId
    if (data.taxId) {
      const existingByTaxId = await this.repository.findByTaxId(data.taxId);
      if (existingByTaxId && existingByTaxId.id !== id) {
        throw new Error('Ya existe una empresa con ese RUC/RIF');
      }
    }

    const company = await this.repository.update(id, data);
    return companyToListResponse(company);
  }

  async delete(id: string): Promise<void> {
    const exists = await this.repository.exists(id);
    if (!exists) {
      throw new Error('Empresa no encontrada');
    }

    const company = await this.repository.findById(id);
    if (company?._count && company._count.users > 0) {
      throw new Error('No se puede eliminar una empresa con usuarios asociados');
    }
    if (company?._count && company._count.pm_projects > 0) {
      throw new Error('No se puede eliminar una empresa con proyectos asignados. Transfiérelos antes de eliminarla');
    }

    await this.repository.delete(id);
  }
}
