import { test, expect, type Page, type APIRequestContext } from '@playwright/test';

const API_URL = process.env.API_BASE_URL || 'http://localhost:3001';
const API_VERSION = process.env.API_VERSION || '/api/v1';

async function loginAs(page: Page, email: string, password: string) {
  await page.goto('/login');
  await page.getByLabel('Adresse e-mail').fill(email);
  await page.getByLabel('Mot de passe').fill(password);
  await page.getByRole('button', { name: 'Se connecter' }).click();
  await page.waitForTimeout(1200);
  return !page.url().includes('/login');
}

async function getApiToken(page: Page, email: string, password: string) {
  const res = await page.request.post(`${API_URL}${API_VERSION}/auth/login`, {
    data: { email, password },
  });
  const { accessToken, user } = await res.json();
  expect(user).toBeDefined();
  return accessToken as string;
}

async function loginAdmin(page: Page) {
  const ok = await loginAs(page, 'admin@ark.io', 'admin123456');
  expect(ok).toBeTruthy();
}

async function loginReadOnly(page: Page) {
  return loginAs(page, 'readonly@ark.io', 'readonly123456');
}

async function getAdminApiToken(page: Page) {
  return getApiToken(page, 'admin@ark.io', 'admin123456');
}

async function openBusinessCapabilitiesFromSidebar(page: Page) {
  await page.getByText('Capacités métier').first().click();
  await expect(page).toHaveURL(/\/business-capabilities$/);
}

async function createDomain(request: APIRequestContext, token: string, name: string) {
  const response = await request.post(`${API_URL}${API_VERSION}/domains`, {
    data: { name, description: 'E2E domain' },
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(response.ok()).toBeTruthy();
  return response.json();
}

async function createBusinessCapability(
  request: APIRequestContext,
  token: string,
  data: {
    name: string;
    domainId?: string;
    parentId?: string;
    description?: string;
    criticality?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    technicalFit?: 'ADEQUATE' | 'PARTIAL' | 'INADEQUATE' | 'LEGACY';
  }
) {
  const response = await request.post(`${API_URL}${API_VERSION}/business-capabilities`, {
    data,
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(response.ok()).toBeTruthy();
  return response.json();
}

async function deleteBusinessCapability(request: APIRequestContext, token: string, id: string) {
  await request.delete(`${API_URL}${API_VERSION}/business-capabilities/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
    timeout: 5000,
  });
}

async function deleteDomain(request: APIRequestContext, token: string, id: string) {
  await request.delete(`${API_URL}${API_VERSION}/domains/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
    timeout: 5000,
  });
}

test.describe('Business Capabilities UI', () => {
  test.beforeEach(async ({ page }) => {
    await loginAdmin(page);
    await openBusinessCapabilitiesFromSidebar(page);
    await expect(page.getByRole('heading', { name: 'Business Capabilities' })).toBeVisible();
  });

  test('affiche la liste et le toggle 3 vues', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Liste' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Arbre' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Matrix' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Ajouter une capacité' })).toBeVisible();
  });

  test('bascule entre liste, arbre et matrix', async ({ page }) => {
    await page.getByRole('button', { name: 'Arbre' }).click();
    await expect(page.locator('.MuiTreeItem-root').first()).toBeVisible();

    await page.getByRole('button', { name: 'Matrix' }).click();
    await expect(page.locator('.MuiCard-root').first()).toBeVisible();

    await page.getByRole('button', { name: 'Liste' }).click();
    await expect(page.locator('table')).toBeVisible();
  });

  test('ouvre le drawer sur clic ligne et navigue au détail sur clic nom', async ({ page }) => {
    const firstRow = page.locator('table tbody tr').first();
    await firstRow.locator('td').nth(1).click();
    await expect(page.locator('.MuiDrawer-root')).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(page.locator('.MuiDrawer-root')).not.toBeVisible();

    const nameLink = firstRow.locator('a').first();
    await nameLink.click();
    await expect(page).toHaveURL(/\/business-capabilities\/[a-f0-9-]+$/);
  });

  test('expand/collapse masque les descendants en vue liste', async ({ page }) => {
    const beforeCount = await page.locator('table tbody tr').count();
    await page.locator('table tbody tr td:first-child button').first().click();
    const afterCount = await page.locator('table tbody tr').count();

    expect(afterCount).toBeLessThan(beforeCount);
  });

  test('masque Add + colonne Actions en read-only', async ({ page }) => {
    const readonlyOk = await loginReadOnly(page);
    test.skip(!readonlyOk, 'Compte readonly indisponible sur cet environnement');
    await openBusinessCapabilitiesFromSidebar(page);

    await expect(page.getByRole('button', { name: 'Ajouter une capacité' })).toHaveCount(0);
    await expect(page.getByRole('columnheader', { name: 'Actions' })).toHaveCount(0);
  });
});

