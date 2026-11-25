import { PrismaClient, Prisma } from '@prisma/client';
import { PmProfile } from '../dto/auth.dto.js';
import { PmForbiddenError, PmNotFoundError, PmValidationError } from '../../errors.js';
import { computeBalance, calcActualCost, calcTotalPayables, calcTotalDebt } from './payables.calc.js';
import type { z } from 'zod';
import {
  createObligationSchema,
  updateObligationSchema,
  payObligationSchema,
  updateAdvanceSchema,
  recognizeObligationSchema,
} from '../dto/payables.dto.js';

type Tx = Prisma.TransactionClient;
const D = (v: Prisma.Decimal.Value) => new Prisma.Decimal(v);

export class PayablesService {
  constructor(private readonly db: PrismaClient) {}

  /** Admin/Gestión ven todo; el resto solo los proyectos asignados en pm_user_scopes (si están configurados). */
  private assertAccess(user: PmProfile, projectId: string) {
    if (user.roles.includes('PM_ADMIN') || user.roles.includes('PM_GESTION')) return;
    if (user.scopes.projectIds.length > 0 && !user.scopes.projectIds.includes(projectId)) {
      throw new PmForbiddenError('Fuera de scope: no tienes asignado este proyecto');
    }
  }

  /** Lista + resumen. El saldo SIEMPRE se calcula acá desde los registros. */
  async snapshot(user: PmProfile, projectId: string) {
    this.assertAccess(user, projectId);
    return this.buildSnapshot(this.db, projectId);
  }

  /** Resumen global y por proyecto de deudas para el dashboard financiero. */
  async overview(user: PmProfile) {
    const isGlobal = user.roles.includes('PM_ADMIN') || user.roles.includes('PM_GESTION');
    const where: Prisma.PmProjectWhereInput = {};
    if (!isGlobal) {
      if (user.scopes.projectIds && user.scopes.projectIds.length > 0) {
        where.id = { in: user.scopes.projectIds };
      } else if (user.scopes.companyIds && user.scopes.companyIds.length > 0) {
        where.companyId = { in: user.scopes.companyIds };
      }
    }

    const projects = await this.db.pmProject.findMany({
      where,
      include: {
        pm_companies: { select: { id: true, name: true } },
        pm_obligations: {
          include: {
            payments: { select: { amountUsd: true } },
          },
        },
        pm_expenses: { select: { amountUsd: true, obligationPaymentId: true } },
        pm_collections: { select: { amountUsd: true } },
      },
      orderBy: [{ pm_companies: { name: 'asc' } }, { code: 'asc' }],
    });

    let gDebt = D(0), gPaid = D(0), gPending = D(0), gOpen = 0;
    let gActualCost = D(0), gCollected = D(0), gAdvance = D(0), gAmortized = D(0);

    const projectOverviews = projects.map((p) => {
      let pDebt = D(0), pPaid = D(0), pPending = D(0), pOpen = 0, pIncurred = D(0);
      for (const o of p.pm_obligations) {
        const b = computeBalance(o.amountUsd, o.payments.map((pm) => pm.amountUsd));
        pDebt = pDebt.plus(b.total);
        pPaid = pPaid.plus(b.paid);
        pPending = pPending.plus(b.pending);
        if (b.status !== 'PAGADO') pOpen++;
        if (o.isIncurred !== false) {
          pIncurred = pIncurred.plus(b.total);
        }
      }

      let pDirectExpenses = D(0);
      for (const exp of p.pm_expenses ?? []) {
        if (!exp.obligationPaymentId) {
          pDirectExpenses = pDirectExpenses.plus(D(exp.amountUsd));
        }
      }
      const pActualCost = pIncurred.plus(pDirectExpenses);

      let pCollected = D(0);
      for (const col of p.pm_collections ?? []) {
        pCollected = pCollected.plus(D(col.amountUsd));
      }

      const pAdvance = D(p.advanceAmount ?? 0);
      const pAmortized = D(p.amortizedAmount ?? 0);

      gDebt = gDebt.plus(pDebt);
      gPaid = gPaid.plus(pPaid);
      gPending = gPending.plus(pPending);
      gOpen += pOpen;
      gActualCost = gActualCost.plus(pActualCost);
      gCollected = gCollected.plus(pCollected);
      gAdvance = gAdvance.plus(pAdvance);
      gAmortized = gAmortized.plus(pAmortized);

      return {
        id: p.id,
        code: p.code,
        fullName: p.fullName,
        shortName: p.shortName,
        status: p.status,
        company: p.pm_companies,
        advanceAmount: pAdvance.toNumber(),
        amortizedAmount: pAmortized.toNumber(),
        summary: {
          totalDebt: pDebt.toNumber(),
          totalPaid: pPaid.toNumber(),
          totalPending: pPending.toNumber(),
          actualCost: pActualCost.toNumber(),
          collectedAmount: pCollected.toNumber(),
          openCount: pOpen,
          totalCount: p.pm_obligations.length,
        },
      };
    });

    return {
      globalSummary: {
        totalDebt: gDebt.toNumber(),
        totalPaid: gPaid.toNumber(),
        totalPending: gPending.toNumber(),
        totalActualCost: gActualCost.toNumber(),
        totalCollected: gCollected.toNumber(),
        totalAdvance: gAdvance.toNumber(),
        totalAmortized: gAmortized.toNumber(),
        openCount: gOpen,
        totalProjects: projects.length,
      },
      projects: projectOverviews,
    };
  }

