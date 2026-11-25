import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  getAuthFrontendOrigin,
  getPmFrontendOrigin,
  getQcFrontendOrigin,
} from '../../../config/public-urls.js';

describe('public-urls (password reset origins)', () => {
  const original = {
    FRONTEND_URL: process.env.FRONTEND_URL,
    PM_FRONTEND_URL: process.env.PM_FRONTEND_URL,
    QC_FRONTEND_URL: process.env.QC_FRONTEND_URL,
  };

  beforeEach(() => {
    delete process.env.FRONTEND_URL;
    delete process.env.PM_FRONTEND_URL;
    delete process.env.QC_FRONTEND_URL;
  });

  afterEach(() => {
    for (const [key, value] of Object.entries(original)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });

  it('usa dominios públicos cuando FRONTEND_URL es localhost', () => {
    process.env.FRONTEND_URL = 'http://localhost:5173';
    assert.equal(getAuthFrontendOrigin(), 'https://bdgestion.org');
    assert.equal(getPmFrontendOrigin(), 'https://proyectos.bdgestion.org');
    assert.equal(getQcFrontendOrigin(), 'https://calidad.bdgestion.org');
  });

  it('respeta overrides públicos no-localhost', () => {
    process.env.PM_FRONTEND_URL = 'https://staging-proyectos.example.com/';
    process.env.QC_FRONTEND_URL = 'https://staging-calidad.example.com';
    process.env.FRONTEND_URL = 'https://staging.example.com';
    assert.equal(getPmFrontendOrigin(), 'https://staging-proyectos.example.com');
    assert.equal(getQcFrontendOrigin(), 'https://staging-calidad.example.com');
    assert.equal(getAuthFrontendOrigin(), 'https://staging.example.com');
  });
});
