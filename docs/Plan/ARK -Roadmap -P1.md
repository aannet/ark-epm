# ARK — Roadmap des Feature-Specs P1

_Version 0.3 — Février 2026_

> **Changelog v0.3 :** Estimations mises à jour pour intégrer la génération et la validation des tests dans chaque sprint (Jest + Supertest + Cypress). Checklist pré-lancement enrichie. Référence au plan de sprint v0.4.
>
> **Voir aussi :** [Plan Sprint MVP v0.4](./ARK-Plan-Sprint-MVP-v0.4.md) — Détail des tâches manuelles vs OpenCode par sprint, incluant les tâches de test.

---

## Règle de statut

| Statut | Signification |
|---|---|
| `draft` | Spec en cours de rédaction |
| `review` | Spec complète, en attente de validation |
| `stable` | Spec validée — prête pour OpenCode |
| `in-progress` | Implémentation en cours |
| `done` | Implémentée, testée (Jest + Supertest + Cypress), mergée |

> **Note sur `done` :** Une feature n'est `done` que si ses tests Jest, Supertest et Cypress sont écrits, relus et verts. Les tests de sécurité/RBAC ont été validés manuellement.

---

## Roadmap P1 — Découpage vertical par feature

### Fondation (Phase 0 — manuel, pas de spec Claude Code)

| ID | Feature | Dépend de | Statut | Estimé |
|---|---|---|---|---|
| F-00 | Scaffolding projet — NestJS + Prisma + Docker + JWT + PrismaService + middleware `ark.current_user_id` + **configuration Jest/Supertest + Cypress** | — | `draft` | 2.5j |

> F-00 est réalisé manuellement. Pas de Feature-Spec OpenCode — c'est le socle sur lequel toutes les specs s'appuient. L'estimation passe de 2j à 2.5j pour intégrer la configuration des stacks de test (tâches 0.10 et 0.11).

---

### Sprint 1 — Auth & RBAC end-to-end

| ID | Feature | Dépend de | Statut | Estimé |
|---|---|---|---|---|
| FS-01 | **Auth & RBAC** — Login email/password, JWT, gestion des rôles et permissions, guards NestJS, écran login React + **tests Jest/Supertest/Cypress + validation RBAC manuelle** | F-00 | `draft` | 3.5j |

**Périmètre FS-01 :**
- Backend : `POST /auth/login`, `POST /auth/logout`, `GET /auth/me`
- Backend : CRUD `/roles`, `/permissions`, `/users` (protégés)
- Frontend : écran Login + gestion du token JWT en mémoire
- Tests Jest : `AuthService`, `UsersService`
- Tests Supertest : contrat API `/auth/*`, `/users`, `/roles` — cas nominaux
- Tests Cypress : flow login complet, `PrivateRoute` bloque sans token
- Tests manuels : guards RBAC, absence de `passwordHash` dans les réponses
- Hors périmètre : SSO SAML2 (P2), droits par domaine (P2)

---

### Sprint 2 — Entités racines end-to-end

| ID | Feature | Dépend de | Statut | Estimé |
|---|---|---|---|---|
| FS-02 | **Domains** — CRUD complet backend + pages liste/new/edit React + **tests complets + validation guards manuelle** | FS-01 | `draft` | 1.5j |
| FS-03 | **Providers** — CRUD complet backend + pages liste/new/edit React + **tests** | FS-01 | `draft` | 1.5j |
| FS-04 | **IT Components** — CRUD + liaison `app_it_component_map` + écran + **tests** | FS-01 | `draft` | 2j |
| FS-05 | **Data Objects** — CRUD + liaison `app_data_object_map` (avec rôle) + écran + **tests** | FS-01 | `draft` | 2j |

> FS-02 et FS-03 sont les features les plus simples — elles servent de **modules de référence** pour OpenCode sur tous les suivants. Les produire en premier et les valider soigneusement, **tests inclus**. L'estimation passe de 1j à 1.5j pour intégrer la génération + relecture des tests.

---

### Sprint 3 — Applications & Capacités end-to-end

| ID | Feature | Dépend de | Statut | Estimé |
|---|---|---|---|---|
| FS-06 | **Applications** — CRUD complet + liaisons `domains`/`providers`/`users` + écran inventaire + fiche détail + **tests** | FS-02, FS-03, FS-01 | `draft` | 3.5j |
| FS-07 | **Business Capabilities** — CRUD + récursion `WITH RECURSIVE` + écran arbre hiérarchique + **tests arbre** | FS-02, FS-01 | `draft` | 3.5j |

> FS-07 contient le cas le plus complexe du projet : la requête `WITH RECURSIVE` doit être écrite et testée manuellement en SQL avant d'être intégrée dans la spec. Les tests Jest/Supertest doivent couvrir les cas d'arbre à plusieurs niveaux — inclure dans la spec les fixtures de données de test.

---

### Sprint 4 — Graphe de dépendances end-to-end

| ID | Feature | Dépend de | Statut | Estimé |
|---|---|---|---|---|
| FS-08 | **Interfaces** — CRUD unidirectionnel Source→Cible + règles métier + écran liste + **tests** | FS-06 | `draft` | 2.5j |
| FS-09 | **Dependency Graph POC** — endpoint `/graph` dédié + composant React Flow + filtres (domaine, criticité, type) + **tests Supertest `/graph` + Cypress affichage** | FS-08, FS-06 | `draft` | 3.5j |

