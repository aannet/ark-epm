# ARK — Plan Sprint MVP

_Version 0.2 — Février 2026_

> **Changelog v0.2 :** Passage d'un découpage horizontal (backend puis frontend) à un découpage **vertical par feature end-to-end**. Intégration du format Feature-Spec comme gate obligatoire avant toute génération Claude Code. Alignement avec la Roadmap Feature-Specs P1.

---

## Conventions

| Icône | Signification |
|---|---|
| 🧑‍💻 Manuel | À faire soi-même — décision d'architecture ou code transverse |
| 🤖 Claude Code | Génération agentique — injecter la Feature-Spec complète |
| 📄 Spec | Rédaction de Feature-Spec — livrable avant le code |
| ✅ Fait | Livrable déjà stable |

---

## Principe du découpage vertical

Chaque sprint livre des **features complètes** — backend + frontend + tests ensemble. Avantages pour un développeur solo avec agent :

- Valeur visible à chaque fin de sprint (pas de backend orphelin pendant 4 semaines)
- Claude Code génère mieux quand le contrat est end-to-end (il voit les deux bouts)
- Les bugs d'intégration backend/frontend sont détectés immédiatement

---

## Phase 0 — Fondations (avant Sprint 1, ~2 jours)

> Réalisé **manuellement**. Pas de Claude Code. C'est le socle sur lequel toutes les Feature-Specs s'appuient — une erreur ici se propage partout.

| # | Tâche | Mode | Notes |
|---|---|---|---|
| 0.1 | ✅ `schema.sql` v0.4 — triggers d'audit inclus | ✅ Fait | Stable. |
| 0.2 | ✅ Brief v0.5 + Setup v0.4 + Roadmap Specs | ✅ Fait | Périmètre P1 validé. |
| 0.3 | Scaffolding NestJS strict + structure dossiers par domaine | 🧑‍💻 Manuel | `npx @nestjs/cli new backend --strict` |
| 0.4 | `PrismaService` partagé + `npx prisma init` + `schema.prisma` P1 complet | 🧑‍💻 Manuel | Source de vérité TypeScript — ne pas fragmenter |
| 0.5 | Middleware global `$executeRaw ark.current_user_id` | 🧑‍💻 Manuel | Doit être en place avant tout module CRUD |
| 0.6 | `docker-compose.yml` fonctionnel — 3 services opérationnels | 🧑‍💻 Manuel | Valider avec `docker-compose up -d` + connexion Prisma OK |
| 0.7 | Scaffolding React + Vite + dépendances P1 (React Flow, MUI, axios) | 🧑‍💻 Manuel | Une seule fois, proprement |
| 0.8 | POC React Flow — graphe sur données fictives hardcodées | 🧑‍💻 Manuel | **Go/no-go sur la librairie avant de rédiger FS-09** |
| 0.9 | Requête `WITH RECURSIVE` testée directement en PostgreSQL | 🧑‍💻 Manuel | **Valider en SQL pur avant de rédiger FS-07** |

**Gate de sortie Phase 0 :** `docker-compose up` fonctionne, Prisma se connecte, POC React Flow concluant, `WITH RECURSIVE` validée.

---

## Sprint 1 — Auth & RBAC end-to-end (S1–S2, ~5 jours)

> Objectif : l'authentification et les droits sont opérationnels de bout en bout. Tout le reste du MVP s'appuie dessus.

| # | Tâche | Mode | Notes |
|---|---|---|---|
| 1.1 | Rédiger et valider **FS-01** (Auth & RBAC) | 📄 Spec | Gate obligatoire avant 1.2 |
| 1.2 | Backend Auth — `POST /auth/login`, `POST /auth/logout`, `GET /auth/me`, hash Bcrypt, JWT | 🧑‍💻 Manuel | Sécurité — ne pas déléguer à Claude Code |
| 1.3 | Backend RBAC — CRUD `/roles`, `/permissions`, `/users` + guards `JwtAuthGuard` | 🤖 Claude Code | Injecter FS-01 complète |
| 1.4 | Frontend — écran Login + gestion token JWT | 🤖 Claude Code | Injecter FS-01 + contrat `/auth/*` |
| 1.5 | Tests RBAC manuels — vérifier que chaque guard bloque correctement | 🧑‍💻 Manuel | Ne jamais déléguer les tests de sécurité |

