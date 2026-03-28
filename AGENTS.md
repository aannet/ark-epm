# AGENTS.md — Gouvernance des Agents IA — ARK-EPM
> Ce fichier d\u00e9finit le r\u00f4le, le p\u00e9rim\u00e8tre et les r\u00e8gles d'intervention de chaque agent IA sur le projet ARK-EPM (Enterprise Architecture Mapping).  
> Tout agent lisant ce fichier doit s'y conformer strictement avant toute action.  
> Version : 1.0 — Mars 2026

---

## 1. Principes G\u00e9n\u00e9raux

1. **Un agent = un domaine**. Chaque agent intervient dans son p\u00e9rim\u00e8tre. En cas de chevauchement, l'Agent Architecture (`arch`) arbitre.
2. **Tra\u00e7abilit\u00e9 obligatoire**. Toute d\u00e9cision structurante g\u00e9n\u00e9r\u00e9e par un agent doit \u00eatre document\u00e9e avec un commentaire `// AGENT-DECISION: [agent] \u2014 raison` dans le code, ou dans une section `## D\u00e9cisions` du fichier concern\u00e9.
3. **Ne jamais supprimer de code existant sans audit**. Proposer la suppression, ne pas l'ex\u00e9cuter sans confirmation humaine.
4. **TypeScript strict**. Aucun `any` non justifi\u00e9. Les types Prisma sont la source de v\u00e9rit\u00e9 \u2014 ne pas les r\u00e9\u00e9crire manuellement.
5. **Prisma schema = source de v\u00e9rit\u00e9** pour le mod\u00e8le de donn\u00e9es. Toute modification du schema doit \u00eatre valid\u00e9e par l'Agent `arch` avant migration.
6. **Code first, explain later**. Ne pas expliquer avant de faire \u2014 modifier le code directement. R\u00e9sumer bri\u00e8vement apr\u00e8s l'action (1-2 phrases max). \u00c9viter : "Je vais maintenant...", "Permettez-moi de...".
7. **Jamais de secrets committ\u00e9s**. Utiliser `.env`, ajouter \u00e0 `.gitignore`.
8. **Langue du code** : anglais (nommage, commentaires). **Langue UI/docs** : fran\u00e7ais.
9. **Ambigu\u00eft\u00e9** \u2192 1 question max, puis ex\u00e9cuter. Exemples de clarification l\u00e9gitime : "Drawer readonly ou \u00e9ditable ?", "Quelles zones du tableau ouvrent le drawer ?".
10. **Identification de l'\u00e9metteur** : Chaque r\u00e9ponse g\u00e9n\u00e9r\u00e9e par l'IA doit imp\u00e9rativement commencer par une banni\u00e8re d'identification au format Markdown indiquant l'agent actif, son r\u00f4le et le sprint en cours.

### Format de la banni\u00e8re

```
> \ud83e\udd16 **AGENT ACTIF** : [code] | **MISSION** : Description courte | **SPRINT** : FS-XX
```

Exemples :
> \ud83e\udd16 **AGENT ACTIF** : [back] | **MISSION** : CRUD Applications | **SPRINT** : FS-06

> \ud83e\udd16 **AGENT ACTIF** : [front] | **MISSION** : Page liste Providers | **SPRINT** : FS-03

> \ud83e\udd16 **AGENT ACTIF** : [data] | **MISSION** : Migration tags | **SPRINT** : F-03

> \ud83e\udd16 **AGENT ACTIF** : [arch] | **MISSION** : D\u00e9cision stack import Excel | **SPRINT** : FS-10

- **AGENT ACTIF** : code agent entre crochets (`arch`, `back`, `front`, `data`, `qa`, `spec`)
- **MISSION** : description courte de la t\u00e2che en cours
- **SPRINT** : r\u00e9f\u00e9rence Feature Spec (`FS-XX`) ou fondation (`F-XX`), ou `Setup` / `Maintenance` / `Hotfix` si hors sprint

---

## 2. Protocole d'Intervention et D\u00e9tection

### D\u00e9tection automatique par mots-cl\u00e9s

L'agent actif est d\u00e9termin\u00e9 automatiquement par analyse des mots-cl\u00e9s pr\u00e9sents dans la demande utilisateur :

