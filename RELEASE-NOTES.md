# ARK — Release Notes

_Last updated: 2026-03-29 — v0.7.0_

> This file contains the complete release history for ARK, most recent first.
> One entry per release. Each release maps to one or more completed sprints.
> Format: add new entries at the top, above the previous release separator.

---

## v0.7.0 — 2026-03-29

> Sprint 2 Enhancement — IT Components ↔ Applications bidirectional relationship + UI improvements

### Highlights

- **Bidirectional IT Components ↔ Applications** — Complete N:N relationship implementation with symmetric navigation, count badges, and validation guards
- **Enhanced Applications List** — New IT Components count column with chip badge, clickable component/domain/provider links
- **Comprehensive E2E Testing** — 50+ Playwright tests for APIs and bidirectional relationship validation

### What's New

#### Features

| ID | Title | Priority |
|---|---|---|
| FS-06-v1.2 | Applications: IT Components count chip + clickable names | P1 |
| FS-04-v1.1 | IT Components: clickable application names + DeleteIcon fix | P1 |
| Bidirectional-APIs | `GET /applications/{id}/it-components`, `GET /it-components/{id}/applications` | P1 |

#### Technical Improvements

| Ref | Description |
|---|---|
| Frontend UI | 5 files updated: ApplicationsListPage (Chip column), ApplicationDetailPage (links), ApplicationDrawer (links), ITComponentDetailPage (links), ITComponentListPage (DeleteIcon fix) |
| OpenAPI | ApplicationListItem schema now includes `itComponents` array for consistency with detail endpoint |
| Frontend i18n | New key `applications.list.columns.itComponents` (FR: "Composants IT") |
| E2E Tests | 40+ new API tests covering CRUD, dependencies, bidirectional queries, and deletion guards |
| TestDataFactory | New `createItComponent()` method with auto-cleanup |

### Breaking Changes

> ⚠️ _None_

### Known Limitations

- No frontend UI tests (Playwright) for the new clickable links — pure API tests only
- Drag-drop IT Component reordering deferred (no use case identified)
- Mass operations (add same ICs to multiple apps) deferred to future sprint

### Migration Steps

```bash
# No manual steps required for this release
docker-compose down
docker-compose pull
npx prisma migrate deploy
docker-compose up -d
```

### Specs Delivered

| Spec | Title | Status |
|---|---|---|
| FS-06-Applications-front v1.2 | Applications: IT Components enhancements | ✅ done |
| FS-04-IT-Components-front v1.1 | IT Components: bidirectional support | ✅ done |
| OpenAPI v2.5 | Complete Application schemas with itComponents | ✅ done |
| E2E Tests | 40+ Playwright tests for IT Components | ✅ done |

---

## v0.6.0 — 2026-03-29

> Sprint 2 completion — Providers frontend + Design Guidelines standardization

### Highlights

- **Providers CRUD Frontend** — 4 pages (List, Detail, New, Edit) avec drawer PNS-02, badges rôles N:N, badges urgence expiration
- **Design Guidelines v0.4** — Breadcrumb systématique (PNS-11), DatePicker MUI, badges conditionnels, composants métier documentés

### What's New

#### Features

| ID | Title | Priority |
|---|---|---|
| FS-03-FRONT | Providers — Frontend CRUD (4 pages + drawer) | P1 |

#### Technical Improvements

| Ref | Description | Source |
|---|---|---|
| PNS-11 | Breadcrumb systématique 3 niveaux (Accueil > Liste > Courant) + composant AppBreadcrumbs recommandé | Design v0.4 |
| UI-Kit v0.4 | DatePicker MUI (FR locale), badge conditionnel (Chip dynamique), ExpiryDateBadge, ProviderRoleBadge documentés | Design v0.4 |
| TD-15 | Routes Providers décommentées + fonctionnelles (FS-03-FRONT implémentée) | F-999 ✅ done |
| TD-12 | Providers API réels via `useProviders()` hook — mocks supprimés dans ApplicationForm | F-999 ✅ unblocked |
| TD-17-21 | 5 items dette technique Sprint 3 documentés : filtres, breadcrumbs manquants, composant partagé | F-999 v0.6 |

### Breaking Changes

> ⚠️ _None_

### Known Limitations

- FS-03-FRONT Playwright tests non implémentés (~50 cas, Phase 6 à venir)
- Filtres contractType/expiryDate différés Sprint 3 (backend `QueryProvidersDto` non prêt)
- Breadcrumbs manquants sur Applications/Domains (F-999 Items 18-19 Sprint 3)
- Menu dropdown Actions (⋮) remplacé par icônes séparées Edit/Delete (fonctionnellement équivalent)

