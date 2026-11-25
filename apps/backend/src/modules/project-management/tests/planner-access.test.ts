import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildPlannerProjectsWhere,
  canPlannerAccessProject,
} from '../../../features/auth/utils/planner-access.js';

describe('planner-access', () => {
  it('sin scopes filtra solo por managerId', () => {
    assert.deepEqual(buildPlannerProjectsWhere('planner-1'), { managerId: 'planner-1' });
    assert.deepEqual(buildPlannerProjectsWhere('planner-1', []), { managerId: 'planner-1' });
  });

  it('con scopes une managerId y projectIds (nunca companyId)', () => {
    assert.deepEqual(buildPlannerProjectsWhere('planner-1', ['p1', 'p2']), {
      OR: [{ managerId: 'planner-1' }, { id: { in: ['p1', 'p2'] } }],
    });
  });

  it('canPlannerAccessProject respeta manager y scopes', () => {
    assert.equal(
      canPlannerAccessProject({ id: 'p1', managerId: 'planner-1' }, 'planner-1', []),
      true,
    );
    assert.equal(
      canPlannerAccessProject({ id: 'p2', managerId: 'otro' }, 'planner-1', ['p2']),
      true,
    );
    assert.equal(
      canPlannerAccessProject({ id: 'p3', managerId: 'otro' }, 'planner-1', ['p1']),
      false,
    );
  });
});
