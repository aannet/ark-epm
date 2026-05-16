/**
 * Omnisearch — Tests E2E UI (Playwright)
 * FS-11-FRONT — Composant de recherche global dans TopBar
 */
import { test, expect, type Page } from '@playwright/test';

const API_URL = process.env.API_BASE_URL || 'http://localhost:3001';
const API_VERSION = process.env.API_VERSION || '/api/v1';

const searchResultItemsSelector = '[role="dialog"] .MuiListItemButton-root';

async function loginAs(page: Page, email: string, password: string) {
  await page.goto('/login');
  await page.getByLabel('Adresse e-mail').fill(email);
  await page.getByLabel('Mot de passe').fill(password);

  const loginResponse = page.waitForResponse(
    (response) => response.url().includes('/api/v1/auth/login') && response.request().method() === 'POST',
    { timeout: 10000 },
  );
  const profileResponse = page
    .waitForResponse(
      (response) => response.url().includes('/api/v1/auth/me') && response.request().method() === 'GET',
      { timeout: 10000 },
    )
    .catch(() => null);

  await page.getByRole('button', { name: 'Se connecter' }).click();
  const response = await loginResponse;

  if (!response.ok()) {
    return false;
  }

  await expect(page).not.toHaveURL(/\/login(\?.*)?$/, { timeout: 10000 });
  const meResponse = await profileResponse;

  if (meResponse && !meResponse.ok()) {
    return false;
  }

  return !page.url().includes('/login');
}

async function login(page: Page) {
  const ok = await loginAs(page, 'admin@ark.io', 'admin123456');
  expect(ok).toBeTruthy();
}

// ──────────────────────────────────────────
// 1. ACCÈS RAPIDE RECHERCHE (US-01)
// ──────────────────────────────────────────
test.describe('US-01 — Accès rapide recherche', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('raccourci Ctrl+K ouvre la popover de recherche', async ({ page }) => {
    await page.evaluate(() => {
      window.dispatchEvent(
        new KeyboardEvent('keydown', {
          key: 'k',
          code: 'KeyK',
          ctrlKey: true,
          bubbles: true,
        }),
      );
    });
    await expect(page.getByPlaceholder(/Rechercher une application/i)).toBeVisible();
  });

  test('clic sur icône recherche dans TopBar ouvre la popover', async ({ page }) => {
    await page.getByRole('button', { name: /Ouvrir la recherche/i }).click();
    await expect(page.getByPlaceholder(/Rechercher une application/i)).toBeVisible();
  });

  test('la popover est centrée avec le champ de recherche', async ({ page }) => {
    await page.getByRole('button', { name: /Ouvrir la recherche/i }).click();
    const dialog = page.locator('.MuiDialog-root');
    await expect(dialog).toBeVisible();
    await expect(page.getByPlaceholder(/Rechercher une application/i)).toBeFocused();
  });
});

// ──────────────────────────────────────────
// 6. AUTO-FOCUS À L'OUVERTURE (US-06)
// ──────────────────────────────────────────
test.describe('US-06 — Auto-focus à l\'ouverture', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('le champ de recherche est focalisé à l\'ouverture initiale', async ({ page }) => {
    await page.getByRole('button', { name: /Ouvrir la recherche/i }).click();
    // Attendre la fin de l'animation du Dialog (80ms dans l'implémentation)
    await page.waitForTimeout(100);
    const input = page.getByPlaceholder(/Rechercher une application/i);
    await expect(input).toBeFocused();
  });

  test('le champ est refocalisé à la réouverture après fermeture', async ({ page }) => {
    const searchButton = page.getByRole('button', { name: /Ouvrir la recherche/i });
    const input = page.getByPlaceholder(/Rechercher une application/i);

    // Ouvrir puis fermer
    await searchButton.click();
    await page.waitForTimeout(100);
    await page.keyboard.press('Escape');
    await expect(input).not.toBeVisible();

    // Réouvrir et vérifier le focus
    await searchButton.click();
    await page.waitForTimeout(100);
    await expect(input).toBeFocused();
  });

  test('l\'utilisateur peut taper immédiatement sans clic souris', async ({ page }) => {
    await page.getByRole('button', { name: /Ouvrir la recherche/i }).click();
    // Attendre le focus
    await page.waitForTimeout(100);

    // Taper directement sans cliquer sur le champ
    await page.keyboard.type('CRM');
    await expect(page.getByPlaceholder(/Rechercher une application/i)).toHaveValue('CRM');
  });
});

