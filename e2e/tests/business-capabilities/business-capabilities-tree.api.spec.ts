import { test, expect } from '../../fixtures/index';
import { expectSuccess } from '../../utils/api-helpers';

interface TreeNode {
  id: string;
  name: string;
  level: number;
  parentId: string | null;
  domain: { id: string; name: string } | null;
  _count: { applicationMappings: number; children: number };
  children: TreeNode[];
}

test.describe('Business Capabilities Tree API', () => {
  test('GET /business-capabilities/tree should return nested tree structure', async ({
    auth,
    testData,
  }) => {
    const response = await auth.request.get('business-capabilities/tree');
    const result = await expectSuccess<{ data: TreeNode[] }>(response, 200);

    expect(result).toHaveProperty('data');
    expect(Array.isArray(result.data)).toBe(true);

    // All roots should have null parentId
    result.data.forEach((root) => {
      expect(root.parentId).toBeNull();
      expect(Array.isArray(root.children)).toBe(true);
    });
  });

  test('GET /business-capabilities/tree should include children nested inside parent', async ({
    auth,
    testData,
  }) => {
    const root = await testData.createBusinessCapability({
      name: `BC Tree Root ${Date.now()}`,
      domainId: undefined as unknown as string,
      level: 0,
    });

    await testData.createBusinessCapability({
      name: `BC Tree Child ${Date.now()}`,
      domainId: undefined as unknown as string,
      level: 1,
      parentId: root.id,
    });

    const response = await auth.request.get('business-capabilities/tree');
    const result = await expectSuccess<{ data: TreeNode[] }>(response, 200);

    const rootNode = result.data.find((n) => n.id === root.id);
    expect(rootNode).toBeDefined();
    expect(rootNode!.children.length).toBeGreaterThanOrEqual(1);
    expect(rootNode!.children[0].parentId).toBe(root.id);
  });

  test('GET /business-capabilities/tree nodes should include _count fields', async ({
    auth,
    testData,
  }) => {
    await testData.createBusinessCapability({
      name: `BC Tree Count ${Date.now()}`,
      domainId: undefined as unknown as string,
      level: 0,
    });

    const response = await auth.request.get('business-capabilities/tree');
    const result = await expectSuccess<{ data: TreeNode[] }>(response, 200);

    expect(result.data.length).toBeGreaterThan(0);
    const node = result.data[0];
    expect(node._count).toBeDefined();
    expect(typeof node._count.applicationMappings).toBe('number');
    expect(typeof node._count.children).toBe('number');
  });

  test('PATCH reparenting should recalculate level for descendants', async ({
    auth,
    testData,
  }) => {
    // Create a 2-level tree: rootA → childA → grandchild
    const rootA = await testData.createBusinessCapability({
      name: `BC ReparentA Root ${Date.now()}`,
      domainId: undefined as unknown as string,
      level: 0,
    });

    const childA = await testData.createBusinessCapability({
      name: `BC ReparentA Child ${Date.now()}`,
      domainId: undefined as unknown as string,
      level: 1,
      parentId: rootA.id,
    });

    const grandchild = await testData.createBusinessCapability({
      name: `BC ReparentA Grandchild ${Date.now()}`,
      domainId: undefined as unknown as string,
      level: 2,
      parentId: childA.id,
    });

    // Create rootB (level 0) and reparent childA → rootB
    const rootB = await testData.createBusinessCapability({
      name: `BC ReparentB Root ${Date.now()}`,
      domainId: undefined as unknown as string,
      level: 0,
    });

    await auth.request.patch(`business-capabilities/${childA.id}`, {
      data: { parentId: rootB.id },
    });

    // Grandchild should now be level 2 (rootB=0, childA=1, grandchild=2 — same depth relative, still 2)
    const grandchildResp = await auth.request.get(
      `business-capabilities/${grandchild.id}`,
    );
    const grandchildData = await grandchildResp.json();
    expect(grandchildData.level).toBe(2);
  });
});