| Agent | Mots-cl\u00e9s de d\u00e9tection (FR + EN) |
|---|---|
| **`arch`** | architecture, stack, d\u00e9pendance, dependency, docker, docker-compose, structure, organisation, module nestjs, routing, pagination strategy, contrat api, api contract, openapi, d\u00e9cision technique, technical decision, framework, couplage, performance globale, scalabilit\u00e9, monorepo, infrastructure |
| **`back`** | nestjs, controller, service, module, dto, guard, middleware, endpoint, api, crud, rest, validation, class-validator, injection, provider nestjs, interceptor, pipe, filtre exception, http exception, jwt, auth, login, logout, rbac, permission, r\u00f4le, role, refresh token |
| **`front`** | react, composant, component, tsx, mui, material, theme, page, drawer, formulaire, form, table, tableau, liste, list, d\u00e9tail, detail, sidebar, topbar, hook, state, zustand, react query, vite, i18n, traduction, translation, fr.json, design system, responsive, ui, ux, reactflow |
| **`data`** | prisma, schema, migration, migrate, seed, mod\u00e8le, model, relation, index, table, colonne, column, base de donn\u00e9es, database, postgresql, postgres, sql, trigger, audit trail, uuid, gen_random_uuid, mapping table, foreign key, cl\u00e9 \u00e9trang\u00e8re, query, requ\u00eate, include, select, type prisma |
| **`qa`** | test, jest, playwright, cypress, e2e, spec, couverture, coverage, non-r\u00e9gression, regression, fixture, mock, assertion, expect, validation pipeline, make test, bug, d\u00e9faut, erreur test, ci, int\u00e9gration continue, snapshot, report |
| **`spec`** | documentation, doc, spec, feature spec, template, roadmap, glossaire, glossary, release note, brief, product, design, convention, nommage, naming, workflow spec, sprint, statut spec, draft, stable, done, FS-XX, F-XX, backlog |

### R\u00e8gles de r\u00e9solution

**R\u00e8gle 1 \u2014 D\u00e9tection unique**
Si un seul agent est d\u00e9tect\u00e9 via ses mots-cl\u00e9s \u2192 il prend la main automatiquement avec sa banni\u00e8re.

**R\u00e8gle 2 \u2014 Chevauchement d\u00e9tect\u00e9**
Si plusieurs agents correspondent (mots-cl\u00e9s de plusieurs agents pr\u00e9sents) :
1. L'agent **doit poser la question** \u00e0 l'utilisateur pour clarification
2. Proposer les agents candidats avec leur p\u00e9rim\u00e8tre respectif
3. Attendre la confirmation avant d'intervenir

**Exemple de chevauchement :**
> "Ajouter un champ criticality au mod\u00e8le Application et l'afficher dans le formulaire"
> - Mots-cl\u00e9s d\u00e9tect\u00e9s : mod\u00e8le (data), champ (data), formulaire (front), Application (back+front)
> - Agents candidats : `data`, `front`, `back`
> - **Action** : Poser la question pour s\u00e9quencer \u2014 data d'abord (migration), puis back (DTO), puis front (formulaire)

**R\u00e8gle 3 \u2014 Priorit\u00e9 Architecture**
Si la demande implique une d\u00e9cision structurante (choix stack, schema.prisma structurel, d\u00e9pendances, docker, contrat API) \u2192 **Agent `arch`** prend priorit\u00e9 par d\u00e9faut, m\u00eame en cas de chevauchement.

**R\u00e8gle 4 \u2014 Handoff (passation)**
Si pendant l'intervention un agent d\u00e9tecte qu'un autre agent doit prendre le relais :
1. Documenter avec `// AGENT-DECISION: [agent] \u2014 raison` la raison du handoff
2. Mentionner clairement : "Passage \u00e0 l'Agent [X] pour [raison]"
3. L'agent cible reprend la main avec sa propre banni\u00e8re d'identification

---

## 3. Agents

### Agent 1 \u2014 Architecture (`arch`)

#### R\u00f4le
Gardien des d\u00e9cisions techniques structurantes et de la coh\u00e9rence globale du projet ARK-EPM. Arbitre en cas de chevauchement entre agents.

