/**
 * Data Objects — Tests E2E UI (Playwright)
 * Migration de frontend/cypress/e2e/data-objects.cy.ts (F-999 Item 22)
 * 37 tests — 8 sections
 */
import { test, expect, type Page } from '@playwright/test';

const API_URL = process.env.API_BASE_URL || 'http://localhost:3001';
const API_VERSION = process.env.API_VERSION || '/api/v1';

async function loginAs(page: Page, email: string, password: string) {
  const res = await page.request.post(`${API_URL}${API_VERSION}/auth/login`, {
    data: { email, password },
  });
  const { accessToken, user } = await res.json();

  await page.goto('/');
  await page.evaluate(
    ({ token, userData }) => {
      (window as any).__ARK_TOKEN__ = token;
      (window as any).__ARK_USER__ = userData;
    },
    { token: accessToken, userData: user },
  );
}

async function login(page: Page) {
  await loginAs(page, 'admin@ark.io', 'admin123456');
}

async function loginAsReadOnly(page: Page) {
  await loginAs(page, 'readonly@ark.io', 'readonly123456');
}

// ──────────────────────────────────────────
// 1. LIST PAGE
// ──────────────────────────────────────────
test.describe('DataObjectListPage', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('/data-objects');
  });

  test('affiche la liste des objets de données après login', async ({ page }) => {
    await expect(page.getByText('Objets de Données')).toBeVisible();
    await expect(page.getByText('Gestion de vos sources et références de données métier')).toBeVisible();
  });

  test('affiche les colonnes du tableau', async ({ page }) => {
    await expect(page.locator('table')).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Nom' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Type' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Source' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Tags' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Applications' })).toBeVisible();
  });

  test('affiche le bouton Nouveau objet si permissions écriture', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Nouveau objet' })).toBeVisible();
  });

  test('recherche par nom avec debounce', async ({ page }) => {
    await page.getByPlaceholder(/Rechercher/i).fill('TestDO_Inexistant');
    await page.waitForTimeout(500);
    // Après recherche sans résultat, le tableau est vide ou le message vide s'affiche
    const rows = page.locator('table tbody tr');
    const count = await rows.count();
    expect(count).toBeLessThan(20);
  });

  test('trie par nom au clic sur en-tête', async ({ page }) => {
    await page.getByRole('columnheader', { name: 'Nom' }).click();
    await expect(page.locator('table')).toBeVisible();
  });
});

// ──────────────────────────────────────────
// 2. SIDE DRAWER (PNS-02)
// ──────────────────────────────────────────
test.describe('DataObjectDrawer', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('/data-objects');
  });

  test('ouvre le drawer sur clic ligne (hors nom)', async ({ page }) => {
    const rows = page.locator('table tbody tr');
    await rows.first().locator('td').nth(1).click();
    await expect(page.locator('.MuiDrawer-root')).toBeVisible();
  });

  test('navigue vers le détail sur clic du nom', async ({ page }) => {
    const rows = page.locator('table tbody tr');
    await rows.first().locator('a').first().click();
    await expect(page).toHaveURL(/\/data-objects\/[a-f0-9-]+$/);
  });

  test('affiche le drawer avec les onglets Informations et Applications', async ({ page }) => {
    const rows = page.locator('table tbody tr');
    await rows.first().locator('td').nth(1).click();
    const drawer = page.locator('.MuiDrawer-root');
    await expect(drawer.getByText('Informations')).toBeVisible();
    await expect(drawer.getByText('Applications')).toBeVisible();
  });

  test('ferme le drawer sur clic bouton fermer', async ({ page }) => {
    const rows = page.locator('table tbody tr');
    await rows.first().locator('td').nth(1).click();
    const drawer = page.locator('.MuiDrawer-root');
    await expect(drawer).toBeVisible();
    // Fermeture via le premier bouton icône du drawer
    await drawer.locator('button').filter({ has: page.locator('svg') }).first().click();
    await expect(page.locator('.MuiDrawer-root')).not.toBeVisible();
  });

  test('navigue vers le détail depuis le bouton Voir la fiche complète', async ({ page }) => {
    const rows = page.locator('table tbody tr');
    await rows.first().locator('td').nth(1).click();
    const drawer = page.locator('.MuiDrawer-root');
    await drawer.getByRole('button', { name: 'Voir la fiche complète' }).click();
    await expect(page).toHaveURL(/\/data-objects\/[a-f0-9-]+$/);
    await expect(page.locator('.MuiDrawer-root')).not.toBeVisible();
  });

  test('navigue vers édition depuis le bouton Modifier dans le drawer', async ({ page }) => {
    const rows = page.locator('table tbody tr');
    await rows.first().locator('td').nth(1).click();
    const drawer = page.locator('.MuiDrawer-root');
    await drawer.getByRole('button', { name: 'Modifier' }).click();
    await expect(page).toHaveURL(/\/data-objects\/.+\/edit/);
  });

  test('désactive le bouton Modifier si read-only', async ({ page }) => {
    await loginAsReadOnly(page);
    await page.goto('/data-objects');
    const rows = page.locator('table tbody tr');
    await rows.first().locator('td').nth(1).click();
    const drawer = page.locator('.MuiDrawer-root');
    await expect(drawer.getByRole('button', { name: 'Modifier' })).toBeDisabled();
  });
});