test.describe('Business Capabilities create/edit/delete flows', () => {
  test('affiche breadcrumb PNS-11 sur New et crée une capacité', async ({ page }) => {
    await loginAdmin(page);
    await openBusinessCapabilitiesFromSidebar(page);
    await page.getByRole('button', { name: 'Ajouter une capacité' }).click();

    await expect(page.getByText('Accueil')).toBeVisible();
    await expect(page.getByText('Business Capabilities')).toBeVisible();
    await expect(page.getByText('Nouvelle capacité')).toBeVisible();

    const name = `E2E BC ${Date.now()}`;
    await page.getByRole('textbox', { name: 'Nom' }).fill(name);
    await page.getByRole('button', { name: 'Enregistrer' }).click();

    await expect(page).toHaveURL(/\/business-capabilities\/[a-f0-9-]+$/);
    await expect(page.getByText('Capacité créée avec succès')).toBeVisible();
    await expect(page.getByRole('heading', { name })).toBeVisible();
  });

  test('exclut l’entité elle-même du sélecteur parent en édition', async ({ page }) => {
    const token = await getAdminApiToken(page);
    await loginAdmin(page);
    await openBusinessCapabilitiesFromSidebar(page);
    const uniqueName = `E2E Parent Selector ${Date.now()}`;
    const created = await createBusinessCapability(page.request, token, {
      name: uniqueName,
      description: 'selector test',
    });

    try {
      await page.getByPlaceholder('Rechercher une capacité...').fill(uniqueName);
      await page.keyboard.press('Enter');
      await page.getByRole('link', { name: uniqueName }).click();
      await page.getByRole('button', { name: 'Modifier' }).click();
      await page.getByRole('tab', { name: 'Relations' }).click();

      const parentAutocomplete = page.getByRole('combobox', { name: 'Capacité parent' });
      await parentAutocomplete.click();
      await parentAutocomplete.fill(uniqueName);

      await expect(page.getByRole('option', { name: new RegExp(uniqueName) })).toHaveCount(0);
    } finally {
      await deleteBusinessCapability(page.request, token, created.id);
    }
  });

  test('affiche le blocage 409 DEPENDENCY_CONFLICT en suppression avec enfants', async ({ page }) => {
    const token = await getAdminApiToken(page);
    await loginAdmin(page);
    await openBusinessCapabilitiesFromSidebar(page);
    const suffix = Date.now();
    const domain = await createDomain(page.request, token, `E2E BC Domain ${suffix}`);
    const parent = await createBusinessCapability(page.request, token, {
      name: `E2E Parent ${suffix}`,
      domainId: domain.id,
    });
    const child = await createBusinessCapability(page.request, token, {
      name: `E2E Child ${suffix}`,
      domainId: domain.id,
      parentId: parent.id,
    });

    try {
      await page.getByPlaceholder('Rechercher une capacité...').fill(`E2E Parent ${suffix}`);
      await page.keyboard.press('Enter');

      const targetRow = page.locator('table tbody tr').filter({
        has: page.getByRole('link', { name: `E2E Parent ${suffix}` }),
      });
      await expect(targetRow).toHaveCount(1);

      await targetRow.getByRole('button').last().click();
      await page.getByRole('menuitem', { name: 'Supprimer' }).click();
      const confirmDialog = page.getByRole('dialog');
      await expect(confirmDialog).toBeVisible();
      await confirmDialog.getByRole('button', { name: 'Supprimer' }).click();

      await expect(page.getByText('ne peut pas être supprimée')).toBeVisible();
    } finally {
      try {
        await deleteBusinessCapability(page.request, token, child.id);
      } catch {
        // best-effort cleanup
      }
      try {
        await deleteBusinessCapability(page.request, token, parent.id);
      } catch {
        // best-effort cleanup
      }
      try {
        await deleteDomain(page.request, token, domain.id);
      } catch {
        // best-effort cleanup
      }
    }
  });
});