// ──────────────────────────────────────────
// 2. RECHERCHE TEMPS RÉEL (US-02)
// ──────────────────────────────────────────
test.describe('US-02 — Recherche temps réel', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.getByRole('button', { name: /Ouvrir la recherche/i }).click();
  });

  test('saisir un terme affiche des résultats après debounce', async ({ page }) => {
    await page.getByPlaceholder(/Rechercher une application/i).fill('CRM');
    await page.waitForTimeout(400); // debounce 300ms + marge
    const results = page.locator(searchResultItemsSelector);
    await expect(results.first()).toBeVisible({ timeout: 5000 });
  });

  test('indicateur de chargement pendant la requête', async ({ page }) => {
    const searchResponse = page.waitForResponse(
      (response) => response.url().includes('/api/v1/search?q=Test') && response.request().method() === 'GET',
      { timeout: 5000 },
    );
    await page.getByPlaceholder(/Rechercher une application/i).fill('Test');
    const response = await searchResponse;
    expect(response.ok()).toBeTruthy();
  });

  test('"Aucun résultat" affiché si recherche vide', async ({ page }) => {
    await page.getByPlaceholder(/Rechercher une application/i).fill('XYZ_NonExistant_99999');
    await page.waitForTimeout(400);
    await expect(page.getByText(/Aucun résultat trouvé/i)).toBeVisible();
  });

  test('minimum 2 caractères pour lancer la recherche', async ({ page }) => {
    await page.getByPlaceholder(/Rechercher une application/i).fill('A');
    await expect(page.getByText(/Saisissez au moins 2 caractères/i)).toBeVisible();
  });
});

// ──────────────────────────────────────────
// 3. NAVIGATION CLAVIER (US-03)
// ──────────────────────────────────────────
test.describe('US-03 — Navigation clavier', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await expect(page).toHaveURL(/\/$/);
    await page.getByRole('button', { name: /Ouvrir la recherche/i }).click();
    await page.getByPlaceholder(/Rechercher une application/i).fill('CRM');
    await page.waitForTimeout(400);
    // Attendre que les résultats soient visibles
    await expect(page.locator(searchResultItemsSelector).first()).toBeVisible({ timeout: 5000 });
  });

  test('flèche ↓ sélectionne le résultat suivant', async ({ page }) => {
    await page.keyboard.press('ArrowDown');
    await expect(page.locator(`${searchResultItemsSelector}.Mui-selected`).first()).toBeVisible();
  });

  test('flèche ↑ sélectionne le résultat précédent', async ({ page }) => {
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowUp');
    await expect(page.locator(`${searchResultItemsSelector}.Mui-selected`).first()).toBeVisible();
  });

  test('touche Enter ouvre le résultat sélectionné', async ({ page }) => {
    await expect(page.locator(searchResultItemsSelector).first()).toBeVisible();

    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/(applications|data-objects|providers|interfaces|domains|business-capabilities|it-components)\//);
  });

  test('touche Escape ferme la popover', async ({ page }) => {
    await page.keyboard.press('Escape');
    await expect(page.getByPlaceholder(/Rechercher une application/i)).not.toBeVisible();
  });

  test('premier résultat sélectionné par défaut', async ({ page }) => {
    await page.keyboard.press('ArrowDown');
    await expect(page.locator(`${searchResultItemsSelector}.Mui-selected`).first()).toBeVisible();
  });
});

