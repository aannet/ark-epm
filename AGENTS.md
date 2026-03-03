# AGENTS.md - ARK-EPM Development Guide

AI agent guidance for ARK-EPM codebase (Enterprise Architecture Mapping tool).

## Project Stack

- **Backend**: NestJS + Prisma ORM + PostgreSQL
- **Frontend**: React + Vite + TypeScript + ReactFlow + MUI
- **Database**: PostgreSQL 16 with audit trail triggers

---

## Commands

### Backend
```bash
cd backend
npm run start:dev     # hot reload (port 3000)
npm run build         # TypeScript build
npm start             # production
npm run prisma:generate   # Generate Prisma client
npm run prisma:migrate     # Run migrations
npm run prisma:studio     # GUI for database
```

### Frontend
```bash
cd frontend
npm run dev           # hot reload (port 5173)
npm run build         # production build
npm run preview       # preview production build
```

### Single Test
> No test framework installed. Install first:
> - Backend: `npm install --save-dev jest @types/jest ts-jest`, then `npx jest --testPathPattern=<pattern>`
> - Frontend: `npm install --save-dev vitest`, then `npx vitest run --testNamePattern=<pattern>`

### Docker
```bash
docker-compose up -d          # start all services
docker-compose up -d --build  # rebuild
docker-compose down           # stop
```

---

## Code Style

### Import Order
1. External libraries (`@nestjs/common`, `prisma`)
2. Internal modules
3. Relative imports (grouped by depth)

### Naming
| Element | Convention | Example |
|---------|------------|---------|
| Files | PascalCase | `ApplicationService.ts` |
| Variables/Functions | camelCase | `getApplications()` |
| Classes | PascalCase | `ApplicationController` |
| Database tables | snake_case | `business_capabilities` |
| API endpoints | kebab-case | `/business-capabilities` |
| Constants | UPPER_SNAKE_CASE | `MAX_DEPTH = 5` |
| DTOs | CreateXxxDto, UpdateXxxDto | `CreateApplicationDto` |

### TypeScript
- Prefer `interface` for objects, `type` for unions
- Always use explicit return types
- Use strict null checks: `function findById(id: string): App | null`

### Error Handling (NestJS)
```typescript
throw new NotFoundException(`Application ${id} not found`);
throw new BadRequestException('Invalid input');
throw new InternalServerErrorException(`Failed: ${error.message}`);
```

### Prisma - CRITICAL
Always set user session before write operations:
```typescript
async setCurrentUser(userId: string): Promise<void> {
  await this.prisma.$executeRaw`SET LOCAL ark.current_user_id = ${userId}`;
}
await this.setCurrentUser(currentUserId);
await this.prisma.application.create({ data: { ... } });
```

### React/Frontend
- Functional components with explicit prop types
- Hooks first, then handlers, then render
- Use React Query/SWR for data fetching
- Use MUI components for consistency

### File Structure
```
backend/src/
├── auth/                  # Login, JWT, logout
├── applications/           # CRUD
├── business-capabilities/ # recursive hierarchy
├── data-objects/
├── interfaces/            # unidirectional (source → target)
├── it-components/
├── providers/
├── users/
├── domains/
├── audit/
├── prisma/
└── main.ts
```

### Linting (not configured)
Recommended: ESLint + Prettier with rules:
- `no-unused-vars`: error
- `prefer-const`: error
- `no-console`: warn (use logger)

### Logging
Use Winston with structured JSON:
```typescript
private readonly logger = new Logger(MyService.name);
this.logger.log({ method: 'createApp', userId, result: id });
```

---

## Key Conventions

1. **Never commit secrets** - Use `.env`, add to `.gitignore`
2. **Always use UUIDs** - `gen_random_uuid()` for primary keys
3. **Audit trail** - Handled by PostgreSQL triggers, not app code
4. **API contracts** - Define in `docs/openapi.yaml` before coding
5. **Prisma schema** - Source of truth for TypeScript types
6. **No external integrations** in MVP (keep dependencies minimal)
7. **Never hard-delete users** - Always soft delete via `isActive = false`

