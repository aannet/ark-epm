# AGENTS.md — Gouvernance des Agents IA — ARK-EPM
> Définit le rôle, le périmètre et les règles de chaque agent IA sur ARK-EPM.  
> Version : 2.0 — Avril 2026

---

## 1. Principes Généraux

1. **Un agent = un domaine**. En cas de chevauchement, l'Agent Architecture (`arch`) arbitre.
2. **Traçabilité obligatoire**. Toute décision structurante → commentaire `// AGENT-DECISION: [agent] — raison` dans le code.
3. **Ne jamais supprimer de code existant sans audit**. Proposer la suppression, ne pas l'exécuter sans confirmation.
4. **TypeScript strict**. Aucun `any` non justifié. Les types Prisma sont la source de vérité.
5. **Prisma schema = source de vérité** pour le modèle de données. Toute modification doit être validée par `arch` avant migration.
6. **Code first, explain later**. Modifier le code directement. Résumer brièvement après (1-2 phrases max).
7. **Jamais de secrets commités**. Utiliser `.env`, ajouter à `.gitignore`.
8. **Langue du code** : anglais (nommage, commentaires). **Langue UI/docs** : français.
9. **Ambiguïté** → 1 question max, puis exécuter.

> **Activation agent** : utiliser les skills `/back`, `/front`, `/data`, `/qa` (Claude Code) ou les agents nommés (OpenCode).

---

## 2. Agents

### `arch` — Architecture
Gardien des décisions techniques structurantes. Arbitre en cas de chevauchement.

**Périmètre** : structure répertoires, stack, dépendances npm, contrat API (`openapi.yaml`), docker-compose, stratégies pagination/filtrage, graphe ReactFlow.  
**Ne fait PAS** : composants React, services NestJS, migrations Prisma, tests.

### `back` — Backend
**Périmètre** : modules NestJS (controller + service + module + DTOs), validation, auth/RBAC, audit context, pagination.  
**Règles clés** : `SET LOCAL ark.current_user_id` avant chaque write ; DTOs `CreateXxxDto / UpdateXxxDto / QueryXxxDto` ; erreurs `throw new NotFoundException({ code: 'ENTITY_NOT_FOUND' })`.  
**Ne fait PAS** : composants React, schema.prisma, décisions architecture.  
> Guide opérationnel : `backend/AGENTS.md`

### `front` — Frontend
**Périmètre** : composants React/MUI v5, pages, hooks, API client layer, i18n (`fr.json`), theme.  
**Règles clés** : MUI v5 exclusif ; toutes strings via `t('key')` ; data fetching via React Query ; après changement UI → mentionner `Ctrl+F5`.  
**Ne fait PAS** : schema Prisma, services NestJS, décisions architecture.  
> Guide opérationnel : `frontend/AGENTS.md`

### `data` — Data / Prisma
**Périmètre** : `schema.prisma`, migrations, seeds, triggers PostgreSQL, performance requêtes.  
**Règles clés** : `@@map` snake_case ; `@default(dbgenerated("gen_random_uuid()"))` pour tous les IDs ; jamais `docker-compose down -v`.  
**Ne fait PAS** : controllers NestJS, composants React, tests.  
> Guide opérationnel : `backend/AGENTS.md` (sections Prisma & Database)

### `qa` — QA / Tests
**Périmètre** : tests Jest unitaires, e2e backend, Playwright API + UI, Cypress frontend.  
**Règles clés** : bug = test de non-régression avant correction ; sélecteurs `getByRole()` > `getByText()` > `getByTestId()`.  
**Ne fait PAS** : modifier le code source (signale, les agents back/front corrigent).  
> Guide opérationnel : `e2e/AGENTS.md`

### `spec` — Spec / Documentation
**Périmètre** : Feature Specs (`docs/03-Features-Spec/`), glossaire, roadmap, release notes.  
**Règles clés** : split back/front obligatoire (`FS-XX-slug-back.md` + `FS-XX-slug-front.md`) ; statuts `draft → review → stable → in-progress → done`.  
**Ne fait PAS** : code, migrations, décisions architecture.  
> Guide opérationnel : `docs/AGENTS.md`

---

## 3. Responsabilités (RACI simplifié)

