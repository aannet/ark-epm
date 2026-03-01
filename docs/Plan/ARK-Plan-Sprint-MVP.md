# ARK — Plan Sprint MVP

_Version 0.5 — Février 2026_

> **Changelog v0.5 :** Ajout de la tâche 0.10 (F-01 Design System) en Phase 0. Estimé Phase 0 mis à jour (2j → 3j). Gate de sortie Phase 0 complété. Tâche 1.4 (frontend Sprint 1) précisée : dépend de F-01. Vue synthétique mise à jour.

> **Changelog v0.4 :** Intégration de la stratégie de test dans les sprints. Ajout des tâches Jest/Supertest et Cypress dans chaque sprint. Phase 0 enrichie (tâches 0.10 et 0.11 — configuration stack de test). Règles OpenCode mises à jour. Section "Ce qu'il ne faut jamais déléguer" complétée pour les tests. Gates de sortie enrichis avec critères de couverture.

> **Changelog v0.3 :** Unification des versions v0.1 et v0.2. Réorganisation en 5 sprints + Phase 0 (9 tâches). Terminologie unifiée sur "OpenCode". Ajout des gates de validation entre phases.

---

## Conventions

| Icône | Signification |
|---|---|
| 🟡 Manuel | À faire soi-même — décision d'architecture, code sensible ou validation humaine |
| 🤖 OpenCode | Génération assistée — injecter la Feature-Spec complète |
| ✅ Fait | Livrable déjà stable |
| 🚧 Gate | Point de validation obligatoire avant de continuer |

---

## Principe du découpage vertical

Chaque sprint livre des **features complètes** — backend + frontend + tests ensemble. Avantages pour un développeur solo avec agent :

- Valeur visible à chaque fin de sprint
- OpenCode génère mieux quand le contrat est end-to-end
- Les bugs d'intégration sont détectés immédiatement

---

## Phase 0 — Fondations (avant Sprint 1, ~3 jours)

> Réalisé **manuellement**. C'est le socle sur lequel toutes les Feature-Specs s'appuient — une erreur ici se propage partout.

| # | Tâche | Mode | Notes |
|---|---|---|---|
| 0.1 | ✅ `schema.sql` v0.4 — triggers d'audit inclus | ✅ Fait | Stable. Référence SQL pour les triggers. |
| 0.2 | ✅ Brief v0.5 + Setup v0.4 + Roadmap Specs | ✅ Fait | Périmètre P1 validé. |
| 0.3 | Scaffolding NestJS strict + structure dossiers par domaine | 🟡 Manuel | `npx @nestjs/cli new backend --strict` |
| 0.4 | `PrismaService` partagé + `npx prisma init` + `schema.prisma` P1 complet | 🟡 Manuel | Source de vérité TypeScript — ne pas fragmenter |
| 0.5 | Configuration JWT + Passport (stratégies `local` et `jwt`) | 🟡 Manuel | Guards NestJS transverses — base de tout le RBAC |
| 0.6 | Middleware global `$executeRaw ark.current_user_id` | 🟡 Manuel | Doit être en place avant tout module CRUD |
| 0.7 | `docker-compose.yml` fonctionnel — 3 services opérationnels | 🟡 Manuel | Valider avec `docker-compose up -d` + connexion Prisma OK |
| 0.8 | POC React Flow — graphe sur données fictives hardcodées | 🟡 Manuel | **Go/no-go sur la librairie avant de rédiger FS-09** |
| 0.9 | Requête `WITH RECURSIVE` testée directement en PostgreSQL | 🟡 Manuel | **Valider en SQL pur avant de rédiger FS-07** |
| 0.10 | **F-01 Design System** — `src/theme/index.ts`, `AppShell`, `Sidebar`, composants partagés, `NotFoundPage`, `ErrorBoundary` | 🟡 Manuel | **Doit être terminé avant toute tâche frontend (1.4+)**. Spec : `F-01-design-system.md` |

**Gate de sortie Phase 0 :** `docker-compose up` fonctionne, Prisma se connecte, POC React Flow concluant, `WITH RECURSIVE` validée, **theme MUI actif, AppShell fonctionnel, composants partagés disponibles (G-01 à G-13 de F-01 verts)**.

---

## Sprint 1 — Auth & RBAC end-to-end (S1–S2, ~5 jours)

> Objectif : l'authentification et les droits sont opérationnels de bout en bout. Tout le reste du MVP s'appuie dessus.
> **Prérequis :** F-01 terminé (gate Phase 0) — `AppShell`, `PrivateRoute`, composants partagés disponibles.

