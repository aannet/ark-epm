# ARK — Roadmap des Feature-Specs P1

_Version 0.6 — Mars 2026_

> **Changelog v0.6 :** Correction statuts — tâches 0.8 (POC React Flow) et 0.9 (WITH RECURSIVE) remises à `à faire`. Repositionnées pendant Sprint 2. Checklist pré-lancement corrigée en conséquence.

> **Changelog v0.5 :** Ajout de F-02 (i18n Foundation) dans la section Fondation. Statuts F-00, F-01, FS-01 passés à `done`. Dépendance F-02 ajoutée sur toutes les Feature-Specs frontend Sprint 2+.

> **Changelog v0.4 :** Ajout de F-01 (Design System & UI Foundation) dans la section Fondation — intercalé entre F-00 et FS-01. Estimé Phase 0 mis à jour (2j → 3j). Dépendance F-01 ajoutée sur FS-01.

> **Changelog v0.3 :** Estimations mises à jour pour intégrer la génération et la validation des tests dans chaque sprint (Jest + Supertest + Cypress). Checklist pré-lancement enrichie. Référence au plan de sprint v0.4.

> **Changelog v0.2 :** Ajout de la référence au plan de sprint unifié. Terminologie mise à jour (OpenCode au lieu de Claude Code).

---

## Règle de statut

| Statut | Signification |
|---|---|
| `draft` | Spec en cours de rédaction |
| `review` | Spec complète, en attente de validation |
| `stable` | Spec validée — prête pour OpenCode |
| `in-progress` | Implémentation en cours |
| `done` | Implémentée, testée, mergée |

---

## Roadmap P1 — Découpage vertical par feature

### Fondation (Phase 0 — manuel, pas de spec OpenCode)

| ID | Feature | Dépend de | Statut | Estimé |
|---|---|---|---|---|
| F-00 | Scaffolding projet — NestJS + Prisma + Docker + JWT + PrismaService + middleware `ark.current_user_id` | — | ✅ `done` | 2j |
| F-01 | **Design System & UI Foundation** — Theme MUI, Layout Shell (Sidebar/TopBar), composants partagés, `NotFoundPage` (404), `ErrorBoundary` | F-00 | ✅ `done` | 1j |
| F-02 | **i18n Foundation** — react-i18next, langue unique FR, externalisation strings F-01 + FS-01 | FS-01 | `stable` | 0.5j |

> F-00, F-01 et F-02 sont réalisés manuellement. Pas de génération OpenCode — ce sont les socles sur lesquels toutes les specs s'appuient. **F-02 doit être terminé avant toute génération OpenCode frontend à partir de Sprint 2.**

> **Composants disponibles après F-01 :** `AppShell`, `Sidebar`, `TopBar`, `PageContainer`, `StatusChip`, `ConfirmDialog`, `EmptyState`, `PageHeader`, `LoadingSkeleton`, `NotFoundPage`, `ErrorBoundary`.

> **Convention disponible après F-02 :** toutes les strings visibles passent par `t('key')`. Fichier source : `src/i18n/locales/fr.json`. Bloc contexte OpenCode disponible en section 12 de la spec F-02.

---

### Sprint 1 — Auth & RBAC end-to-end

| ID | Feature | Dépend de | Statut | Estimé |
|---|---|---|---|---|
| FS-01 | **Auth & RBAC** — Login email/password, JWT, gestion des rôles et permissions, guards NestJS, écran login React, pages `UnauthorizedPage` (401) et `ForbiddenPage` (403) | F-00, F-01 | ✅ `done` | 3j |

**Périmètre FS-01 :**
- Backend : `POST /auth/login`, `POST /auth/logout`, `GET /auth/me`
- Backend : CRUD `/roles`, `/permissions`, `/users` (protégés)
- Frontend : écran Login + gestion du token JWT en mémoire + `UnauthorizedPage` (401) + `ForbiddenPage` (403)
- Frontend : `PrivateRoute` étendu (vérification token + permission), intercepteur Axios 401/403
- Hors périmètre : SSO SAML2 (P2), droits par domaine (P2)

> ⚠️ Les strings FS-01 ont été implémentées **avant** F-02. Le rétrofittage i18n des composants FS-01 fait partie du périmètre de F-02 (voir §6 de la spec F-02).

---

### Sprint 2 — Entités racines end-to-end

> **Prérequis bloquant : F-02 terminé** — toute génération OpenCode frontend sans i18n en place produirait des strings en dur impossibles à résorber proprement.

| ID | Feature | Dépend de | Statut | Estimé |
|---|---|---|---|---|
| FS-02 | **Domains** — CRUD complet backend + écran liste/détail React | FS-01, F-02 | `draft` | 1.5j |
| FS-03 | **Providers** — CRUD complet backend + écran liste/détail React | FS-01, F-02 | `draft` | 1j |
| FS-04 | **IT Components** — CRUD + liaison `app_it_component_map` + écran | FS-01, F-02 | `draft` | 1.5j |
| FS-05 | **Data Objects** — CRUD + liaison `app_data_object_map` (avec rôle) + écran | FS-01, F-02 | `draft` | 1.5j |