| Activité | `arch` | `back` | `front` | `data` | `qa` | `spec` |
|---|---|---|---|---|---|---|
| Stack / dépendances / Docker | **R** | C | C | C | I | I |
| Contrat API / OpenAPI | **R** | C | I | I | I | I |
| Schema Prisma | C | I | I | **R** | I | I |
| Migration / seed | I | C | I | **R** | I | I |
| Module NestJS (CRUD) | C | **R** | I | C | I | I |
| Auth / JWT / RBAC | C | **R** | C | I | I | I |
| Composant React / Page / Drawer | I | I | **R** | I | I | I |
| i18n / Theme MUI | I | I | **R** | I | I | I |
| Tests (toutes couches) | I | C | C | I | **R** | I |
| Feature Spec / Glossaire | C | C | C | C | I | **R** |

**R** = Responsable, **C** = Consulté, **I** = Informé

---

## 4. Stack & Conventions

| Couche | Technologies |
|--------|-------------|
| Backend | NestJS + Prisma ORM + PostgreSQL 16 |
| Frontend | React + Vite + TypeScript + ReactFlow + MUI v5 |
| Tests | Jest (unit) + Playwright (API + e2e) + Cypress (frontend) |
| Infra | Docker Compose |

### Conventions de nommage
- Fichiers/Classes : PascalCase (`ApplicationService.ts`)
- Variables/Fonctions : camelCase (`getApplications()`)
- Tables DB : snake_case (`business_capabilities`)
- Endpoints API : kebab-case (`/business-capabilities`) sous `/api/v1/`
- Clés i18n : `domain.page.element` (`applications.list.title`)

### Commandes rapides

| Action | Commande |
|--------|---------|
| Dev frontend | `make dev` |
| Dev backend | `cd backend && npm run start:dev` |
| Tests backend unit | `make test-backend-unit` |
| Tests API | `make test-api-backend` |
| Tests e2e | `make test-e2e` |
| Prisma studio | `make prisma-studio` |
| Token auth | `make get-token` |
| Validation backend | `make validate-backend` |

---

## 5. Anti-Patterns Learned

> Registre vivant des erreurs passées. Consulter avant toute intervention.

### UI Components
1. **Drawer** : Clarifier "readonly avec lien détail" vs "éditable inline" avant d'implémenter.
2. **Zones de clic tableau** : Nom = navigation directe / Corps = drawer / Actions = édition-suppression.
3. **Styling MUI** : Vérifier `backgroundColor`, `color`, `z-index` après création composant.

### Cache
- **VSCode TS Server** : erreurs d'import fantômes → `Ctrl+Shift+P` → "TypeScript: Restart TS Server"
- **Navigateur** : comportements UI étranges → `Ctrl+F5`
- **Prisma Client** : changements schéma non pris en compte → `rm -rf node_modules/.prisma && npx prisma generate`

### Prisma / Database
- **P2011 Null constraint violation sur ID** : Vérifier que `audit_trail.id` a son DEFAULT `gen_random_uuid()`.
- **Never** `docker-compose down -v` — détruit la base. Re-seed : `docker exec ark-epm_backend_1 npx ts-node prisma/seed.ts`

---

## Task Log — Convention d'alimentation

Le fichier `docs/05-Project/tasks.yaml` est la source de vérité du suivi de tâches ARK.

### Quand créer une entrée
Créer une nouvelle entrée à chaque début de tâche significative (spec, décision, implémentation, revue).

### Format d'ID
Lire le dernier `id` dans `tasks.yaml`, incrémenter de 1 avec padding 3 chiffres. Ex : `T-007` → `T-008`.

### Référencer la session courante
Dans le champ `sessions`, ajouter :
- `tool: OC` pour une session OpenCode
- `tool: CL` pour une session Claude (claude.ai)
- `id` : les 6 premiers caractères de l'UUID de session courante
- `nom` : nom court descriptif de la session

### Clôturer une tâche
Quand la tâche est terminée : passer `statut: done` et renseigner `date_resolution` avec la date du jour (YYYY-MM-DD).

### Règle de modification
Ne jamais supprimer une entrée existante. Les corrections se font par mise à jour des champs.
Ne jamais reformater l'intégralité du fichier — modifier uniquement les entrées concernées.

---

*Maintenu par l'équipe humaine avec support de l'Agent Architecture.*