  private async buildSnapshot(db: Tx | PrismaClient, projectId: string) {
    const [rows, project, directExpenses] = await Promise.all([
      db.pmProjectObligation.findMany({
        where: { projectId },
        include: { payments: { orderBy: { paidAt: 'asc' } } },
        orderBy: { createdAt: 'desc' },
      }),
      db.pmProject.findUnique({
        where: { id: projectId },
        select: { advanceAmount: true, amortizedAmount: true },
      }),
      db.pmProjectExpense.findMany({
        where: { projectId, obligationPaymentId: null },
        select: { amountUsd: true },
      }),
    ]);
    let tDebt = D(0), tPaid = D(0), tPending = D(0), open = 0, tIncurred = D(0);
    const items = rows.map((r) => {
      const b = computeBalance(r.amountUsd, r.payments.map((p) => p.amountUsd));
      tDebt = tDebt.plus(b.total);
      tPaid = tPaid.plus(b.paid);
      tPending = tPending.plus(b.pending);
      if (b.status !== 'PAGADO') open++;
      if (r.isIncurred !== false) {
        tIncurred = tIncurred.plus(b.total);
      }
      return {
        id: r.id,
        projectId: r.projectId,
        category: r.category,
        description: r.description,
        supplier: r.supplier,
        invoiceNumber: r.invoiceNumber,
        dueDate: r.dueDate,
        status: b.status,
        amountUsd: b.total.toNumber(),
        paidUsd: b.paid.toNumber(),
        pendingUsd: b.pending.toNumber(),
        paidAt: r.paidAt,
        isIncurred: r.isIncurred,
        incurredAt: r.incurredAt,
        supportDocument: r.supportDocument,
        createdAt: r.createdAt,
        payments: r.payments.map((p) => ({
          id: p.id,
          amountUsd: p.amountUsd.toNumber(),
          paidAt: p.paidAt,
          note: p.note,
        })),
      };
    });

    const tDirect = directExpenses.reduce((s, e) => s.plus(D(e.amountUsd)), D(0));
    const tActualCost = tIncurred.plus(tDirect);

    items.sort((a, b) => {
      const aPending = a.status !== 'PAGADO';
      const bPending = b.status !== 'PAGADO';
      if (aPending && !bPending) return -1;
      if (!aPending && bPending) return 1;
      if (aPending && bPending) {
        if (a.status === 'PARCIAL' && b.status === 'PENDIENTE') return -1;
        if (a.status === 'PENDIENTE' && b.status === 'PARCIAL') return 1;
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return {
      items,
      advance: {
        advanceAmount: project?.advanceAmount ? Number(project.advanceAmount) : 0,
        amortizedAmount: project?.amortizedAmount ? Number(project.amortizedAmount) : 0,
        pendingAmortization: project
          ? Math.max(0, Number(project.advanceAmount) - Number(project.amortizedAmount))
          : 0,
      },
      summary: {
        totalDebt: tDebt.toNumber(),
        totalPaid: tPaid.toNumber(),
        totalPending: tPending.toNumber(),
        actualCost: tActualCost.toNumber(),
        totalIncurred: tIncurred.toNumber(),
        directExpenses: tDirect.toNumber(),
        openCount: open,
        totalCount: rows.length,
      },
    };
  }

  /** Recalcula y persiste el estado (Pagado/Parcial/Pendiente) de una obligación. */
  private async syncStatus(tx: Tx, obligationId: string) {
    const o = await tx.pmProjectObligation.findUnique({ where: { id: obligationId }, include: { payments: true } });
    if (!o) throw new PmNotFoundError('Obligación no encontrada');
    const b = computeBalance(o.amountUsd, o.payments.map((p) => p.amountUsd));
    await tx.pmProjectObligation.update({
      where: { id: obligationId },
      data: { status: b.status, paidAt: b.status === 'PAGADO' ? (o.paidAt ?? new Date()) : null },
    });
    return o.projectId;
  }

  async create(user: PmProfile, dto: z.infer<typeof createObligationSchema>) {
    this.assertAccess(user, dto.projectId);
    const project = await this.db.pmProject.findUnique({ where: { id: dto.projectId }, select: { id: true } });
    if (!project) throw new PmNotFoundError('Proyecto no encontrado');
    await this.db.pmProjectObligation.create({
      data: {
        ...dto,
        amountUsd: D(dto.amountUsd),
        isIncurred: dto.isIncurred ?? true,
        incurredAt: dto.incurredAt ? new Date(dto.incurredAt) : (dto.isIncurred !== false ? new Date() : null),
        supportDocument: dto.supportDocument ?? null,
        createdById: user.id,
      },
    });
    return this.buildSnapshot(this.db, dto.projectId);
  }

  async update(user: PmProfile, id: string, dto: z.infer<typeof updateObligationSchema>) {
    return this.db.$transaction(async (tx) => {
      const o = await tx.pmProjectObligation.findUnique({ where: { id }, include: { payments: true } });
      if (!o) throw new PmNotFoundError('Obligación no encontrada');
      this.assertAccess(user, o.projectId);
      if (dto.amountUsd !== undefined) {
        const paid = o.payments.reduce((a, p) => a.plus(p.amountUsd), D(0));
        if (D(dto.amountUsd).lt(paid)) throw new PmValidationError('El monto no puede ser menor a lo ya pagado');
      }
      await tx.pmProjectObligation.update({
        where: { id },
        data: {
          ...dto,
          amountUsd: dto.amountUsd !== undefined ? D(dto.amountUsd) : undefined,
          incurredAt: dto.incurredAt !== undefined ? (dto.incurredAt ? new Date(dto.incurredAt) : null) : undefined,
          supportDocument: dto.supportDocument !== undefined ? dto.supportDocument : undefined,
        },
      });
      await this.syncStatus(tx, id);
      return this.buildSnapshot(tx, o.projectId);
    });
  }

  /** Registra un desembolso (por defecto el saldo restante) y actualiza el estado automáticamente. */
  async pay(user: PmProfile, id: string, dto: z.infer<typeof payObligationSchema>) {
    return this.db.$transaction(
      async (tx) => {
        const o = await tx.pmProjectObligation.findUnique({ where: { id }, include: { payments: true } });
        if (!o) throw new PmNotFoundError('Obligación no encontrada');
        this.assertAccess(user, o.projectId);
        const { pending } = computeBalance(o.amountUsd, o.payments.map((p) => p.amountUsd));
        if (pending.lte(0)) throw new PmValidationError('La obligación ya está pagada');
        const amount = dto.amountUsd !== undefined ? D(dto.amountUsd) : pending;
        if (amount.gt(pending)) throw new PmValidationError('El pago supera el saldo pendiente de la obligación');
        const payment = await tx.pmObligationPayment.create({
          data: { obligationId: id, amountUsd: amount, paidById: user.id, note: dto.note ?? null },
        });
        await tx.pmProjectExpense.create({
          data: {
            projectId: o.projectId,
            description: `Pago obligación: ${o.description}${dto.note ? ` (${dto.note})` : ''}`,
            amountUsd: amount,
            expenseDate: new Date(),
            createdById: user.id,
            obligationPaymentId: payment.id,
          },
        });
        await this.syncStatus(tx, id);
        return this.buildSnapshot(tx, o.projectId);
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }

  /** Anula un pago (corrección de error). El saldo y el estado se recalculan sin destruir otros abonos. */
  async revertPayment(user: PmProfile, paymentId: string) {
    return this.db.$transaction(async (tx) => {
      const p = await tx.pmObligationPayment.findUnique({ where: { id: paymentId }, include: { obligation: true } });
      if (!p) throw new PmNotFoundError('Pago no encontrado');
      this.assertAccess(user, p.obligation.projectId);
      await tx.pmProjectExpense.deleteMany({ where: { obligationPaymentId: paymentId } });
      await tx.pmObligationPayment.delete({ where: { id: paymentId } });
      await this.syncStatus(tx, p.obligationId);
      return this.buildSnapshot(tx, p.obligation.projectId);
    });
  }

  async remove(user: PmProfile, id: string) {
    const o = await this.db.pmProjectObligation.findUnique({ where: { id }, include: { payments: { select: { id: true } } } });
    if (!o) throw new PmNotFoundError('Obligación no encontrada');
    this.assertAccess(user, o.projectId);
    if (o.payments.length > 0) throw new PmValidationError('No se puede eliminar una obligación con pagos; revierte los pagos primero');
    await this.db.pmProjectObligation.delete({ where: { id } });
    return this.buildSnapshot(this.db, o.projectId);
  }

  /**
   * Alterna el estado pagado vía checklist.
   * - Si es true: liquida el saldo restante mediante un abono final.
   * - Si es false: NO elimina masivamente abonos previos si hay múltiples pagos (protección contra pérdida de datos).
   */
  async setPaid(user: PmProfile, id: string, paid: boolean) {
    return this.db.$transaction(async (tx) => {
      const o = await tx.pmProjectObligation.findUnique({ where: { id }, include: { payments: true } });
      if (!o) throw new PmNotFoundError('Obligación no encontrada');
      this.assertAccess(user, o.projectId);

      if (paid) {
        const pagado = o.payments.reduce((s, p) => s.plus(p.amountUsd), D(0));
        const resto = D(o.amountUsd).minus(pagado);
        if (resto.gt(0)) {
          const payment = await tx.pmObligationPayment.create({
            data: {
              obligationId: id,
              amountUsd: resto,
              paidById: user.id,
              note: 'Pago total (checklist)',
            },
          });
          await tx.pmProjectExpense.create({
            data: {
              projectId: o.projectId,
              description: `Pago obligación: ${o.description}`,
              amountUsd: resto,
              expenseDate: new Date(),
              createdById: user.id,
              obligationPaymentId: payment.id,
            },
          });
        }
        await tx.pmProjectObligation.update({
          where: { id },
          data: { status: 'PAGADO', paidAt: new Date() },
        });
      } else {
        // Protección financiera: impedir la eliminación masiva de múltiples abonos
        if (o.payments.length > 1) {
          throw new PmValidationError(
            'La obligación posee múltiples abonos registrados. Para anular un pago, utiliza la acción de anulación individual por abono.'
          );
        }
        const singlePayment = o.payments[0];
        if (singlePayment) {
          await tx.pmProjectExpense.deleteMany({
            where: { obligationPaymentId: singlePayment.id },
          });
          await tx.pmObligationPayment.delete({ where: { id: singlePayment.id } });
        }
        await tx.pmProjectObligation.update({
          where: { id },
          data: { status: 'PENDIENTE', paidAt: null },
        });
      }

      return this.buildSnapshot(tx, o.projectId);
    });
  }

  /** Actualiza anticipo y amortización del proyecto. */
  async updateAdvance(user: PmProfile, projectId: string, dto: z.infer<typeof updateAdvanceSchema>) {
    this.assertAccess(user, projectId);
    const project = await this.db.pmProject.findUnique({ where: { id: projectId } });
    if (!project) throw new PmNotFoundError('Proyecto no encontrado');

    await this.db.pmProject.update({
      where: { id: projectId },
      data: {
        advanceAmount: D(dto.advanceAmount),
        amortizedAmount: D(dto.amortizedAmount),
      },
    });

    return this.buildSnapshot(this.db, projectId);
  }

  /**
   * Reconoce una obligación como costo incurrido / ejecutado.
   * - Cambia isIncurred a true (o según dto.isIncurred).
   * - Registra incurredAt y documento soporte / nota.
   * - Actualiza inmediatamente el Costo Real del proyecto sin alterar el saldo por pagar ni duplicar pagos.
   */
  async recognize(user: PmProfile, id: string, dto: z.infer<typeof recognizeObligationSchema>) {
    const o = await this.db.pmProjectObligation.findUnique({ where: { id } });
    if (!o) throw new PmNotFoundError('Obligación no encontrada');
    this.assertAccess(user, o.projectId);

    const parts = [
      dto.supportDocument?.trim() || null,
      dto.note?.trim() ? `Nota: ${dto.note.trim()}` : null,
    ].filter(Boolean);
    const combinedSupport = parts.length > 0 ? parts.join(' · ') : (dto.supportDocument === null ? null : undefined);

    await this.db.pmProjectObligation.update({
      where: { id },
      data: {
        isIncurred: dto.isIncurred ?? true,
        incurredAt: dto.isIncurred !== false
          ? (dto.incurredAt ? new Date(dto.incurredAt) : new Date())
          : null,
        ...(combinedSupport !== undefined ? { supportDocument: combinedSupport } : {}),
      },
    });

    return this.buildSnapshot(this.db, o.projectId);
  }
}