---

## Auth & Security Conventions

### Route protection — `@Public()` decorator
`JwtAuthGuard` is registered globally in `AppModule`. All routes are protected by default. Mark public routes explicitly:

```typescript
// common/decorators/public.decorator.ts
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

// Usage — only /auth/login and /health are public in P1
@Public()
@Post('login')
login() { ... }
```

> Never omit `@Public()` on a route that must be accessible without a token — the guard will block it silently.

### Logout (stateless)
`POST /auth/logout` → `204`, client deletes token. No server-side blacklist in P1.

Frontend logout flow:
1. Call `POST /auth/logout` (best-effort — ignore network errors)
2. Call `clearAuth()` to purge token + user from memory
3. Hard redirect to `/login` via `window.location.href`

### Permission naming convention
Format: `<resource>:<action>`. All P1 permissions are seeded at startup via `prisma/seed.ts`:

| Permission | Description |
|---|---|
| `applications:read` | Read applications |
| `applications:write` | Create / update / delete applications |
| `business-capabilities:read` | Read business capabilities |
| `business-capabilities:write` | Create / update / delete business capabilities |
| `data-objects:read` | Read data objects |
| `data-objects:write` | Create / update / delete data objects |
| `interfaces:read` | Read interfaces |
| `interfaces:write` | Create / update / delete interfaces |
| `it-components:read` | Read IT components |
| `it-components:write` | Create / update / delete IT components |
| `providers:read` | Read providers |
| `providers:write` | Create / update / delete providers |
| `domains:read` | Read domains |
| `domains:write` | Create / update / delete domains |
| `users:write` | Create / update / deactivate users |
| `roles:write` | Create / update / delete roles |
| `permissions:write` | Create permissions |

---

## Design System — ARK UI (NON-NÉGOCIABLE)

> Source de vérité : `ARK - Design charte express v0.1` + `ARK - UI Kit v0.1` + `docs/PRD-FS/F01-Design System-UI Foundation.md`
> Injecter ce bloc dans chaque session OpenCode frontend.

---

## F01-Design System & UI Foundation

> **Source :** `docs/PRD-FS/F01-Design System-UI Foundation.md` (v0.2)
> Ce bloc doit être injecté en début de **chaque** session OpenCode frontend pour les sprints suivants.

### Composants disponibles

| Catégorie | Composants | Import |
|---|---|---|
| Layout | `AppShell`, `Sidebar`, `TopBar`, `PageContainer` | `@/components/layout` |
| Shared | `StatusChip`, `ConfirmDialog`, `EmptyState`, `PageHeader`, `LoadingSkeleton` | `@/components/shared` |
| Error | `ErrorBoundary` | `@/components/error` |
| Pages | `NotFoundPage` (route `*`), `DesignSystemPage` (dev: `/design`) | `@/pages` |

### Règles d'utilisation

1. **Theme MUI** — `src/theme/index.ts` est la source de vérité. Ne jamais redéfinir les couleurs en dur.
2. **Tailwind CSS interdit** — MUI + `sx` prop uniquement.
3. **PageContainer** — wrapper avec padding 24px pour toutes les pages
4. **PageHeader** — titre + action principale en haut de chaque liste
5. **LoadingSkeleton** — toujours Skeleton, jamais de spinner central
6. **EmptyState** — affiché quand la liste est vide
7. **ConfirmDialog** — obligatoire avant toute suppression
8. **StatusChip** — pour criticality / lifecycle / isActive
9. **ErrorBoundary** — wrapping global dans `main.tsx` (déjà configuré)
10. **Route catch-all** — `*` déclarée en dernier dans `App.tsx` (déjà configuré)

### Tokens de référence