**Gate de sortie Sprint 1 :** Login fonctionnel, token JWT valide, routes protégées bloquent les accès non autorisés.

---

## Sprint 2 — Entités racines end-to-end (S3–S4, ~5 jours)

> Objectif : Domains, Providers, IT Components et Data Objects livrés end-to-end. FS-02 devient le **module de référence** pour tous les suivants.

| # | Tâche | Mode | Notes |
|---|---|---|---|
| 2.1 | Rédiger et valider **FS-02** (Domains) | 📄 Spec | Sera le module de référence — soigner la spec |
| 2.2 | Feature Domains — CRUD backend + écran liste/détail React | 🤖 Claude Code | Injecter FS-02. Valider soigneusement avant de continuer. |
| 2.3 | Rédiger et valider **FS-03** (Providers) | 📄 Spec | Utiliser FS-02 comme référence de pattern dans la spec |
| 2.4 | Feature Providers — CRUD backend + écran liste/détail React | 🤖 Claude Code | Injecter FS-03 + module Domains comme référence |
| 2.5 | Rédiger et valider **FS-04** (IT Components) + **FS-05** (Data Objects) | 📄 Spec | Inclure les tables de liaison n:n dans les specs |
| 2.6 | Feature IT Components — CRUD + liaison `app_it_component_map` + écran | 🤖 Claude Code | Injecter FS-04 |
| 2.7 | Feature Data Objects — CRUD + liaison `app_data_object_map` (rôle) + écran | 🤖 Claude Code | Injecter FS-05 |

**Gate de sortie Sprint 2 :** 4 entités racines livrées end-to-end. Module Domains validé comme référence Claude Code.

---

## Sprint 3 — Applications & Business Capabilities end-to-end (S5–S6, ~6 jours)

> Objectif : les deux entités centrales du MVP sont livrées. C'est le sprint le plus dense techniquement.

| # | Tâche | Mode | Notes |
|---|---|---|---|
| 3.1 | Rédiger et valider **FS-06** (Applications) | 📄 Spec | Feature la plus riche en règles métier — prendre le temps |
| 3.2 | Feature Applications — CRUD + liaisons multi-entités + écran inventaire + fiche détail | 🤖 Claude Code | Injecter FS-06. C'est la feature centrale — bien valider. |
| 3.3 | Rédiger et valider **FS-07** (Business Capabilities) | 📄 Spec | Intégrer la requête `WITH RECURSIVE` validée en Phase 0 |
| 3.4 | Feature Business Capabilities — CRUD backend + récursion | 🤖 Claude Code | Injecter FS-07 + requête SQL validée |
| 3.5 | Intégration manuelle `$queryRaw` pour la récursion | 🧑‍💻 Manuel | Vérifier que la requête générée est identique à celle validée en Phase 0 |
| 3.6 | Frontend Business Capabilities — écran arbre hiérarchique | 🤖 Claude Code | Injecter FS-07 + structure de données de l'arbre |

**Gate de sortie Sprint 3 :** Applications et Business Capabilities fonctionnelles. Récursion validée sur données réelles.

---

## Sprint 4 — Graphe de dépendances end-to-end (S7–S8, ~5 jours)

> Objectif : la feature différenciante du MVP est livrée. C'est la valeur principale d'ARK.

