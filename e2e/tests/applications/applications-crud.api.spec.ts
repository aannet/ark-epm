import { test, expect, TestDataFactory } from '../../fixtures/index';
import { 
  expectSuccess, 
  expectError,
  ApplicationResponse, 
  DependenciesResponse,
  PaginatedResponse,
  expectPaginationMeta 
} from '../../utils/api-helpers';

test.describe('Applications CRUD API', () => {
  let createdAppId: string;

  test('GET /applications should return paginated list', async ({ auth }) => {
    const response = await auth.request.get('applications');
    const result = await expectSuccess<PaginatedResponse<ApplicationResponse>>(response, 200);

    expect(result).toHaveProperty('data');
    expect(result).toHaveProperty('meta');
    expect(Array.isArray(result.data)).toBe(true);
    expectPaginationMeta(result.meta, {});
  });

  test('POST /applications should create an application', async ({ auth, testData }) => {
    const domain = await testData.createDomain({
      name: `Test Domain ${Date.now()}`,
    });

    const response = await auth.request.post('applications', {
      data: {
        name: `Test Application ${Date.now()}`,
        description: 'Test description',
        comment: 'Test comment',
        domainId: domain.id,
        criticality: 'high',
        lifecycleStatus: 'production',
      },
    });

    const app = await expectSuccess<ApplicationResponse>(response, 201);

    expect(app.id).toBeTruthy();
    expect(app.name).toContain('Test Application');
    expect(app.description).toBe('Test description');
    expect(app.comment).toBe('Test comment');
    expect(app.criticality).toBe('high');
    expect(app.lifecycleStatus).toBe('production');
    expect(app.domain).toBeDefined();
    expect(app.domain!.id).toBe(domain.id);
    expect(app.tags).toBeDefined();
    expect(Array.isArray(app.tags)).toBe(true);

    createdAppId = app.id;
  });

  test('GET /applications/:id should return application with populated relations', async ({ auth, testData }) => {
    const domain = await testData.createDomain({
      name: `Domain for App ${Date.now()}`,
    });

    const createResponse = await auth.request.post('applications', {
      data: {
        name: `App for Get Test ${Date.now()}`,
        description: 'Test app',
        domainId: domain.id,
      },
    });

    const createdApp = await expectSuccess<ApplicationResponse>(createResponse, 201);
    createdAppId = createdApp.id;

    const response = await auth.request.get(`applications/${createdApp.id}`);
    const app = await expectSuccess<ApplicationResponse>(response, 200);

    expect(app.id).toBe(createdApp.id);
    expect(app.name).toBe(createdApp.name);
    expect(app.domain).toBeDefined();
    expect(app.domain!.id).toBe(domain.id);
    expect(app.tags).toBeDefined();
  });

  test('GET /applications/:id should return 404 for non-existent id', async ({ auth }) => {
    const response = await auth.request.get('applications/00000000-0000-0000-0000-000000000000');

    expect(response.status()).toBe(404);
    const body = await response.json();
    expect(body.code).toBe('APPLICATION_NOT_FOUND');
  });

  test('GET /applications/:id/dependencies should return dependency counts', async ({ auth, testData }) => {
    const domain = await testData.createDomain({
      name: `Domain for Deps ${Date.now()}`,
    });

    const createResponse = await auth.request.post('applications', {
      data: {
        name: `App for Deps Test ${Date.now()}`,
        domainId: domain.id,
      },
    });

    const createdApp = await expectSuccess<ApplicationResponse>(createResponse, 201);
    createdAppId = createdApp.id;

    const response = await auth.request.get(`applications/${createdApp.id}/dependencies`);
    const deps = await expectSuccess<DependenciesResponse>(response, 200);

    expect(deps).toHaveProperty('hasDependencies');
    expect(deps).toHaveProperty('counts');
    expect(deps.counts).toHaveProperty('capabilities');
    expect(deps.counts).toHaveProperty('dataObjects');
    expect(deps.counts).toHaveProperty('itComponents');
    expect(deps.counts).toHaveProperty('sourceInterfaces');
    expect(deps.counts).toHaveProperty('targetInterfaces');
    expect(deps.hasDependencies).toBe(false);
  });

  test('PATCH /applications/:id should update application', async ({ auth, testData }) => {
    const domain = await testData.createDomain({
      name: `Domain for Update ${Date.now()}`,
    });

    const createResponse = await auth.request.post('applications', {
      data: {
        name: `App for Update ${Date.now()}`,
        description: 'Original description',
        criticality: 'low',
        domainId: domain.id,
      },
    });

    const createdApp = await expectSuccess<ApplicationResponse>(createResponse, 201);
    createdAppId = createdApp.id;

    const response = await auth.request.patch(`applications/${createdApp.id}`, {
      data: {
        description: 'Updated description',
        criticality: 'medium',
      },
    });

    const updated = await expectSuccess<ApplicationResponse>(response, 200);

    expect(updated.id).toBe(createdApp.id);
    expect(updated.description).toBe('Updated description');
    expect(updated.criticality).toBe('medium');
    expect(updated.name).toBe(createdApp.name);
  });

  test('DELETE /applications/:id should delete application without dependencies', async ({ auth, testData }) => {
    const domain = await testData.createDomain({
      name: `Domain for Delete ${Date.now()}`,
    });

    const createResponse = await auth.request.post('applications', {
      data: {
        name: `App to Delete ${Date.now()}`,
        domainId: domain.id,
      },
    });

    const createdApp = await expectSuccess<ApplicationResponse>(createResponse, 201);

    const response = await auth.request.delete(`applications/${createdApp.id}`);
    expect(response.status()).toBe(204);

    const getResponse = await auth.request.get(`applications/${createdApp.id}`);
    expect(getResponse.status()).toBe(404);
    const body = await getResponse.json();
    expect(body.code).toBe('APPLICATION_NOT_FOUND');
  });
});
