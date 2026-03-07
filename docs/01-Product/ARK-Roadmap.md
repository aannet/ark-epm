# ARK — Roadmap des Feature-Specs P1

_Version 0.7 — Mars 2026_

> **Changelog v0.7 :**
> - Adoption de la convention split back/front pour toutes les Feature-Specs Sprint 2+ (décision Sprint FS-02)
> - Règle de statut enrichie : statuts `back` et `front` distincts par feature
> - Tableaux Sprint 2–5 mis à jour avec colonnes `Statut BACK` / `Statut FRONT` et estimés séparés
> - Vue synthétique des dépendances mise à jour : gate back → front explicitée
> - Ordre de rédaction mis à jour : chaque spec = 2 documents à produire séquentiellement
> - Checklist Sprint 2 mise à jour avec les nouvelles conventions

> **Changelog v0.6 :** Correction statuts — tâches 0.8 (POC React Flow) et 0.9 (WITH RECURSIVE) remises à `à faire`. Repositionnées pendant Sprint 2.

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

### Fondation (Phase 0 — manuel, pas de spec OpenCode)

| ID | Feature | Dépend de | Statut | Estimé |
|---|---|---|---|---|
| F-00 | Scaffolding projet — NestJS + Prisma + Docker + JWT + PrismaService + middleware `ark.current_user_id` | — | ✅ `done` | 2j |
| F-01 | **Design System & UI Foundation** — Theme MUI, Layout Shell (Sidebar/TopBar), composants partagés, `NotFoundPage` (404), `ErrorBoundary` | F-00 | ✅ `done` | 1j |
| F-02 | **i18n Foundation** — react-i18next, langue unique FR, externalisation strings F-01 + FS-01 | FS-01 | `stable` | 0.5j |

> F-00, F-01 et F-02 sont réalisés manuellement — pas de génération OpenCode. **F-02 doit être `done` avant toute session OpenCode frontend à partir de Sprint 2.**

> **Composants F-01 disponibles :** `AppShell`, `Sidebar`, `TopBar`, `PageContainer`, `StatusChip`, `ConfirmDialog`, `EmptyState`, `PageHeader`, `LoadingSkeleton`, `NotFoundPage`, `ErrorBoundary` — injectés dans la commande OpenCode de chaque spec front via `_template-front.md §10`.

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
> **Prérequis bloquant :** F-02 `done` avant toute session OpenCode frontend.

| ID | Feature | Dépend de (BACK) | Dépend de (FRONT) | Statut BACK | Statut FRONT | Estimé |
|---|---|---|---|---|---|---|
| FS-02 | **Domains** — CRUD complet + pages Liste/Détail/New/Edit | FS-01 | FS-02-BACK, F-02 | `in-progress` | `draft` | 0.5j + 1j |
| FS-03 | **Providers** — CRUD complet + pages Liste/Détail/New/Edit | FS-01 | FS-03-BACK, F-02 | `draft` | `draft` | 0.5j + 0.5j |
| FS-04 | **IT Components** — CRUD + liaison `app_it_component_map` + écrans | FS-01 | FS-04-BACK, F-02 | `draft` | `draft` | 0.5j + 1j |
| FS-05 | **Data Objects** — CRUD + liaison `app_data_object_map` (avec rôle) + écrans | FS-01 | FS-05-BACK, F-02 | `draft` | `draft` | 0.5j + 1j |

> FS-02 et FS-03 sont les **modules de référence** — backend (FS-02-BACK) et frontend (FS-02-FRONT) — pour OpenCode sur tous les modules suivants. Valider soigneusement avant de démarrer FS-03.

---

### Sprint 3 — Applications & Capacités end-to-end

| ID | Feature | Dépend de (BACK) | Dépend de (FRONT) | Statut BACK | Statut FRONT | Estimé |
|---|---|---|---|---|---|---|
| FS-06 | **Applications** — CRUD complet + liaisons `domains`/`providers`/`users` + écran inventaire + fiche détail | FS-02-BACK, FS-03-BACK | FS-06-BACK, F-02 | `draft` | `draft` | 1.5j + 1.5j |
| FS-07 | **Business Capabilities** — CRUD + récursion `WITH RECURSIVE` + écran arbre hiérarchique | FS-02-BACK | FS-07-BACK, F-02 | `draft` | `draft` | 1.5j + 1.5j |

