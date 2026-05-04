# AGENTS.md — Gouvernance des Agents IA — ARK-EPM
> Définit le rôle, le périmètre et les règles de chaque agent IA sur ARK-EPM.  
> Version : 2.0 — Avril 2026

---

## 1. Principes Généraux

### Golden Rules

| ID | Règle |
|----|-------|
| GR1 | **Think before coding** — ne pas supposer. Ne pas cacher la confusion. Remonter les trade-offs. |
| GR2 | **Simplicity first** — minimum de code qui résout le problème. Rien de spéculatif. |
| GR3 | **Surgical changes** — toucher uniquement ce qui est nécessaire. Ne nettoyer que sa propre pollution. |
| GR4 | **Goal-driven execution** — définir les critères de succès. Boucler jusqu'à vérification. |

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
**Périmètre** : composants React/MUI v9, pages, hooks, API client layer, i18n (`fr.json`), theme.  
**Règles clés** : MUI v9 exclusif ; toutes strings via `t('key')` ; data fetching via React Query ; après changement UI → mentionner `Ctrl+F5`.  
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
| Frontend | React + Vite + TypeScript + ReactFlow + MUI v9 |
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
| Tests API | `make test-api` |
| Tests e2e | `make test-e2e` |
| Prisma studio | `make prisma-studio` |
| Token auth | `make auth-token` |
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
**En contexte multi-agent simultané, `tasks.yaml` est le coordinateur principal** — pas `SESSION-HANDOFF.md`.

### Schéma d'une entrée

```yaml
id: T-NNN                          # padding 3 chiffres, auto-incrémenté
nom: "..."
statut: open | in_progress | done | blocked
assigned_agent: back|front|data|qa|spec|arch   # qui doit faire cette tâche
session_active: ~                  # ~ = libre / 6 hex = verrou session courante
handoff_ref: "chemin/relatif"      # optionnel — archive de contexte de la session précédente
date_resolution: ~                 # ~ si non terminé, YYYY-MM-DD si done
sprint: S1|S2|...
theme: "FS-XX" | "QA" | "F-999"
type: spec|decision|review|debt|impl|test|doc|poc
  feature: "FS-XX-BACK"
  priorité: high|medium|low
  sessions:
  - tool: OC|CL
    id: "6hexchars"
    nom: "description courte"
notes: |
  texte libre
```

### Statuts

| Statut | Signification |
|---|---|
| `open` | Prête à démarrer |
| `in_progress` | Session active — `session_active` rempli |
| `done` | Terminée — `date_resolution` renseignée |
| `blocked` | Gate non levée — voir `notes` pour les prérequis |

### Rituel d'ouverture
Utiliser `/ark-open-session` : lit tasks.yaml + SESSION-HANDOFF.md, filtre les tâches disponibles, **trie par priorité décroissante (high → medium → low)**, pose le verrou `session_active`.

### Rituel de clôture
Utiliser `/ark-close-session` : met à jour tasks.yaml (statuts, sessions[]), libère `session_active`, archive le handoff si pertinent.

### Format d'ID
Lire le dernier `id` dans `tasks.yaml`, incrémenter de 1 avec padding 3 chiffres. Ex : `T-012` → `T-013`.

### Règle de modification
Ne jamais supprimer une entrée existante. Les corrections se font par mise à jour des champs.
Ne jamais reformater l'intégralité du fichier — modifier uniquement les entrées concernées.

---

## SESSION-HANDOFF — Règles multi-agent

### Propriété du fichier racine

`SESSION-HANDOFF.md` (racine) est un **document de sprint stable**, pas un baton de session.

| Agent | Peut modifier `SESSION-HANDOFF.md` racine ? |
|---|---|
| `spec`, `arch` | **Oui** — lors d'un pivot de sprint ou d'une nouvelle feature critique |
| `back`, `front`, `data`, `qa` | **Non** — écrire dans `docs/05-Project/<YYYYMMDD>/` uniquement |

### Convention d'archive

Quand un agent clôture une session avec du contexte à transmettre :
```
docs/05-Project/<YYYYMMDD>/SESSION-HANDOFF-<agent>-<slug>.md
```
Exemples :
- `docs/05-Project/20260407/SESSION-HANDOFF-back-fs07.md`
- `docs/05-Project/20260407/SESSION-HANDOFF-front-fs05.md`

Le chemin est ensuite référencé dans `tasks.yaml` via le champ `handoff_ref`.

### Workflow multi-agent simultané

```
Session back (FS-07)          Session front (FS-05)
      │                               │
      ├─ /ark-open-session            ├─ /ark-open-session
      │   T-011 → in_progress         │   T-010 → in_progress
      │   session_active: a1b2c3      │   session_active: d4e5f6
      │                               │
      ├─ Travaille                    ├─ Travaille
      │                               │
      └─ /ark-close-session           └─ /ark-close-session
          T-011 → done                    T-010 → done
          session_active: ~              session_active: ~
          Archive: SESSION-HANDOFF-      Archive: SESSION-HANDOFF-
                   back-fs07.md                   front-fs05.md
          (NE touche PAS le root)        (NE touche PAS le root)
```

---

*Maintenu par l'équipe humaine avec support de l'Agent Architecture.*