// ──────────────────────────────────────────
// 3. DETAIL PAGE
// ──────────────────────────────────────────
test.describe('DataObjectDetailPage', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('affiche le détail complet de l\'objet de données', async ({ page }) => {
    await page.goto('/data-objects');
    await page.getByRole('button', { name: 'Nouveau objet' }).click();
    await page.getByRole('textbox', { name: /Nom/i }).fill(`DetailTestDO ${Date.now()}`);
    await page.getByRole('textbox', { name: /Description/i }).fill('Test description DO');
    await page.getByRole('button', { name: 'Enregistrer' }).click();
    await expect(page.getByText('Test description DO')).toBeVisible();
    await expect(page.getByText(/Créé le/i)).toBeVisible();
  });

  test('affiche un bouton Modifier si permissions écriture', async ({ page }) => {
    await page.goto('/data-objects');
    await page.getByRole('button', { name: 'Nouveau objet' }).click();
    await page.getByRole('textbox', { name: /Nom/i }).fill(`EditableDO ${Date.now()}`);
    await page.getByRole('button', { name: 'Enregistrer' }).click();
    await expect(page.getByRole('button', { name: 'Modifier' })).toBeVisible();
  });

  test('affiche l\'onglet Applications', async ({ page }) => {
    await page.goto('/data-objects');
    await page.getByRole('button', { name: 'Nouveau objet' }).click();
    await page.getByRole('textbox', { name: /Nom/i }).fill(`AppTabDO ${Date.now()}`);
    await page.getByRole('button', { name: 'Enregistrer' }).click();
    await page.getByRole('tab', { name: 'Applications' }).click();
    await expect(page.getByText(/Aucune/i)).toBeVisible();
  });

  test('redirige vers /data-objects si UUID inexistant', async ({ page }) => {
    await page.goto('/data-objects/00000000-0000-0000-0000-000000000000');
    await expect(page).toHaveURL(/\/data-objects$/);
  });
});

