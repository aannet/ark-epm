import { test, expect } from '../../fixtures';

test.describe('IT Components CRUD API', () => {
  test('GET /it-components - should return paginated list', async ({ authenticatedRequest }) => {
    const res = await authenticatedRequest.get('it-components?page=1&limit=10');
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

  test('POST /it-components - should create IT component', async ({ authenticatedRequest, testData }) => {
    const itComponent = await testData.createItComponent({
      name: `Test IT Component ${Date.now()}`,
      description: 'Created by e2e test',
      technology: 'PostgreSQL',
      type: 'database',
    });

    expect(itComponent).toHaveProperty('id');
    expect(itComponent.name).toContain('Test IT Component');
    expect(itComponent.description).toBe('Created by e2e test');
    expect(itComponent.technology).toBe('PostgreSQL');
    expect(itComponent.type).toBe('database');
  });

  test('GET /it-components/:id - should get single IT component', async ({ authenticatedRequest, testData }) => {
    const created = await testData.createItComponent({
      name: `Detail Test ${Date.now()}`,
      technology: 'Elasticsearch',
    });

    const res = await authenticatedRequest.get(`it-components/${created.id}`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.id).toBe(created.id);
    expect(body.name).toBe(created.name);
  });

  test('GET /it-components/:id - should return 404 for non-existent IT component', async ({ authenticatedRequest }) => {
    const fakeId = 'ffffffff-ffff-ffff-ffff-ffffffffffff';
    const res = await authenticatedRequest.get(`it-components/${fakeId}`);
    expect(res.status()).toBe(404);
  });

  test('PATCH /it-components/:id - should update IT component', async ({ authenticatedRequest, testData }) => {
    const created = await testData.createItComponent({
      name: `Update Test ${Date.now()}`,
      technology: 'MongoDB',
      type: 'database',
    });

    const res = await authenticatedRequest.patch(`it-components/${created.id}`, {
      data: {
        description: 'Updated description',
        technology: 'MongoDB 6.0',
      },
    });

    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.description).toBe('Updated description');
    expect(body.technology).toBe('MongoDB 6.0');
    expect(body.name).toBe(created.name); // Should not change
  });

  test('DELETE /it-components/:id - should delete IT component without dependencies', async ({ authenticatedRequest }) => {
    const created = await testData.createItComponent({
      name: `Delete Test ${Date.now()}`,
    });

    const deleteRes = await authenticatedRequest.delete(`it-components/${created.id}`);
    expect(deleteRes.status()).toBe(204); // No Content

    // Verify it's deleted
    const getRes = await authenticatedRequest.get(`it-components/${created.id}`);
    expect(getRes.status()).toBe(404);
  });

  test('DELETE /it-components/:id - should return 409 when IT component has linked applications', async ({
    authenticatedRequest,
    testData,
  }) => {
    const domain = await testData.createDomain({
      name: `Domain for IC Test ${Date.now()}`,
    });

    const itComponent = await testData.createItComponent({
      name: `IC with Apps ${Date.now()}`,
    });

    // Create application linked to IT component
    const application = await testData.createApplication({
      name: `App linked to IC ${Date.now()}`,
      domainId: domain.id,
      itComponents: [{ id: itComponent.id }],
    });

    // Try to delete IT component
    const deleteRes = await authenticatedRequest.delete(`it-components/${itComponent.id}`);
    expect(deleteRes.status()).toBe(409); // Conflict

    const body = await deleteRes.json();
    expect(body.code).toBe('DEPENDENCY_CONFLICT');
    expect(body.details).toHaveProperty('applicationsCount');
    expect(body.details.applicationsCount).toBeGreaterThan(0);
  });

  test('GET /it-components - should support filtering by type', async ({ authenticatedRequest, testData }) => {
    await testData.createItComponent({
      name: `DB Component ${Date.now()}`,
      type: 'database',
    });

    const res = await authenticatedRequest.get('it-components?type=database&limit=100');
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.data.length).toBeGreaterThan(0);
    body.data.forEach((item: any) => {
      expect(item.type).toBe('database');
    });
  });

  test('GET /it-components - should support filtering by technology', async ({ authenticatedRequest, testData }) => {
    await testData.createItComponent({
      name: `Redis Component ${Date.now()}`,
      technology: 'Redis 7.0',
    });

    const res = await authenticatedRequest.get('it-components?technology=Redis%207.0&limit=100');
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.data.length).toBeGreaterThan(0);
  });

  test('GET /it-components - should support search by name', async ({ authenticatedRequest, testData }) => {
    const uniqueName = `SearchTest${Date.now()}`;
    await testData.createItComponent({
      name: uniqueName,
      type: 'search-engine',
    });

    const res = await authenticatedRequest.get(`it-components?search=${uniqueName}`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.data.length).toBeGreaterThan(0);
    expect(body.data[0].name).toContain(uniqueName);
  });
});
