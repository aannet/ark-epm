import { APIRequestContext, Page, expect, request as playwrightRequest, test } from '@playwright/test';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';
const API_VERSION = process.env.API_VERSION || '/api/v1';
const API_FULL_URL = `${API_BASE_URL}${API_VERSION}`.replace(/\/$/, '') + '/';
const ADMIN_EMAIL = process.env.API_USER_EMAIL || 'admin@ark.io';
const ADMIN_PASSWORD = process.env.API_USER_PASSWORD || 'admin123456';
const USER_PASSWORD = 'T106SecurePass!123';

interface AuthMeResponse {
  id: string;
  role?: {
    id: string;
  } | null;
  roleId?: string | null;
}

interface CreatedUser {
  id: string;
  email: string;
  password: string;
}

interface CreatedDomain {
  id: string;
  name: string;
}

interface CreatedApplication {
  id: string;
  name: string;
}

test.describe.configure({ mode: 'serial' });

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function homeContainer(page: Page) {
  return page.locator('main .MuiContainer-root').first();
}

function kpiTile(page: Page, label: string) {
  const container = homeContainer(page);
  return container.getByText(label, { exact: true }).locator('xpath=ancestor::button[1]');
}

async function createAuthenticatedApiContext(
  email: string,
  password: string,
): Promise<APIRequestContext> {
  const loginContext = await playwrightRequest.newContext({ baseURL: API_FULL_URL });
  const loginResponse = await loginContext.post('auth/login', {
    data: { email, password },
  });

  expect(loginResponse.status()).toBe(200);
  const body = (await loginResponse.json()) as { accessToken: string };
  expect(body.accessToken).toBeTruthy();
  await loginContext.dispose();

  return playwrightRequest.newContext({
    baseURL: API_FULL_URL,
    extraHTTPHeaders: {
      Authorization: `Bearer ${body.accessToken}`,
      'Content-Type': 'application/json',
    },
  });
}

async function createAdminApiContext(): Promise<APIRequestContext> {
  return createAuthenticatedApiContext(ADMIN_EMAIL, ADMIN_PASSWORD);
}

async function loginFromUi(page: Page, email: string, password: string): Promise<void> {
  await page.goto('/login');
  await page.getByLabel('Adresse e-mail').fill(email);
  await page.getByLabel('Mot de passe').fill(password);
  await page.getByRole('button', { name: 'Se connecter' }).click();
}

async function getCurrentUserRoleId(adminApi: APIRequestContext): Promise<string> {
  const meResponse = await adminApi.get('auth/me');
  expect(meResponse.status()).toBe(200);
  const me = (await meResponse.json()) as AuthMeResponse;

  const roleId = me.role?.id ?? me.roleId;
  if (!roleId) {
    throw new Error('Admin role id is missing in auth/me response');
  }

  return roleId;
}

async function createDomain(adminApi: APIRequestContext, name: string): Promise<CreatedDomain> {
  const response = await adminApi.post('domains', {
    data: {
      name,
      description: 'T-106 domain scope fixture',
    },
  });

  expect(response.status()).toBe(201);
  const domain = (await response.json()) as CreatedDomain;
  return domain;
}

async function createApplication(
  adminApi: APIRequestContext,
  name: string,
  domainId: string,
): Promise<CreatedApplication> {
  const response = await adminApi.post('applications', {
    data: {
      name,
      description: 'T-106 incomplete application fixture',
      domainId,
    },
  });

  expect(response.status()).toBe(201);
  const application = (await response.json()) as CreatedApplication;
  return application;
}

async function createUser(
  adminApi: APIRequestContext,
  firstName: string,
  lastName: string,
  roleId: string,
): Promise<CreatedUser> {
  const testId = Date.now();
  const email = `t106-${firstName.toLowerCase()}-${testId}@ark.local`;
  const response = await adminApi.post('users', {
    data: {
      email,
      password: USER_PASSWORD,
      firstName,
      lastName,
      roleId,
    },
  });

  expect(response.status()).toBe(201);
  const user = (await response.json()) as { id: string };

  return {
    id: user.id,
    email,
    password: USER_PASSWORD,
  };
}