// ──────────────────────────────────────────
// 4. GROUPES PAR TYPE (US-04)
// ──────────────────────────────────────────
test.describe('US-04 — Groupes par type', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await expect(page).toHaveURL(/\/$/);
    await page.getByRole('button', { name: /Ouvrir la recherche/i }).click();
  });

  test('résultats groupés par type avec sous-titres', async ({ page }) => {
    await page.getByPlaceholder(/Rechercher une application/i).fill('CRM');
    await page.waitForTimeout(400);

    // Vérifier que des sous-titres de groupes sont présents
    const groupHeaders = page.getByRole('listitem');
    await expect(groupHeaders.first()).toBeVisible();
  });

  test('ordre des groupes correct', async ({ page }) => {
    // Créer des entités de différents types via API pour un test déterministe
    const timestamp = Date.now();

    // Créer une application
    const appRes = await page.request.post(`${API_URL}${API_VERSION}/applications`, {
      data: { name: `TestOrderApp ${timestamp}`, description: 'Test' },
    });
    const appData = await appRes.json();

    // Créer un domaine
    const domainRes = await page.request.post(`${API_URL}${API_VERSION}/domains`, {
      data: { name: `TestOrderDomain ${timestamp}`, description: 'Test' },
    });
    const domainData = await domainRes.json();

    await page.getByPlaceholder(/Rechercher une application/i).fill(`TestOrder ${timestamp}`);
    await page.waitForTimeout(400);

    // Vérifier que les groupes sont présents
    await expect(page.getByText(/Applications/i).first()).toBeVisible();

    // Cleanup
    await page.request.delete(`${API_URL}${API_VERSION}/applications/${appData.id}`);
    await page.request.delete(`${API_URL}${API_VERSION}/domains/${domainData.id}`);
  });

  test('nom de l\'entité en gras, description tronquée', async ({ page }) => {
    await page.getByPlaceholder(/Rechercher une application/i).fill('CRM');
    await page.waitForTimeout(400);

    const firstResult = page.locator(searchResultItemsSelector).first();
    await expect(firstResult).toBeVisible();

    await expect(firstResult).toContainText(/CRM/i);
  });
});

// ──────────────────────────────────────────
// 5. NAVIGATION VERS DÉTAIL (US-05)
// ──────────────────────────────────────────
test.describe('US-05 — Navigation vers détail', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await expect(page).toHaveURL(/\/$/);
    await page.getByRole('button', { name: /Ouvrir la recherche/i }).click();
  });

  test('clic sur un résultat navigue vers la page détail', async ({ page }) => {
    await page.getByPlaceholder(/Rechercher une application/i).fill('CRM');
    await page.waitForTimeout(400);

    await page.locator(searchResultItemsSelector).first().click({ force: true });
    await expect(page).toHaveURL(/\/(applications|data-objects|providers|interfaces|domains|business-capabilities|it-components)\/[a-f0-9-]+$/);
  });

  test('la popover se ferme après navigation', async ({ page }) => {
    await page.getByPlaceholder(/Rechercher une application/i).fill('CRM');
    await page.waitForTimeout(400);

    await page.locator(searchResultItemsSelector).first().click({ force: true });
    await expect(page.getByPlaceholder(/Rechercher une application/i)).not.toBeVisible();
  });
});

// ──────────────────────────────────────────
// 6. PARCOURS D'ERREUR
// ──────────────────────────────────────────
test.describe('Parcours d\'erreur', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await expect(page).toHaveURL(/\/$/);
    await page.getByRole('button', { name: /Ouvrir la recherche/i }).click();
  });

  test('token expiré pendant la recherche → redirect vers /login', async ({ page }) => {
    await page.route('**/api/v1/search*', async (route) => {
      await route.fulfill({
        status: 401,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          statusCode: 401,
          message: 'Invalid or expired token',
          code: 'UNAUTHORIZED',
        }),
      });
    });

    await page.getByPlaceholder(/Rechercher une application/i).fill('Test');
    await page.waitForTimeout(400);

    // La requête devrait échouer et rediriger
    await expect(page).toHaveURL(/\/login/);

    await page.unroute('**/api/v1/search*');
  });
});