> FS-02 et FS-03 sont les features les plus simples — elles servent de **modules de référence** pour OpenCode sur tous les suivants. Les produire en premier et les valider soigneusement.

---

### Sprint 3 — Applications & Capacités end-to-end

| ID | Feature | Dépend de | Statut | Estimé |
|---|---|---|---|---|
| FS-06 | **Applications** — CRUD complet + liaisons `domains`/`providers`/`users` + écran inventaire + fiche détail | FS-02, FS-03, F-02 | `draft` | 3j |
| FS-07 | **Business Capabilities** — CRUD + récursion `WITH RECURSIVE` + écran arbre hiérarchique | FS-02, F-02 | `draft` | 3j |

> FS-07 contient le cas le plus complexe du projet : la requête `WITH RECURSIVE` doit être écrite et testée manuellement en SQL avant d'être intégrée dans la spec. **Tâche 0.9 à réaliser pendant Sprint 2** — prévoir 0.5j de R&D SQL pur avant de rédiger la spec.

---

### Sprint 4 — Graphe de dépendances end-to-end

| ID | Feature | Dépend de | Statut | Estimé |
|---|---|---|---|---|
| FS-08 | **Interfaces** — CRUD unidirectionnel Source→Cible + règles métier + écran liste | FS-06, F-02 | `draft` | 2j |
| FS-09 | **Dependency Graph POC** — endpoint `/graph` dédié + composant React Flow + filtres (domaine, criticité, type) | FS-08, FS-06, F-02 | `draft` | 3j |

> FS-09 est la feature la plus risquée visuellement. Le POC React Flow (**tâche 0.8 à réaliser pendant Sprint 2**) doit précéder la rédaction de la spec — ne pas rédiger FS-09 avant que le POC soit concluant.

---

### Sprint 5 — Import & Finalisation MVP

| ID | Feature | Dépend de | Statut | Estimé |
|---|---|---|---|---|
| FS-10 | **Import Excel** — upload frontend + validation backend + insertion en base pour les 6 entités P1 | FS-06, FS-07, FS-08, F-02 | `draft` | 3j |
| FS-11 | **Navigation & UX transverse** — menu, breadcrumb, gestion des erreurs globale, écran 404, loading states | FS-06, F-02 | `draft` | 2j |

---

## Vue synthétique — dépendances

```
F-00 (Fondation technique) ✅
  └── F-01 (Design System & UI Foundation) ✅
        └── FS-01 (Auth & RBAC) ✅
              └── F-02 (i18n Foundation) ← nouveau, bloque tout le frontend Sprint 2+
                    ├── FS-02 (Domains)
                    │     └── FS-06 (Applications)
                    │           ├── FS-08 (Interfaces)
                    │           │     └── FS-09 (Dependency Graph)
                    │           └── FS-10 (Import Excel)
                    ├── FS-03 (Providers)
                    │     └── FS-06 (Applications)
                    ├── FS-04 (IT Components)
                    ├── FS-05 (Data Objects)
                    └── FS-07 (Business Capabilities)
                          └── FS-10 (Import Excel)
```

---

## Ordre de rédaction des specs recommandé

Travailler à rebours depuis la feature la plus risquée :

| Ordre | Spec | Pourquoi | Statut |
|---|---|---|---|
| — | **F-02** (i18n Foundation) | Bloque tout le frontend Sprint 2+ — à terminer en priorité absolue | `stable` |
| 1 | **FS-09** (Dependency Graph) | La plus risquée visuellement — valider le POC React Flow d'abord | `draft` |
| 2 | **FS-07** (Business Capabilities) | La plus complexe techniquement — valider `WITH RECURSIVE` en SQL avant | `draft` |
| 3 | **FS-02** (Domains) | Module de référence pour OpenCode — doit être exemplaire | `draft` |
| 4 | **FS-06** (Applications) | Feature centrale du MVP — la plus riche en règles métier | `draft` |
| 5–10 | Reste des specs | Dans l'ordre du tableau roadmap | `draft` |

---

## Checklist avant de lancer la première session OpenCode Sprint 2

- [x] F-00 terminé — `docker-compose up` OK, PrismaModule global, middleware audit actif
- [x] F-01 terminé — theme MUI actif, AppShell fonctionnel, composants partagés disponibles
- [x] FS-01 terminé — `JwtAuthGuard` global, `@RequirePermission()` disponible, seed Admin OK
- [ ] **F-02 terminé** — `react-i18next` installé, `fr.json` complet, tous les composants F-01 + FS-01 rétrofittés ← **gate bloquant immédiat**
- [ ] FS-02 au statut `stable` (servira de module de référence)
- [ ] **POC React Flow concluant** (tâche 0.8) — à réaliser pendant Sprint 2, gate avant FS-09
- [ ] **Requête `WITH RECURSIVE` testée en base** (tâche 0.9) — à réaliser pendant Sprint 2, gate avant FS-07