async function assignUserDomains(
  adminApi: APIRequestContext,
  userId: string,
  domainIds: string[],
): Promise<void> {
  const response = await adminApi.patch(`users/${userId}`, {
    data: { domainIds },
  });
  expect(response.status()).toBe(200);
}

async function cleanupUser(adminApi: APIRequestContext, userId: string): Promise<void> {
  try {
    await adminApi.patch(`users/${userId}`, {
      data: {
        roleId: null,
        domainIds: [],
      },
    });
  } catch {
    // best-effort cleanup
  }

  try {
    await adminApi.delete(`users/${userId}`);
  } catch {
    // best-effort cleanup
  }
}

test.describe('T-106 — Dashboard UI — Thierry (0 domaine)', () => {
  test.beforeEach(async ({ page }) => {
    await loginFromUi(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    await expect(page).toHaveURL(/\/$/);
    await expect(homeContainer(page).getByRole('heading', { name: 'Tableau de bord' })).toBeVisible();
  });

  test('welcome banner affiche la portée globale', async ({ page }) => {
    const banner = page.getByRole('heading', { level: 5 });
    await expect(banner).toContainText('Bonjour');
    await expect(banner).toContainText('Tous les domaines');
  });

  test('les 4 tuiles KPI sont visibles', async ({ page }) => {
    await expect(kpiTile(page, 'Applications')).toBeVisible();
    await expect(kpiTile(page, 'Mission Critical')).toBeVisible();
    await expect(kpiTile(page, 'Interfaces')).toBeVisible();
    await expect(kpiTile(page, 'Capacités couvertes')).toBeVisible();
  });

  test('clic sur la tuile Applications navigue vers /applications', async ({ page }) => {
    await kpiTile(page, 'Applications').click();
    await expect(page).toHaveURL(/\/applications$/);
  });

  test('clic sur la tuile Interfaces navigue vers /interfaces', async ({ page }) => {
    await kpiTile(page, 'Interfaces').click();
    await expect(page).toHaveURL(/\/interfaces$/);
  });

  test('clic sur la tuile Capacités couvertes navigue vers /business-capabilities', async ({ page }) => {
    await kpiTile(page, 'Capacités couvertes').click();
    await expect(page).toHaveURL(/\/business-capabilities$/);
  });

  test('la section Fiches incomplètes est visible', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Fiches incomplètes' })).toBeVisible();
  });

  test('la distribution lifecycle affiche 5 statuts', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Distribution cycle de vie' })).toBeVisible();
    await expect(page.getByText('Brouillon')).toBeVisible();
    await expect(page.getByText('En cours')).toBeVisible();
    await expect(page.getByText('Production')).toBeVisible();
    await expect(page.getByText('Déprécié')).toBeVisible();
    await expect(page.getByText('Retiré')).toBeVisible();
  });

  test('la section Qualité des données est visible', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Qualité des données' })).toBeVisible();
  });
});

