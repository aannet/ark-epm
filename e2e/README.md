# E2E Tests - Playwright

Tests End-to-End pour ARK-EPM utilisant Playwright.

## Structure

```
e2e/
├── tests/           # Scénarios de test
│   └── *.spec.ts    # Fichiers de test
├── reports/         # Rapports HTML générés
├── Dockerfile       # Image Playwright
└── playwright.config.ts  # Configuration
```

## Commandes disponibles

### Mode A : Tests contre environnement de dev local

Les services backend et frontend doivent déjà tourner :

```bash
# Lancer tous les tests
make test-e2e

# Ou directement
docker-compose run --rm playwright

# Avec affichage des navigateurs (debug)
make test-e2e-debug
```

### Mode B : Tests en environnement isolé

Lance tous les services + les tests, puis arrête tout :

```bash
# CI / isolation complète
make test-e2e-ci

# Ou directement
docker-compose -f docker-compose.yml -f docker-compose.test.yml up --abort-on-container-exit
```

### Visualiser les rapports

```bash
make test-e2e-report
```

Les rapports HTML sont générés dans `e2e/reports/html/`.

## Écrire des tests

Les tests sont dans `e2e/tests/*.spec.ts` :

```typescript
import { test, expect } from '@playwright/test';

test('mon test', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('h1')).toContainText('ARK');
});
```

## Configuration

- **Navigateur** : Chromium uniquement
- **URL base** : `http://frontend:5173` (configurable via `BASE_URL`)
- **Rapports** : HTML dans `reports/html/`

## Troubleshooting

### Les tests échouent car services pas prêts
Les conteneurs attendent automatiquement que frontend:5173 et backend:3000 soient disponibles (timeout: 60s-120s).

### Rapports HTML vides
Vérifiez que le volume `reports` est bien monté :
```bash
docker-compose run playwright ls -la reports/
```

### Modification des tests sans rebuild
Les tests dans `./e2e/tests/` sont montés en volume, les modifications sont immédiates.

## Documentation Playwright

- [API Playwright](https://playwright.dev/docs/api/class-page)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [Selectors](https://playwright.dev/docs/selectors)