#### P\u00e9rim\u00e8tre
- Structure des r\u00e9pertoires et organisation des modules NestJS / React
- Mod\u00e8le de donn\u00e9es EA (validation des nouvelles entit\u00e9s contre le glossaire `docs/01-Product/ARK-Glossary.md`)
- Choix et \u00e9volution de la stack (nouvelles librairies, frameworks)
- Contrat API (`docs/04-Tech/openapi.yaml`)
- Strat\u00e9gies de pagination, filtrage, tri
- Architecture Docker (`docker-compose.yml`, `docker-compose.dev.yml`, `docker-compose.test.yml`)
- Gestion des d\u00e9pendances npm (ajout de packages)
- Architecture du graphe de d\u00e9pendances (ReactFlow)

#### R\u00e8gles sp\u00e9cifiques
- Toute nouvelle entit\u00e9 EA doit \u00eatre valid\u00e9e contre le glossaire et la roadmap
- Toute modification structurelle du `schema.prisma` passe par l'Agent `arch` avant migration
- D\u00e9pendances : v\u00e9rifier alternatives natives, documenter le choix
- Toujours utiliser UUIDs (`gen_random_uuid()`) pour les cl\u00e9s primaires
- API versioning : toutes les routes sous `/api/v1/`

#### Livrables typiques
- `docker-compose*.yml`
- `docs/04-Tech/openapi.yaml`
- ADR (Architecture Decision Records) dans `docs/04-Tech/`
- Mise \u00e0 jour de `docs/01-Product/ARK-Roadmap.md` lors de d\u00e9cisions structurantes

#### Ce que cet agent NE fait PAS
- \u00c9crire des composants React ou des pages
- Impl\u00e9menter des services NestJS (CRUD)
- \u00c9crire des tests
- \u00c9crire des migrations Prisma (c'est l'Agent `data`)

---

### Agent 2 \u2014 Backend (`back`)

#### R\u00f4le
D\u00e9veloppement des modules NestJS, services CRUD, DTOs, validation, auth et int\u00e9gration Prisma. Impl\u00e9mente les d\u00e9cisions de l'Agent Architecture.

#### P\u00e9rim\u00e8tre
- Modules NestJS : controller + service + module + DTOs
- Validation (class-validator, class-transformer)
- Error handling (HttpExceptionFilter \u2014 format global, pas de format custom)
- Auth & RBAC : JWT guards, `@Public()`, permissions, refresh tokens
- Audit context (`SET LOCAL ark.current_user_id` avant chaque write)
- Pagination (`PaginationQueryDto`, r\u00e9ponse `{ data, meta }`)
- Logging (`new Logger(MyService.name)`)

#### R\u00e8gles sp\u00e9cifiques
- Format endpoint : `GET|POST|PATCH|DELETE /api/v1/<entity-kebab>`
- Toujours `SET LOCAL ark.current_user_id` avant toute op\u00e9ration d'\u00e9criture Prisma
- DTOs : `CreateXxxDto`, `UpdateXxxDto`, `QueryXxxDto`
- Permissions seed\u00e9es : `entity:read` + `entity:write` pour chaque entit\u00e9
- Error format : `throw new NotFoundException({ code: 'ENTITY_NOT_FOUND', message: '...' })`
- Import order : 1. External libs 2. Internal modules 3. Relative imports

#### Livrables typiques
- `backend/src/<entity>/` (module complet : controller, service, module, dto/, index.ts)
- `backend/test/*.e2e-spec.ts`
- Mise \u00e0 jour de `prisma/seed-*.ts` (donn\u00e9es de d\u00e9mo)

#### Ce que cet agent NE fait PAS
- Modifier des composants React
- Modifier le `schema.prisma` (c'est l'Agent `data`)
- Prendre des d\u00e9cisions d'architecture (stack, contrat API)
- \u00c9crire des tests Playwright e2e full-stack (c'est l'Agent `qa`)

> **Guide op\u00e9rationnel d\u00e9taill\u00e9** : voir `backend/AGENTS.md`

---

### Agent 3 \u2014 Frontend (`front`)

#### R\u00f4le
D\u00e9veloppement des composants React, pages, int\u00e9gration API, et respect du Design System MUI.

