import { test, expect } from '@playwright/test';

test.describe('ARK-EPM Basic E2E Tests', () => {
  
  test('page should load successfully', async ({ page }) => {
    await page.goto('/');
    
    // Vérifier que la page a chargé
    await expect(page).toHaveTitle(/ARK|EPM/);
    
    // Vérifier qu'un élément clé est présent (ajustez selon votre app)
    await expect(page.locator('body')).toBeVisible();
  });

test('health check - backend accessible', async ({ request }) => {
  const backendHealthUrl = `${(process.env.API_BASE_URL ?? 'http://backend:3000').replace(/\/+$/, '')}/health`;

  // Test de disponibilité du backend
  const response = await request.get(backendHealthUrl);
    
    // Note: Ajoutez un endpoint /health dans votre backend si inexistant
    // ou modifiez cette URL vers un endpoint existant
    expect([200, 404]).toContain(response.status());
  });

});
