import { Request, Response } from 'express';
import { CompanyService } from '../services/company.service';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const validateCompanyUpdate = (data: Record<string, unknown>): Record<string, string> => {
  const fields: Record<string, string> = {};

  if (data.name !== undefined && !String(data.name ?? '').trim()) {
    fields.name = 'El nombre de la empresa es obligatorio';
  }

  if (typeof data.email === 'string' && data.email.trim() && !EMAIL_PATTERN.test(data.email.trim())) {
    fields.email = 'Ingresa un correo electrónico válido';
  }

  if (typeof data.phone === 'string' && data.phone.trim()) {
    const digits = data.phone.replace(/\D/g, '');
    if (digits.length < 7) {
      fields.phone = 'Ingresa un teléfono válido, con al menos 7 dígitos';
    }
  }

  return fields;
};

export class CompanyController {
  private readonly service: CompanyService;

  constructor() {
    this.service = new CompanyService();
  }

  getAll = async (_req: Request, res: Response): Promise<void> => {
    try {
      const companies = await this.service.getAll();
      res.status(200).json(companies);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Error al obtener empresas' });
    }
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const company = await this.service.getById(String(id));
      if (!company) {
        res.status(404).json({ error: 'Empresa no encontrada' });
        return;
      }
      res.status(200).json(company);
    } catch (error: any) {
      if (error.message === 'Empresa no encontrada') {
        res.status(404).json({ error: error.message });
        return;
      }
      res.status(500).json({ error: error.message || 'Error al obtener empresa' });
    }
  };

  create = async (req: Request, res: Response): Promise<void> => {
    try {
      const data = req.body;
      const company = await this.service.create(data);
      res.status(201).json(company);
    } catch (error: any) {
      if (error.message.includes('ya existe')) {
        res.status(409).json({ error: error.message });
      } else {
        res.status(500).json({ error: error.message || 'Error al crear empresa' });
      }
    }
  };

  update = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const data = req.body;

      // Validar que envíe al menos un campo
      if (!data || Object.keys(data).length === 0) {
        res.status(400).json({ error: 'Debe enviar al menos un campo para actualizar' });
        return;
      }

      const fields = validateCompanyUpdate(data);
      if (Object.keys(fields).length > 0) {
        res.status(400).json({ error: 'Revisa los campos marcados', fields });
        return;
      }

      const company = await this.service.update(String(id), data);
      res.status(200).json(company);
    } catch (error: any) {
      if (error.message === 'Empresa no encontrada') {
        res.status(404).json({ error: error.message });
      } else if (error.message.includes('ya existe')) {
        const fields: Record<string, string> = {};
        if (error.message.toLowerCase().includes('nombre')) {
          fields.name = 'Ya existe una empresa con ese nombre';
        }
        if (error.message.toLowerCase().includes('ruc') || error.message.toLowerCase().includes('rif')) {
          fields.taxId = 'Ya existe una empresa con esa identificación fiscal';
        }
        res.status(409).json({ error: error.message, fields });
      } else {
        res.status(500).json({ error: error.message || 'Error al actualizar empresa' });
      }
    }
  };

  delete = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      await this.service.delete(String(id));
      res.status(200).json({ message: 'Empresa eliminada correctamente' });
    } catch (error: any) {
      if (error.message === 'Empresa no encontrada') {
        res.status(404).json({ error: error.message });
      } else if (error.message.includes('usuarios asociados') || error.message.includes('proyectos asignados')) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Error al eliminar empresa' });
      }
    }
  };
}