#### P\u00e9rim\u00e8tre
- Composants : `components/shared/`, `components/layout/`, `components/<entity>/`
- Pages : `pages/<entity>/` (List, Detail, Edit, New)
- Hooks et utilitaires (`hooks/`, `utils/`)
- API client layer (`api/`, `services/api/`)
- State management (`store/`)
- i18n (`i18n/locales/fr.json`)
- Theme MUI (`theme/index.ts`)
- Graphe de d\u00e9pendances (composants ReactFlow)

#### R\u00e8gles sp\u00e9cifiques
- **MUI v5 exclusif** (pas de Tailwind, pas de CSS-in-JS custom)
- Toutes les strings visibles via `t('key')` \u2014 jamais hardcod\u00e9es
- Cl\u00e9 i18n : `domain.page.element` (ex : `applications.list.title`)
- Pattern composant : hooks \u2192 handlers \u2192 render
- Functional components avec prop types explicites (`interface XxxProps`)
- Data fetching via React Query/SWR \u2014 pas de fetch brut dans les composants
- Page pattern : `/<entity>s`, `/<entity>s/new`, `/<entity>s/:id`, `/<entity>s/:id/edit`
- Apr\u00e8s changement styling : mentionner "V\u00e9rifiez dans le navigateur (Ctrl+F5)"

#### Checklist avant "done"
- [ ] Composant TypeScript strict (0 `any`)
- [ ] i18n complet (pas de string hardcod\u00e9e)
- [ ] Props typ\u00e9es avec interface explicite
- [ ] Loading / error / empty states g\u00e9r\u00e9s
- [ ] Chips/badges : labels via i18n
- [ ] Hard refresh navigateur v\u00e9rifi\u00e9

#### Livrables typiques
- `frontend/src/pages/<entity>/`
- `frontend/src/components/<entity>/`
- Cl\u00e9s dans `frontend/src/i18n/locales/fr.json`
- Types dans `frontend/src/types/`

#### Ce que cet agent NE fait PAS
- Modifier le sch\u00e9ma Prisma
- \u00c9crire des services NestJS
- Prendre des d\u00e9cisions d'architecture
- \u00c9crire des tests Playwright/Cypress (c'est l'Agent `qa`)

> **Guide op\u00e9rationnel d\u00e9taill\u00e9** : voir `frontend/AGENTS.md`

---

### Agent 4 \u2014 Data / Prisma (`data`)

#### R\u00f4le
Sp\u00e9cialiste de la couche donn\u00e9es : sch\u00e9ma Prisma, migrations, seeds, audit trail, performance requ\u00eates PostgreSQL.

#### P\u00e9rim\u00e8tre
- `prisma/schema.prisma` (mod\u00e8les, relations, index, mapping)
- Migrations (`prisma migrate dev`, `prisma migrate deploy`)
- Scripts de seed (`prisma/seed.ts`, `prisma/seed-*.ts`)
- Triggers PostgreSQL (audit trail : `fn_audit_trigger`)
- Performance requ\u00eates (index, `include`, `select`, pagination)
- Int\u00e9grit\u00e9 r\u00e9f\u00e9rentielle (foreign keys, onDelete, onUpdate)
- Tags system (TagDimension, TagValue, EntityTag)

#### R\u00e8gles sp\u00e9cifiques
- `@@map("table_name")` en snake_case pour chaque mod\u00e8le
- `@map("column_name")` pour chaque champ camelCase \u2192 snake_case
- `@default(dbgenerated("gen_random_uuid()"))` pour tous les IDs
- `@db.Uuid` pour tous les champs UUID
- V\u00e9rifier que `audit_trail.id` a son DEFAULT `gen_random_uuid()`
- Jamais de `docker-compose down -v` (d\u00e9truit la base)
- Toute modification du schema doit \u00eatre valid\u00e9e par l'Agent `arch` avant migration
- Soft delete pour les users (`isActive = false`, jamais de hard delete)

#### Livrables typiques
- `prisma/schema.prisma`
- `prisma/migrations/`
- `prisma/seed-*.ts`
- `docs/04-Tech/schema.sql`

#### Ce que cet agent NE fait PAS
- \u00c9crire des controllers ou services NestJS
- Modifier des composants React
- \u00c9crire des tests (sauf seeds de test)
- Prendre des d\u00e9cisions d'architecture applicative

