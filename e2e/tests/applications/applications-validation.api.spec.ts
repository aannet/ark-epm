import { test, expect } from '../../fixtures/index';
import { 
  expectError,
} from '../../utils/api-helpers';

test.describe('Applications Validation API', () => {
  test('POST /applications should return 400 for empty name', async ({ auth }) => {
    const response = await auth.request.post('applications', {
      data: { name: '' },
    });

    expect(response.status()).toBe(400);
  });

  test('POST /applications should return 400 for name with only spaces', async ({ auth }) => {
    const response = await auth.request.post('applications', {
      data: { name: '   ' },
    });

    expect(response.status()).toBe(400);
  });

  test('POST /applications should return 409 for duplicate name', async ({ auth, testData }) => {
    const domain = await testData.createDomain({
      name: `Domain for Duplicate ${Date.now()}`,
    });

    const uniqueName = `Duplicate App ${Date.now()}`;

    await testData.createApplication({ name: uniqueName, domainId: domain.id });

    const secondResponse = await auth.request.post('applications', {
      data: { name: uniqueName, domainId: domain.id },
    });

    const error = await expectError(secondResponse, 409, 'CONFLICT');
    expect(error.message).toContain('Application name already in use');
  });

  test('POST /applications should return 404 for non-existent domainId', async ({ auth }) => {
    const response = await auth.request.post('applications', {
      data: {
        name: `App Invalid Domain ${Date.now()}`,
        domainId: '00000000-0000-0000-0000-000000000000',
      },
    });

    expect(response.status()).toBe(404);
    const body = await response.json();
    expect(body.code).toBe('DOMAIN_NOT_FOUND');
  });

  test('PATCH /applications/:id should return 409 for duplicate name on update', async ({ auth, testData }) => {
    const domain = await testData.createDomain({
      name: `Domain for Update Conflict ${Date.now()}`,
    });

    const app1 = await testData.createApplication({
      name: `App One ${Date.now()}`,
      domainId: domain.id,
    });

    const app2 = await testData.createApplication({
      name: `App Two ${Date.now()}`,
      domainId: domain.id,
    });

    const response = await auth.request.patch(`applications/${app2.id}`, {
      data: { name: app1.name },
    });

    const error = await expectError(response, 409, 'CONFLICT');
    expect(error.message).toContain('Application name already in use');
  });

  test('POST /applications should return 404 for non-existent business capabilityId', async ({ auth, testData }) => {
    const domain = await testData.createDomain({
      name: `Domain for Invalid BC ${Date.now()}`,
    });

    const response = await auth.request.post('applications', {
      data: {
        name: `App Invalid BC ${Date.now()}`,
        domainId: domain.id,
        capabilityIds: ['00000000-0000-4000-8000-000000000000'],
      },
    });

    const error = await expectError(response, 404, 'BUSINESS_CAPABILITY_NOT_FOUND');
    expect(error.message).toContain('One or more business capabilities not found');
  });

  // AGENT-DECISION: qa — T-101 injection hardening tests
  test('POST /applications - should reject command injection in name (semicolon)', async ({ auth }) => {
    const res = await auth.request.post('applications', {
      data: { name: 'ZAP;cat /etc/passwd;' },
    });
    expect(res.status()).toBe(400);
  });

  test('POST /applications - should reject URL scheme injection in name', async ({ auth }) => {
    const res = await auth.request.post('applications', {
      data: { name: 'http://www.google.com/search?q=ZAP' },
    });
    expect(res.status()).toBe(400);
  });

  test('POST /applications - should accept valid name with spaces and hyphens', async ({ auth, testData }) => {
    const name = `Valid Application - Test ${Date.now()}`;
    const res = await auth.request.post('applications', {
      data: { name },
    });
    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body.name).toBe(name);
    await auth.request.delete(`applications/${body.id}`);
  });

  test('PATCH /applications/:id - should reject injection in name during update', async ({ auth, testData }) => {
    const app = await testData.createApplication({ name: `App Inject Target ${Date.now()}` });
    const res = await auth.request.patch(`applications/${app.id}`, {
      data: { name: 'ZAP|type %SYSTEMROOT%\\win.ini' },
    });
    expect(res.status()).toBe(400);
  });
});
