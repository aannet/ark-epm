import { test, expect } from '../../fixtures/index';
import {
  expectSuccess,
  ApplicationResponse,
  DependenciesResponse,
  PaginatedResponse,
  expectPaginationMeta
} from '../../utils/api-helpers';

test.describe('Applications CRUD API', () => {
  test('GET /applications should return paginated list', async ({ auth }) => {
    const response = await auth.request.get('applications');
    const result = await expectSuccess<PaginatedResponse<ApplicationResponse>>(response, 200);

    expect(result).toHaveProperty('data');
    expect(result).toHaveProperty('meta');
    expect(Array.isArray(result.data)).toBe(true);
    expectPaginationMeta(result.meta, {});
  });

  test('POST /applications should create an application', async ({ _auth, testData }) => {
    const domain = await testData.createDomain({
      name: `Test Domain ${Date.now()}`,
    });

    const app = await testData.createApplication({
      name: `Test Application ${Date.now()}`,
      description: 'Test description',
      comment: 'Test comment',
      domainId: domain.id,
      criticality: 'high',
      lifecycleStatus: 'production',
    });

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
  });

  test('GET /applications/:id should return application with populated relations', async ({ auth, testData }) => {
    const domain = await testData.createDomain({
      name: `Domain for App ${Date.now()}`,
    });

    const createdApp = await testData.createApplication({
      name: `App for Get Test ${Date.now()}`,
      description: 'Test app',
      domainId: domain.id,
    });

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

    const createdApp = await testData.createApplication({
      name: `App for Deps Test ${Date.now()}`,
      domainId: domain.id,
    });

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

    const createdApp = await testData.createApplication({
      name: `App for Update ${Date.now()}`,
      description: 'Original description',
      criticality: 'low',
      domainId: domain.id,
    });

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

    const createdApp = await testData.createApplication({
      name: `App to Delete ${Date.now()}`,
      domainId: domain.id,
    });

    const response = await auth.request.delete(`applications/${createdApp.id}`);
    expect(response.status()).toBe(204);

    const getResponse = await auth.request.get(`applications/${createdApp.id}`);
    expect(getResponse.status()).toBe(404);
    const body = await getResponse.json();
    expect(body.code).toBe('APPLICATION_NOT_FOUND');
  });

  test('POST /applications should create application with IT components', async ({ _auth, testData }) => {
    const domain = await testData.createDomain({
      name: `Domain for IT Component test ${Date.now()}`,
    });

    const ic = await testData.createItComponent({
      name: `Test IC ${Date.now()}`,
      technology: 'PostgreSQL',
    });

    const app = await testData.createApplication({
      name: `App with IC ${Date.now()}`,
      domainId: domain.id,
      criticality: 'medium',
      lifecycleStatus: 'production',
      itComponents: [{ id: ic.id }],
    });

    expect(app.itComponents).toBeDefined();
    expect(app.itComponents?.length).toBe(1);
    expect(app.itComponents?.[0].id).toBe(ic.id);
    expect(app.itComponents?.[0].name).toBe(ic.name);
  });

  test('PATCH /applications/:id should update IT components', async ({ auth, testData }) => {
    const domain = await testData.createDomain({
      name: `Domain for update test ${Date.now()}`,
    });

    const ic1 = await testData.createItComponent({
      name: `IC 1 for update ${Date.now()}`,
    });

    const ic2 = await testData.createItComponent({
      name: `IC 2 for update ${Date.now()}`,
    });

    const app = await testData.createApplication({
      name: `App for IC update ${Date.now()}`,
      domainId: domain.id,
      itComponents: [{ id: ic1.id }],
    });

    const updateResponse = await auth.request.patch(`applications/${app.id}`, {
      data: {
        itComponents: [{ id: ic2.id }],
      },
    });

    const updated = await expectSuccess<ApplicationResponse>(updateResponse, 200);
    expect(updated.itComponents?.length).toBe(1);
    expect(updated.itComponents?.[0].id).toBe(ic2.id);
  });

  test('GET /applications/:id should include itComponents', async ({ auth, testData }) => {
    const domain = await testData.createDomain({
      name: `Domain for get test ${Date.now()}`,
    });

    const ic = await testData.createItComponent({
      name: `IC for detail ${Date.now()}`,
    });

    const app = await testData.createApplication({
      name: `App for detail view ${Date.now()}`,
      domainId: domain.id,
      itComponents: [{ id: ic.id }],
    });

    const response = await auth.request.get(`applications/${app.id}`);
    const detail = await expectSuccess<ApplicationResponse>(response, 200);
    expect(detail.itComponents).toBeDefined();
    expect(detail.itComponents?.length).toBe(1);
    expect(detail.itComponents?.[0].id).toBe(ic.id);
  });

  test('POST /applications should create application with business capabilities', async ({ _auth, testData }) => {
    const domain = await testData.createDomain({
      name: `Domain for BC create ${Date.now()}`,
    });

    const bc = await testData.createBusinessCapability({
      name: `Business Capability ${Date.now()}`,
      domainId: domain.id,
      level: 1,
    });

    const app = await testData.createApplication({
      name: `App with BC ${Date.now()}`,
      domainId: domain.id,
      capabilityIds: [bc.id],
    });

    expect(app.businessCapabilities).toBeDefined();
    expect(app.businessCapabilities.length).toBe(1);
    expect(app.businessCapabilities?.[0].id).toBe(bc.id);
    expect(app.businessCapabilities?.[0].name).toBe(bc.name);
  });

  test('PATCH /applications/:id should update business capabilities', async ({ auth, testData }) => {
    const domain = await testData.createDomain({
      name: `Domain for BC update ${Date.now()}`,
    });

    const bc1 = await testData.createBusinessCapability({
      name: `Business Capability A ${Date.now()}`,
      domainId: domain.id,
      level: 1,
    });

    const bc2 = await testData.createBusinessCapability({
      name: `Business Capability B ${Date.now()}`,
      domainId: domain.id,
      level: 1,
    });

    const app = await testData.createApplication({
      name: `App BC update ${Date.now()}`,
      domainId: domain.id,
      capabilityIds: [bc1.id],
    });

    const updateResponse = await auth.request.patch(`applications/${app.id}`, {
      data: {
        capabilityIds: [bc2.id],
      },
    });

    const updated = await expectSuccess<ApplicationResponse>(updateResponse, 200);
    expect(updated.businessCapabilities).toHaveLength(1);
    expect(updated.businessCapabilities?.[0].id).toBe(bc2.id);
  });

  test('GET /applications/:id should include businessCapabilities', async ({ auth, testData }) => {
    const domain = await testData.createDomain({
      name: `Domain for BC detail ${Date.now()}`,
    });

    const bc = await testData.createBusinessCapability({
      name: `Business Capability detail ${Date.now()}`,
      domainId: domain.id,
      level: 1,
    });

    const app = await testData.createApplication({
      name: `App BC detail ${Date.now()}`,
      domainId: domain.id,
      capabilityIds: [bc.id],
    });

    const response = await auth.request.get(`applications/${app.id}`);
    const detail = await expectSuccess<ApplicationResponse>(response, 200);
    expect(detail.businessCapabilities).toBeDefined();
    expect(detail.businessCapabilities).toHaveLength(1);
    expect(detail.businessCapabilities?.[0].id).toBe(bc.id);
  });
});
