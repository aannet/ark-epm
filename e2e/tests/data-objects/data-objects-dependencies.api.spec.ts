import { test, expect } from '../../fixtures';

test.describe('Data Objects ↔ Applications Relationship API', () => {
  test('GET /data-objects/:id/applications - should return paginated list', async ({ authenticatedRequest, testData }) => {
    const dataObject = await testData.createDataObject({
      name: `DO for apps query ${Date.now()}`,
    });

    const res = await authenticatedRequest.get(`data-objects/${dataObject.id}/applications`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('data');
    expect(body).toHaveProperty('meta');
    expect(body.data).toBeInstanceOf(Array);
    expect(body.meta.total).toBeGreaterThanOrEqual(0);
  });

  test('GET /data-objects/:id/applications - should return 404 for non-existent data object', async ({ authenticatedRequest }) => {
    const fakeId = 'ffffffff-ffff-ffff-ffff-ffffffffffff';
    const res = await authenticatedRequest.get(`data-objects/${fakeId}/applications`);
    expect(res.status()).toBe(404);
  });

  test('GET /data-objects/:id/applications - should respect pagination params', async ({ authenticatedRequest, testData }) => {
    const dataObject = await testData.createDataObject({
      name: `DO pagination test ${Date.now()}`,
    });

    const res = await authenticatedRequest.get(`data-objects/${dataObject.id}/applications?page=1&limit=5`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.meta.page).toBe(1);
    expect(body.meta.limit).toBe(5);
  });

  test('DELETE /data-objects/:id - should return 204 when no applications linked', async ({ authenticatedRequest, testData }) => {
    const dataObject = await testData.createDataObject({
      name: `DO no deps ${Date.now()}`,
    });

    const deleteRes = await authenticatedRequest.delete(`data-objects/${dataObject.id}`);
    expect(deleteRes.status()).toBe(204);

    const getRes = await authenticatedRequest.get(`data-objects/${dataObject.id}`);
    expect(getRes.status()).toBe(404);
  });

  // NOTE: Le test DEPENDENCY_CONFLICT nécessite de lier une application à un data object.
  // L'API /applications (POST/PATCH) n'expose pas encore de champ `dataObjects` dans le DTO.
  // Ce test est skippé jusqu'à implémentation du lien côté API Applications.
  // Ref: FS-05-BACK (appDataObjectMap), F-999 Item 22.
  test.skip('DELETE /data-objects/:id - should return 409 DEPENDENCY_CONFLICT when application is linked', async ({ authenticatedRequest, testData }) => {
    const domain = await testData.createDomain({ name: `Domain for DO test ${Date.now()}` });
    const dataObject = await testData.createDataObject({ name: `DO with app ${Date.now()}` });

    // TODO: Lier l'application au data object via PATCH /applications/:id { dataObjects: [{ id, role }] }
    // une fois le DTO Applications mis à jour pour exposer les data objects.
    await testData.createApplication({
      name: `App linked to DO ${Date.now()}`,
      domainId: domain.id,
    });

    const deleteRes = await authenticatedRequest.delete(`data-objects/${dataObject.id}`);
    expect(deleteRes.status()).toBe(409);
    const body = await deleteRes.json();
    expect(body.code).toBe('DEPENDENCY_CONFLICT');
    expect(body.details).toHaveProperty('applicationsCount');
    expect(body.details.applicationsCount).toBeGreaterThan(0);
  });
});
