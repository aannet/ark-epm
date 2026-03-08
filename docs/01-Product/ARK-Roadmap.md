# ARK — Roadmap des Feature-Specs P1

_Version 0.8 — Mars 2026_

> **Changelog v0.8 :**
> - Ajout de F-03 (Dimension Tags Foundation) dans la section Fondation
> - Gate bloquante ajoutée : F-03 `done` est requis avant toute session OpenCode Sprint 2 (bloque FS-02 et toute la chaîne)
> - Vue synthétique des dépendances mise à jour : F-03 intercalé entre F-02 et FS-02+
> - Checklist Sprint 2 enrichie avec les prérequis F-03
> - Ordre de rédaction des specs mis à jour : F-03 en priorité 0 (avant FS-02-BACK)
> - Estimé Phase 0 mis à jour (4j → 5.5j)
> - Note FS-21 (admin UI dimensions) ajoutée en P2 différée

> **Changelog v0.7 :** Adoption de la convention split back/front pour Sprint 2+. Règle de statut enrichie (statuts BACK / FRONT distincts). Tableaux mis à jour. Vue dépendances avec gates explicites.

> **Changelog v0.6 :** Correction statuts — tâches 0.8 (POC React Flow) et 0.9 (WITH RECURSIVE) remises à `à faire`.

> **Changelog v0.5 :** Ajout de F-02 (i18n Foundation). Statuts F-00, F-01, FS-01 passés à `done`. Dépendance F-02 ajoutée sur toutes les Feature-Specs frontend Sprint 2+.

> **Changelog v0.4 :** Ajout de F-01 (Design System & UI Foundation). Estimé Phase 0 mis à jour (2j → 3j).

---

## Règle de statut

| Statut | Signification |
|---|---|
| `draft` | Spec en cours de rédaction |
| `review` | Spec complète, en attente de validation |
| `stable` | Spec validée — prête pour OpenCode |
| `in-progress` | Implémentation en cours |
| `done` | Implémentée, testée, mergée |

> **Règle de séquencement back/front :** La spec FRONT ne peut passer à `stable` que si la spec BACK est `done`. Une feature est `done` au sens sprint uniquement quand BACK **et** FRONT sont `done`.

---

## Roadmap P1 — Découpage vertical par feature

### Fondation (Phase 0 — hybride manuel/OpenCode)

| ID | Feature | Dépend de | Statut | Estimé | Mode |
|---|---|---|---|---|---|
| F-00 | **Scaffolding** — NestJS + Prisma + Docker + JWT + PrismaService + middleware `ark.current_user_id` | — | ✅ `done` | 2j | Manuel |
| F-01 | **Design System & UI Foundation** — Theme MUI, Layout Shell (Sidebar/TopBar), composants partagés, `NotFoundPage`, `ErrorBoundary` | F-00 | ✅ `done` | 1j | Manuel |
| F-02 | **i18n Foundation** — react-i18next, langue unique FR, externalisation strings F-01 + FS-01 | FS-01 | `stable` | 0.5j | Manuel |
| F-03 | **Dimension Tags Foundation** — `TagsModule` global, migrations Prisma (`tag_dimensions`, `tag_values`, `entity_tags`), `TagService` (resolveOrCreate, path récursif), `DimensionTagInput` React, seed 3 dimensions de base | F-02, FS-01 | `draft` | 1.5j | 🟡 Hybride |

> F-00, F-01, F-02 sont entièrement manuels. F-03 est **hybride** : `TagService` (resolveOrCreate, normalizePath, getAncestorPaths) est écrit manuellement — migrations, controller, DTOs, module wiring et `DimensionTagInput` sont générables via OpenCode.

> **Gate critique F-03 :** F-03 doit être `done` avant de démarrer FS-02. `DimensionTagInput` est consommé par tous les formulaires CRUD du Sprint 2+. Ne pas commencer FS-02-BACK sans F-03 terminé.

> **Composants disponibles après F-01 :** `AppShell`, `Sidebar`, `TopBar`, `PageContainer`, `StatusChip`, `ConfirmDialog`, `EmptyState`, `PageHeader`, `LoadingSkeleton`, `NotFoundPage`, `ErrorBoundary`.

> **Convention disponible après F-02 :** toutes les strings visibles passent par `t('key')`. Fichier source : `src/i18n/locales/fr.json`.