| Token | Valeur |
|---|---|
| `primary.main` | `#1A237E` |
| `secondary.main` | `#007FFF` |
| `background.default` | `#F8FAFC` |
| `divider` | `#E2E8F0` |

### Style global
- **Thème :** Modern Enterprise Blueprint — Sidebar Dark / Content Light
- **Librairie UI :** MUI v5 **exclusivement** — Tailwind CSS est **interdit** (conflits CSS-in-JS / Emotion)
- **Theme MUI :** `src/theme/index.ts` — source de vérité des tokens. **Ne jamais redéfinir les couleurs en dur.**

### Tokens de référence

| Token | Valeur | Usage |
|---|---|---|
| `primary.main` | `#1A237E` | Sidebar, Header, Branding |
| `secondary.main` | `#007FFF` | Boutons, liens, focus, icône active |
| `background.default` | `#F8FAFC` | Fond de page (zone content) |
| `background.paper` | `#FFFFFF` | Cartes, Formulaires, Tableaux |
| `text.primary` | `#1E293B` | Texte principal |
| `text.secondary` | `#64748B` | Labels, aides, placeholders |
| `divider` | `#E2E8F0` | Bordures, séparations |

### Typographie
- **Font principale :** `Inter, system-ui, sans-serif`
- **Font technique (IDs) :** `JetBrains Mono` — utiliser `sx={{ fontFamily: "'JetBrains Mono', monospace" }}` ou classe `.font-mono`
- `textTransform: 'none'` sur tous les boutons — jamais de majuscules forcées

### Shape
- **Radius standard :** `4px` — Cartes, Paper, conteneurs
- **Radius action :** `6px` — Boutons, Inputs
- Pas d'ombres portées (`elevation={0}` par défaut) — style "flat / plan technique"

