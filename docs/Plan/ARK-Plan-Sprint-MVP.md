# ARK — Plan Sprint MVP

_Version 0.7 — Mars 2026_

> **Changelog v0.7 :** Correction statuts — tâches 0.8 (POC React Flow) et 0.9 (WITH RECURSIVE) remises à `à faire` — non réalisées. Repositionnées pendant Sprint 2 comme gates avant Sprint 3/4. Gate de sortie Phase 0 corrigé en conséquence.

> **Changelog v0.6 :** Statuts mis à jour — Phase 0 entièrement `done`, Sprint 1 `done`. Ajout de la tâche 0.11 (F-02 i18n Foundation) en Phase 0 — gate bloquant avant Sprint 2. Prérequis Sprint 2 mis à jour. Bloc contexte OpenCode enrichi avec convention i18n. Vue synthétique mise à jour.

> **Changelog v0.5 :** Ajout de la tâche 0.10 (F-01 Design System) en Phase 0. Estimé Phase 0 mis à jour (2j → 3j). Gate de sortie Phase 0 complété. Tâche 1.4 (frontend Sprint 1) précisée : dépend de F-01.

> **Changelog v0.4 :** Intégration de la stratégie de test dans les sprints. Ajout des tâches Jest/Supertest et Cypress. Section "Ce qu'il ne faut jamais déléguer" complétée pour les tests.

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

## Phase 0 — Fondations (⚠️ partiellement terminée)

> Réalisé **manuellement**. Socle sur lequel toutes les Feature-Specs s'appuient.

| # | Tâche | Mode | Statut | Notes |
|---|---|---|---|---|
| 0.1 | `schema.sql` v0.4 — triggers d'audit inclus | ✅ Fait | ✅ `done` | Stable. Référence SQL pour les triggers. |
| 0.2 | Brief v0.5 + Setup v0.4 + Roadmap Specs | ✅ Fait | ✅ `done` | Périmètre P1 validé. |
| 0.3 | Scaffolding NestJS strict + structure dossiers par domaine | ✅ Fait | ✅ `done` | |
| 0.4 | `PrismaService` partagé + `schema.prisma` P1 complet | ✅ Fait | ✅ `done` | Source de vérité TypeScript |
| 0.5 | Configuration JWT + Passport (stratégies `local` et `jwt`) | ✅ Fait | ✅ `done` | |
| 0.6 | Middleware global `$executeRaw ark.current_user_id` | ✅ Fait | ✅ `done` | |
| 0.7 | `docker-compose.yml` fonctionnel — 3 services opérationnels | ✅ Fait | ✅ `done` | |
| 0.8 | POC React Flow — graphe sur données fictives hardcodées | 🟡 Manuel | 🚧 **À faire** | **Gate avant FS-09** — à réaliser pendant Sprint 2 |
| 0.9 | Requête `WITH RECURSIVE` testée directement en PostgreSQL | 🟡 Manuel | 🚧 **À faire** | **Gate avant FS-07** — à réaliser pendant Sprint 2 |
| 0.10 | **F-01 Design System** — theme MUI, AppShell, Sidebar, composants partagés, `NotFoundPage`, `ErrorBoundary` | ✅ Fait | ✅ `done` | |
| 0.11 | **F-02 i18n Foundation** — `react-i18next`, `fr.json`, rétrofittage composants F-01 + FS-01 | 🟡 Manuel | 🚧 **À faire** | **Gate bloquant avant Sprint 2 frontend** — spec : `F-02-i18n-foundation.md` |

**Gate de sortie Phase 0 :**
- ✅ 0.1 à 0.7, 0.10 — terminés
- 🚧 0.8 (POC React Flow) — à réaliser pendant Sprint 2, gate avant Sprint 4
- 🚧 0.9 (WITH RECURSIVE) — à réaliser pendant Sprint 2, gate avant Sprint 3
- 🚧 0.11 (F-02 i18n) — **gate bloquant immédiat** avant tout frontend Sprint 2

---

## Sprint 1 — Auth & RBAC end-to-end (✅ terminé)

> Objectif atteint : authentification et droits opérationnels de bout en bout.

| # | Tâche | Mode | Statut |
|---|---|---|---|
| 1.1 | Spec **FS-01** (Auth & RBAC) rédigée et validée | 📄 Spec | ✅ `done` |
| 1.2 | Backend Auth — `POST /auth/login`, Bcrypt, JWT | 🟡 Manuel | ✅ `done` |
| 1.3 | Backend RBAC — CRUD `/roles`, `/permissions`, `/users` + guards | 🤖 OpenCode | ✅ `done` |
| 1.4 | Frontend — `LoginPage`, `UnauthorizedPage`, `ForbiddenPage`, `PrivateRoute`, intercepteur Axios | 🤖 OpenCode | ✅ `done` |
| 1.5 | Routes `/login`, `/401`, `/403` dans `App.tsx` + `PrivateRoute` | 🟡 Manuel | ✅ `done` |
| 1.6 | Tests RBAC manuels | 🟡 Manuel | ✅ `done` |