> **Composant disponible après F-03 :** `DimensionTagInput` — exporté depuis `src/components/tags/index.ts`. `TagsModule` global — `TagService` injectable partout sans réimport. 3 dimensions seedées : Geography, Brand, LegalEntity.

---

### Sprint 1 — Auth & RBAC end-to-end

> FS-01 conserve le format unifié (implémenté avant la décision de split back/front).

| ID | Feature | Dépend de | Statut | Estimé |
|---|---|---|---|---|
| FS-01 | **Auth & RBAC** — Login email/password, JWT, gestion des rôles et permissions, guards NestJS, écran login React, pages `UnauthorizedPage` (401) et `ForbiddenPage` (403) | F-00, F-01 | ✅ `done` | 3j |

**Périmètre FS-01 :**
- Backend : `POST /auth/login`, `POST /auth/logout`, `GET /auth/me`
- Backend : CRUD `/roles`, `/permissions`, `/users` (protégés)
- Frontend : écran Login + gestion du token JWT en mémoire + `UnauthorizedPage` (401) + `ForbiddenPage` (403)
- Frontend : `PrivateRoute` étendu (vérification token + permission), intercepteur Axios 401/403
- Hors périmètre : SSO SAML2 (P2), droits par domaine (P2)

> ⚠️ Les strings FS-01 ont été implémentées avant F-02. Le rétrofittage i18n fait partie du périmètre de F-02.

---

### Sprint 2 — Entités racines end-to-end

> **Convention à partir de ce sprint :** chaque feature = `FS-XX-BACK` + `FS-XX-FRONT`. Templates : `_template-back.md` / `_template-front.md`.
> **Prérequis bloquants :** F-02 `done` (frontend) **et** F-03 `done` (tags) — les deux gates doivent être franchies avant toute session OpenCode Sprint 2.

| ID | Feature | Dépend de (BACK) | Dépend de (FRONT) | Statut BACK | Statut FRONT | Estimé |
|---|---|---|---|---|---|---|
| FS-02 | **Domains** — CRUD complet + pages Liste/Détail/New/Edit | FS-01, F-03 | FS-02-BACK, F-02, F-03 | `in-progress` | `draft` | 0.5j + 1j |
| FS-03 | **Providers** — CRUD complet + pages Liste/Détail/New/Edit | FS-01, F-03 | FS-03-BACK, F-02, F-03 | `draft` | `draft` | 0.5j + 0.5j |
| FS-04 | **IT Components** — CRUD + liaison `app_it_component_map` + écrans | FS-01, F-03 | FS-04-BACK, F-02, F-03 | `draft` | `draft` | 0.5j + 1j |
| FS-05 | **Data Objects** — CRUD + liaison `app_data_object_map` (avec rôle) + écrans | FS-01, F-03 | FS-05-BACK, F-02, F-03 | `draft` | `draft` | 0.5j + 1j |

> FS-02 et FS-03 sont les **modules de référence** — backend (FS-02-BACK) et frontend (FS-02-FRONT) — pour OpenCode sur tous les modules suivants. Valider soigneusement avant de démarrer FS-03.

> ⚠️ La migration F-03 retire les colonnes `tags TEXT[]` sur chaque table au fil des sprints. Chaque FS-xx est responsable du `DROP COLUMN tags` sur sa propre table (documenté en F-999 §2).

---

### Sprint 3 — Applications & Capacités end-to-end

| ID | Feature | Dépend de (BACK) | Dépend de (FRONT) | Statut BACK | Statut FRONT | Estimé |
|---|---|---|---|---|---|---|
| FS-06 | **Applications** — CRUD complet + liaisons `domains`/`providers`/`users` + `DimensionTagInput` + écran inventaire + fiche détail | FS-02-BACK, FS-03-BACK, F-03 | FS-06-BACK, F-02, F-03 | `draft` | `draft` | 1.5j + 1.5j |
| FS-07 | **Business Capabilities** — CRUD + récursion `WITH RECURSIVE` + `DimensionTagInput` + écran arbre hiérarchique | FS-02-BACK, F-03 | FS-07-BACK, F-02, F-03 | `draft` | `draft` | 1.5j + 1.5j |

> FS-07-BACK contient la requête `WITH RECURSIVE` — à écrire et tester manuellement en SQL avant de rédiger la spec back. **Tâche 0.9 à réaliser pendant Sprint 2** (0.5j R&D SQL pur).

