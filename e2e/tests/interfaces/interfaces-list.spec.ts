import { test, expect, type Page } from '../../fixtures/index';

async function loginAs(page: Page, email: string, password: string) {
  await page.goto('/login');
  await page.getByLabel('Adresse e-mail').fill(email);
  await page.getByLabel('Mot de passe').fill(password);

  const loginResponse = page.waitForResponse(
    (response) => response.url().includes('/api/v1/auth/login') && response.request().method() === 'POST',
    { timeout: 10000 }
  );

  await page.getByRole('button', { name: 'Se connecter' }).click();
  const response = await loginResponse;

  if (!response.ok()) {
    return false;
  }

  await expect(page).not.toHaveURL(/\/login(\?.*)?$/, { timeout: 10000 });
  return !page.url().includes('/login');
}

async function loginAdmin(page: Page) {
  const ok = await loginAs(page, 'admin@ark.io', 'admin123456');
  expect(ok).toBeTruthy();
}

test.describe('Interfaces list regression (T-082)', () => {
  test('shows name as first column and filters by free-text name', async ({ page, testData }) => {
    const suffix = Date.now();
    const sourceApp = await testData.createApplication({ name: `T082 Source ${suffix}` });
    const targetApp = await testData.createApplication({ name: `T082 Target ${suffix}` });

    const targetInterfaceName = `T082 Interface ${suffix}`;
    const otherInterfaceName = `T082 Other ${suffix}`;

    await testData.createInterface({
      name: targetInterfaceName,
      sourceAppId: sourceApp.id,
      targetAppId: targetApp.id,
      type: 'REST',
    });

    await testData.createInterface({
      name: otherInterfaceName,
      sourceAppId: targetApp.id,
      targetAppId: sourceApp.id,
      type: 'REST',
    });

    await loginAdmin(page);
    await page.getByText('Interfaces').first().click();
    await expect(page).toHaveURL(/\/interfaces$/);

    await expect(page.locator('table')).toBeVisible();
    await expect(page.locator('table thead th').first()).toContainText('Nom');

    const searchInput = page.getByPlaceholder('Rechercher par nom...');
    await searchInput.fill(targetInterfaceName);

    const targetNameButton = page.getByRole('button', { name: targetInterfaceName });
    await expect(targetNameButton).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('button', { name: otherInterfaceName })).toHaveCount(0);

    const targetRow = page.locator('table tbody tr').filter({ has: targetNameButton }).first();
    await expect(targetRow.locator('td').first().getByRole('button', { name: targetInterfaceName })).toBeVisible();
  });
});