> ⚠️ Les composants frontend FS-01 contiennent des **strings en dur** — le rétrofittage i18n est inclus dans la tâche 0.11 (F-02).

**Gate de sortie Sprint 1 :** ✅ Login fonctionnel, JWT valide, routes protégées, `/401` et `/403` OK.

---

## Sprint 2 — Entités racines end-to-end (S3–S4, ~6 jours)

> Objectif : Domains, Providers, IT Components et Data Objects livrés end-to-end.
> **Prérequis bloquant : tâche 0.11 (F-02 i18n) terminée.** Sans elle, OpenCode génèrera des strings en dur dans tous les composants React de ce sprint.
> **Tâches manuelles 0.8 et 0.9 à intercaler** pendant les générations OpenCode — profiter des temps morts pour les réaliser.

| # | Tâche | Mode | Notes |
|---|---|---|---|
| 2.0 | Terminer **F-02 i18n** (tâche 0.11) | 🟡 Manuel | **Gate obligatoire — à faire avant 2.1** |
| 2.1 | Rédiger et valider **FS-02** (Domains) | 📄 Spec | Module de référence — soigner la spec |
| 2.2 | Feature Domains — CRUD backend + écran liste/détail React | 🤖 OpenCode | Injecter FS-02 + bloc contexte i18n (F-02 §12) |
| 2.3 | **POC React Flow** (tâche 0.8) — graphe sur données fictives hardcodées | 🟡 Manuel | **Gate avant FS-09** — go/no-go sur la librairie |
| 2.4 | **Requête `WITH RECURSIVE`** (tâche 0.9) — validée en PostgreSQL pur | 🟡 Manuel | **Gate avant FS-07** — exécuter le script de test F-00 §7 |
| 2.5 | Rédiger et valider **FS-03** (Providers) | 📄 Spec | Utiliser FS-02 comme référence de pattern |
| 2.6 | Feature Providers — CRUD backend + écran liste/détail React | 🤖 OpenCode | Injecter FS-03 + FS-02 comme référence |
| 2.7 | Rédiger et valider **FS-04** (IT Components) + **FS-05** (Data Objects) | 📄 Spec | Inclure les tables de liaison n:n |
| 2.8 | Feature IT Components — CRUD + liaison `app_it_component_map` + écran | 🤖 OpenCode | Injecter FS-04 |
| 2.9 | Feature Data Objects — CRUD + liaison `app_data_object_map` (rôle) + écran | 🤖 OpenCode | Injecter FS-05 |

**Gate de sortie Sprint 2 :** 4 entités racines livrées end-to-end. Module Domains validé comme référence OpenCode. POC React Flow go/no-go validé (0.8). Requête `WITH RECURSIVE` validée en base (0.9). Aucune string en dur dans les composants générés.

---

## Sprint 3 — Applications & Business Capabilities end-to-end (S5–S6, ~6 jours)

> Objectif : les deux entités centrales du MVP sont livrées.

| # | Tâche | Mode | Notes |
|---|---|---|---|
| 3.1 | Rédiger et valider **FS-06** (Applications) | 📄 Spec | Feature la plus riche en règles métier |
| 3.2 | Feature Applications — CRUD + liaisons multi-entités + écran inventaire + fiche détail | 🤖 OpenCode | Injecter FS-06 + bloc contexte i18n |
| 3.3 | Rédiger et valider **FS-07** (Business Capabilities) | 📄 Spec | Intégrer la requête `WITH RECURSIVE` validée en Sprint 2 (tâche 2.4) |
| 3.4 | Feature Business Capabilities — CRUD backend + récursion | 🤖 OpenCode | Injecter FS-07 + requête SQL validée |
| 3.5 | Intégration manuelle `$queryRaw` pour la récursion | 🟡 Manuel | Vérifier que la requête générée est identique à celle validée en Sprint 2 (tâche 2.4) |
| 3.6 | Frontend Business Capabilities — écran arbre hiérarchique | 🤖 OpenCode | Injecter FS-07 + structure de données de l'arbre |

**Gate de sortie Sprint 3 :** Applications et Business Capabilities fonctionnelles. Récursion validée sur données réelles.

---

## Sprint 4 — Graphe de dépendances end-to-end (S7–S8, ~5 jours)

> Objectif : la feature différenciante du MVP est livrée. C'est la valeur principale d'ARK.

