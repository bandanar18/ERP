import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CreatePmCostPlanningUseCase } from '../application/use-cases/pm-cost-plannings/create-cost-planning.use-case.js';

test('CreatePmCostPlanningUseCase: crea un cost planning', async () => {
  let captured: any = null;
  const repo = {
    create: async (data: any) => {
      captured = data;
      return { id: 'c1', ...data, createdAt: new Date(), updatedAt: new Date() };
    },
    findByProjectId: async () => [],
  };

  const useCase = new CreatePmCostPlanningUseCase(repo as any);
  const dto = {
    projectId: 'p1',
    amountUsd: 1000,
    startDate: new Date('2026-01-01'),
    endDate: new Date('2026-02-01'),
  };

  const result = await useCase.execute(dto as any);

  assert.equal(captured.projectId, 'p1');
  assert.equal(captured.amountUsd, 1000);
  assert.equal(result.id, 'c1');
});

test('CreatePmCostPlanningUseCase: propaga errores del repo', async () => {
  const repo = {
    create: async () => { throw new Error('DB error'); },
    findByProjectId: async () => [],
  };

  const useCase = new CreatePmCostPlanningUseCase(repo as any);
  await assert.rejects(
    () => useCase.execute({} as any),
    /DB error/
  );
});