### Layout
- **Sidebar :** fond `primary.main` (#1A237E), texte blanc 85% opacité, icône `secondary.main` sur item actif uniquement
- **Content :** fond `background.default` (#F8FAFC), padding `24px` (spacing 3)
- **Container MUI :** `maxWidth="xl"` par défaut

### Composants — règles impératives

```typescript
// Boutons — hiérarchie stricte
<Button variant="contained">Action principale</Button>   // 1 seul par page
<Button variant="outlined">Action secondaire</Button>
<Button color="error">Suppression</Button>               // toujours + Dialog de confirmation
<IconButton>...</IconButton>                             // actions de ligne dans tableaux

// Inputs — toujours outlined + small
<TextField variant="outlined" size="small" />

// Cards / Paper — toujours elevation={0} + bordure
<Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>

// Tableaux — header gris, pas de zebra-striping
// Header : fond #F1F5F9, texte uppercase bold 0.75rem
// Lignes  : bordure bottom 1px #E2E8F0 uniquement

// Loading — Skeleton obligatoire, jamais de spinner central
<Skeleton variant="rectangular" animation="wave" />

// Empty state — icône grise + message centré + bouton d'action
```

### React Flow (Dependency Graph)
- **Canvas :** fond blanc, grille de points (`variant="dots"`) gris clair
- **Nodes :** fond blanc, bordure indigo `primary.main` 1px, titre en gras
- **Edges :** couleur `divider` (#E2E8F0), flèche directionnelle Source → Cible

### Routing frontend — patron de référence (FS-02)
Pages indépendantes, jamais de modales pour le CRUD :

| Pattern | Route | Composant |
|---|---|---|
| Liste | `/<entité>s` | `<Entité>sListPage` |
| Création | `/<entité>s/new` | `<Entité>NewPage` |
| Détail | `/<entité>s/:id` | `<Entité>DetailPage` |
| Édition | `/<entité>s/:id/edit` | `<Entité>EditPage` |

Formulaire partagé entre New et Edit via composant `<Entité>Form` avec prop `initialValues?`.

---

## F02-i18n Foundation

> **Source :** `docs/PRD-FS/F02-i18n-foundation.md` (v0.1)
> Ce bloc doit être injecté en début de **chaque** session OpenCode frontend pour les sprints suivants.
> **Convention NON-NÉGOCIABLE** — toute string visible en dur est refusée en code review.

### Règle fondamentale

```typescript
// ✅ Correct — toujours
import { useTranslation } from 'react-i18next';
const { t } = useTranslation();
<Button>{t('common.actions.save')}</Button>

// ❌ Interdit — refusé en code review
<Button>Enregistrer</Button>
```

### Structure

```
frontend/src/
├── i18n/
│   ├── index.ts              ← import side-effect dans main.tsx (avant tout autre import)
│   └── locales/
│       └── fr.json           ← source de vérité de toutes les strings FR
```

### Convention de nommage des clés

Format : `domaine.page.element` — ex : `domains.list.title`, `common.actions.save`

```json
{
  "nav": { "applications": "Applications", "domains": "Domaines", ... },
  "common": {
    "actions": { "add": "Ajouter", "edit": "Modifier", "delete": "Supprimer", "save": "Enregistrer", "cancel": "Annuler", "back": "Retour" },
    "status": { "active": "Actif", "inactive": "Inactif", "deprecated": "Déprécié" },
    "criticality": { "low": "Faible", "medium": "Moyen", "high": "Élevé", "missionCritical": "Mission critique" },
    "emptyState": { "title": "Aucun élément", "description": "Commencez par créer votre premier élément." },
    "confirmDialog": { "confirmLabel": "Supprimer", "cancelLabel": "Annuler" },
    "snackbar": { "createSuccess": "Élément créé avec succès.", "updateSuccess": "Élément mis à jour avec succès.", "deleteSuccess": "Élément supprimé avec succès." }
  },
  "errors": { "notFound": {...}, "unauthorized": {...}, "forbidden": {...}, "unexpected": {...} },
  "auth": { "login": {...} },
  "<module>": { "list": {...}, "detail": {...}, "form": {...}, "delete": {...}, "snackbar": {...} }
}
```

### Règles impératives

1. **Toutes les strings visibles** passent par `t('key')` — sans exception
2. **Ajouter les clés dans `fr.json` en même temps que le composant** — jamais après coup
3. **Interpolation dynamique :** `t('key', { variable: valeur })` avec syntaxe `{{variable}}` dans `fr.json`
4. **Pas de composant `<Trans>` en P1**
5. **Pas de `defaultValue`** dans les appels `t()` — les clés manquantes s'affichent crues (détection immédiate)
6. **Valeurs par défaut** des composants partagés (`ConfirmDialog`, `EmptyState`) : via `t()` sur `common.*`

### Bloc contexte à injecter dans chaque session OpenCode frontend

```
i18n (F-02) :
- react-i18next installé, langue unique FR, fichier source : src/i18n/locales/fr.json
- Convention obligatoire : toutes les strings visibles passent par t('key') — jamais de string en dur
- Structure des clés : domaine.page.element — ex: domains.list.title, common.actions.save
- Ajouter les nouvelles clés dans fr.json EN MÊME TEMPS que le composant — jamais après
- Interpolation dynamique : t('key', { variable: valeur }) avec syntaxe {{variable}} dans fr.json
- Pas de composant <Trans> en P1
- Valeurs par défaut dans les composants partagés (ConfirmDialog, EmptyState) : via t() sur les clés common.*
- Assertions Cypress : utiliser les valeurs FR de fr.json, pas les strings anglaises des specs Gherkin
```

---

```bash
# Backend (.env)
DATABASE_URL=postgresql://arkepm:arkepm@localhost:5432/arkepm
JWT_SECRET=<secret>
JWT_EXPIRES_IN=8h
NODE_ENV=development
ADMIN_PASSWORD=<initial_admin_password>  # used by prisma/seed.ts

# Frontend (.env)
VITE_API_URL=http://localhost:3000
```