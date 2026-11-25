import { test } from 'node:test';
import assert from 'node:assert/strict';
import { AuthService } from '../application/services/auth.service.js';
import { PmUnauthorizedError } from '../errors.js';

function createMocks(overrides: any = {}) {
  const repo = {
    findByEmail: async () => null,
    findByUsername: async () => null,
    findById: async () => null,
    updatePassword: async () => undefined,
    findProfile: async () => null,
    linkExternalId: async () => undefined,
    ...(overrides.repo || {}),
  };

  const jwt = {
    sign: (payload: any) => `token-${payload.sub}`,
    verify: () => ({ sub: 'u1', email: 'a@b.c' }),
    ...(overrides.jwt || {}),
  };

  const hasher = {
    hash: async (p: string) => `hash-${p}`,
    compare: async () => true,
    ...(overrides.hasher || {}),
  };

  return { repo, jwt, hasher };
}

const activeUser = {
  id: 'u1',
  email: 'admin@test.com',
  password: 'hash',
  status: 'ACTIVE',
  createdAt: new Date(),
  updatedAt: new Date(),
  externalId: null,
};

const profile = {
  id: 'u1',
  email: 'admin@test.com',
  roles: ['PM_ADMIN'],
  permissions: ['PM_PROJECTS_READ'],
  scopes: { companyIds: [], projectIds: [] },
};

test('AuthService.login: éxito con token y redirectUrl', async () => {
  const { repo, jwt, hasher } = createMocks({
    repo: { findByEmail: async () => activeUser, findProfile: async () => profile },
  });
  const service = new AuthService(repo, jwt, hasher);

  const result = await service.login({ login: 'admin@test.com', password: 'hash' });

  assert.equal(result.token, 'token-u1');
  assert.equal(result.user.roles[0], 'PM_ADMIN');
  assert.equal(result.redirectUrl, '/project-management/gestion');
});

test('AuthService.login: lanza PmUnauthorizedError si usuario no existe', async () => {
  const { repo, jwt, hasher } = createMocks({});
  const service = new AuthService(repo, jwt, hasher);

  await assert.rejects(
    () => service.login({ login: 'no@test.com', password: 'x' }),
    PmUnauthorizedError
  );
});

test('AuthService.login: lanza PmUnauthorizedError si usuario inactivo', async () => {
  const { repo, jwt, hasher } = createMocks({
    repo: { findByEmail: async () => ({ ...activeUser, status: 'INACTIVE' }) },
  });
  const service = new AuthService(repo, jwt, hasher);

  await assert.rejects(
    () => service.login({ login: 'admin@test.com', password: 'hash' }),
    PmUnauthorizedError
  );
});

test('AuthService.login: lanza PmUnauthorizedError si password incorrecta', async () => {
  const { repo, jwt, hasher } = createMocks({
    repo: { findByEmail: async () => activeUser },
    hasher: { compare: async () => false },
  });
  const service = new AuthService(repo, jwt, hasher);

  await assert.rejects(
    () => service.login({ login: 'admin@test.com', password: 'wrong' }),
    PmUnauthorizedError
  );
});

test('AuthService.computeRedirectUrl por rol', () => {
  const { repo, jwt, hasher } = createMocks();
  const service = new AuthService(repo, jwt, hasher);

  assert.equal(service.computeRedirectUrl(['PM_ADMIN']), '/project-management/gestion');
  assert.equal(service.computeRedirectUrl(['PM_GESTION']), '/project-management/gestion');
  assert.equal(service.computeRedirectUrl(['PM_PLANIFICADOR']), '/project-management/planificador');
  assert.equal(service.computeRedirectUrl(['PM_DIRECCION']), '/project-management/cliente');
  assert.equal(service.computeRedirectUrl(['SIN_ROL']), '/project-management/gestion');
});

test('AuthService.linkModuleUserToErp llama al repo', async () => {
  let called = false;
  const { repo, jwt, hasher } = createMocks({
    repo: { linkExternalId: async () => { called = true; } },
  });
  const service = new AuthService(repo, jwt, hasher);

  await service.linkModuleUserToErp('pm1', 'erp1');
  assert.equal(called, true);
});

test('AuthService.changePassword: éxito actualiza el hash con la nueva contraseña', async () => {
  let updatedPassword = '';
  const { repo, jwt, hasher } = createMocks({
    repo: {
      findById: async () => activeUser,
      updatePassword: async (id: string, hashed: string) => { updatedPassword = hashed; },
    },
  });
  const service = new AuthService(repo, jwt, hasher);

  const result = await service.changePassword('u1', 'hash', 'NuevaClave123!');

  assert.equal(result.success, true);
  assert.equal(updatedPassword, 'hash-NuevaClave123!');
});

test('AuthService.changePassword: rechaza contraseña actual incorrecta sin actualizar', async () => {
  let updated = false;
  const { repo, jwt, hasher } = createMocks({
    repo: {
      findById: async () => activeUser,
      updatePassword: async () => { updated = true; },
    },
    hasher: { compare: async () => false },
  });
  const service = new AuthService(repo, jwt, hasher);

  const result = await service.changePassword('u1', 'wrong', 'NuevaClave123!');

  assert.equal(result.success, false);
  assert.equal(result.error, 'La contraseña actual es incorrecta');
  assert.equal(updated, false);
});

test('AuthService.changePassword: rechaza usuario inactivo o inexistente', async () => {
  const { repo, jwt, hasher } = createMocks({
    repo: { findById: async () => ({ ...activeUser, status: 'INACTIVE' }) },
  });
  const service = new AuthService(repo, jwt, hasher);

  const result = await service.changePassword('u1', 'hash', 'NuevaClave123!');

  assert.equal(result.success, false);
  assert.equal(result.error, 'Usuario no encontrado o inactivo');
});

test('AuthService.changePassword: rechaza nueva contraseña igual a la actual', async () => {
  const { repo, jwt, hasher } = createMocks({
    repo: { findById: async () => activeUser },
  });
  const service = new AuthService(repo, jwt, hasher);

  const result = await service.changePassword('u1', 'hash', 'hash');

  assert.equal(result.success, false);
  assert.equal(result.error, 'La nueva contraseña debe ser diferente a la actual');
});