### Migration Steps

```bash
# No manual steps required for this release
docker-compose down
docker-compose pull
npx prisma migrate deploy
docker-compose up -d
```

### Specs Delivered

| Spec | Title | Status |
|---|---|---|
| FS-03-FRONT | Providers — Frontend CRUD | ✅ done |
| Design v0.4 | UI Kit + Navigation Patterns (PNS-11) | ✅ done |
| F-999 v0.6 | Technical Debt Items 17-21 documented | ✅ documented |

---

## v0.5.2 — 2026-03-29

> Hotfix — Provider Dropdown API integration

### Highlights

- **Provider Dropdown Fix** — ApplicationForm now displays real providers from API instead of empty mock list

### What's New

#### Bug Fixes

| Ref | Description | Area |
|---|---|---|
| #12 | ApplicationNewPage/EditPage fetch providers from real API via `useProviders()` hook | frontend |
| #12 | MOCK_PROVIDERS empty array removed, actual API response mapped to form select options | frontend |

### Breaking Changes

> ⚠️ _None_

### Known Limitations

- FS-09 Users API not yet implemented (MOCK_USERS still placeholder)

### Migration Steps

```bash
# No manual steps required for this release
docker-compose down
docker-compose pull
docker-compose up -d
```

### Specs Delivered

| Spec | Title | Status |
|---|---|---|
| F-999 Item 12 | APIs Providers mockées → unblocked | ✅ unblocked |

---

## v0.5.0 — 2026-03-22

> FS-03 Providers + FS-04 IT Components complete (Backend + Frontend)

### Highlights

- **Providers CRUD Complete** — Backend API + N:N relationships with Applications (provider roles: editor, integrator, support, vendor, custom)
- **IT Components CRUD** — Full module implementation (backend API + frontend 4 pages + drawer)
- **Provider Roles N:N** — Applications can link multiple providers with distinct roles per relationship

### What's New

#### Features

| ID | Title | Priority |
|---|---|---|
| FS-03-BACK | Providers — Backend CRUD API | P1 |
| FS-04-BACK | IT Components — Backend CRUD API | P1 |
| FS-04-FRONT | IT Components — Frontend CRUD (4 pages + drawer) | P1 |

#### Technical Improvements

| Ref | Description | Source |
|---|---|---|
| N:N-Providers | app_provider_map junction table with provider_role enum (editor/integrator/support/vendor/custom) | FS-03-BACK v1.2 |
| Audit-Trail-Fix | $transaction interactive guarantees SET LOCAL ark.current_user_id persists in same transaction as write | FS-04-BACK |
| IT-Components-API | Full CRUD endpoints with filtering, pagination, N:1 application mapping | FS-04-BACK |
| IT-Components-UI | PNS-02 drawer pattern, breadcrumb, RBAC, i18n fully implemented | FS-04-FRONT |

### Breaking Changes

> ⚠️ _None_

### Known Limitations

- FS-03-FRONT Providers frontend not yet started (routes commented in App.tsx)
- Playwright tests FS-04-FRONT documented but not implemented (~30 cases)
- Tag dimensions hardcoded in frontend (P2 — dynamic API pending)

### Migration Steps

```bash
# Database migration required (N:N junction tables)
docker-compose down
docker-compose pull
npx prisma migrate deploy
docker-compose up -d

# Seed providers + IT components
docker exec ark-epm_backend_1 npx ts-node prisma/seed.ts
```

### Specs Delivered

| Spec | Title | Status |
|---|---|---|
| FS-03-BACK | Providers — Backend CRUD API | ✅ done |
| FS-04-BACK | IT Components — Backend CRUD API | ✅ done |
| FS-04-FRONT | IT Components — Frontend CRUD | ✅ done |






---
## v0.5.1 — 2026-03-18 

> Module CRUD Application

## TLDR
Les utilisateurs peuvent désormais gérer leur inventaire d'applications via une interface complète : liste paginée avec filtres par cycle de vie et tags, consultation rapide via drawer, fiche détail avec toutes les relations (domaine, fournisseur, responsable), et création/modification avec gestion des tags dimensionnels.

## NEW
### Applications — Module Frontend (P1)
**Pages disponibles :**
- `/applications` — Liste paginée avec tri, filtres cycle de vie et tags
- `/applications/:id` — Détail complet (infos, relations, tags, métadonnées)
- `/applications/new` — Création avec formulaire complet
- `/applications/:id/edit` — Modification avec pré-remplissage

