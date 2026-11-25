import { test } from 'node:test';
import assert from 'node:assert/strict';
import { JwtService } from '../infrastructure/auth/jwt.service.js';

test('JwtService: fail-fast si PM_JWT_SECRET no está definido', () => {
  const prev = process.env.PM_JWT_SECRET;
  delete process.env.PM_JWT_SECRET;
  try {
    assert.throws(() => new JwtService(), /PM_JWT_SECRET/);
  } finally {
    process.env.PM_JWT_SECRET = prev;
  }
});

test('JwtService: sign y verify roundtrip', () => {
  process.env.PM_JWT_SECRET = 'test-secret';
  process.env.PM_JWT_EXPIRES_IN = '1h';

  const jwt = new JwtService();
  const token = jwt.sign({ sub: 'user-1', email: 'admin@test.com' });

  assert.ok(typeof token === 'string' && token.length > 0);

  const payload = jwt.verify(token);
  assert.equal(payload.sub, 'user-1');
  assert.equal(payload.email, 'admin@test.com');
});

test('JwtService: verify lanza con token inválido', () => {
  process.env.PM_JWT_SECRET = 'test-secret';
  const jwt = new JwtService();
  assert.throws(() => jwt.verify('token-invalido'), /jwt|token/i);
});
