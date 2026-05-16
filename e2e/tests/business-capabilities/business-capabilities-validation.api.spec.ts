import { test, expect } from '../../fixtures/index';
import { expectError } from '../../utils/api-helpers';

test.describe('Business Capabilities Validation API', () => {
  test('POST /business-capabilities should return 400 for missing name', async ({
    auth,
  }) => {
    const response = await auth.request.post('business-capabilities', {
      data: { description: 'No name' },
    });
    await expectError(response, 400);
  });

  test('POST /business-capabilities should return 400 for whitespace-only name', async ({
    auth,
  }) => {
    const response = await auth.request.post('business-capabilities', {
      data: { name: '   ' },
    });
    await expectError(response, 400);
  });

  test('POST /business-capabilities should return 409 CONFLICT for duplicate name', async ({
    auth,
    testData,
  }) => {
    const name = `BC Duplicate Test ${Date.now()}`;

    await testData.createBusinessCapability({
      name,
      domainId: undefined as unknown as string,
      level: 0,
    });

    const response = await auth.request.post('business-capabilities', {
      data: { name },
    });
    await expectError(response, 409, 'CONFLICT');
  });

  test('POST /business-capabilities should return 404 for non-existent domainId', async ({
    auth,
  }) => {
    const response = await auth.request.post('business-capabilities', {
      data: {
        name: `BC Bad Domain ${Date.now()}`,
        domainId: '00000000-0000-0000-0000-000000000000',
      },
    });
    await expectError(response, 404);
  });

  test('POST /business-capabilities should return 404 for non-existent parentId', async ({
    auth,
  }) => {
    const response = await auth.request.post('business-capabilities', {
      data: {
        name: `BC Bad Parent ${Date.now()}`,
        parentId: '00000000-0000-0000-0000-000000000000',
      },
    });
    await expectError(response, 404);
  });

  test('PATCH /business-capabilities/:id should return 400 CIRCULAR_REFERENCE', async ({
    auth,
    testData,
  }) => {
    const root = await testData.createBusinessCapability({
      name: `BC Circular Root ${Date.now()}`,
      domainId: undefined as unknown as string,
      level: 0,
    });

    const child = await testData.createBusinessCapability({
      name: `BC Circular Child ${Date.now()}`,
      domainId: undefined as unknown as string,
      level: 1,
      parentId: root.id,
    });

    // Try to make root a child of its own child → circular reference
    const response = await auth.request.patch(`business-capabilities/${root.id}`, {
      data: { parentId: child.id },
    });
    await expectError(response, 400, 'CIRCULAR_REFERENCE');
  });

  test('PATCH /business-capabilities/:id should return 409 CONFLICT on duplicate name', async ({
    auth,
    testData,
  }) => {
    const name1 = `BC Conflict A ${Date.now()}`;
    const name2 = `BC Conflict B ${Date.now()}`;

    const bc1 = await testData.createBusinessCapability({
      name: name1,
      domainId: undefined as unknown as string,
      level: 0,
    });

    await testData.createBusinessCapability({
      name: name2,
      domainId: undefined as unknown as string,
      level: 0,
    });

    const response = await auth.request.patch(`business-capabilities/${bc1.id}`, {
      data: { name: name2 },
    });
    await expectError(response, 409, 'CONFLICT');
  });

  test('DELETE /business-capabilities/:id should return 409 DEPENDENCY_CONFLICT when has children', async ({
    auth,
    testData,
  }) => {
    const root = await testData.createBusinessCapability({
      name: `BC Root With Child ${Date.now()}`,
      domainId: undefined as unknown as string,
      level: 0,
    });

    await testData.createBusinessCapability({
      name: `BC Child Of Root ${Date.now()}`,
      domainId: undefined as unknown as string,
      level: 1,
      parentId: root.id,
    });

    const response = await auth.request.delete(`business-capabilities/${root.id}`);
    const body = await expectError(response, 409, 'DEPENDENCY_CONFLICT');

    expect(body.details).toBeDefined();
    expect(body.details.childrenCount).toBeGreaterThan(0);
  });
});
