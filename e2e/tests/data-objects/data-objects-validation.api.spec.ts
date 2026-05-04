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

  // AGENT-DECISION: qa — T-099 ZAP injection validation tests
  test('POST /data-objects - should reject command injection in name (semicolon)', async ({ authenticatedRequest }) => {
    const res = await authenticatedRequest.post('data-objects', {
      data: { name: 'ZAP;cat /etc/passwd;' },
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    // Validation error — status 400 is sufficient proof of rejection
    expect(body.statusCode).toBe(400);
  });

  test('POST /data-objects - should reject shell pipe injection in name', async ({ authenticatedRequest }) => {
    const res = await authenticatedRequest.post('data-objects', {
      data: { name: 'ZAP|type %SYSTEMROOT%\\win.ini' },
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.statusCode).toBe(400);
  });

  test('POST /data-objects - should reject URL scheme injection in name', async ({ authenticatedRequest }) => {
    const res = await authenticatedRequest.post('data-objects', {
      data: { name: 'http://www.google.com/search?q=ZAP' },
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.statusCode).toBe(400);
  });

  test('POST /data-objects - should reject XML/SSTI markers in name', async ({ authenticatedRequest }) => {
    const res = await authenticatedRequest.post('data-objects', {
      data: { name: 'Valid Name ]]>' },
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.statusCode).toBe(400);
  });

  test('POST /data-objects - should reject backtick injection in name', async ({ authenticatedRequest }) => {
    const res = await authenticatedRequest.post('data-objects', {
      data: { name: 'Data`whoami`' },
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.statusCode).toBe(400);
  });

  test('POST /data-objects - should accept valid name with spaces and hyphens', async ({ authenticatedRequest }) => {
    const res = await authenticatedRequest.post('data-objects', {
      data: { name: 'Valid Data Object - Test Name' },
    });
    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body.name).toBe('Valid Data Object - Test Name');
    // Cleanup
    await authenticatedRequest.delete(`data-objects/${body.id}`);
  });

  test('PATCH /data-objects/:id - should reject injection in name during update', async ({ authenticatedRequest, testData }) => {
    const dataObject = await testData.createDataObject({ name: 'Original Name' });

    const res = await authenticatedRequest.patch(`data-objects/${dataObject.id}`, {
      data: { name: 'ZAP;cat /etc/passwd;' },
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.statusCode).toBe(400);
  });
});