> FS-09 est la feature la plus risquée visuellement. Le POC React Flow (valider la librairie sur données réelles) doit précéder la rédaction de la spec. Les tests Cypress couvrent les scénarios nominaux — la validation des cas limites visuels (graphe dense, cycles) reste manuelle.

---

### Sprint 5 — Import & Finalisation MVP

| ID | Feature | Dépend de | Statut | Estimé |
|---|---|---|---|---|
| FS-10 | **Import Excel** — upload frontend + validation backend + insertion en base pour les 6 entités P1 + **tests Jest/Supertest validation + Cypress flux complet** | FS-06, FS-07, FS-08 | `draft` | 3.5j |
| FS-11 | **Navigation & UX transverse** — menu, breadcrumb, gestion des erreurs globale, écran 404, loading states + **tests Cypress navigation** | FS-06 | `draft` | 2.5j |

---

## Vue synthétique — dépendances

```
F-00 (Fondation + stack de test)
  └── FS-01 (Auth & RBAC + tests)
        ├── FS-02 (Domains + tests) ← module de référence
        │     └── FS-06 (Applications + tests)
        │           ├── FS-08 (Interfaces + tests)
        │           │     └── FS-09 (Dependency Graph + tests)
        │           └── FS-10 (Import Excel + tests)
        ├── FS-03 (Providers + tests)
        │     └── FS-06 (Applications)
        ├── FS-04 (IT Components + tests)
        ├── FS-05 (Data Objects + tests)
        └── FS-07 (Business Capabilities + tests)
              └── FS-10 (Import Excel)
```

---

## Récapitulatif des estimations

| ID | Feature | Estimé v0.2 | Estimé v0.3 | Delta | Raison |
|---|---|---|---|---|---|
| F-00 | Scaffolding | 2j | 2.5j | +0.5j | Config Jest + Cypress |
| FS-01 | Auth & RBAC | 3j | 3.5j | +0.5j | Tests Cypress login + validation RBAC manuelle |
| FS-02 | Domains | 1j | 1.5j | +0.5j | Tests Jest + Supertest + Cypress + validation guards |
| FS-03 | Providers | 1j | 1.5j | +0.5j | Idem FS-02 |
| FS-04 | IT Components | 1.5j | 2j | +0.5j | Tests liaison n:n |
| FS-05 | Data Objects | 1.5j | 2j | +0.5j | Tests liaison n:n + rôle |
| FS-06 | Applications | 3j | 3.5j | +0.5j | Tests liaisons multi-entités |
| FS-07 | Business Capabilities | 3j | 3.5j | +0.5j | Tests arbre récursif (fixtures multi-niveaux) |
| FS-08 | Interfaces | 2j | 2.5j | +0.5j | Tests règles unidirectionnelles |
| FS-09 | Dependency Graph | 3j | 3.5j | +0.5j | Tests Supertest `/graph` + Cypress affichage |
| FS-10 | Import Excel | 3j | 3.5j | +0.5j | Tests cas d'erreur validation + Cypress flux complet |
| FS-11 | Navigation & UX | 2j | 2.5j | +0.5j | Tests Cypress navigation |
| **Total** | | **25j** | **30j** | **+5j** | |

> **Note :** Le delta de +5j représente ~20% du budget total. C'est le coût réaliste d'une couverture de test intégrée. En contrepartie, les bugs d'intégration sont détectés sprint par sprint et non en fin de projet.

---

## Ordre de rédaction des specs recommandé

Travailler à rebours depuis la feature la plus risquée :

| Ordre | Spec | Pourquoi |
|---|---|---|
| 1 | **FS-09** (Dependency Graph) | La plus risquée visuellement — valider le POC React Flow d'abord, puis rédiger la spec |
| 2 | **FS-07** (Business Capabilities) | La plus complexe techniquement — valider la requête `WITH RECURSIVE` en SQL + définir les fixtures de test |
| 3 | **FS-01** (Auth & RBAC) | Bloque tout le reste — à stabiliser tôt |
| 4 | **FS-02** (Domains) | Module de référence pour OpenCode — doit être exemplaire, tests inclus |
| 5 | **FS-06** (Applications) | Feature centrale du MVP — la plus riche en règles métier |
| 6-11 | Reste des specs | Dans l'ordre du tableau roadmap |

---

## Checklist avant de lancer la première session OpenCode

- [ ] F-00 terminé (scaffolding fonctionnel, `docker-compose up` OK)
- [ ] **Jest + Supertest configurés — un test tourne sans erreur**
- [ ] **Cypress installé — `cypress open` fonctionne sur le frontend**
- [ ] **`cypress/support/commands.ts` — commande `cy.login()` implémentée**
- [ ] FS-01 au statut `stable`
- [ ] FS-02 au statut `stable` (servira de module de référence)
- [ ] POC React Flow concluant (avant FS-09)
- [ ] Requête `WITH RECURSIVE` testée en base (avant FS-07)
- [ ] Fixtures de données de test définies pour FS-07 (arbre Business Capabilities)

---

_Document de travail v0.3 — Réconcilié avec Plan Sprint MVP v0.4_