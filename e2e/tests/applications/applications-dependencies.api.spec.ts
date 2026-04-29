import { test, expect } from '../../fixtures/index';
import { 
  expectSuccess, 
  expectError,
  DependenciesResponse 
} from '../../utils/api-helpers';

test.describe('Applications Dependencies API', () => {
  test('DELETE /applications/:id should return 409 when application has interfaces linked', async ({ auth, testData }) => {
    const domain = await testData.createDomain({
      name: `Domain for Interface Deps ${Date.now()}`,
    });

    const sourceApp = await testData.createApplication({
      name: `Source App Interfaces ${Date.now()}`,
      domainId: domain.id,
    });

    const targetApp = await testData.createApplication({
      name: `Target App Interfaces ${Date.now()}`,
      domainId: domain.id,
    });

    // Create interface linking sourceApp → targetApp
    await testData.createInterface({
      name: `Interface for Deps ${Date.now()}`,
      sourceAppId: sourceApp.id,
      targetAppId: targetApp.id,
      type: 'REST',
    });

    const response = await auth.request.delete(`applications/${sourceApp.id}`);

    const error = await expectError(response, 409, 'DEPENDENCY_CONFLICT');
    expect(error.details).toBeDefined();
    expect(error.details.sourceInterfaces).toBeGreaterThan(0);
  });

  test('DELETE /applications/:id should return 409 with detailed counts', async ({ auth, testData }) => {
    const domain = await testData.createDomain({
      name: `Domain for Deps Test ${Date.now()}`,
    });

    const sourceApp = await testData.createApplication({
      name: `Source App Deps Test ${Date.now()}`,
      domainId: domain.id,
    });

    const targetApp = await testData.createApplication({
      name: `Target App Deps Test ${Date.now()}`,
      domainId: domain.id,
    });

    // Create interface
    await testData.createInterface({
      sourceAppId: sourceApp.id,
      targetAppId: targetApp.id,
      type: 'REST',
    });

    // Check dependencies endpoint
    const depsResponse = await auth.request.get(`applications/${sourceApp.id}/dependencies`);
    const deps = await expectSuccess<DependenciesResponse>(depsResponse, 200);

    expect(deps.hasDependencies).toBe(true);
    expect(deps.counts.sourceInterfaces + deps.counts.targetInterfaces).toBeGreaterThan(0);

    // Try to delete
    const deleteResponse = await auth.request.delete(`applications/${sourceApp.id}`);
    const error = await expectError(deleteResponse, 409, 'DEPENDENCY_CONFLICT');

    expect(error.details).toHaveProperty('sourceInterfaces');
    expect(error.details).toHaveProperty('targetInterfaces');
    expect(error.details).toHaveProperty('capabilities');
    expect(error.details).toHaveProperty('dataObjects');
    expect(error.details).toHaveProperty('itComponents');
  });

  test('GET /applications/:id/dependencies should return hasDependencies=true when linked', async ({ auth, testData }) => {
    const domain = await testData.createDomain({
      name: `Domain for Deps Check ${Date.now()}`,
    });

    const sourceApp = await testData.createApplication({
      name: `Source App Deps Check ${Date.now()}`,
      domainId: domain.id,
    });

    const targetApp = await testData.createApplication({
      name: `Target App Deps Check ${Date.now()}`,
      domainId: domain.id,
    });

    // Create interface
    await testData.createInterface({
      sourceAppId: sourceApp.id,
      targetAppId: targetApp.id,
      type: 'REST',
    });

    const response = await auth.request.get(`applications/${sourceApp.id}/dependencies`);
    const deps = await expectSuccess<DependenciesResponse>(response, 200);

    expect(deps.hasDependencies).toBe(true);
    expect(deps.counts.sourceInterfaces + deps.counts.targetInterfaces).toBeGreaterThan(0);
  });

  test('GET /applications/:id/dependencies should return hasDependencies=false for isolated app', async ({ auth, testData }) => {
    const domain = await testData.createDomain({
      name: `Domain for No Deps ${Date.now()}`,
    });

    const app = await testData.createApplication({
      name: `App No Deps ${Date.now()}`,
      domainId: domain.id,
    });

    const response = await auth.request.get(`applications/${app.id}/dependencies`);
    const deps = await expectSuccess<DependenciesResponse>(response, 200);

    expect(deps.hasDependencies).toBe(false);
    expect(deps.counts.capabilities).toBe(0);
    expect(deps.counts.dataObjects).toBe(0);
    expect(deps.counts.itComponents).toBe(0);
    expect(deps.counts.sourceInterfaces).toBe(0);
    expect(deps.counts.targetInterfaces).toBe(0);
  });
});
