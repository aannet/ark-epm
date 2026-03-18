import { test, expect, TestDataFactory } from '../../fixtures/index';
import { expectSuccess, DomainResponse, TagValueResponse } from '../../utils/api-helpers';

test.describe('Domains CRUD API', () => {
  test('GET /domains should return array of domains', async ({ auth }) => {
    const response = await auth.request.get('domains');
    const domains = await expectSuccess<DomainResponse[]>(response, 200);

    expect(Array.isArray(domains)).toBe(true);
  });

  test('GET /domains should return empty array when no domains exist', async ({ auth }) => {
    const response = await auth.request.get('domains');
    const domains = await expectSuccess<DomainResponse[]>(response, 200);

    if (domains.length === 0) {
      expect(domains).toEqual([]);
    }
  });

  test('POST /domains should create a domain', async ({ auth, testData }) => {
    const uniqueName = `Test Domain ${Date.now()}`;
    const response = await auth.request.post('domains', {
      data: {
        name: uniqueName,
        description: 'Test description',
        comment: 'Test comment',
      },
    });

    const domain = await expectSuccess<DomainResponse>(response, 201);

    expect(domain.id).toBeTruthy();
    expect(domain.name).toBe(uniqueName);
    expect(domain.description).toBe('Test description');
    expect(domain.comment).toBe('Test comment');
    expect(domain.createdAt).toBeTruthy();
    expect(domain.updatedAt).toBeTruthy();
    expect(domain.tags).toBeDefined();
    expect(Array.isArray(domain.tags)).toBe(true);
  });

  test('GET /domains/:id should return domain with tags including ancestor and descendant', async ({ auth, testData }) => {
    const geographyDim = await testData.createTagDimension({
      name: `Geography ${Date.now()}`,
      color: '#2196F3',
    });

    const ancestorTag = await testData.resolveTagValue({
      dimensionId: geographyDim.id,
      path: 'europe/france',
      label: 'France',
    });

    const descendantTag = await testData.resolveTagValue({
      dimensionId: geographyDim.id,
      path: 'europe/france/paris',
      label: 'Paris',
    });

    const domain = await testData.createDomain({
      name: `Domain With Tags ${Date.now()}`,
    });

    await testData.attachTagsToEntity(
      'domain',
      domain.id,
      geographyDim.id,
      [ancestorTag.id, descendantTag.id]
    );

    const response = await auth.request.get(`domains/${domain.id}`);
    const result = await expectSuccess<DomainResponse>(response, 200);

    expect(result.tags).toBeDefined();
    expect(result.tags).toHaveLength(2);

    const tagPaths = result.tags!.map((t: TagValueResponse) => t.path);
    expect(tagPaths).toContain('europe/france');
    expect(tagPaths).toContain('europe/france/paris');
  });

  test('GET /domains/:id should return tags with depth and dimensionColor fields', async ({ auth, testData }) => {
    const geographyDim = await testData.createTagDimension({
      name: `Geography ${Date.now()}`,
      color: '#2196F3',
    });

    const tagValue = await testData.resolveTagValue({
      dimensionId: geographyDim.id,
      path: 'europe/france/paris',
      label: 'Paris',
    });

    const domain = await testData.createDomain({
      name: `Domain Tag Fields ${Date.now()}`,
    });

    await testData.attachTagsToEntity(
      'domain',
      domain.id,
      geographyDim.id,
      [tagValue.id]
    );

    const response = await auth.request.get(`domains/${domain.id}`);
    const result = await expectSuccess<DomainResponse>(response, 200);

    expect(result.tags).toBeDefined();
    expect(result.tags).toHaveLength(1);

    const tagValueResponse = result.tags![0];
    expect(tagValueResponse).toHaveProperty('depth');
    expect(typeof tagValueResponse.depth).toBe('number');
    expect(tagValueResponse.depth).toBe(2);

    expect(tagValueResponse).toHaveProperty('dimensionColor');
    expect(tagValueResponse.dimensionColor).toBe('#2196F3');

    expect(tagValueResponse).toHaveProperty('dimensionName');
    expect(tagValueResponse.dimensionName).toBe(geographyDim.name);
  });

  test('PATCH /domains/:id should update a domain', async ({ auth, testData }) => {
    const domain = await testData.createDomain({
      name: `Update Test ${Date.now()}`,
    });

    const response = await auth.request.patch(`domains/${domain.id}`, {
      data: { description: 'Updated description' },
    });

    const updated = await expectSuccess<DomainResponse>(response, 200);

    expect(updated.id).toBe(domain.id);
    expect(updated.description).toBe('Updated description');
  });

  test('DELETE /domains/:id should delete a domain with no linked entities', async ({ auth, testData }) => {
    const domain = await testData.createDomain({
      name: `Delete Test ${Date.now()}`,
    });

    const response = await auth.request.delete(`domains/${domain.id}`);
    expect(response.status()).toBe(204);

    const getResponse = await auth.request.get(`domains/${domain.id}`);
    expect(getResponse.status()).toBe(404);

    const body = await getResponse.json();
    expect(body.code).toBe('DOMAIN_NOT_FOUND');
  });

  test('GET /domains/:id should return 404 for non-existent uuid', async ({ auth }) => {
    const response = await auth.request.get('domains/00000000-0000-0000-0000-000000000000');

    expect(response.status()).toBe(404);
    const body = await response.json();
    expect(body.code).toBe('DOMAIN_NOT_FOUND');
  });
});
