import { request as playwrightRequest } from '@playwright/test';
import { test, expect } from '../../fixtures/index';
import { expectSuccess, expectError } from '../../utils/api-helpers';

test.describe('Graph API', () => {
  test('GET /graph focalType=application returns nodes and edges', async ({ auth, testData }) => {
    const domain = await testData.createDomain({ name: `Graph AppFocal Dom ${Date.now()}` });
    const appA = await testData.createApplication({ name: `Graph AppFocal A ${Date.now()}`, domainId: domain.id });
    const appB = await testData.createApplication({ name: `Graph AppFocal B ${Date.now()}`, domainId: domain.id });
    await testData.createInterface({ sourceAppId: appA.id, targetAppId: appB.id, type: 'REST' });

    const res = await auth.request.get(`graph?focalType=application&focalId=${appA.id}`);
    const body = await expectSuccess<{ nodes: any[]; edges: any[] }>(res, 200);

    expect(Array.isArray(body.nodes)).toBe(true);
    expect(Array.isArray(body.edges)).toBe(true);

    const focalNode = body.nodes.find((n) => n.id === appA.id);
    expect(focalNode).toBeDefined();
    expect(focalNode.isFocal).toBe(true);
    expect(focalNode.type).toBe('application');
    expect(body.edges.length).toBeGreaterThanOrEqual(1);

    const neighborNode = body.nodes.find((n) => n.id === appB.id);
    expect(neighborNode).toBeDefined();
    expect(neighborNode.isFocal).toBe(false);
  });

  test('GET /graph focalType=domain returns linked app nodes', async ({ auth, testData }) => {
    const domain = await testData.createDomain({ name: `Graph DomFocal ${Date.now()}` });
    const app = await testData.createApplication({ name: `Graph DomFocal App ${Date.now()}`, domainId: domain.id });

    const res = await auth.request.get(`graph?focalType=domain&focalId=${domain.id}`);
    const body = await expectSuccess<{ nodes: any[]; edges: any[] }>(res, 200);

    const appNode = body.nodes.find((n) => n.id === app.id);
    expect(appNode).toBeDefined();
    expect(appNode.type).toBe('application');
  });

  test('GET /graph depth=2 reaches second-hop neighbors', async ({ auth, testData }) => {
    const domain = await testData.createDomain({ name: `Graph Depth2 Dom ${Date.now()}` });
    const appA = await testData.createApplication({ name: `Graph Depth2 A ${Date.now()}`, domainId: domain.id });
    const appB = await testData.createApplication({ name: `Graph Depth2 B ${Date.now()}`, domainId: domain.id });
    const appC = await testData.createApplication({ name: `Graph Depth2 C ${Date.now()}`, domainId: domain.id });
    await testData.createInterface({ sourceAppId: appA.id, targetAppId: appB.id, type: 'REST' });
    await testData.createInterface({ sourceAppId: appB.id, targetAppId: appC.id, type: 'REST' });

    const res = await auth.request.get(`graph?focalType=application&focalId=${appA.id}&depth=2`);
    const body = await expectSuccess<{ nodes: any[]; edges: any[] }>(res, 200);

    const ids = body.nodes.map((n: any) => n.id);
    expect(ids).toContain(appA.id);
    expect(ids).toContain(appB.id);
    expect(ids).toContain(appC.id);
  });

  test('GET /graph layers=business_capabilities includes BC nodes', async ({ auth, testData }) => {
    const domain = await testData.createDomain({ name: `Graph BC Dom ${Date.now()}` });
    const app = await testData.createApplication({ name: `Graph BC App ${Date.now()}`, domainId: domain.id });
    const bc = await testData.createBusinessCapability({
      name: `Graph BC ${Date.now()}`,
      domainId: domain.id,
      level: 1,
    });
    await auth.request.patch(`applications/${app.id}`, {
      data: { capabilityIds: [bc.id] },
    });

    const res = await auth.request.get(
      `graph?focalType=application&focalId=${app.id}&layers=applications,business_capabilities`,
    );
    const body = await expectSuccess<{ nodes: any[]; edges: any[] }>(res, 200);

    const bcNode = body.nodes.find((n: any) => n.type === 'bc');
    expect(bcNode).toBeDefined();
    expect(bcNode.id).toBe(bc.id);
  });

  test('GET /graph without auth token returns 401', async ({ apiBaseUrl, apiVersion }) => {
    const anonCtx = await playwrightRequest.newContext({
      baseURL: `${apiBaseUrl}${apiVersion}/`,
    });
    const res = await anonCtx.get(
      'graph?focalType=application&focalId=00000000-0000-0000-0000-000000000000',
    );
    expect(res.status()).toBe(401);
    await anonCtx.dispose();
  });

  test('GET /graph with non-existent focalId returns 404 ENTITY_NOT_FOUND', async ({ auth }) => {
    const res = await auth.request.get(
      'graph?focalType=application&focalId=00000000-0000-0000-0000-000000000000',
    );
    await expectError(res, 404, 'ENTITY_NOT_FOUND');
  });

  test('GET /graph isolated application returns single node and empty edges', async ({ auth, testData }) => {
    const domain = await testData.createDomain({ name: `Graph Isolated Dom ${Date.now()}` });
    const app = await testData.createApplication({ name: `Graph Isolated App ${Date.now()}`, domainId: domain.id });

    const res = await auth.request.get(`graph?focalType=application&focalId=${app.id}`);
    const body = await expectSuccess<{ nodes: any[]; edges: any[] }>(res, 200);

    expect(body.nodes).toHaveLength(1);
    expect(body.nodes[0].id).toBe(app.id);
    expect(body.nodes[0].isFocal).toBe(true);
    expect(body.edges).toHaveLength(0);
  });

  test('GET /graph layers=interfaces does not return edges to hidden nodes', async ({ auth, testData }) => {
    const domain = await testData.createDomain({ name: `Graph HiddenEdges Dom ${Date.now()}` });
    const appA = await testData.createApplication({ name: `Graph HiddenEdges A ${Date.now()}`, domainId: domain.id });
    const appB = await testData.createApplication({ name: `Graph HiddenEdges B ${Date.now()}`, domainId: domain.id });
    await testData.createInterface({ sourceAppId: appA.id, targetAppId: appB.id, type: 'REST' });

    const res = await auth.request.get(
      `graph?focalType=application&focalId=${appA.id}&layers=interfaces`,
    );
    const body = await expectSuccess<{
      nodes: { id: string; isFocal: boolean; type: string }[];
      edges: { sourceId: string; targetId: string }[];
    }>(res, 200);

    const focalNode = body.nodes.find((n) => n.id === appA.id);
    expect(focalNode).toBeDefined();
    expect(focalNode?.isFocal).toBe(true);
    expect(focalNode?.type).toBe('application');

    const nodeIds = new Set(body.nodes.map((n) => n.id));
    for (const edge of body.edges) {
      expect(nodeIds.has(edge.sourceId)).toBe(true);
      expect(nodeIds.has(edge.targetId)).toBe(true);
    }
    expect(body.edges).toHaveLength(0);
  });

  test('GET /graph focalType=provider returns linked app nodes', async ({ auth, testData }) => {
    const domain = await testData.createDomain({ name: `Graph Prov Dom ${Date.now()}` });
    const provider = await testData.createProvider({ name: `Graph Provider ${Date.now()}` });
    const app = await testData.createApplication({ name: `Graph Prov App ${Date.now()}`, domainId: domain.id });
    await auth.request.patch(`applications/${app.id}`, {
      data: { providers: [{ id: provider.id }] },
    });

    const res = await auth.request.get(
      `graph?focalType=provider&focalId=${provider.id}&layers=applications`,
    );
    const body = await expectSuccess<{ nodes: any[]; edges: any[] }>(res, 200);

    const providerNode = body.nodes.find((n: any) => n.id === provider.id);
    expect(providerNode).toBeDefined();
    expect(providerNode.type).toBe('provider');
    expect(providerNode.isFocal).toBe(true);

    const appNode = body.nodes.find((n: any) => n.id === app.id);
    expect(appNode).toBeDefined();
    expect(appNode.type).toBe('application');
  });
});
