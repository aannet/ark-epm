import { test, expect } from '../../fixtures';

test.describe('Data Objects CRUD API', () => {
  test('GET /data-objects - should return paginated list', async ({ authenticatedRequest }) => {
    const res = await authenticatedRequest.get('data-objects?page=1&limit=10');
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('data');
    expect(body).toHaveProperty('meta');
    expect(body.data).toBeInstanceOf(Array);
    expect(body.meta).toHaveProperty('page');
    expect(body.meta).toHaveProperty('limit');
    expect(body.meta).toHaveProperty('total');
    expect(body.meta).toHaveProperty('totalPages');
  });

  test('POST /data-objects - should create data object with all fields', async ({ testData }) => {
    const dataObject = await testData.createDataObject({
      name: `Test DataObject ${Date.now()}`,
      description: 'Created by e2e test',
      type: 'database',
      isSourceOfTruth: true,
    });

    expect(dataObject).toHaveProperty('id');
    expect(dataObject.name).toContain('Test DataObject');
    expect(dataObject.description).toBe('Created by e2e test');
    expect(dataObject.type).toBe('database');
    expect(dataObject.isSourceOfTruth).toBe(true);
  });

  test('POST /data-objects - should create data object with name only', async ({ testData }) => {
    const dataObject = await testData.createDataObject({
      name: `Minimal DO ${Date.now()}`,
    });

    expect(dataObject).toHaveProperty('id');
    expect(dataObject.isSourceOfTruth).toBe(false);
    expect(dataObject.type).toBeNull();
  });

  test('GET /data-objects/:id - should return data object with _count and tags', async ({ authenticatedRequest, testData }) => {
    const created = await testData.createDataObject({
      name: `Detail Test ${Date.now()}`,
      type: 'dataset',
    });

    const res = await authenticatedRequest.get(`data-objects/${created.id}`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.id).toBe(created.id);
    expect(body.name).toBe(created.name);
    expect(body._count).toBeDefined();
    expect(body._count.appDataObjectMaps).toBeGreaterThanOrEqual(0);
    expect(body.tags).toBeInstanceOf(Array);
  });

  test('GET /data-objects/:id - should return 404 for non-existent UUID', async ({ authenticatedRequest }) => {
    const fakeId = 'ffffffff-ffff-ffff-ffff-ffffffffffff';
    const res = await authenticatedRequest.get(`data-objects/${fakeId}`);
    expect(res.status()).toBe(404);
  });

  test('PATCH /data-objects/:id - should update data object', async ({ authenticatedRequest, testData }) => {
    const created = await testData.createDataObject({
      name: `Update Test ${Date.now()}`,
      type: 'file',
    });

    const res = await authenticatedRequest.patch(`data-objects/${created.id}`, {
      data: {
        description: 'Updated description',
        type: 'dataset',
        isSourceOfTruth: true,
      },
    });

    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.description).toBe('Updated description');
    expect(body.type).toBe('dataset');
    expect(body.isSourceOfTruth).toBe(true);
    expect(body.name).toBe(created.name); // unchanged
  });

  test('DELETE /data-objects/:id - should delete and return 204', async ({ authenticatedRequest, testData }) => {
    const created = await testData.createDataObject({
      name: `Delete Test ${Date.now()}`,
    });

    const deleteRes = await authenticatedRequest.delete(`data-objects/${created.id}`);
    expect(deleteRes.status()).toBe(204);

    const getRes = await authenticatedRequest.get(`data-objects/${created.id}`);
    expect(getRes.status()).toBe(404);
  });

  test('GET /data-objects - should filter by search (case-insensitive)', async ({ authenticatedRequest, testData }) => {
    const uniquePrefix = `SearchableDataObj${Date.now()}`;
    await testData.createDataObject({ name: uniquePrefix });

    const res = await authenticatedRequest.get(`data-objects?search=${uniquePrefix.toLowerCase()}`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.data.length).toBeGreaterThan(0);
    expect(body.data[0].name).toContain(uniquePrefix);
  });

  test('GET /data-objects - should filter by type', async ({ authenticatedRequest, testData }) => {
    const uniqueName = `TypeFilter${Date.now()}`;
    await testData.createDataObject({ name: uniqueName, type: 'file' });

    const res = await authenticatedRequest.get('data-objects?type=file&limit=100');
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.data.length).toBeGreaterThan(0);
    body.data.forEach((item: { type: string }) => {
      expect(item.type).toBe('file');
    });
  });

  test('GET /data-objects - should filter by isSourceOfTruth', async ({ authenticatedRequest, testData }) => {
    await testData.createDataObject({
      name: `SoT Filter ${Date.now()}`,
      isSourceOfTruth: true,
    });

    const res = await authenticatedRequest.get('data-objects?isSourceOfTruth=true&limit=100');
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.data.length).toBeGreaterThan(0);
    body.data.forEach((item: { isSourceOfTruth: boolean }) => {
      expect(item.isSourceOfTruth).toBe(true);
    });
  });

  test('GET /data-objects - should support sortBy=name asc', async ({ authenticatedRequest, testData }) => {
    const ts = Date.now();
    const first = await testData.createDataObject({ name: `Zzz Sort ${ts}` });
    const second = await testData.createDataObject({ name: `Aaa Sort ${ts}` });

    const res = await authenticatedRequest.get('data-objects?sortBy=name&sortOrder=asc&limit=100');
    expect(res.status()).toBe(200);
    const body = await res.json();
    const names: string[] = body.data.map((d: { name: string }) => d.name);
    const firstIndex = names.indexOf(first.name);
    const secondIndex = names.indexOf(second.name);

    expect(firstIndex).toBeGreaterThan(-1);
    expect(secondIndex).toBeGreaterThan(-1);
    expect(secondIndex).toBeLessThan(firstIndex);
  });
});