> FS-06 est la première feature à intégrer `DimensionTagInput` dans un formulaire réel — les tests Cypress F-03 (`DimensionTagInput`) sont complétés dans la spec FS-06-FRONT.

---

### Sprint 4 — Graphe de dépendances end-to-end

| ID | Feature | Dépend de (BACK) | Dépend de (FRONT) | Statut BACK | Statut FRONT | Estimé |
|---|---|---|---|---|---|---|
| FS-08 | **Interfaces** — CRUD unidirectionnel Source→Cible + règles métier + `DimensionTagInput` + écran liste | FS-06-BACK, F-03 | FS-08-BACK, F-02, F-03 | `draft` | `draft` | 1j + 1j |
| FS-09 | **Dependency Graph** — endpoint `/graph` + composant React Flow + filtres (domaine, criticité, type, dimension tag) | FS-08-BACK, FS-06-BACK | FS-09-BACK, F-02 | `draft` | `draft` | 1j + 2j |

> FS-09-FRONT est la spec frontend la plus risquée. Le **POC React Flow** (tâche 0.8) doit être concluant avant de rédiger FS-09-FRONT.

---

### Sprint 5 — Import & Finalisation MVP

| ID | Feature | Dépend de (BACK) | Dépend de (FRONT) | Statut BACK | Statut FRONT | Estimé |
|---|---|---|---|---|---|---|
| FS-10 | **Import Excel** — upload frontend + validation backend + insertion en base pour les 6 entités P1 (avec tags) | FS-06-BACK, FS-07-BACK, FS-08-BACK, F-03 | FS-10-BACK, F-02, F-03 | `draft` | `draft` | 1.5j + 1.5j |
| FS-11 | **Navigation & UX transverse** — menu, breadcrumb, gestion des erreurs globale, loading states | FS-06-BACK | FS-11-BACK, F-02 | `draft` | `draft` | 0.5j + 1.5j |

---

## Features P2 — Différées

| ID | Feature | Dépend de | Priorité | Note |
|---|---|---|---|---|
| FS-21 | **Tag Dimensions Administration** — UI d'admin des dimensions (renommage, fusion, réordonnancement, contrainte `multi_value`, `entity_scope`) | F-03 | P2 | Hors périmètre MVP — F-03 pose les fondations, FS-21 expose l'UI de gestion |

---

## Vue synthétique — dépendances

```
F-00 (Fondation technique) ✅
  └── F-01 (Design System & UI Foundation) ✅
        └── FS-01 (Auth & RBAC — format unifié) ✅
              └── F-02 (i18n Foundation) — bloque tout le frontend Sprint 2+
                    │
                    └── F-03 (Dimension Tags Foundation) — bloque FS-02 et toute la chaîne CRUD
                          │  TagsModule @Global, DimensionTagInput, seed dimensions
                          │
                          ├── FS-02-BACK ──gate──► FS-02-FRONT (Domains)
                          │     └── FS-06-BACK ──gate──► FS-06-FRONT (Applications)
                          │           ├── FS-08-BACK ──gate──► FS-08-FRONT (Interfaces)
                          │           │     └── FS-09-BACK ──gate──► FS-09-FRONT (Dependency Graph)
                          │           └── FS-10-BACK ──gate──► FS-10-FRONT (Import Excel)
                          ├── FS-03-BACK ──gate──► FS-03-FRONT (Providers)
                          │     └── FS-06-BACK (déjà listé)
                          ├── FS-04-BACK ──gate──► FS-04-FRONT (IT Components)
                          ├── FS-05-BACK ──gate──► FS-05-FRONT (Data Objects)
                          └── FS-07-BACK ──gate──► FS-07-FRONT (Business Capabilities)
                                └── FS-10-BACK (déjà listé)

F-03 ──(P2)──► FS-21 (Tag Dimensions Administration — UI admin)
```

> **Lecture :** `──gate──►` = la spec FRONT ne peut passer à `stable` qu'après que la spec BACK est `done`. F-03 est un gate global sur toute la chaîne CRUD Sprint 2+.

---

## Ordre de rédaction des specs recommandé

Travailler à rebours depuis la feature la plus risquée. Pour chaque feature Sprint 2+ : rédiger BACK en premier, valider, puis rédiger FRONT.