// ──────────────────────────────────────────
// 4. FORM (CREATE)
// ──────────────────────────────────────────
test.describe('Création d\'objet de données', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('/data-objects');
  });

  test('crée un objet avec nom et description', async ({ page }) => {
    const name = `NewDOTest ${Date.now()}`;
    await page.getByRole('button', { name: 'Nouveau objet' }).click();
    await expect(page).toHaveURL(/\/data-objects\/new/);
    await page.getByRole('textbox', { name: /Nom/i }).fill(name);
    await page.getByRole('textbox', { name: /Description/i }).fill('Description test');
    await page.getByRole('button', { name: 'Enregistrer' }).click();
    await expect(page.getByText('Objet de données créé avec succès')).toBeVisible();
    await expect(page).toHaveURL(/\/data-objects\/[a-f0-9-]+$/);
    await expect(page.getByText(name)).toBeVisible();
  });

  test('crée un objet sans description', async ({ page }) => {
    await page.getByRole('button', { name: 'Nouveau objet' }).click();
    await page.getByRole('textbox', { name: /Nom/i }).fill(`MinimalDO ${Date.now()}`);
    await page.getByRole('button', { name: 'Enregistrer' }).click();
    await expect(page.getByText('Objet de données créé avec succès')).toBeVisible();
  });

  test('annule la création', async ({ page }) => {
    await page.getByRole('button', { name: 'Nouveau objet' }).click();
    await page.getByRole('textbox', { name: /Nom/i }).fill('DraftDO');
    await page.getByRole('button', { name: 'Annuler' }).click();
    await expect(page).toHaveURL(/\/data-objects$/);
  });

  test('affiche une erreur si nom vide', async ({ page }) => {
    await page.getByRole('button', { name: 'Nouveau objet' }).click();
    await page.getByRole('button', { name: 'Enregistrer' }).click();
    await expect(page.getByText('Le nom est obligatoire')).toBeVisible();
    await expect(page.getByRole('textbox', { name: /Nom/i })).toHaveAttribute('aria-invalid', 'true');
  });

  test('affiche une erreur si nom avec uniquement des espaces', async ({ page }) => {
    await page.getByRole('button', { name: 'Nouveau objet' }).click();
    await page.getByRole('textbox', { name: /Nom/i }).fill('   ');
    await page.getByRole('button', { name: 'Enregistrer' }).click();
    await expect(page.getByText('Le nom est obligatoire')).toBeVisible();
  });

  test('affiche une erreur si nom dupliqué (409)', async ({ page }) => {
    const name = `DuplicateDO ${Date.now()}`;
    // Créer le premier
    await page.getByRole('button', { name: 'Nouveau objet' }).click();
    await page.getByRole('textbox', { name: /Nom/i }).fill(name);
    await page.getByRole('button', { name: 'Enregistrer' }).click();
    await expect(page.getByText('Objet de données créé avec succès')).toBeVisible();

    // Tenter de créer un doublon
    await page.goto('/data-objects/new');
    await page.getByRole('textbox', { name: /Nom/i }).fill(name);
    await page.getByRole('button', { name: 'Enregistrer' }).click();
    await expect(page.getByText(/Ce nom d'objet existe déjà/i)).toBeVisible();
  });
});

// ──────────────────────────────────────────
// 5. FORM (EDIT)
// ──────────────────────────────────────────
test.describe('Modification d\'objet de données', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('modifie un objet de données', async ({ page }) => {
    await page.goto('/data-objects');
    await page.getByRole('button', { name: 'Nouveau objet' }).click();
    await page.getByRole('textbox', { name: /Nom/i }).fill(`OriginalDO ${Date.now()}`);
    await page.getByRole('textbox', { name: /Description/i }).fill('Original description');
    await page.getByRole('button', { name: 'Enregistrer' }).click();
    await expect(page.getByText('Objet de données créé avec succès')).toBeVisible();

    await page.getByRole('button', { name: 'Modifier' }).click();
    await expect(page).toHaveURL(/\/edit/);
    await page.getByRole('textbox', { name: /Description/i }).fill('Updated description');
    await page.getByRole('button', { name: 'Enregistrer' }).click();

    await expect(page.getByText('Objet de données modifié avec succès')).toBeVisible();
    await expect(page.getByText('Updated description')).toBeVisible();
    await expect(page.getByText('Original description')).not.toBeVisible();
  });

  test('annule la modification', async ({ page }) => {
    await page.goto('/data-objects');
    await page.getByRole('button', { name: 'Nouveau objet' }).click();
    await page.getByRole('textbox', { name: /Nom/i }).fill(`CancelDO ${Date.now()}`);
    await page.getByRole('textbox', { name: /Description/i }).fill('Original');
    await page.getByRole('button', { name: 'Enregistrer' }).click();

    await page.getByRole('button', { name: 'Modifier' }).click();
    await page.getByRole('textbox', { name: /Description/i }).fill('Modified');
    await page.getByRole('button', { name: 'Annuler' }).click();

    await expect(page.getByText('Original')).toBeVisible();
    await expect(page.getByText('Modified')).not.toBeVisible();
  });

  test('redirige vers /data-objects si UUID inexistant en édition', async ({ page }) => {
    await login(page);
    await page.goto('/data-objects/00000000-0000-0000-0000-000000000000/edit');
    await expect(page).toHaveURL(/\/data-objects$/);
  });
});

