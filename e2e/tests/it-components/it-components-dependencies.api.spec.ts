import { test, expect } from '../fixtures';

test.describe('IT Components ↔ Applications Bidirectional Relationship', () => {
  test('GET /it-components/:id/applications - should return linked applications', async ({ authenticatedRequest, testData }) => {
    const domain = await testData.createDomain({
      name: `Domain ${Date.now()}`,
    });

    const itComponent = await testData.createItComponent({
      name: `IC for apps query ${Date.now()}`,
    });

    const app1 = await testData.createApplication({
      name: `App 1 ${Date.now()}`,
      domainId: domain.id,
      itComponents: [{ id: itComponent.id }],
    });

    const app2 = await testData.createApplication({
      name: `App 2 ${Date.now()}`,
      domainId: domain.id,
      itComponents: [{ id: itComponent.id }],
    });

    const res = await authenticatedRequest.get(`/it-components/${itComponent.id}/applications`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.data).toBeInstanceOf(Array);
    expect(body.meta.total).toBe(2);
    const appIds = body.data.map((a: any) => a.id);
    expect(appIds).toContain(app1.id);
    expect(appIds).toContain(app2.id);
  });

  test('GET /applications/:id/it-components - should return linked IT components', async ({ authenticatedRequest, testData }) => {
    const domain = await testData.createDomain({
      name: `Domain ${Date.now()}`,
    });

    const ic1 = await testData.createItComponent({
      name: `IC 1 ${Date.now()}`,
    });

    const ic2 = await testData.createItComponent({
      name: `IC 2 ${Date.now()}`,
    });

    const app = await testData.createApplication({
      name: `App with ICs ${Date.now()}`,
      domainId: domain.id,
      itComponents: [{ id: ic1.id }, { id: ic2.id }],
    });

    const res = await authenticatedRequest.get(`/applications/${app.id}/it-components`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.data).toBeInstanceOf(Array);
    expect(body.meta.total).toBe(2);
    const icIds = body.data.map((ic: any) => ic.id);
    expect(icIds).toContain(ic1.id);
    expect(icIds).toContain(ic2.id);
  });

  test('POST /applications - should create application with IT components', async ({ authenticatedRequest, testData }) => {
    const domain = await testData.createDomain({
      name: `Domain ${Date.now()}`,
    });

    const ic = await testData.createItComponent({
      name: `IC for creation ${Date.now()}`,
    });

    const res = await authenticatedRequest.post('/applications', {
      data: {
        name: `App with IC ${Date.now()}`,
        domainId: domain.id,
        criticality: 'high',
        lifecycleStatus: 'production',
        itComponents: [{ id: ic.id }],
      },
    });

    expect(res.status()).toBe(201);
    const app = await res.json();
    expect(app.itComponents).toBeInstanceOf(Array);
    expect(app.itComponents.length).toBe(1);
    expect(app.itComponents[0].id).toBe(ic.id);
    expect(app.itComponents[0].name).toBe(ic.name);
  });

  test('PATCH /applications/:id - should update IT components (replace strategy)', async ({ authenticatedRequest, testData }) => {
    const domain = await testData.createDomain({
      name: `Domain ${Date.now()}`,
    });

    const ic1 = await testData.createItComponent({
      name: `IC 1 for replace ${Date.now()}`,
    });

    const ic2 = await testData.createItComponent({
      name: `IC 2 for replace ${Date.now()}`,
    });

    const ic3 = await testData.createItComponent({
      name: `IC 3 for replace ${Date.now()}`,
    });

    const app = await testData.createApplication({
      name: `App for IC update ${Date.now()}`,
      domainId: domain.id,
      itComponents: [{ id: ic1.id }, { id: ic2.id }],
    });

    // Replace with single IC
    const updateRes = await authenticatedRequest.patch(`/applications/${app.id}`, {
      data: {
        itComponents: [{ id: ic3.id }],
      },
    });

    expect(updateRes.status()).toBe(200);
    const updated = await updateRes.json();
    expect(updated.itComponents.length).toBe(1);
    expect(updated.itComponents[0].id).toBe(ic3.id);

    // Verify the old mappings are deleted
    const queryRes = await authenticatedRequest.get(`/applications/${app.id}/it-components`);
    const queried = await queryRes.json();
    expect(queried.data.length).toBe(1);
    expect(queried.data[0].id).toBe(ic3.id);
  });

  test('PATCH /applications/:id - should clear IT components when empty array provided', async ({
    authenticatedRequest,
    testData,
  }) => {
    const domain = await testData.createDomain({
      name: `Domain ${Date.now()}`,
    });

    const ic = await testData.createItComponent({
      name: `IC to remove ${Date.now()}`,
    });

    const app = await testData.createApplication({
      name: `App with IC to clear ${Date.now()}`,
      domainId: domain.id,
      itComponents: [{ id: ic.id }],
    });

    const updateRes = await authenticatedRequest.patch(`/applications/${app.id}`, {
      data: {
        itComponents: [],
      },
    });

    expect(updateRes.status()).toBe(200);
    const updated = await updateRes.json();
    expect(updated.itComponents.length).toBe(0);
  });

  test('DELETE /it-components/:id - should prevent deletion when linked to applications', async ({
    authenticatedRequest,
    testData,
  }) => {
    const domain = await testData.createDomain({
      name: `Domain ${Date.now()}`,
    });

    const ic = await testData.createItComponent({
      name: `IC linked to app ${Date.now()}`,
    });

    await testData.createApplication({
      name: `App with linked IC ${Date.now()}`,
      domainId: domain.id,
      itComponents: [{ id: ic.id }],
    });

    const deleteRes = await authenticatedRequest.delete(`/it-components/${ic.id}`);
    expect(deleteRes.status()).toBe(409);
    const body = await deleteRes.json();
    expect(body.code).toBe('DEPENDENCY_CONFLICT');
    expect(body.details.applicationsCount).toBe(1);
  });

  test('DELETE /it-components/:id - should succeed after unlinking from applications', async ({
    authenticatedRequest,
    testData,
  }) => {
    const domain = await testData.createDomain({
      name: `Domain ${Date.now()}`,
    });

    const ic = await testData.createItComponent({
      name: `IC to unlink and delete ${Date.now()}`,
    });

    const app = await testData.createApplication({
      name: `App to unlink IC ${Date.now()}`,
      domainId: domain.id,
      itComponents: [{ id: ic.id }],
    });

    // Unlink IC from application
    await authenticatedRequest.patch(`/applications/${app.id}`, {
      data: {
        itComponents: [],
      },
    });

    // Now delete should work
    const deleteRes = await authenticatedRequest.delete(`/it-components/${ic.id}`);
    expect(deleteRes.status()).toBe(204);

    // Verify deletion
    const getRes = await authenticatedRequest.get(`/it-components/${ic.id}`);
    expect(getRes.status()).toBe(404);
  });

  test('GET /applications/:id - should include itComponents in response', async ({ authenticatedRequest, testData }) => {
    const domain = await testData.createDomain({
      name: `Domain ${Date.now()}`,
    });

    const ic1 = await testData.createItComponent({
      name: `IC in list ${Date.now()}`,
    });

    const ic2 = await testData.createItComponent({
      name: `IC 2 in list ${Date.now()}`,
    });

    const app = await testData.createApplication({
      name: `App with ICs in list ${Date.now()}`,
      domainId: domain.id,
      itComponents: [{ id: ic1.id }, { id: ic2.id }],
    });

    const res = await authenticatedRequest.get(`/applications/${app.id}`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.itComponents).toBeInstanceOf(Array);
    expect(body.itComponents.length).toBe(2);
    const icNames = body.itComponents.map((ic: any) => ic.name);
    expect(icNames).toContain(ic1.name);
    expect(icNames).toContain(ic2.name);
  });

  test('GET /applications - list should include itComponents for each application', async ({ authenticatedRequest, testData }) => {
    const domain = await testData.createDomain({
      name: `Domain ${Date.now()}`,
    });

    const ic = await testData.createItComponent({
      name: `IC in list view ${Date.now()}`,
    });

    const app = await testData.createApplication({
      name: `App in list with IC ${Date.now()}`,
      domainId: domain.id,
      itComponents: [{ id: ic.id }],
    });

    const res = await authenticatedRequest.get('/applications?limit=100');
    expect(res.status()).toBe(200);
    const body = await res.json();
    const createdApp = body.data.find((a: any) => a.id === app.id);
    expect(createdApp).toBeDefined();
    expect(createdApp.itComponents).toBeInstanceOf(Array);
    expect(createdApp.itComponents.length).toBe(1);
    expect(createdApp.itComponents[0].id).toBe(ic.id);
  });
});