> FS-07-BACK contient la requête `WITH RECURSIVE` — à écrire et tester manuellement en SQL avant de rédiger la spec back. **Tâche 0.9 à réaliser pendant Sprint 2** (0.5j R&D SQL pur).

---

### Sprint 4 — Graphe de dépendances end-to-end

| ID | Feature | Dépend de (BACK) | Dépend de (FRONT) | Statut BACK | Statut FRONT | Estimé |
|---|---|---|---|---|---|---|
| FS-08 | **Interfaces** — CRUD unidirectionnel Source→Cible + règles métier + écran liste | FS-06-BACK | FS-08-BACK, F-02 | `draft` | `draft` | 1j + 1j |
| FS-09 | **Dependency Graph** — endpoint `/graph` + composant React Flow + filtres | FS-08-BACK, FS-06-BACK | FS-09-BACK, F-02 | `draft` | `draft` | 1j + 2j |

> FS-09-FRONT est la spec frontend la plus risquée. Le **POC React Flow** (tâche 0.8) doit être concluant avant de rédiger FS-09-FRONT. Le Layout Contract §3 de FS-09-FRONT sera particulièrement riche — prévoir une validation soignée avant session OpenCode.

---

### Sprint 5 — Import & Finalisation MVP

| ID | Feature | Dépend de (BACK) | Dépend de (FRONT) | Statut BACK | Statut FRONT | Estimé |
|---|---|---|---|---|---|---|
| FS-10 | **Import Excel** — upload frontend + validation backend + insertion en base pour les 6 entités P1 | FS-06-BACK, FS-07-BACK, FS-08-BACK | FS-10-BACK, F-02 | `draft` | `draft` | 1.5j + 1.5j |
| FS-11 | **Navigation & UX transverse** — menu, breadcrumb, gestion des erreurs globale, loading states | FS-06-BACK | FS-11-BACK, F-02 | `draft` | `draft` | 0.5j + 1.5j |

---

## Vue synthétique — dépendances

```
F-00 (Fondation technique) ✅
  └── F-01 (Design System & UI Foundation) ✅
        └── FS-01 (Auth & RBAC — format unifié) ✅
              └── F-02 (i18n Foundation) — bloque tout le frontend Sprint 2+
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
```

> **Lecture :** `──gate──►` signifie que la spec FRONT ne peut passer à `stable` qu'après que la spec BACK est `done` (gates G-01 à G-08 cochées).

---

## Ordre de rédaction des specs recommandé

Travailler à rebours depuis la feature la plus risquée. Pour chaque feature : rédiger BACK en premier, valider, puis rédiger FRONT.

| Ordre | Spec | Pourquoi | Statut BACK | Statut FRONT |
|---|---|---|---|---|
| — | **F-02** (i18n Foundation) | Bloque tout le frontend Sprint 2+ | `stable` | — |
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
- [ ] **POC React Flow concluant** (tâche 0.8) — gate avant FS-09-FRONT
- [ ] **Requête `WITH RECURSIVE` testée en base** (tâche 0.9) — gate avant FS-07-BACK

### Prérequis session OpenCode Backend (FS-XX-BACK)

- [ ] `schema.prisma` contient le modèle de la feature avec ses relations
- [ ] Migration Prisma appliquée — table présente en base
- [ ] Seed contient les permissions `[domaine]:read` et `[domaine]:write`
- [ ] Jest + Supertest opérationnels
- [ ] Spec BACK au statut `stable`

### Prérequis session OpenCode Frontend (FS-XX-FRONT)

- [ ] Spec BACK au statut `done` — gates G-01 à G-08 cochées
- [ ] API testée manuellement (Postman/curl)
- [ ] Clés `[domaine].*` ajoutées dans `fr.json`
- [ ] Câblage `App.tsx` réalisé manuellement
- [ ] `cy.loginAsReadOnly()` disponible dans `cypress/support/commands.ts`
- [ ] Layout Contract §3 relu — un bloc YAML par page, aucun composant F-01 manquant
- [ ] Spec FRONT au statut `stable`

---

_Roadmap v0.7 — Projet ARK_