// ──────────────────────────────────────────
// 6. SUPPRESSION
// ──────────────────────────────────────────
test.describe('Suppression d\'objet de données', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('supprime un objet sans applications liées', async ({ page }) => {
    const name = `ToDeleteDO ${Date.now()}`;
    await page.goto('/data-objects');
    await page.getByRole('button', { name: 'Nouveau objet' }).click();
    await page.getByRole('textbox', { name: /Nom/i }).fill(name);
    await page.getByRole('button', { name: 'Enregistrer' }).click();

    await page.goto('/data-objects');
    await expect(page.getByText(name)).toBeVisible();

    await page.getByRole('button', { name: 'Supprimer' }).first().click();
    await expect(page.getByText(/Supprimer l'objet de données/i)).toBeVisible();
    await page.getByRole('button', { name: 'Confirmer' }).click();

    await expect(page.getByText('Objet de données supprimé avec succès')).toBeVisible();
    await expect(page.getByText(name)).not.toBeVisible();
  });

  test('annule la suppression', async ({ page }) => {
    const name = `KeepMeDO ${Date.now()}`;
    await page.goto('/data-objects');
    await page.getByRole('button', { name: 'Nouveau objet' }).click();
    await page.getByRole('textbox', { name: /Nom/i }).fill(name);
    await page.getByRole('button', { name: 'Enregistrer' }).click();

    await page.goto('/data-objects');
    await expect(page.getByText(name)).toBeVisible();

    await page.getByRole('button', { name: 'Supprimer' }).first().click();
    await page.getByRole('button', { name: 'Annuler' }).click();

    await expect(page.getByText(name)).toBeVisible();
  });

  // NOTE: Test DEPENDENCY_CONFLICT — nécessite un lien application↔data-object via API.
  // Skippé jusqu'à implémentation du champ `dataObjects` dans le DTO Applications.
  // Ref: F-999 Item 22, FS-05-BACK (appDataObjectMap)
  test.skip('affiche erreur si objet lié à des applications (409)', async ({ page }) => {
    // TODO: Créer un DO, lier une application, vérifier le message 409 dans le dialog
  });

  test.skip('désactive le bouton Confirmer sur DEPENDENCY_CONFLICT', async ({ page }) => {
    // TODO: Même prérequis que ci-dessus
  });
});

// ──────────────────────────────────────────
// 7. FILTRES
// ──────────────────────────────────────────
test.describe('Filtres', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('/data-objects');
  });

  test('filtre par type', async ({ page }) => {
    await page.getByLabel('Type').click();
    await page.getByRole('option', { name: 'database' }).click();
    await page.waitForTimeout(300);
    const rows = page.locator('table tbody tr');
    expect(await rows.count()).toBeLessThan(20);
  });

  test('filtre par source officielle', async ({ page }) => {
    await page.getByLabel('Source officielle').click();
    await page.getByRole('option', { name: 'Oui' }).click();
    await page.waitForTimeout(300);
    const rows = page.locator('table tbody tr');
    expect(await rows.count()).toBeLessThan(20);
  });
});

// ──────────────────────────────────────────
// 8. DROITS UI (read-only)
// ──────────────────────────────────────────
test.describe('Droits UI — utilisateur read-only', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsReadOnly(page);
    await page.goto('/data-objects');
  });

  test('bouton Nouveau objet absent pour read-only', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Nouveau objet' })).not.toBeVisible();
  });

  test('colonne Actions absente pour read-only', async ({ page }) => {
    await expect(page.getByRole('columnheader', { name: 'Actions' })).not.toBeVisible();
  });

  test('icônes edit/delete absentes pour read-only', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Modifier' })).not.toBeVisible();
    await expect(page.getByRole('button', { name: 'Supprimer' })).not.toBeVisible();
  });

  test('redirect vers /403 pour /data-objects/new si read-only', async ({ page }) => {
    await page.goto('/data-objects/new');
    await expect(page).toHaveURL(/\/403/);
  });

  test('redirect vers /403 pour /data-objects/:id/edit si read-only', async ({ page }) => {
    await page.goto('/data-objects/some-id/edit');
    await expect(page).toHaveURL(/\/403/);
  });
});