* Pagination paginée avec URL : page, lignes/page, tri et filtres synchronisés dans l'URL (?page=2&limit=20&sortBy=criticality)
* Colonne Criticité : ajout dans la vue liste avec tri backend activé
* Navigation historique : boutons Précédent/Suivant du navigateur fonctionnent sur les changements de page/tri/filtre
* Sélecteur lignes/page : choix 10/20/50 éléments avec persistance URL

## FIX
* Uniformisation chips : criticité et cycle de vie affichés de façon identique entre liste, drawer et détail (chips colorés i18n)
* Tri backend : correction erreur 400 sur tri par criticité/cycle de vie
* Valeurs lifecycle : alignement des valeurs acceptées (draft, in_progress, production, deprecated, retired)
* Labels i18n : remplacement des textes hardcodés anglais par traductions françaises


---
## v0.4.0 — 2026-03-12 

> Dimension Tags
> Session Domain Drawer (PNS-02)

🎯 TLDR
- **Les domaines peuvent maintenant être tagués par dimension** (Geography, Brand, etc.) avec gestion hierarchique automatique. Plus besoin de scroller des listes interminables : les tags se dédupliquent intelligemment et s'affichent de manière compacte. Les suppressions/ajouts de tags attendent désormais la validation du formulaire, évitant les erreurs de manipulation.
- **Consultation rapide sans perte de contexte**. Les utilisateurs peuvent désormais cliquer sur n'importe quelle ligne du tableau de domaines pour consulter instantanément les métadonnées dans un panneau latéral, sans quitter leur liste ni perdre leurs filtres. Le nom du domaine reste un lien direct vers la fiche complète pour un accès rapide aux détails avancés.

✨ NEW
Tagging : 
  - Tagging hiérarchique : Les tags ont une profondeur (Europe → France → Paris), l'affichage garde automatiquement le niveau le plus précis par dimension
  - Vue compacte : Max 3 tags visibles en liste, drawer complet accessible en un clic  
  - Autocomplete intelligent : Création rapide de nouveaux tags avec suggestion existante
  - Couleurs par dimension : Chaque type de tag (Geography=bleu, Brand=violet...) identifiable visuellement
- SideDrawer
  - Side Drawer sur la liste des domaines : Clic sur le corps d'une ligne ouvre un panneau latéral (400px) affichant nom, description, tags et dates
  - Double mode d'accès : 
    - Clic sur le nom → navigation directe vers la page détail complète
    - Clic sur le reste de la ligne → ouverture du drawer
  - Transition fluide depuis le drawer : Boutons "Modifier" (grisé si pas de droits) et "Voir la fiche complète" pour basculer vers les vues édition/détail
  - Gestion des tags dans le drawer : Affichage des 10 premiers tags avec option "Voir plus" pour les listes longues
- Fermeture intuitive : Bouton croix grisé, clic hors du drawer, ou touche Escape

🔧 FIX
- Suppression de tags : Les chips disparaissaient de la base mais restaient visibles à l'écran jusqu'au refresh
- Sauvegarde immédiate : Les tags étaient persistés dès le clic sans attendre "Enregistrer", rendant le bouton "Annuler" inefficace
-  Couleur de fond du drawer : Passage de la couleur primaire à la couleur de fond standard (blanc/papier)

---
---
## v0.3.0 — 2026-03-08

> Dimension Tags Foundation — Hierarchical tagging system with recursive path resolution and free-form autocomplete.

### Highlights

- **TagsModule API** — Complete CRUD for tag dimensions with recursive path creation (Obsidian-style: `europe/france/paris`)
- **DimensionTagInput Component** — Reusable MUI autocomplete with free creation and debounce
- **Security Fix** — Resolved CodeQL type confusion alert with AutocompleteQueryDto validation

### What's New

#### Features

| ID | Title | Priority |
|---|---|---|
| F-03 | Dimension Tags Foundation | P1 |

#### Bug Fixes

| Ref | Description | Area |
|---|---|---|
| #1 | Type confusion in `/tags/autocomplete` endpoint (CodeQL js/type-confusion-through-parameter-tampering) | backend |

#### Technical Improvements

| Ref | Description | Source |
|---|---|---|
| F-03-IMPL | TagService manual logic (normalizePath, resolveOrCreate, getAncestorPaths, labelFromPath) | F-03 |
| F-03-DB | Prisma models: TagDimension, TagValue, EntityTag with text_pattern_ops index | F-03 |
| F-03-SEED | Seed data: Geography, Brand, LegalEntity dimensions | F-03 |
| F-03-DTO | AutocompleteQueryDto with @Transform validation for query params | F-03 |

