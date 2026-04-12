import { test, expect } from '../../fixtures/index';
import {
  expectSuccess,
  expectError,
  PaginatedResponse,
} from '../../utils/api-helpers';

interface BusinessCapabilityResponse {
  id: string;
  name: string;
  description?: string | null;
  comment?: string | null;
  level: number;
  parentId?: string | null;
  parent?: { id: string; name: string } | null;
  domainId?: string | null;
  domain?: { id: string; name: string } | null;
  createdAt: string;
  updatedAt: string;
  _count: { applicationMappings: number; children: number };
  tags: unknown[];
}

test.describe('Business Capabilities CRUD API', () => {
  test('GET /business-capabilities should return paginated list', async ({
    auth,
  }) => {
    const response = await auth.request.get('business-capabilities');
    const result = await expectSuccess<PaginatedResponse<BusinessCapabilityResponse>>(
      response,
      200,
    );

    expect(result).toHaveProperty('data');
    expect(result).toHaveProperty('meta');
    expect(Array.isArray(result.data)).toBe(true);
    expect(result.meta).toHaveProperty('total');
    expect(result.meta).toHaveProperty('page');
    expect(result.meta).toHaveProperty('limit');
    expect(result.meta).toHaveProperty('totalPages');
  });

  test('POST /business-capabilities should create a root capability (level=0)', async ({
    auth,
    testData,
  }) => {
    const name = `Root BC ${Date.now()}`;
    const bc = await testData.createBusinessCapability({
      name,
      description: 'Root level business capability',
      domainId: undefined as unknown as string,
      level: 0,
    });

    expect(bc.id).toBeTruthy();
    expect(bc.name).toBe(name);
    expect(bc.level).toBe(0);
    expect(bc.parentId).toBeNull();
    expect(bc._count).toBeDefined();
    expect(bc._count.children).toBe(0);
    expect(bc._count.applicationMappings).toBe(0);
    expect(Array.isArray(bc.tags)).toBe(true);
  });

  test('POST /business-capabilities should create a child capability with auto level', async ({
    auth,
    testData,
  }) => {
    const root = await testData.createBusinessCapability({
      name: `BC Root For Child ${Date.now()}`,
      domainId: undefined as unknown as string,
      level: 0,
    });

    const child = await testData.createBusinessCapability({
      name: `BC Child ${Date.now()}`,
      domainId: undefined as unknown as string,
      level: 1,
      parentId: root.id,
    });

    expect(child.level).toBe(1);
    expect(child.parentId).toBe(root.id);
  });

  test('GET /business-capabilities/:id should return detail with _count and tags', async ({
    auth,
    testData,
  }) => {
    const bc = await testData.createBusinessCapability({
      name: `BC Detail Test ${Date.now()}`,
      domainId: undefined as unknown as string,
      level: 0,
    });

    const response = await auth.request.get(`business-capabilities/${bc.id}`);
    const result = await expectSuccess<BusinessCapabilityResponse>(response, 200);

    expect(result.id).toBe(bc.id);
    expect(result._count).toBeDefined();
    expect(result._count.applicationMappings).toBeDefined();
    expect(result._count.children).toBeDefined();
    expect(Array.isArray(result.tags)).toBe(true);
  });

  test('GET /business-capabilities/:id should return 404 for unknown id', async ({
    auth,
  }) => {
    const response = await auth.request.get(
      'business-capabilities/00000000-0000-0000-0000-000000000000',
    );
    await expectError(response, 404);
  });

  test('PATCH /business-capabilities/:id should update name', async ({
    auth,
    testData,
  }) => {
    const bc = await testData.createBusinessCapability({
      name: `BC To Update ${Date.now()}`,
      domainId: undefined as unknown as string,
      level: 0,
    });

    const updatedName = `BC Updated ${Date.now()}`;
    const response = await auth.request.patch(`business-capabilities/${bc.id}`, {
      data: { name: updatedName },
    });
    const result = await expectSuccess<BusinessCapabilityResponse>(response, 200);

    expect(result.name).toBe(updatedName);
  });

  test('DELETE /business-capabilities/:id should delete leaf capability (204)', async ({
    auth,
  }) => {
    // Create directly via API to have full control (no auto-cleanup for this test)
    const createResp = await auth.request.post('business-capabilities', {
      data: { name: `BC To Delete ${Date.now()}` },
    });
    const bc = await createResp.json();

    const response = await auth.request.delete(`business-capabilities/${bc.id}`);
    expect(response.status()).toBe(204);
  });

  test('GET /business-capabilities/:id/children should return paginated children', async ({
    auth,
    testData,
  }) => {
    const root = await testData.createBusinessCapability({
      name: `BC Root Children Test ${Date.now()}`,
      domainId: undefined as unknown as string,
      level: 0,
    });

    await testData.createBusinessCapability({
      name: `BC Child 1 ${Date.now()}`,
      domainId: undefined as unknown as string,
      level: 1,
      parentId: root.id,
    });

    const response = await auth.request.get(`business-capabilities/${root.id}/children`);
    const result = await expectSuccess<PaginatedResponse<BusinessCapabilityResponse>>(
      response,
      200,
    );

    expect(result.data.length).toBeGreaterThanOrEqual(1);
    expect(result.data.every((c) => c.parentId === root.id)).toBe(true);
  });

  test('GET /business-capabilities/:id/applications should return paginated apps', async ({
    auth,
    testData,
  }) => {
    const bc = await testData.createBusinessCapability({
      name: `BC Apps Test ${Date.now()}`,
      domainId: undefined as unknown as string,
      level: 0,
    });

    const response = await auth.request.get(
      `business-capabilities/${bc.id}/applications`,
    );
    const result = await expectSuccess<PaginatedResponse<unknown>>(response, 200);

    expect(result).toHaveProperty('data');
    expect(result).toHaveProperty('meta');
    expect(Array.isArray(result.data)).toBe(true);
  });
});