| # | Tâche | Mode | Notes |
|---|---|---|---|
| 1.1 | Rédiger et valider **FS-01** (Auth & RBAC) | 📄 Spec | Gate obligatoire avant 1.2 |
| 1.2 | Backend Auth — `POST /auth/login`, `POST /auth/logout`, `GET /auth/me`, hash Bcrypt, JWT | 🟡 Manuel | Sécurité — ne pas déléguer à OpenCode |
| 1.3 | Backend RBAC — CRUD `/roles`, `/permissions`, `/users` + guards `JwtAuthGuard` | 🤖 OpenCode | Injecter FS-01 complète |
| 1.4 | Frontend — `LoginPage`, `UnauthorizedPage` (401), `ForbiddenPage` (403), `PrivateRoute`, intercepteur Axios | 🤖 OpenCode | **Requiert F-01 terminé.** Injecter FS-01 + bloc OpenCode F-01 (section 11) |
| 1.5 | Déclaration routes `/login`, `/401`, `/403` dans `App.tsx` + `PrivateRoute` sur toutes les routes authentifiées | 🟡 Manuel | Vérifier l'ordre des routes — `*` toujours en dernier |
| 1.6 | Tests RBAC manuels — vérifier que chaque guard bloque correctement | 🟡 Manuel | Ne jamais déléguer les tests de sécurité |

**Gate de sortie Sprint 1 :** Login fonctionnel, token JWT valide, routes protégées bloquent les accès non autorisés, `/401` et `/403` affichés correctement.

---

## Sprint 2 — Entités racines end-to-end (S3–S4, ~5 jours)

> Objectif : Domains, Providers, IT Components et Data Objects livrés end-to-end. FS-02 devient le **module de référence** pour tous les suivants.

| # | Tâche | Mode | Notes |
|---|---|---|---|
| 2.1 | Rédiger et valider **FS-02** (Domains) | 📄 Spec | Sera le module de référence — soinner la spec |
| 2.2 | Feature Domains — CRUD backend + écran liste/détail React | 🤖 OpenCode | Injecter FS-02. Valider soigneusement avant de continuer. |
| 2.3 | Rédiger et valider **FS-03** (Providers) | 📄 Spec | Utiliser FS-02 comme référence de pattern |
| 2.4 | Feature Providers — CRUD backend + écran liste/détail React | 🤖 OpenCode | Injecter FS-03 + module Domains comme référence |
| 2.5 | Rédiger et valider **FS-04** (IT Components) + **FS-05** (Data Objects) | 📄 Spec | Inclure les tables de liaison n:n dans les specs |
| 2.6 | Feature IT Components — CRUD + liaison `app_it_component_map` + écran | 🤖 OpenCode | Injecter FS-04 |
| 2.7 | Feature Data Objects — CRUD + liaison `app_data_object_map` (rôle) + écran | 🤖 OpenCode | Injecter FS-05 |

**Gate de sortie Sprint 2 :** 4 entités racines livrées end-to-end. Module Domains validé comme référence OpenCode.

---

## Sprint 3 — Applications & Business Capabilities end-to-end (S5–S6, ~6 jours)

> Objectif : les deux entités centrales du MVP sont livrées. C'est le sprint le plus dense techniquement.

| # | Tâche | Mode | Notes |
|---|---|---|---|
| 3.1 | Rédiger et valider **FS-06** (Applications) | 📄 Spec | Feature la plus riche en règles métier |
| 3.2 | Feature Applications — CRUD + liaisons multi-entités + écran inventaire + fiche détail | 🤖 OpenCode | Injecter FS-06. C'est la feature centrale. |
| 3.3 | Rédiger et valider **FS-07** (Business Capabilities) | 📄 Spec | Intégrer la requête `WITH RECURSIVE` validée en Phase 0 |
| 3.4 | Feature Business Capabilities — CRUD backend + récursion | 🤖 OpenCode | Injecter FS-07 + requête SQL validée |
| 3.5 | Intégration manuelle `$queryRaw` pour la récursion | 🟡 Manuel | Vérifier que la requête générée est identique à celle validée en Phase 0 |
| 3.6 | Frontend Business Capabilities — écran arbre hiérarchique | 🤖 OpenCode | Injecter FS-07 + structure de données de l'arbre |

**Gate de sortie Sprint 3 :** Applications et Business Capabilities fonctionnelles. Récursion validée sur données réelles.

---

## Sprint 4 — Graphe de dépendances end-to-end (S7–S8, ~5 jours)

> Objectif : la feature différenciante du MVP est livrée. C'est la valeur principale d'ARK.

