import { test, expect, TestDataFactory } from '../../fixtures/index';
import { expectError, expectSuccess, DomainResponse } from '../../utils/api-helpers';

test.describe('Domains Validation API', () => {
  test('POST /domains should return 400 when name is missing', async ({ auth }) => {
    const response = await auth.request.post('domains', {
      data: { description: 'Test description' },
    });

    expect(response.status()).toBe(400);
  });

  test('POST /domains should return 400 when name is whitespace only', async ({ auth }) => {
    const response = await auth.request.post('domains', {
      data: { name: '   ' },
    });

    expect(response.status()).toBe(400);
  });

  test('POST /domains should return 409 for duplicate name', async ({ auth }) => {
    const uniqueName = `Duplicate ${Date.now()}`;

    const firstResponse = await auth.request.post('domains', {
      data: { name: uniqueName },
    });
    await expectSuccess<DomainResponse>(firstResponse, 201);

    const secondResponse = await auth.request.post('domains', {
      data: { name: uniqueName },
    });

    const error = await expectError(secondResponse, 409, 'CONFLICT');
    expect(error.message).toContain('Domain name already in use');
  });

  test('PATCH /domains/:id should return 409 for duplicate name on update', async ({ auth, testData }) => {
    const domain1 = await testData.createDomain({
      name: `Domain1 ${Date.now()}`,
    });

    const domain2 = await testData.createDomain({
      name: `Domain2 ${Date.now()}`,
    });

    const response = await auth.request.patch(`domains/${domain2.id}`, {
      data: { name: domain1.name },
    });

    const error = await expectError(response, 409, 'CONFLICT');
    expect(error.message).toContain('Domain name already in use');
  });

  test('PATCH /domains/:id should return 404 for non-existent domain', async ({ auth }) => {
    const response = await auth.request.patch('domains/00000000-0000-0000-0000-000000000000', {
      data: { description: 'Updated' },
    });

    expect(response.status()).toBe(404);
    const body = await response.json();
    expect(body.code).toBe('DOMAIN_NOT_FOUND');
  });
});