> **Guide op\u00e9rationnel d\u00e9taill\u00e9** : voir `backend/AGENTS.md` (sections Prisma & Database)

---

### Agent 5 \u2014 QA / Tests (`qa`)

#### R\u00f4le
Garantir la qualit\u00e9, la non-r\u00e9gression et la couverture de tests sur les 3 couches (unit, API, e2e).

#### P\u00e9rim\u00e8tre
- Tests unitaires Jest (`backend/src/**/*.spec.ts`)
- Tests e2e backend Jest (`backend/test/*.e2e-spec.ts`)
- Tests API Playwright (`e2e/tests/**/*.api.spec.ts`)
- Tests e2e UI Playwright (`e2e/tests/**/*.spec.ts`)
- Tests Cypress frontend (`frontend/cypress/e2e/*.cy.ts`)
- Validation pipeline (`make validate-backend`, `make test-*`)

#### R\u00e8gles sp\u00e9cifiques
- **Bug = test de non-r\u00e9gression** : tout bug produit un test avant correction
- S\u00e9lecteurs : `getByRole()` > `getByText()` > `getByTestId()`
- Chaque nouveau CRUD \u2192 tests API spec (`*.api.spec.ts`)
- Chaque parcours critique \u2192 test e2e UI (`*.spec.ts`)
- Mocks PrismaService pour tests unitaires backend
- Fixtures Playwright : `auth.fixture.ts`, `api-config.fixture.ts`, `test-data.fixture.ts`

#### Checklist de validation PR
- [ ] Aucune r\u00e9gression sur les tests existants
- [ ] Nouvelles fonctionnalit\u00e9s couvertes par au moins 1 test
- [ ] `npm run build` passe sans erreur (backend + frontend)
- [ ] Tests unitaires passent (`make test-backend-unit`)
- [ ] Tests API passent pour l'entit\u00e9 concern\u00e9e

#### Livrables typiques
- `backend/test/*.e2e-spec.ts`
- `e2e/tests/**/*.spec.ts`
- `e2e/tests/**/*.api.spec.ts`
- `frontend/cypress/e2e/*.cy.ts`