| # | Tâche | Mode | Notes |
|---|---|---|---|
| 4.1 | Rédiger et valider **FS-08** (Interfaces) | 📄 Spec | Documenter les règles unidirectionnelles |
| 4.2 | Feature Interfaces — CRUD backend + écran liste | 🤖 OpenCode | Injecter FS-08 |
| 4.3 | Atelier filtres graphe — valider les dimensions de filtrage | 🟡 Manuel | Livrable : liste des filtres + structure des props React Flow |
| 4.4 | Rédiger et valider **FS-09** (Dependency Graph) | 📄 Spec | Intégrer structure props React Flow validée en atelier |
| 4.5 | Endpoint backend `/graph` — agrégation nœuds + arêtes | 🤖 OpenCode | Injecter FS-09 section backend |
| 4.6 | Composant React Flow — graphe + filtres | 🤖 OpenCode | Injecter FS-09 section frontend + structure props |
| 4.7 | Validation visuelle sur données réelles | 🟡 Manuel | Tester les cas limites : graphe dense, nœuds isolés, cycles |

**Gate de sortie Sprint 4 :** Graphe de dépendances fonctionnel avec filtres. Validé sur données réelles.

---

## Sprint 5 — Import Excel & Finalisation MVP (S9–S10, ~5 jours)

> Objectif : l'import des inventaires existants est opérationnel. Le MVP est livrable.

| # | Tâche | Mode | Notes |
|---|---|---|---|
| 5.1 | Spécification format Excel — mapping colonnes → modèle ARK | 🟡 Manuel | Livrable : document de mapping + règles de validation. Gate obligatoire avant 5.2. |
| 5.2 | Rédiger et valider **FS-10** (Import Excel) | 📄 Spec | Intégrer le document de mapping dans la spec |
| 5.3 | Feature Import Excel — upload + validation + insertion 6 entités | 🤖 OpenCode | Injecter FS-10 + document de mapping |
| 5.4 | Rédiger et valider **FS-11** (Navigation & UX transverse) | 📄 Spec | Menu, breadcrumb, erreurs globales, loading states |
| 5.5 | Feature Navigation & UX — composants transverses | 🤖 OpenCode | Injecter FS-11 |
| 5.6 | Tests d'intégration end-to-end sur le flux complet | 🟡 Manuel | Import Excel → inventaire → graphe |
| 5.7 | `docker-compose up` sur machine vierge — validation déploiement | 🟡 Manuel | Simuler le déploiement chez un client |

**Gate de sortie Sprint 5 :** MVP complet, déployable en `docker-compose up`, importable depuis Excel.

---

## Ce qu'il ne faut jamais déléguer à OpenCode

| Sujet | Raison |
|---|---|
| **Logon Bcrypt + endpoints `/auth/*`** | Sécurité — une erreur silencieuse est indétectable à la relecture |
| **Tests RBAC** | OpenCode génère des guards syntaxiquement corrects, pas nécessairement sémantiquement |
| **Migrations Prisma** (`prisma migrate dev`) | Toujours relire le fichier de migration avant d'appliquer — une migration destructive ne se rattrape pas |
| **Requêtes `$queryRaw` et `$executeRaw`** | Prisma ne les valide pas à la compilation — relire ligne par ligne |
| **POC React Flow** | Décision go/no-go sur une librairie — doit être validée par un humain sur données réelles |
| **Validation visuelle du graphe** | Les cas limites (graphe dense, cycles) ne sont pas testables automatiquement |

---

## Règles d'utilisation d'OpenCode

1. **Une Feature-Spec = une session OpenCode.** Ne pas mélanger plusieurs features dans un même contexte.
2. **Toujours commencer par la commande de la section 9 du template** — elle charge le contexte projet avant la spec.
3. **Mode Plan avant Mode Build** sur les features complexes (FS-07, FS-09, FS-10) — valider l'approche proposée avant l'exécution.
4. **Relire systématiquement** les guards, DTOs, relations Prisma et requêtes raw générés avant d'intégrer.
5. **Fournir le module de référence** (FS-02 Domains) comme exemple de pattern dans chaque prompt OpenCode.

---

## Vue synthétique — dépendances des sprints

```
Phase 0 (Fondations)
  ├── F-00 (Scaffolding technique)
  └── F-01 (Design System & UI Foundation)
        └── Sprint 1 (FS-01: Auth & RBAC)
              ├── Sprint 2 (FS-02 to FS-05: Domains, Providers, IT-Components, Data-Objects)
              ├── Sprint 3 (FS-06: Applications, FS-07: Business-Capabilities)
              │     └── Sprint 4 (FS-08: Interfaces, FS-09: Dependency Graph)
              └── Sprint 5 (FS-10: Import Excel, FS-11: Navigation)
```

---

## Voir aussi

- **Roadmap:** `ARK-Roadmap-P1.md`
- **Template Feature-Spec:** `../PRD-FS/ARK - Template FeatureSpec.md`
- **Brief Application:** `../ARK - Brief Application.md`
- **Setup Technique:** `../ARK - Setup technique.md`
- **F-01 Design System:** `F-01-design-system.md`

