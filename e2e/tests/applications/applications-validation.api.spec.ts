import { test, expect, TestDataFactory } from '../../fixtures/index';
import { 
  expectSuccess, 
  expectError,
  ApplicationResponse 
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

    const firstResponse = await auth.request.post('applications', {
      data: { name: uniqueName, domainId: domain.id },
    });
    await expectSuccess<ApplicationResponse>(firstResponse, 201);

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
});
