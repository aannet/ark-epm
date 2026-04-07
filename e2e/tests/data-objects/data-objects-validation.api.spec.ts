import { test, expect } from '../../fixtures';

test.describe('Data Objects Validation API', () => {
  test('POST /data-objects - should return 400 when name is missing', async ({ authenticatedRequest }) => {
    const res = await authenticatedRequest.post('data-objects', {
      data: { description: 'No name provided' },
    });
    expect(res.status()).toBe(400);
  });

  test('POST /data-objects - should return 400 for spaces-only name', async ({ authenticatedRequest }) => {
    const res = await authenticatedRequest.post('data-objects', {
      data: { name: '   ' },
    });
    expect(res.status()).toBe(400);
  });

  test('POST /data-objects - should return 409 CONFLICT for duplicate name', async ({ authenticatedRequest, testData }) => {
    const name = `Duplicate DO ${Date.now()}`;
    await testData.createDataObject({ name });

    const res = await authenticatedRequest.post('data-objects', {
      data: { name },
    });
    expect(res.status()).toBe(409);
    const body = await res.json();
    expect(body.code).toBe('CONFLICT');
  });

  test('PATCH /data-objects/:id - should return 409 CONFLICT for duplicate name on update', async ({ authenticatedRequest, testData }) => {
    const ts = Date.now();
    const do1 = await testData.createDataObject({ name: `DO Unique1 ${ts}` });
    const do2 = await testData.createDataObject({ name: `DO Unique2 ${ts}` });

    const res = await authenticatedRequest.patch(`data-objects/${do2.id}`, {
      data: { name: do1.name },
    });
    expect(res.status()).toBe(409);
    const body = await res.json();
    expect(body.code).toBe('CONFLICT');
  });

  test('GET /data-objects/:id - should return 404 with proper error format', async ({ authenticatedRequest }) => {
    const fakeId = 'ffffffff-ffff-ffff-ffff-ffffffffffff';
    const res = await authenticatedRequest.get(`data-objects/${fakeId}`);
    expect(res.status()).toBe(404);
    const body = await res.json();
    // F-999 Item 1: format d'erreur normalisé
    expect(body).toHaveProperty('statusCode', 404);
    expect(body).toHaveProperty('code');
    expect(body).toHaveProperty('message');
  });

  test('PATCH /data-objects/:id - should return 404 for non-existent UUID', async ({ authenticatedRequest }) => {
    const fakeId = 'ffffffff-ffff-ffff-ffff-ffffffffffff';
    const res = await authenticatedRequest.patch(`data-objects/${fakeId}`, {
      data: { description: 'update on ghost' },
    });
    expect(res.status()).toBe(404);
  });

  test('DELETE /data-objects/:id - should return 404 for non-existent UUID', async ({ authenticatedRequest }) => {
    const fakeId = 'ffffffff-ffff-ffff-ffff-ffffffffffff';
    const res = await authenticatedRequest.delete(`data-objects/${fakeId}`);
    expect(res.status()).toBe(404);
  });
});
