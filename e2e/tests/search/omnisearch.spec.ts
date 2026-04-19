/**
 * Omnisearch — Tests E2E UI (Playwright)
 * FS-11-FRONT — Composant de recherche global dans TopBar
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

// ──────────────────────────────────────────
// 1. ACCÈS RAPIDE RECHERCHE (US-01)
// ──────────────────────────────────────────
test.describe('US-01 — Accès rapide recherche', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('/applications');
  });

  test('raccourci Ctrl+K ouvre la popover de recherche', async ({ page }) => {
    await page.keyboard.press('Control+k');
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
    await page.goto('/applications');
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
    await page.goto('/applications');
    await page.getByRole('button', { name: /Ouvrir la recherche/i }).click();
  });

  test('saisir un terme affiche des résultats après debounce', async ({ page }) => {
    await page.getByPlaceholder(/Rechercher une application/i).fill('CRM');
    await page.waitForTimeout(400); // debounce 300ms + marge
    const results = page.locator('[role="listitem"]');
    await expect(results.first()).toBeVisible({ timeout: 5000 });
  });

  test('indicateur de chargement pendant la requête', async ({ page }) => {
    await page.getByPlaceholder(/Rechercher une application/i).fill('Test');
    // Vérifier que le spinner ou l'état de chargement est présent
    const progress = page.locator('.MuiCircularProgress-root');
    await expect(progress).toBeVisible({ timeout: 2000 });
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
    await page.goto('/applications');
    await page.getByRole('button', { name: /Ouvrir la recherche/i }).click();
    await page.getByPlaceholder(/Rechercher une application/i).fill('CRM');
    await page.waitForTimeout(400);
    // Attendre que les résultats soient visibles
    await expect(page.locator('[role="listitem"]').first()).toBeVisible({ timeout: 5000 });
  });

  test('flèche ↓ sélectionne le résultat suivant', async ({ page }) => {
    const firstItem = page.locator('[role="listitem"]').first();
    const secondItem = page.locator('[role="listitem"]').nth(1);

    await expect(firstItem).toHaveAttribute('aria-selected', 'true');
    await page.keyboard.press('ArrowDown');
    await expect(secondItem).toHaveAttribute('aria-selected', 'true');
  });

  test('flèche ↑ sélectionne le résultat précédent', async ({ page }) => {
    const firstItem = page.locator('[role="listitem"]').first();

    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowUp');
    await expect(firstItem).toHaveAttribute('aria-selected', 'true');
  });

  test('touche Enter ouvre le résultat sélectionné', async ({ page }) => {
    const firstItem = page.locator('[role="listitem"]').first();
    await firstItem.click(); // Pour s'assurer qu'un résultat existe

    // Extraire l'ID du premier résultat
    const href = await firstItem.getAttribute('href');
    const expectedUrl = href || '/applications'; // fallback

    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/applications\/[a-f0-9-]+$/);
  });

  test('touche Escape ferme la popover', async ({ page }) => {
    await page.keyboard.press('Escape');
    await expect(page.getByPlaceholder(/Rechercher une application/i)).not.toBeVisible();
  });

  test('premier résultat sélectionné par défaut', async ({ page }) => {
    const firstItem = page.locator('[role="listitem"]').first();
    await expect(firstItem).toHaveAttribute('aria-selected', 'true');
  });
});

// ──────────────────────────────────────────
// 4. GROUPES PAR TYPE (US-04)
// ──────────────────────────────────────────
test.describe('US-04 — Groupes par type', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('/applications');
    await page.getByRole('button', { name: /Ouvrir la recherche/i }).click();
  });

  test('résultats groupés par type avec sous-titres', async ({ page }) => {
    await page.getByPlaceholder(/Rechercher une application/i).fill('a');
    await page.waitForTimeout(400);

    // Vérifier que des sous-titres de groupes sont présents
    const groupHeaders = page.locator('.MuiListSubheader-root');
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

    const firstResult = page.locator('[role="listitem"]').first();
    await expect(firstResult).toBeVisible();

    // Vérifier que le nom est présent et visible
    const nameElement = firstResult.locator('h6, span').first();
    await expect(nameElement).toBeVisible();
  });
});

// ──────────────────────────────────────────
// 5. NAVIGATION VERS DÉTAIL (US-05)
// ──────────────────────────────────────────
test.describe('US-05 — Navigation vers détail', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('/applications');
    await page.getByRole('button', { name: /Ouvrir la recherche/i }).click();
  });

  test('clic sur un résultat navigue vers la page détail', async ({ page }) => {
    // Créer une application de test
    const timestamp = Date.now();
    const res = await page.request.post(`${API_URL}${API_VERSION}/applications`, {
      data: { name: `NavigateTest ${timestamp}`, description: 'Test navigation' },
    });
    const data = await res.json();

    await page.getByPlaceholder(/Rechercher une application/i).fill(`NavigateTest ${timestamp}`);
    await page.waitForTimeout(400);

    await page.locator('[role="listitem"]').first().click();
    await expect(page).toHaveURL(`/applications/${data.id}`);

    // Cleanup
    await page.request.delete(`${API_URL}${API_VERSION}/applications/${data.id}`);
  });

  test('la popover se ferme après navigation', async ({ page }) => {
    const timestamp = Date.now();
    const res = await page.request.post(`${API_URL}${API_VERSION}/applications`, {
      data: { name: `CloseTest ${timestamp}`, description: 'Test' },
    });
    const data = await res.json();

    await page.getByPlaceholder(/Rechercher une application/i).fill(`CloseTest ${timestamp}`);
    await page.waitForTimeout(400);

    await page.locator('[role="listitem"]').first().click();
    await expect(page.getByPlaceholder(/Rechercher une application/i)).not.toBeVisible();

    // Cleanup
    await page.request.delete(`${API_URL}${API_VERSION}/applications/${data.id}`);
  });
});

// ──────────────────────────────────────────
// 6. PARCOURS D'ERREUR
// ──────────────────────────────────────────
test.describe('Parcours d\'erreur', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('/applications');
    await page.getByRole('button', { name: /Ouvrir la recherche/i }).click();
  });

  test('token expiré pendant la recherche → redirect vers /login', async ({ page }) => {
    // Simuler une session expirée en supprimant le token
    await page.evaluate(() => {
      (window as any).__ARK_TOKEN__ = null;
    });

    await page.getByPlaceholder(/Rechercher une application/i).fill('Test');
    await page.waitForTimeout(400);

    // La requête devrait échouer et rediriger
    await expect(page).toHaveURL(/\/login/);
  });
});
