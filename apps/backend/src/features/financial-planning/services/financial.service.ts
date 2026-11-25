import { FinancialRepository } from '../repositories/financial.repository';
import { CreateFinancialValuationRequest, UpdateFinancialValuationStatusRequest, UpdateFinancialValuationAmountRequest, FinancialValuationResponse } from '../interfaces/financial.types';
import { prisma } from '../../../prisma/prisma';
import { PmValuationStatus, Prisma } from '@prisma/client';

export class FinancialService {
  private repository: FinancialRepository;

  constructor() {
    this.repository = new FinancialRepository();
  }

  async create(data: CreateFinancialValuationRequest): Promise<FinancialValuationResponse> {
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);

    if (start > end) {
      throw new Error('La fecha de fin no puede ser menor a la fecha de inicio');
    }

    return await prisma.$transaction(async (tx) => {
      // Validar monto contra el proyecto
      const project = await tx.pmProject.findUnique({ where: { id: data.projectId } });
      if (!project) {
        throw new Error('Proyecto no encontrado');
      }

      const agg = await tx.pmFinancialValuation.aggregate({
        where: { projectId: data.projectId },
        _sum: { amountUsd: true }
      });
      const currentTotal = agg._sum.amountUsd || new Prisma.Decimal(0);
      const amountUsdDec = new Prisma.Decimal(data.amountUsd);
      const newTotal = currentTotal.add(amountUsdDec);
      const offeredAmount = new Prisma.Decimal(project.offeredAmount || 0);

      if (newTotal.greaterThan(offeredAmount)) {
        throw new Error(`La sumatoria de valuaciones (${newTotal.toString()}) supera el Monto Ofertado del proyecto (${project.offeredAmount})`);
      }

      const valuation = await tx.pmFinancialValuation.create({
        data: {
          projectId: data.projectId,
          valuationNumber: data.valuationNumber,
          amountUsd: amountUsdDec,
          startDate: start,
          endDate: end,
        }
      });

      return this.mapToResponse(valuation);
    });
  }

  async getByProjectId(projectId: string): Promise<FinancialValuationResponse[]> {
    const valuations = await this.repository.findByProjectId(projectId);
    return valuations.map(v => this.mapToResponse(v));
  }

  async updateStatus(id: string, data: UpdateFinancialValuationStatusRequest): Promise<FinancialValuationResponse> {
    const valuation = await this.repository.findById(id);
    if (!valuation) {
      throw new Error('Valuación no encontrada');
    }

    if (data.status === 'FACTURADO' && !data.invoiceNumber) {
      throw new Error('Para pasar a estado FACTURADO es obligatorio ingresar el número de factura');
    }

    // Validar flujo de estados
    const validTransitions: Record<string, string[]> = {
      'POR_VALUAR': ['POR_FACTURAR'],
      'POR_FACTURAR': ['POR_VALUAR', 'FACTURADO'],
      'FACTURADO': ['POR_FACTURAR']
    };

    if (!validTransitions[valuation.status]?.includes(data.status)) {
      throw new Error(`Transición de estado no válida de ${valuation.status} a ${data.status}`);
    }

    const invoiceNumber = data.status === 'FACTURADO' ? data.invoiceNumber : null;
    
    const updated = await this.repository.updateStatus(id, data.status as PmValuationStatus, invoiceNumber as any);
    return this.mapToResponse(updated);
  }

  async updateAmount(id: string, data: UpdateFinancialValuationAmountRequest): Promise<FinancialValuationResponse> {
    return await prisma.$transaction(async (tx) => {
      const valuation = await tx.pmFinancialValuation.findUnique({ where: { id } });
      if (!valuation) {
        throw new Error('Valuación no encontrada');
      }

      if (valuation.status === 'FACTURADO') {
        throw new Error('No se puede editar el monto de una valuación facturada');
      }

      const project = await tx.pmProject.findUnique({ where: { id: valuation.projectId } });
      if (!project) {
        throw new Error('Proyecto no encontrado');
      }

      const agg = await tx.pmFinancialValuation.aggregate({
        where: { projectId: valuation.projectId },
        _sum: { amountUsd: true }
      });
      const currentTotal = agg._sum.amountUsd || new Prisma.Decimal(0);
      const newAmount = new Prisma.Decimal(data.amountUsd);
      const newTotal = currentTotal.sub(valuation.amountUsd).add(newAmount);
      const offeredAmount = new Prisma.Decimal(project.offeredAmount || 0);

      if (newTotal.greaterThan(offeredAmount)) {
        throw new Error(`La sumatoria de valuaciones (${newTotal.toString()}) supera el Monto Ofertado del proyecto (${project.offeredAmount})`);
      }

      const updated = await tx.pmFinancialValuation.update({
        where: { id },
        data: { amountUsd: newAmount }
      });

      return this.mapToResponse(updated);
    });
  }

  private mapToResponse(v: any): FinancialValuationResponse {
    return {
      id: v.id,
      projectId: v.projectId,
      valuationNumber: v.valuationNumber,
      amountUsd: Number(v.amountUsd),
      startDate: v.startDate.toISOString(),
      endDate: v.endDate.toISOString(),
      status: v.status,
      invoiceNumber: v.invoiceNumber || undefined,
      createdAt: v.createdAt.toISOString(),
      updatedAt: v.updatedAt.toISOString(),
    };
  }
}