### Breaking Changes

> ⚠️ _None_

### Known Limitations

- FS-04 to FS-11 — not yet started
- `multiValue: false` constraint not enforced in backend (P2/FS-21)
- `entityScope` validation deferred to P2 (FS-21)

### Migration Steps

```bash
# Standard deployment — migrations auto-applied

docker-compose down
docker-compose pull
docker-compose up -d

# Verify migrations applied
docker exec ark-epm_backend_1 npx prisma migrate status
```

### Specs Delivered

| Spec | Title | Status |
|---|---|---|
| F-03 | Dimension Tags Foundation | ✅ done |

---
---
## v0.2.0 — 2026-03-07

> First frontend feature release — Domains UI complete.

### Highlights

- **Domains Frontend** — Complete CRUD UI with React, MUI, ReactFlow integration
- **Alert System** — Reusable ArkAlert component with success/error feedback

### What's New

#### Features

| ID | Title | Priority |
|---|---|---|
| FS-02-FRONT | Domains — Frontend UI | P1 |

#### Bug Fixes

| Ref | Description | Area |
|---|---|---|
| — | None for this release | — |

#### Technical Improvements

| Ref | Description | Source |
|---|---|---|
| ArkAlert-01 | ArkAlert component (MUI Snackbar + Alert wrapper) | FS-02-FRONT |
| ArkAlert-02 | Navigation state-based success alerts | FS-02-FRONT |
| ArkAlert-03 | 409 DEPENDENCY_CONFLICT handling in ConfirmDialog | FS-02-FRONT |
| UI-SORT-01 | Client-side sorting with null values last | FS-02-FRONT |

### Breaking Changes

> ⚠️ _None_

### Known Limitations

- FS-03 to FS-11 — not yet started

### Migration Steps

```bash
# No manual steps required for this release
docker-compose down
docker-compose pull
npx prisma migrate deploy
docker-compose up -d
```

### Specs Delivered

| Spec | Title | Status |
|---|---|---|
| FS-02-FRONT | Domains — Frontend UI | ✅ done |

---

<!-- ============================================================ -->
<!-- RELEASE v0.1.3 — 2026-03-07                             -->
<!-- ============================================================ -->

## v0.1.3 — 2026-03-07

> First MVP release delivering core backend API foundation.

### Highlights

- **Domains Backend API** — Complete CRUD with RBAC, validation, and referential integrity checks
- **i18n Foundation** — react-i18next ready for all frontend features

### What's New

#### Features

| ID | Title | Priority |
|---|---|---|
| FS-02-BACK | Domains — Backend API | P1 |
| F-02 | i18n Foundation | P1 |

#### Bug Fixes

| Ref | Description | Area |
|---|---|---|
| — | None for this release | — |

#### Technical Improvements

| Ref | Description | Source |
|---|---|---|
| TD-1 | HttpExceptionFilter created in src/common/filters/ | F-999 |
| TD-2 | JWT TTL 15min, redirect /login?reason=session_expired | F-999 |
| TD-3 | ThrottlerModule configured (100 req/min global, 10 req/min auth) | F-999 |
| TD-4 | PaginationQueryDto created in src/common/dto/ | F-999 |
| TD-9 | API prefix /api/v1 configured in main.ts | F-999 |
| TD-10 | RequestIdMiddleware created, header X-Request-ID on all responses | F-999 |
| SPEC-TPL-01 | Split back/front spec templates adopted | Sprint 2 |

### Breaking Changes

> ⚠️ _None_

### Known Limitations

- FS-03 to FS-11 — not yet started

### Migration Steps

```bash
# No manual steps required for this release
docker-compose down
docker-compose pull
npx prisma migrate deploy
docker-compose up -d
```

### Specs Delivered

| Spec | Title | Status |
|---|---|---|
| F-00 | Scaffolding projet — NestJS + Prisma + Docker + JWT | ✅ done |
| F-01 | Design System & UI Foundation | ✅ done |
| FS-01 | Auth & RBAC | ✅ done |
| F-02 | i18n Foundation | ✅ done |
| FS-02-BACK | Domains — Backend API | ✅ done |
| FS-02-FRONT | Domains — Frontend UI | ✅ done |
| F-999 | Technical Debt & Conventions | ✅ done (items 1-4, 9-10) |

---

_ARK Release Notes — updated at each sprint closure_