| Ordre | Spec | Pourquoi | Statut BACK | Statut FRONT |
|---|---|---|---|---|
| — | **F-02** (i18n Foundation) | Bloque tout le frontend Sprint 2+ | `stable` | — |
| **0** | **F-03** (Dimension Tags Foundation) | **Gate global — bloque FS-02 et toute la chaîne CRUD. TagService manuel à écrire en premier.** | `draft` | — |
| 1 | **FS-02-BACK** | Module de référence backend — patron pour FS-03 à FS-11 | `in-progress` | — |
| 2 | **FS-02-FRONT** | Module de référence frontend — valider le Layout Contract en premier | — | `draft` |
| 3 | **FS-09-BACK** | La plus risquée — valider le POC React Flow avant FS-09-FRONT | `draft` | — |
| 4 | **FS-07-BACK** | La plus complexe techniquement — valider `WITH RECURSIVE` en SQL avant | `draft` | — |
| 5 | **FS-06-BACK** | Feature centrale du MVP — la plus riche en règles métier | `draft` | — |
| 6–10 | Reste des specs BACK | Dans l'ordre du tableau roadmap | `draft` | — |
| 11+ | Specs FRONT | Dans l'ordre des gates BACK validées | — | `draft` |

---

## Checklist avant de lancer la première session OpenCode Sprint 2

### Prérequis globaux

- [x] F-00 terminé — `docker-compose up` OK, PrismaModule global, middleware audit actif
- [x] F-01 terminé — theme MUI actif, AppShell fonctionnel, composants partagés disponibles
- [x] FS-01 terminé — `JwtAuthGuard` global, `@RequirePermission()` disponible, seed Admin OK
- [ ] **F-02 terminé** — `react-i18next` installé, `fr.json` complet, composants F-01 + FS-01 rétrofittés ← **gate bloquante frontend**
- [ ] **F-03 terminé** — `TagsModule` global actif, tables `tag_dimensions`/`tag_values`/`entity_tags` migrées, seed 3 dimensions OK, `DimensionTagInput` exporté ← **gate bloquante CRUD Sprint 2+**
- [ ] **POC React Flow concluant** (tâche 0.8) — gate avant FS-09-FRONT
- [ ] **Requête `WITH RECURSIVE` testée en base** (tâche 0.9) — gate avant FS-07-BACK

### Prérequis session OpenCode Backend (FS-XX-BACK)

- [ ] `schema.prisma` contient le modèle de la feature avec ses relations
- [ ] Migration Prisma appliquée — table présente en base (inclut `DROP COLUMN tags` si applicable)
- [ ] Seed contient les permissions `[domaine]:read` et `[domaine]:write`
- [ ] Jest + Supertest opérationnels
- [ ] Spec BACK au statut `stable`

### Prérequis session OpenCode Frontend (FS-XX-FRONT)

- [ ] Spec BACK au statut `done` — gates G-01 à G-08 cochées
- [ ] API testée manuellement (Postman/curl)
- [ ] Clés `[domaine].*` ajoutées dans `fr.json` (inclut `tags.*` si DimensionTagInput présent)
- [ ] Câblage `App.tsx` réalisé manuellement
- [ ] `cy.loginAsReadOnly()` disponible dans `cypress/support/commands.ts`
- [ ] Layout Contract §3 relu — un bloc YAML par page, aucun composant F-01/F-03 manquant
- [ ] Spec FRONT au statut `stable`

### Prérequis spécifiques F-03 (avant génération OpenCode partielle)

- [ ] `TagService.normalizePath()` écrit et testé unitairement
- [ ] `TagService.resolveOrCreate()` écrit et testé unitairement (inclut création récursive des ancêtres)
- [ ] `TagService.getAncestorPaths()` écrit et testé unitairement
- [ ] `TagService.labelFromPath()` écrit et testé unitairement
- [ ] Migration Prisma appliquée — index `text_pattern_ops` présent (`\d tag_values` dans psql)
- [ ] `SELECT * FROM tag_dimensions` retourne 3 lignes (Geography, Brand, LegalEntity)
- [ ] `DimensionTagInput` intégré dans FS-06-FRONT en premier — tests Cypress F-03 complétés dans FS-06

---

_Roadmap v0.8 — Projet ARK_