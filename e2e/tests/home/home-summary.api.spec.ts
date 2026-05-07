import { request as playwrightRequest } from '@playwright/test';
import { test, expect } from '../../fixtures/index';
import { expectSuccess, expectError } from '../../utils/api-helpers';

// FS-12-BACK — Tests API GET /home/summary

interface HomeSummaryResponse {
  kpis: {
    appsCount: number;
    missionCriticalPercent: number | null;
    missionCriticalDenominator: number;
    interfacesCount: number;
    coveredCapabilitiesCount: number;
  } | null;
  incompleteApps: Array<{
    id: string;
    name: string;
    missingFields: string[];
    businessCapability: {
      id: string;
      name: string;
      ancestors: Array<{ id: string; name: string }>;
    } | null;
    createdAt: string;
  }> | null;
  expiringProviders: Array<{
    id: string;
    name: string;
    expiryDate: string;
    daysUntilExpiry: number;
  }> | null;
  lifecycleDistribution: {
    draft: number;
    in_progress: number;
    production: number;
    deprecated: number;
    retired: number;
    total: number;
  } | null;
  dataQuality: {
    completeCount: number;
    totalCount: number;
    scorePercent: number | null;
  } | null;
}

test.describe('Home Summary API — GET /home/summary', () => {
  // G-03 : structure complète + HTTP 200
  test('authenticated user → 200 avec structure HomeSummaryResponse', async ({ auth }) => {
    const res = await auth.request.get('home/summary');
    const body = await expectSuccess<HomeSummaryResponse>(res, 200);

    expect(body).toHaveProperty('kpis');
    expect(body).toHaveProperty('incompleteApps');
    expect(body).toHaveProperty('expiringProviders');
    expect(body).toHaveProperty('lifecycleDistribution');
    expect(body).toHaveProperty('dataQuality');
  });

  // G-03 : kpis.appsCount ≥ 0
  test('kpis.appsCount est un entier >= 0', async ({ auth }) => {
    const res = await auth.request.get('home/summary');
    const body = await expectSuccess<HomeSummaryResponse>(res, 200);

    expect(body.kpis).not.toBeNull();
    expect(typeof body.kpis!.appsCount).toBe('number');
    expect(body.kpis!.appsCount).toBeGreaterThanOrEqual(0);
  });

  // G-04 : lifecycleDistribution contient exactement les 5 clés
  test('lifecycleDistribution contient exactement les 5 statuts', async ({ auth }) => {
    const res = await auth.request.get('home/summary');
    const body = await expectSuccess<HomeSummaryResponse>(res, 200);

    expect(body.lifecycleDistribution).not.toBeNull();
    const dist = body.lifecycleDistribution!;
    expect(dist).toHaveProperty('draft');
    expect(dist).toHaveProperty('in_progress');
    expect(dist).toHaveProperty('production');
    expect(dist).toHaveProperty('deprecated');
    expect(dist).toHaveProperty('retired');
    expect(dist).toHaveProperty('total');
    // total = somme des 5 statuts
    expect(dist.total).toBe(
      dist.draft + dist.in_progress + dist.production + dist.deprecated + dist.retired,
    );
  });

  // G-03 : incompleteApps est un tableau (peut être vide)
  test('incompleteApps est un tableau (peut être vide)', async ({ auth }) => {
    const res = await auth.request.get('home/summary');
    const body = await expectSuccess<HomeSummaryResponse>(res, 200);

    expect(Array.isArray(body.incompleteApps)).toBe(true);
    // max 5 items
    expect(body.incompleteApps!.length).toBeLessThanOrEqual(5);

    if (body.incompleteApps!.length > 0) {
      const first = body.incompleteApps![0];
      expect(first).toHaveProperty('businessCapability');
      if (first.businessCapability !== null) {
        expect(first.businessCapability).toHaveProperty('id');
        expect(first.businessCapability).toHaveProperty('name');
        expect(Array.isArray(first.businessCapability.ancestors)).toBe(true);
      }
    }
  });

  // G-03 : expiringProviders est un tableau (peut être vide)
  test('expiringProviders est un tableau (peut être vide)', async ({ auth }) => {
    const res = await auth.request.get('home/summary');
    const body = await expectSuccess<HomeSummaryResponse>(res, 200);

    expect(Array.isArray(body.expiringProviders)).toBe(true);
    expect(body.expiringProviders!.length).toBeLessThanOrEqual(5);
  });

  // G-03 : kpis.interfacesCount est un entier >= 0
  test('kpis.interfacesCount est un entier >= 0', async ({ auth }) => {
    const res = await auth.request.get('home/summary');
    const body = await expectSuccess<HomeSummaryResponse>(res, 200);

    expect(body.kpis).not.toBeNull();
    expect(typeof body.kpis!.interfacesCount).toBe('number');
    expect(body.kpis!.interfacesCount).toBeGreaterThanOrEqual(0);
  });

  // G-06 : domainIds sur PATCH /users/:id — Supertest
  test('PATCH /users/:id avec domainIds valide → 200 + domains dans la réponse', async ({
    auth,
  }) => {
    // Créer un domaine de test
    const domainRes = await auth.request.post('domains', {
      data: { name: `Home Scope Domain ${Date.now()}` },
    });
    expect(domainRes.status()).toBe(201);
    const domain = await domainRes.json();

    try {
      // Récupérer l'ID de l'utilisateur admin (auth)
      const meRes = await auth.request.get('auth/me');
      const me = await meRes.json();

      // Assigner le domaine
      const patchRes = await auth.request.patch(`users/${me.id}`, {
        data: { domainIds: [domain.id] },
      });
      expect(patchRes.status()).toBe(200);
      const patchBody = await patchRes.json();
      expect(Array.isArray(patchBody.domainIds)).toBe(true);
      expect(patchBody.domainIds).toContain(domain.id);
      expect(Array.isArray(patchBody.domains)).toBe(true);
      expect(patchBody.domains.find((d: { id: string }) => d.id === domain.id)).toBeDefined();

      // Réinitialiser la portée globale (domainIds: [])
      await auth.request.patch(`users/${me.id}`, { data: { domainIds: [] } });
    } finally {
      // Nettoyage du domaine de test
      await auth.request.delete(`domains/${domain.id}`);
    }
  });

  // G-06 : domainIds UUID inexistant → 404 DOMAIN_NOT_FOUND
  test('PATCH /users/:id avec domainIds UUID inexistant → 404 DOMAIN_NOT_FOUND', async ({
    auth,
  }) => {
    const meRes = await auth.request.get('auth/me');
    const me = await meRes.json();

    const res = await auth.request.patch(`users/${me.id}`, {
      data: { domainIds: ['00000000-0000-0000-0000-000000000000'] },
    });
    await expectError(res, 404, 'DOMAIN_NOT_FOUND');
  });

  // G-02 : GET /auth/me retourne domainIds et domains
  test('GET /auth/me contient domainIds (tableau) et domains (tableau)', async ({ auth }) => {
    const res = await auth.request.get('auth/me');
    const body = await res.json();

    expect(res.status()).toBe(200);
    expect(Array.isArray(body.domainIds)).toBe(true);
    expect(Array.isArray(body.domains)).toBe(true);
  });

  // G-02 : GET /users/:id retourne domainIds et domains
  test('GET /users/:id contient domainIds (tableau) et domains (tableau)', async ({ auth }) => {
    const meRes = await auth.request.get('auth/me');
    const me = await expectSuccess<{ id: string }>(meRes, 200);

    const res = await auth.request.get(`users/${me.id}`);
    const body = await expectSuccess<{
      domainIds: string[];
      domains: Array<{ id: string; name: string }>;
    }>(res, 200);

    expect(Array.isArray(body.domainIds)).toBe(true);
    expect(Array.isArray(body.domains)).toBe(true);
  });

  // Scope domaine : 1 domaine assigné => données filtrées, [] => portée globale
  test('GET /home/summary applique le scope domaine utilisateur', async ({ auth, testData }) => {
    const meRes = await auth.request.get('auth/me');
    const me = await expectSuccess<{ id: string }>(meRes, 200);

    const scopedDomain = await testData.createDomain({
      name: `Home Scope Assigned ${Date.now()}`,
      description: 'Scope domain for T-104',
    });
    await testData.createApplication({
      name: `Home Scope App ${Date.now()}`,
      domainId: scopedDomain.id,
      description: 'Application for domain scope test',
    });

    try {
      const assignRes = await auth.request.patch(`users/${me.id}`, {
        data: { domainIds: [scopedDomain.id] },
      });
      await expectSuccess(assignRes, 200);

      const scopedSummaryRes = await auth.request.get('home/summary');
      const scopedSummary = await expectSuccess<HomeSummaryResponse>(scopedSummaryRes, 200);

      expect(scopedSummary.kpis).not.toBeNull();
      expect(scopedSummary.kpis!.appsCount).toBe(1);

      const resetRes = await auth.request.patch(`users/${me.id}`, {
        data: { domainIds: [] },
      });
      await expectSuccess(resetRes, 200);

      const globalSummaryRes = await auth.request.get('home/summary');
      const globalSummary = await expectSuccess<HomeSummaryResponse>(globalSummaryRes, 200);

      expect(globalSummary.kpis).not.toBeNull();
      expect(globalSummary.kpis!.appsCount).toBeGreaterThanOrEqual(1);
    } finally {
      await auth.request.patch(`users/${me.id}`, { data: { domainIds: [] } });
    }
  });

  // G-09 RBAC : 403 sans permission applications:read
  test('GET /home/summary avec token sans applications:read → 403', async ({
    auth,
    apiBaseUrl,
    apiVersion,
  }) => {
    const testId = Date.now();
    let roleId: string | null = null;
    let userId: string | null = null;
    let loginContext: Awaited<ReturnType<typeof playwrightRequest.newContext>> | null = null;
    let restrictedContext: Awaited<ReturnType<typeof playwrightRequest.newContext>> | null = null;

    try {
      const roleRes = await auth.request.post('roles', {
        data: {
          name: `T104 Home Restricted ${testId}`,
          description: 'Role without applications:read for RBAC test',
        },
      });
      expect(roleRes.status()).toBe(201);
      const role = await roleRes.json();
      roleId = role.id;

      const email = `t104-home-restricted-${testId}@ark.local`;
      const password = 'T104SecurePass!123';
      const createUserRes = await auth.request.post('users', {
        data: {
          email,
          password,
          firstName: 'T104',
          lastName: 'Restricted',
          roleId,
        },
      });
      expect(createUserRes.status()).toBe(201);
      const createdUser = await createUserRes.json();
      userId = createdUser.id;

      const fullApiUrl = `${apiBaseUrl}${apiVersion}`.replace(/\/$/, '') + '/';

      loginContext = await playwrightRequest.newContext({
        baseURL: fullApiUrl,
      });
      const loginRes = await loginContext.post('auth/login', {
        data: { email, password },
      });
      expect(loginRes.status()).toBe(200);
      const { accessToken } = await loginRes.json();

      restrictedContext = await playwrightRequest.newContext({
        baseURL: fullApiUrl,
        extraHTTPHeaders: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });
      const res = await restrictedContext.get('home/summary');
      expect(res.status()).toBe(403);
    } finally {
      await restrictedContext?.dispose();
      await loginContext?.dispose();

      if (userId) {
        await auth.request.patch(`users/${userId}`, {
          data: { roleId: null },
        });
        await auth.request.delete(`users/${userId}`);
      }
      if (roleId) {
        await auth.request.delete(`roles/${roleId}`);
      }
    }
  });

  // G-09 RBAC : 401 sans token
  test('GET /home/summary sans token → 401', async ({ apiBaseUrl, apiVersion }) => {
    const fullApiUrl = `${apiBaseUrl}${apiVersion}`.replace(/\/$/, '') + '/';
    const unauthContext = await playwrightRequest.newContext({ baseURL: fullApiUrl });
    const res = await unauthContext.get('home/summary');
    expect(res.status()).toBe(401);
    await unauthContext.dispose();
  });
});