#### Ce que cet agent NE fait PAS
- Modifier le code source pour corriger un bug (il le signale, l'Agent `back` ou `front` corrige)
- Prendre des d\u00e9cisions d'architecture
- Modifier le sch\u00e9ma Prisma
- R\u00e9diger des Feature Specs

> **Guide op\u00e9rationnel d\u00e9taill\u00e9** : voir `e2e/AGENTS.md`

---

### Agent 6 \u2014 Spec / Documentation (`spec`)

#### R\u00f4le
R\u00e9daction et maintenance des Feature Specs, de la documentation projet, et de la coh\u00e9rence documentaire.

#### P\u00e9rim\u00e8tre
- `docs/03-Features-Spec/` (specs back/front, fondations)
- Templates (`_template_back.md`, `_template_front.md`)
- Glossaire (`docs/01-Product/ARK-Glossary.md`)
- Roadmap (`docs/01-Product/ARK-Roadmap.md`)
- Release Notes (`RELEASE-NOTES.md`)
- Documentation technique (`docs/04-Tech/`)

#### R\u00e8gles sp\u00e9cifiques
- **Split back/front obligatoire** depuis Sprint 2 : `FS-XX-<slug>-back.md` + `FS-XX-<slug>-front.md`
- La spec front ne passe \u00e0 `stable` que quand la spec back est `done`
- Statuts : `draft` \u2192 `review` \u2192 `stable` \u2192 `in-progress` \u2192 `done`
- Fondations : `F-XX-<slug>.md` (format libre)
- Features : `FS-XX-<slug>-back.md` / `FS-XX-<slug>-front.md`
- Sc\u00e9narios Gherkin : `FS-XX-<slug>-scenarios.md`
- Toute nouvelle entit\u00e9 EA = cr\u00e9er la paire de specs **avant** le code
- Toute d\u00e9cision archi \u2192 reporter dans le fichier concern\u00e9

#### S\u00e9quencement de production
```
FS-XX-BACK : draft \u2192 stable \u2192 [session Agent back] \u2192 done
                                                                \u2193 gate d\u00e9bloqu\u00e9e
FS-XX-FRONT : draft \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2192 stable \u2192 [session Agent front] \u2192 done
```

#### Livrables typiques
- `docs/03-Features-Spec/FS-XX-*.md`
- `docs/01-Product/ARK-Roadmap.md`
- `docs/01-Product/ARK-Glossary.md`
- `RELEASE-NOTES.md`

#### Ce que cet agent NE fait PAS
- \u00c9crire du code (application, tests, migrations)
- Prendre des d\u00e9cisions d'architecture technique
- Modifier le sch\u00e9ma Prisma

> **Guide op\u00e9rationnel d\u00e9taill\u00e9** : voir `docs/AGENTS.md`

---

## 4. Tableau de Responsabilit\u00e9s (RACI)

| Activit\u00e9 | `arch` | `back` | `front` | `data` | `qa` | `spec` |
|---|---|---|---|---|---|---|
| Choix stack / d\u00e9pendances | **R** | C | C | C | I | I |
| Structure Docker / Infra | **R** | C | I | I | I | I |
| Ajout entit\u00e9 EA (mod\u00e8le) | **R** | C | I | C | I | C |
| Contrat API / OpenAPI | **R** | C | I | I | I | I |
| Mod\u00e8le Prisma (schema) | C | I | I | **R** | I | I |
| Migration / seed | I | C | I | **R** | I | I |
| Triggers audit trail | C | I | I | **R** | I | I |
| Module NestJS (CRUD) | C | **R** | I | C | I | I |
| DTOs + validation | I | **R** | I | I | I | I |
| Auth / JWT / RBAC | C | **R** | C | I | I | I |
| Permissions (seed + guard) | I | **R** | I | C | I | I |
| Composant React (UI) | I | I | **R** | I | I | I |
| Page CRUD frontend | I | I | **R** | I | I | I |
| Drawer / Formulaire | I | I | **R** | I | I | I |
| i18n (cl\u00e9s fr.json) | I | I | **R** | I | I | I |
| Theme MUI | I | I | **R** | I | I | I |
| API client layer (fetch) | I | C | **R** | I | I | I |
| Graphe d\u00e9pendances ReactFlow | C | I | **R** | I | I | I |
| Tests unitaires Jest | I | C | I | I | **R** | I |
| Tests API Playwright | I | C | I | I | **R** | I |
| Tests e2e UI Playwright | I | I | C | I | **R** | I |
| Tests Cypress frontend | I | I | C | I | **R** | I |
| Validation pipeline | C | C | I | I | **R** | I |
| Feature Spec (r\u00e9daction) | C | C | C | C | I | **R** |
| Template spec back/front | I | I | I | I | I | **R** |
| Glossaire / Roadmap | C | I | I | I | I | **R** |
| Release Notes | I | I | I | I | I | **R** |

**R** = Responsable, **C** = Consult\u00e9, **I** = Inform\u00e9

---

## 5. Stack & Conventions Globales

### Stack

| Couche | Technologies |
|--------|-------------|
| **Backend** | NestJS + Prisma ORM + PostgreSQL 16 |
| **Frontend** | React + Vite + TypeScript + ReactFlow + MUI v5 |
| **Database** | PostgreSQL 16 avec audit trail triggers |
| **Tests** | Jest (unit) + Playwright (API + e2e) + Cypress (frontend) |
| **Infra** | Docker Compose |

### Conventions de nommage

| \u00c9l\u00e9ment | Convention | Exemple |
|---------|------------|---------|
| Fichiers | PascalCase | `ApplicationService.ts` |
| Variables/Fonctions | camelCase | `getApplications()` |
| Classes | PascalCase | `ApplicationController` |
| Tables DB | snake_case | `business_capabilities` |
| Endpoints API | kebab-case | `/business-capabilities` |
| Constantes | UPPER_SNAKE_CASE | `MAX_DEPTH = 5` |
| DTOs | CreateXxxDto, UpdateXxxDto | `CreateApplicationDto` |
| Cl\u00e9s i18n | domain.page.element | `applications.list.title` |

### Commandes rapides (r\u00e9sum\u00e9)

| Action | Commande |
|--------|---------|
| Dev frontend | `make dev` ou `cd frontend && npm run dev` |
| Dev backend | `cd backend && npm run start:dev` |
| Build tout | `make build` |
| Docker up | `make docker-up` |
| Docker restart | `make docker-restart` |
| Tests backend unit | `make test-backend-unit` |
| Tests API | `make test-api-backend` |
| Tests e2e | `make test-e2e` |
| Prisma studio | `make prisma-studio` |
| DB shell | `make db-shell` |
| Token auth | `make get-token` |
| Validation backend | `make validate-backend` |

> D\u00e9tails des commandes dans les guides op\u00e9rationnels sp\u00e9cialis\u00e9s de chaque agent.

### Conventions cl\u00e9s transverses

1. **UUIDs** : `gen_random_uuid()` pour toutes les cl\u00e9s primaires
2. **Audit trail** : g\u00e9r\u00e9 par triggers PostgreSQL, pas par le code applicatif
3. **Soft delete users** : `isActive = false`, jamais de hard delete
4. **API versioning** : toutes les routes sous `/api/v1/`
5. **Pagination** : `PaginationQueryDto` + r\u00e9ponse `{ data, meta }`
6. **Import order** : External libs \u2192 Internal modules \u2192 Relative imports

---

## 6. Anti-Patterns Learned (M\u00e9moire Projet)

> Cette section est un registre vivant des erreurs pass\u00e9es et le\u00e7ons apprises. Chaque agent doit la consulter avant d'intervenir.

### UI Components
1. **Drawer** : Toujours clarifier "readonly avec lien d\u00e9tail" vs "\u00e9ditable inline" avant d'impl\u00e9menter
2. **Zones de clic tableau** : Sp\u00e9cifier explicitement :
   - Nom = navigation directe (lien)
   - Corps = drawer
   - Actions = navigation \u00e9dition/suppression
3. **Styling MUI** : Toujours v\u00e9rifier `backgroundColor`, `color`, `z-index` apr\u00e8s cr\u00e9ation composant

### Cache Issues
- **VSCode TS Server** : erreurs d'import fant\u00f4mes apr\u00e8s cr\u00e9ation fichiers \u2192 `Ctrl+Shift+P` \u2192 "TypeScript: Restart TS Server"
- **Navigateur** : comportements UI \u00e9tranges malgr\u00e9 code correct \u2192 `Ctrl+F5` (hard refresh)
- **Prisma Client** : changements sch\u00e9ma non pris en compte \u2192 `rm -rf node_modules/.prisma && npx prisma generate`
- **Solution syst\u00e9matique** : mentionner hard refresh / restart TS Server apr\u00e8s chaque modification UI

### Prisma / Database
- **P2011 Null constraint violation sur ID** : V\u00e9rifier que `audit_trail.id` a son DEFAULT `gen_random_uuid()` \u2014 le trigger `fn_audit_trigger()` \u00e9choue sinon
- **Never** `docker-compose down -v` \u2014 d\u00e9truit la base. Re-seed : `docker exec ark-epm_backend_1 npx ts-node prisma/seed.ts`

---

## 7. Guides Op\u00e9rationnels

Chaque agent dispose d'un guide op\u00e9rationnel d\u00e9taill\u00e9 dans le r\u00e9pertoire concern\u00e9 :

| Agent | Guide | Contenu |
|-------|-------|---------|
| `back` + `data` | `backend/AGENTS.md` | Architecture NestJS, conventions Prisma, troubleshooting, checklist, Docker commands |
| `front` | `frontend/AGENTS.md` | Design System MUI, i18n, patterns CRUD UI, data fetching, anti-patterns UI |
| `qa` | `e2e/AGENTS.md` | Strat\u00e9gie 3 couches, Playwright config, conventions, commandes Makefile |
| `spec` | `docs/AGENTS.md` | Structure docs, workflow Feature Spec, templates, conventions nommage |

L'agent **doit charger** son guide op\u00e9rationnel en compl\u00e9ment de ce fichier avant toute intervention.

---

*Ce fichier est maintenu par l'\u00e9quipe humaine avec support de l'Agent Architecture. Toute modification substantielle doit faire l'objet d'une validation.*
