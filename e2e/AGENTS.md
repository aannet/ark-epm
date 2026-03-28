# QA / Tests — Guide Op\u00e9rationnel

> Guide sp\u00e9cialis\u00e9 pour l'Agent `qa` sur ARK-EPM.  
> Ce fichier compl\u00e8te le `AGENTS.md` racine \u2014 charger les deux avant toute intervention.

---

## 1. Strat\u00e9gie de Test (3 couches)

| Couche | Outil | Scope | Fichiers | Commande |
|--------|-------|-------|----------|----------|
| **Unit\u00e9 backend** | Jest | Services, guards, pipes | `backend/src/**/*.spec.ts` | `make test-backend-unit` |
| **Int\u00e9gration backend** | Jest + Supertest | Endpoints HTTP complets | `backend/test/*.e2e-spec.ts` | `make test-backend-e2e` |
| **API Playwright** | Playwright | Endpoints REST isol\u00e9s | `e2e/tests/**/*.api.spec.ts` | `make test-api-backend` |
| **E2E UI Playwright** | Playwright | Parcours utilisateur complets | `e2e/tests/**/*.spec.ts` | `make test-e2e` |
| **Frontend Cypress** | Cypress | Composants + parcours UI | `frontend/cypress/e2e/*.cy.ts` | `cd frontend && npx cypress run` |

### Quand \u00e9crire quel test

| Situation | Type de test | Agent responsable |
|-----------|-------------|-------------------|
| Nouveau service NestJS | Unit Jest (`.spec.ts`) | `qa` |
| Nouveau CRUD endpoint | API Playwright (`*.api.spec.ts`) | `qa` |
| Nouveau parcours utilisateur critique | E2E Playwright (`*.spec.ts`) | `qa` |
| Bug signal\u00e9 | Test de non-r\u00e9gression **avant** correction | `qa` |
| Nouveau composant React isol\u00e9 | Cypress | `qa` |

---

## 2. Configuration Playwright

### Fichier : `e2e/playwright.config.ts`

Deux projets configur\u00e9s :

```typescript
projects: [
  {
    name: 'ui',                            // Tests UI full-stack
    testMatch: /.*\.spec\.ts$/,
    testIgnore: /.*\.api\.spec\.ts$/,
    use: {
      baseURL: process.env.BASE_URL || 'http://frontend:5173',
    },
  },
  {
    name: 'api-backend',                   // Tests API REST
    testMatch: /.*\.api\.spec\.ts$/,
    use: {
      baseURL: `${process.env.API_BASE_URL || 'http://localhost:3000'}${process.env.API_VERSION || '/api/v1'}`,
    },
  },
],
```

### Convention de nommage des fichiers

| Pattern | Projet | Exemple |
|---------|--------|---------|
| `*.spec.ts` | `ui` | `04-it-components.spec.ts` |
| `*.api.spec.ts` | `api-backend` | `applications-crud.api.spec.ts` |

### Organisation des tests API

```
e2e/tests/
\u251c\u2500\u2500 applications/
\u2502   \u251c\u2500\u2500 applications-crud.api.spec.ts
\u2502   \u251c\u2500\u2500 applications-pagination.api.spec.ts
\u2502   \u251c\u2500\u2500 applications-validation.api.spec.ts
\u2502   \u2514\u2500\u2500 applications-dependencies.api.spec.ts
\u251c\u2500\u2500 domains/
\u2502   \u251c\u2500\u2500 domains-crud.api.spec.ts
\u2502   \u251c\u2500\u2500 domains-validation.api.spec.ts
\u2502   \u2514\u2500\u2500 domains-dependencies.api.spec.ts
\u2514\u2500\u2500 example.spec.ts
```

---

## 3. Fixtures

Les fixtures Playwright sont d\u00e9finies dans `e2e/fixtures/` :

| Fixture | Fichier | R\u00f4le |
|---------|---------|------|
| `auth` | `auth.fixture.ts` | Authentification JWT (login + token) |
| `apiConfig` | `api-config.fixture.ts` | Base URL + headers communs |
| `testData` | `test-data.fixture.ts` | Donn\u00e9es de test (cr\u00e9ation/nettoyage) |

### Utilisation