| # | Tâche | Mode | Notes |
|---|---|---|---|
| 4.1 | Rédiger et valider **FS-08** (Interfaces) | 📄 Spec | Documenter soigneusement les règles unidirectionnelles et l'absence de contrainte UNIQUE |
| 4.2 | Feature Interfaces — CRUD backend + écran liste | 🤖 Claude Code | Injecter FS-08 |
| 4.3 | Atelier filtres graphe — valider les dimensions de filtrage | 🧑‍💻 Manuel | Livrable : liste des filtres + structure des props React Flow |
| 4.4 | Rédiger et valider **FS-09** (Dependency Graph) | 📄 Spec | Intégrer structure props React Flow validée en atelier |
| 4.5 | Endpoint backend `/graph` — agrégation nœuds + arêtes | 🤖 Claude Code | Injecter FS-09 section backend |
| 4.6 | Composant React Flow — graphe + filtres | 🤖 Claude Code | Injecter FS-09 section frontend + structure props |
| 4.7 | Validation visuelle sur données réelles | 🧑‍💻 Manuel | Tester les cas limites : graphe dense, nœuds isolés, cycles |

**Gate de sortie Sprint 4 :** Graphe de dépendances fonctionnel avec filtres. Validé sur données réelles.

---

## Sprint 5 — Import Excel & Finalisation MVP (S9–S10, ~5 jours)

> Objectif : l'import des inventaires existants est opérationnel. Le MVP est livrable.

| # | Tâche | Mode | Notes |
|---|---|---|---|
| 5.1 | Spécification format Excel — mapping colonnes → modèle ARK | 🧑‍💻 Manuel | Livrable : document de mapping + règles de validation. Gate obligatoire avant 5.2. |
| 5.2 | Rédiger et valider **FS-10** (Import Excel) | 📄 Spec | Intégrer le document de mapping dans la spec |
| 5.3 | Feature Import Excel — upload + validation + insertion 6 entités | 🤖 Claude Code | Injecter FS-10 + document de mapping |
| 5.4 | Rédiger et valider **FS-11** (Navigation & UX transverse) | 📄 Spec | Menu, breadcrumb, erreurs globales, loading states |
| 5.5 | Feature Navigation & UX — composants transverses | 🤖 Claude Code | Injecter FS-11 |
| 5.6 | Tests d'intégration end-to-end sur le flux complet | 🧑‍💻 Manuel | Import Excel → inventaire → graphe |
| 5.7 | `docker-compose up` sur machine vierge — validation déploiement | 🧑‍💻 Manuel | Simuler le déploiement chez un client |

**Gate de sortie Sprint 5 :** MVP complet, déployable en `docker-compose up`, importable depuis Excel.

---

## Ce qu'il ne faut jamais déléguer à Claude Code

| Sujet | Raison |
|---|---|
| **Logic Bcrypt + endpoints `/auth/*`** | Sécurité — une erreur silencieuse est indétectable à la relecture |
| **Tests RBAC** | Claude Code génère des guards syntaxiquement corrects, pas nécessairement sémantiquement |
| **Migrations Prisma** (`prisma migrate dev`) | Toujours relire le fichier de migration avant d'appliquer — une migration destructive ne se rattrape pas |
| **Requêtes `$queryRaw` et `$executeRaw`** | Prisma ne les valide pas à la compilation — relire ligne par ligne |
| **POC React Flow** | Décision go/no-go sur une librairie — doit être validée par un humain sur données réelles |
| **Validation visuelle du graphe** | Les cas limites (graphe dense, cycles) ne sont pas testables automatiquement |

---

## Règles d'utilisation de Claude Code

1. **Une Feature-Spec = une session Claude Code.** Ne pas mélanger plusieurs features dans un même contexte.
2. **Toujours commencer par la commande de la section 9 du template** — elle charge le contexte projet avant la spec.
3. **Mode Plan avant Mode Build** sur les features complexes (FS-07, FS-09, FS-10) — valider l'approche proposée avant l'exécution.
4. **Relire systématiquement** les guards, DTOs, relations Prisma et requêtes raw générés avant d'intégrer.
5. **Fournir le module de référence** (FS-02 Domains) comme exemple de pattern dans chaque prompt Claude Code.

---

_Document de travail v0.2 — À affiner après atelier de cadrage_