test.describe('T-106 — Dashboard UI — Marc (1 domaine)', () => {
  let adminApi: APIRequestContext;
  let marcDomain: CreatedDomain;
  let marcUser: CreatedUser;
  let marcApplication: CreatedApplication;

  test.beforeAll(async () => {
    adminApi = await createAdminApiContext();
    const roleId = await getCurrentUserRoleId(adminApi);

    marcDomain = await createDomain(adminApi, `T106 Marc Domain ${Date.now()}`);
    marcApplication = await createApplication(
      adminApi,
      `T106 Marc Incomplete App ${Date.now()}`,
      marcDomain.id,
    );

    marcUser = await createUser(adminApi, 'Marc', 'AE', roleId);
    await assignUserDomains(adminApi, marcUser.id, [marcDomain.id]);
  });

  test.afterAll(async () => {
    await cleanupUser(adminApi, marcUser.id);

    try {
      await adminApi.delete(`applications/${marcApplication.id}`);
    } catch {
      // best-effort cleanup
    }

    try {
      await adminApi.delete(`domains/${marcDomain.id}`);
    } catch {
      // best-effort cleanup
    }

    await adminApi.dispose();
  });

  test.beforeEach(async ({ page }) => {
    await loginFromUi(page, marcUser.email, marcUser.password);
    await expect(page).toHaveURL(/\/$/);
    await expect(homeContainer(page).getByRole('heading', { name: 'Tableau de bord' })).toBeVisible();
  });

  test('welcome banner affiche le domaine assigné', async ({ page }) => {
    const banner = page.getByRole('heading', { level: 5 });
    await expect(banner).toContainText('Bonjour Marc');
    await expect(banner).toContainText(marcDomain.name);
    await expect(banner).not.toContainText('Tous les domaines');
  });

  test('les KPI sont visibles et les fiches incomplètes listent l’app de scope', async ({ page }) => {
    await expect(kpiTile(page, 'Applications')).toBeVisible();
    await expect(kpiTile(page, 'Interfaces')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Fiches incomplètes' })).toBeVisible();
    await expect(page.getByRole('link', { name: marcApplication.name })).toBeVisible();
  });

  test('clic KPI Applications navigue vers /applications', async ({ page }) => {
    await kpiTile(page, 'Applications').click();
    await expect(page).toHaveURL(/\/applications$/);
  });
});

test.describe('T-106 — Dashboard UI — RBAC sans applications:read', () => {
  test('user restreint est redirigé vers /403 et ne voit pas Fiches incomplètes', async ({ page }) => {
    const adminApi = await createAdminApiContext();
    let roleId: string | null = null;
    let restrictedUser: CreatedUser | null = null;

    try {
      const roleResponse = await adminApi.post('roles', {
        data: {
          name: `T106 Restricted Role ${Date.now()}`,
          description: 'Role without applications:read permission',
        },
      });
      expect(roleResponse.status()).toBe(201);
      const role = (await roleResponse.json()) as { id: string };
      roleId = role.id;

      restrictedUser = await createUser(adminApi, 'Readonly', 'Dashboard', roleId);

      await loginFromUi(page, restrictedUser.email, restrictedUser.password);

      // AGENT-DECISION: qa — on valide le comportement réel (403 global) car l'intercepteur Axios redirige
      // immédiatement vers /403, avant le masquage section par section de la HomePage.
      await expect(page).toHaveURL(/\/403$/);
      await expect(page.getByRole('heading', { name: 'Accès refusé' })).toBeVisible();
      await expect(page.getByText('Fiches incomplètes')).toHaveCount(0);
    } finally {
      if (restrictedUser) {
        await cleanupUser(adminApi, restrictedUser.id);
      }
      if (roleId) {
        try {
          await adminApi.delete(`roles/${roleId}`);
        } catch {
          // best-effort cleanup
        }
      }
      await adminApi.dispose();
    }
  });
});

test.describe('T-106 — Dashboard UI — EmptyState périmètre sans application', () => {
  test('appsCount=0 affiche EmptyState global et masque zones 2/3/4', async ({ page }) => {
    const adminApi = await createAdminApiContext();
    let emptyScopeUser: CreatedUser | null = null;
    let emptyDomainId: string | null = null;

    try {
      const roleId = await getCurrentUserRoleId(adminApi);
      const emptyDomain = await createDomain(adminApi, `T106 Empty Scope ${Date.now()}`);
      emptyDomainId = emptyDomain.id;

      emptyScopeUser = await createUser(adminApi, 'Thierry', 'CIO', roleId);
      await assignUserDomains(adminApi, emptyScopeUser.id, [emptyDomain.id]);

      await loginFromUi(page, emptyScopeUser.email, emptyScopeUser.password);
      await expect(page).toHaveURL(/\/$/);

      await expect(page.getByText('Aucune application dans votre périmètre')).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Fiches incomplètes' })).toHaveCount(0);
      await expect(page.getByRole('heading', { name: 'Distribution cycle de vie' })).toHaveCount(0);
      await expect(page.getByRole('heading', { name: 'Qualité des données' })).toHaveCount(0);
      await expect(kpiTile(page, 'Applications')).toBeVisible();
    } finally {
      if (emptyScopeUser) {
        await cleanupUser(adminApi, emptyScopeUser.id);
      }
      if (emptyDomainId) {
        try {
          await adminApi.delete(`domains/${emptyDomainId}`);
        } catch {
          // best-effort cleanup
        }
      }
      await adminApi.dispose();
    }
  });
});
