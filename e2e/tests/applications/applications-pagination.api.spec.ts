import { test, expect, TestDataFactory } from '../../fixtures/index';
import { 
  expectSuccess, 
  ApplicationResponse,
  PaginatedResponse,
  expectPaginationMeta 
} from '../../utils/api-helpers';

test.describe('Applications Pagination and Filters API', () => {
  test('GET /applications should filter by lifecycle status', async ({ auth, testData }) => {
    const domain = await testData.createDomain({
      name: `Domain for Filter ${Date.now()}`,
    });

    await testData.createApplication({
      name: `App Production ${Date.now()}`,
      domainId: domain.id,
      lifecycleStatus: 'production',
    });

    await testData.createApplication({
      name: `App Development ${Date.now()}`,
      domainId: domain.id,
      lifecycleStatus: 'development',
    });

    const response = await auth.request.get('applications?lifecycleStatus=production');
    const result = await expectSuccess<PaginatedResponse<ApplicationResponse>>(response, 200);

    expect(result.data.length).toBeGreaterThan(0);
    expect(result.data.every((app: ApplicationResponse) => app.lifecycleStatus === 'production')).toBe(true);
  });

  test('GET /applications should paginate correctly', async ({ auth }) => {
    const response = await auth.request.get('applications?page=1&limit=10');
    const result = await expectSuccess<PaginatedResponse<ApplicationResponse>>(response, 200);

    expectPaginationMeta(result.meta, { page: 1, limit: 10 });
    expect(result.data.length).toBeLessThanOrEqual(10);
  });

  test('GET /applications should return empty list when no apps match', async ({ auth }) => {
    const response = await auth.request.get('applications?lifecycleStatus=nonexistent-status-xyz');
    const result = await expectSuccess<PaginatedResponse<ApplicationResponse>>(response, 200);

    expect(result.data).toEqual([]);
    expectPaginationMeta(result.meta, { total: 0, totalPages: 0 });
  });

  test('GET /applications should sort by name', async ({ auth, testData }) => {
    const domain = await testData.createDomain({
      name: `Domain for Sort ${Date.now()}`,
    });

    const appA = await testData.createApplication({
      name: `Zebra App ${Date.now()}`,
      domainId: domain.id,
    });

    const appB = await testData.createApplication({
      name: `Alpha App ${Date.now()}`,
      domainId: domain.id,
    });

    const response = await auth.request.get('applications?sortBy=name&sortOrder=asc');
    const result = await expectSuccess<PaginatedResponse<ApplicationResponse>>(response, 200);

    const appNames = result.data.map((app: ApplicationResponse) => app.name);
    const zebraIndex = appNames.indexOf(appA.name);
    const alphaIndex = appNames.indexOf(appB.name);

    expect(alphaIndex).toBeLessThan(zebraIndex);
  });

  test('GET /applications should include all meta fields', async ({ auth }) => {
    const response = await auth.request.get('applications');
    const result = await expectSuccess<PaginatedResponse<ApplicationResponse>>(response, 200);

    expect(result.meta).toHaveProperty('page');
    expect(result.meta).toHaveProperty('limit');
    expect(result.meta).toHaveProperty('total');
    expect(result.meta).toHaveProperty('totalPages');
    expect(typeof result.meta.page).toBe('number');
    expect(typeof result.meta.limit).toBe('number');
    expect(typeof result.meta.total).toBe('number');
    expect(typeof result.meta.totalPages).toBe('number');
  });
});
