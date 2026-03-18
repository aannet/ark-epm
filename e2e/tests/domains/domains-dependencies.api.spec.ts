import { test, expect, TestDataFactory } from '../../fixtures/index';
import { expectError, expectSuccess, DomainResponse } from '../../utils/api-helpers';

test.describe('Domains Dependencies API', () => {
  test('DELETE /domains/:id should return 409 when applications are linked', async ({ auth, testData }) => {
    const domain = await testData.createDomain({
      name: `Domain With App ${Date.now()}`,
    });

    await testData.createApplication({
      name: `App for Domain ${Date.now()}`,
      domainId: domain.id,
    });

    const response = await auth.request.delete(`/domains/${domain.id}`);

    const error = await expectError(response, 409, 'DEPENDENCY_CONFLICT');
    expect(error.message).toContain('application(s)');
  });

  test('DELETE /domains/:id should return 409 when business capabilities are linked', async ({ auth, testData }) => {
    const domain = await testData.createDomain({
      name: `Domain With BC ${Date.now()}`,
    });

    await testData.createBusinessCapability({
      name: `BC for Domain ${Date.now()}`,
      domainId: domain.id,
      level: 1,
    });

    const response = await auth.request.delete(`/domains/${domain.id}`);

    const error = await expectError(response, 409, 'DEPENDENCY_CONFLICT');
    expect(error.message).toContain('business capability(ies)');
  });

  test('DELETE /domains/:id should return 409 with both apps and business capabilities linked', async ({ auth, testData }) => {
    const domain = await testData.createDomain({
      name: `Domain With Both ${Date.now()}`,
    });

    await testData.createApplication({
      name: `App for Both ${Date.now()}`,
      domainId: domain.id,
    });

    await testData.createBusinessCapability({
      name: `BC for Both ${Date.now()}`,
      domainId: domain.id,
      level: 1,
    });

    const response = await auth.request.delete(`/domains/${domain.id}`);

    const error = await expectError(response, 409, 'DEPENDENCY_CONFLICT');
    expect(error.message).toContain('application(s)');
    expect(error.message).toContain('business capability(ies)');
  });
});
