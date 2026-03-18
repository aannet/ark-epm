# E2E Tests - Playwright

Tests End-to-End pour ARK-EPM utilisant Playwright.

## Structure

```
e2e/
├── tests/              # Scénarios de test
│   ├── domains/        # Tests API Domains (FS-02)
│   ├── applications/   # Tests API Applications (FS-06)
│   └── *.spec.ts       # Tests UI
├── fixtures/           # Fixtures réutilisables
│   ├── auth.fixture.ts       # Authentification JWT
│   └── test-data.fixture.ts  # Factories de données avec cleanup
├── utils/              # Helpers et types
│   └── api-helpers.ts  # Assertions API, types
├── reports/            # Rapports HTML générés
├── Dockerfile          # Image Playwright
└── playwright.config.ts    # Configuration
```

## Types de Tests

### Tests UI (Interface utilisateur)
Tests navigateur classiques pour valider le frontend.

### Tests API Backend (Nouveau)
Tests directs de l'API backend via Playwright request.

## Commandes disponibles

### Tests API Backend - Stratégie Hybride

Les tests API backend s'exécutent avec une **stratégie hybride** qui détecte automatiquement le contexte :
- Si Node/npm est disponible ET le backend répond sur `API_BASE_URL` → Mode **local** (npx)
- Sinon → Mode **Docker** (isolated, sans frontend)

#### Commandes principales

```bash
# Détection automatique (recommandé pour le développement)
make test-api-backend

# Mode local explicite (backend sur localhost:3000)
make test-api-local
# ou: API_BASE_URL=http://localhost:3000 make test-api-backend

# Mode Docker explicite (backend dans container)
make test-api-docker

# URL personnalisée (staging, test, etc.)
make test-api-custom API_URL=http://api.staging.example.com
```

#### Variables d'environnement

```bash
API_BASE_URL=http://localhost:3000    # URL backend (défaut: localhost:3000)
API_VERSION=/api/v1                   # Version API (défaut: /api/v1)
API_USER_EMAIL=admin@ark.io           # Compte test
API_USER_PASSWORD=admin123456         # Mot de passe
```

#### Exemples d'utilisation

```bash
# Ton cas: backend local lancé avec "make dev-clean"
make test-api-backend
# → Détecte localhost:3000, utilise npx directement

# Backend local avec credentials personnalisés
API_USER_EMAIL=test@example.com API_USER_PASSWORD=secret make test-api-local

# URL personnalisée avec version spécifique
API_URL=http://api.staging.example.com API_VERSION=/api/v2 make test-api-custom

# Tests spécifiques (auto-détection)
make test-api-domains
make test-api-applications

# Rapport HTML
make test-api-report
```

### Tests UI (Mode A : Tests contre environnement de dev local)

Les services backend et frontend doivent déjà tourner :

```bash
# Lancer tous les tests UI
make test-e2e

# Ou directement
docker-compose run --rm playwright

# Avec affichage des navigateurs (debug)
make test-e2e-debug
```

### Tests en environnement isolé

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
# ou
make test-api-report
```

Les rapports HTML sont générés dans `e2e/reports/html/`.

## Configuration des Tests API

### Variables d'environnement

```bash
API_BASE_URL=http://backend:3000    # URL backend (défaut: Docker)
API_USER_EMAIL=admin@ark.io       # Compte test
API_USER_PASSWORD=admin123456     # Mot de passe
```

### Exemple d'utilisation

```typescript
import { test, expect } from '../../fixtures/auth.fixture';
import { TestDataFactory } from '../../fixtures/test-data.fixture';

test('should create domain', async ({ auth }) => {
  const factory = new TestDataFactory(auth.request);
  
  const domain = await factory.createDomain({
    name: 'Test Domain'
  });
  
  expect(domain.id).toBeTruthy();
  
  await factory.cleanup(); // Nettoyage automatique
});
```

## Structure des Tests API

### Domains (FS-02-BACK)
- `domains-crud.api.spec.ts` : CRUD complet
- `domains-validation.api.spec.ts` : Validation (doublons, champs vides)
- `domains-dependencies.api.spec.ts` : Suppression bloquée par dépendances

### Applications (FS-06-BACK)
- `applications-crud.api.spec.ts` : CRUD complet
- `applications-pagination.api.spec.ts` : Pagination et filtres
- `applications-validation.api.spec.ts` : Validation
- `applications-dependencies.api.spec.ts` : Endpoint /dependencies et suppression

## Écrire des tests

### Tests API

Les tests API utilisent les fichiers `.api.spec.ts` :

```typescript
import { test, expect } from '../../fixtures/auth.fixture';
import { expectSuccess, DomainResponse } from '../../utils/api-helpers';

test('GET /domains should return array', async ({ auth }) => {
  const response = await auth.request.get('/domains');
  const domains = await expectSuccess<DomainResponse[]>(response, 200);
  expect(Array.isArray(domains)).toBe(true);
});
```

### Tests UI

Les tests UI utilisent les fichiers `.spec.ts` (sans `.api`) :

```typescript
import { test, expect } from '@playwright/test';

test('page should load', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/ARK|EPM/);
});
```

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
- [API Testing](https://playwright.dev/docs/api-testing)