| # | Tâche | Mode | Notes |
|---|---|---|---|
| 4.1 | Rédiger et valider **FS-08** (Interfaces) | 📄 Spec | Documenter les règles unidirectionnelles |
| 4.2 | Feature Interfaces — CRUD backend + écran liste | 🤖 OpenCode | Injecter FS-08 + bloc contexte i18n |
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
| 5.3 | Feature Import Excel — upload + validation + insertion 6 entités | 🤖 OpenCode | Injecter FS-10 + document de mapping + bloc contexte i18n |
| 5.4 | Rédiger et valider **FS-11** (Navigation & UX transverse) | 📄 Spec | Menu, breadcrumb, erreurs globales, loading states |
| 5.5 | Feature Navigation & UX — composants transverses | 🤖 OpenCode | Injecter FS-11 + bloc contexte i18n |
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
| **Configuration i18n et `fr.json`** | Socle structurant — une clé mal nommée se propage dans tout le codebase |

---

## Règles d'utilisation d'OpenCode

1. **Une Feature-Spec = une session OpenCode.** Ne pas mélanger plusieurs features dans un même contexte.
2. **Toujours commencer par la commande de la section 9 du template** — elle charge le contexte projet avant la spec.
3. **Mode Plan avant Mode Build** sur les features complexes (FS-07, FS-09, FS-10) — valider l'approche proposée avant l'exécution.
4. **Relire systématiquement** les guards, DTOs, relations Prisma et requêtes raw générés avant d'intégrer.
5. **Fournir le module de référence** (FS-02 Domains) comme exemple de pattern dans chaque prompt OpenCode.
6. **Injecter systématiquement le bloc contexte i18n** (F-02 §12) dans chaque session OpenCode frontend — sans lui, OpenCode génère des strings en dur.

---

## Bloc contexte OpenCode standard — à injecter dans chaque session

```
Contexte projet ARK (conventions dans AGENTS.md) :
- Stack : NestJS strict + Prisma + PostgreSQL 16 + React + TypeScript strict
- Toute écriture en base passe par : await prisma.$executeRaw`SET LOCAL ark.current_user_id = ${userId}`
- PrismaModule est global — ne pas le réimporter
- JwtAuthGuard est global — @Public() sur les routes publiques uniquement
- Module de référence backend : FS-02 (Domains)

Design System (F-01) :
- Theme MUI : src/theme/index.ts — ne jamais redéfinir les couleurs en dur
- Tailwind CSS interdit — MUI + sx prop uniquement
- Composants partagés : StatusChip, ConfirmDialog, EmptyState, PageHeader, LoadingSkeleton
  → import depuis '@/components/shared'
- Layout : AppShell, PageContainer → import depuis '@/components/layout'
- Routing : patron liste / new / :id/edit — pages indépendantes, jamais de modales CRUD

i18n (F-02) :
- react-i18next installé, langue unique FR
- Fichier source : src/i18n/locales/fr.json
- Convention obligatoire : toutes les strings visibles passent par t('key') — jamais de string en dur
- Structure des clés : domaine.page.element — ex: domains.list.title, common.actions.save
- Ajouter les nouvelles clés dans fr.json EN MÊME TEMPS que le composant
- Interpolation dynamique : t('key', { variable: valeur }) avec syntaxe {{variable}} dans fr.json
- Pas de composant <Trans> en P1

Stack de test :
- Unit + API : Jest + Supertest (@nestjs/testing)
- E2E browser : Cypress — cy.login() disponible dans cypress/support/commands.ts
- Tests marqués [Manuel] : NE PAS générer
```

---

## Vue synthétique — dépendances des sprints

```
Phase 0 (Fondations) ✅
  ├── F-00 (Scaffolding technique) ✅
  ├── F-01 (Design System & UI Foundation) ✅
  └── FS-01 (Auth & RBAC) ✅
        └── F-02 (i18n Foundation) 🚧 ← gate bloquant avant tout frontend Sprint 2+
              ├── Sprint 2 (FS-02 to FS-05: Domains, Providers, IT-Components, Data-Objects)
              ├── Sprint 3 (FS-06: Applications, FS-07: Business-Capabilities)
              │     └── Sprint 4 (FS-08: Interfaces, FS-09: Dependency Graph)
              └── Sprint 5 (FS-10: Import Excel, FS-11: Navigation)
```

---

## Voir aussi

- **Roadmap:** `ARK-Roadmap-P1-v0.5.md`
- **Brief Application:** `ARK - Brief Application.md`
- **Setup Technique:** `ARK - Setup technique.md`
- **F-02 i18n Foundation:** `F-02-i18n-foundation.md`