```typescript
import { test } from '../fixtures';

test('should create an application', async ({ authenticatedRequest }) => {
  const response = await authenticatedRequest.post('/applications', {
    data: { name: 'Test App', description: 'Created by e2e test' },
  });
  expect(response.ok()).toBeTruthy();
});
```

---

## 4. Conventions

### S\u00e9lecteurs (tests UI)

Priorit\u00e9 de s\u00e9lection :

1. `getByRole()` \u2014 pr\u00e9f\u00e9r\u00e9 (accessible, robuste)
2. `getByText()` \u2014 acceptable pour le texte visible
3. `getByTestId()` \u2014 dernier recours (ajouter `data-testid` au composant)

### Isolation des donn\u00e9es

- Chaque test cr\u00e9e ses propres donn\u00e9es via l'API
- Chaque test nettoie ses donn\u00e9es apr\u00e8s ex\u00e9cution (`afterEach` / `afterAll`)
- Noms de test uniques : pr\u00e9fixer avec `[E2E]` ou timestamp pour \u00e9viter les collisions

### Tests unitaires backend (Jest)

- Mocker `PrismaService` pour isoler la logique m\u00e9tier
- Tester les cas limites : input invalide, entit\u00e9 non trouv\u00e9e, duplication de nom
- Utiliser `crypto.randomUUID()` (natif Node.js) plut\u00f4t que le package `uuid`

### Pattern test API

```typescript
test.describe('Applications CRUD', () => {
  test('POST /applications - should create', async ({ authenticatedRequest }) => {
    const res = await authenticatedRequest.post('/applications', {
      data: { name: `Test-${Date.now()}` },
    });
    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body.id).toBeDefined();
    // Cleanup
    await authenticatedRequest.delete(`/applications/${body.id}`);
  });

  test('GET /applications - should return paginated list', async ({ authenticatedRequest }) => {
    const res = await authenticatedRequest.get('/applications?page=1&limit=10');
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.data).toBeInstanceOf(Array);
    expect(body.meta).toHaveProperty('total');
    expect(body.meta).toHaveProperty('page');
  });
});
```

---

## 5. Commandes

### Commandes Makefile (depuis la racine du projet)

```bash
# Tests backend
make test-backend              # Tous les tests Jest
make test-backend-unit         # Tests unitaires uniquement
make test-backend-e2e          # Tests e2e backend (Jest + Supertest)

# Tests API (Playwright)
make test-api-backend          # Auto-d\u00e9tection local/Docker
make test-api-local            # Force mode local (npx)
make test-api-docker           # Force mode Docker
make test-api-domains          # Tests API Domains uniquement
make test-api-applications     # Tests API Applications uniquement
make test-api-report           # Ouvre le rapport HTML

# Tests E2E UI (Playwright)
make test-e2e                  # Tests contre environnement dev
make test-e2e-ci               # Tests isol\u00e9s (CI)
make test-e2e-report           # Rapport HTML
make test-e2e-debug            # Avec debug output

# Validation compl\u00e8te
make validate-backend          # Build + restart + smoke test
```

### Variables d'environnement (tests API)

```bash
API_BASE_URL=http://localhost:3000   # URL du backend
API_VERSION=/api/v1                  # Pr\u00e9fixe API
API_USER_EMAIL=admin@ark.io          # Utilisateur de test
API_USER_PASSWORD=admin123456        # Mot de passe de test
```

---

## 6. Checklist de Validation PR

- [ ] Aucune r\u00e9gression sur les tests existants
- [ ] Nouvelles fonctionnalit\u00e9s couvertes par au moins 1 test
- [ ] `npm run build` passe sans erreur (backend + frontend)
- [ ] Tests unitaires passent (`make test-backend-unit`)
- [ ] Tests API passent pour l'entit\u00e9 concern\u00e9e
- [ ] Si modification UI : test Cypress ou Playwright UI

---

## 7. R\u00e8gle Bug = Test

Tout bug signal\u00e9 doit produire un test de non-r\u00e9gression **avant** correction :

1. Reproduire le bug dans un test (\u00e9chec attendu)
2. L'Agent `back` ou `front` corrige le code
3. V\u00e9rifier que le test passe
4. Commit du test + de la correction ensemble
