# ARK — Plan Sprint MVP

_Version 0.4 — Février 2026_

> **Changelog v0.4 :** Intégration de la stratégie de test dans les sprints. Ajout des tâches Jest/Supertest et Cypress dans chaque sprint. Phase 0 enrichie (tâches 0.10 et 0.11 — configuration stack de test). Règles OpenCode mises à jour. Section "Ce qu'il ne faut jamais déléguer" complétée pour les tests. Gates de sortie enrichis avec critères de couverture.

---

## Conventions

| Icône | Signification |
|---|---|
| 🟡 Manuel | À faire soi-même — décision d'architecture, code sensible ou validation humaine |
| 🤖 OpenCode | Génération assistée — injecter la Feature-Spec complète |
| ✅ Fait | Livrable déjà stable |
| 🚧 Gate | Point de validation obligatoire avant de continuer |
| 🧪 Test | Tâche de test — préciser l'outil entre crochets |

---

## Principe du découpage vertical

Chaque sprint livre des **features complètes** — backend + frontend + tests ensemble. Avantages pour un développeur solo avec agent :

- Valeur visible à chaque fin de sprint
- OpenCode génère mieux quand le contrat est end-to-end
- Les bugs d'intégration sont détectés immédiatement

### Stratégie de test intégrée au sprint

Chaque feature est livrée avec trois niveaux de test dans la même session OpenCode :

| Niveau | Outil | Périmètre | Délégable |
|---|---|---|---|
| Unit (services) | Jest | Logique métier isolée | ✅ OpenCode |
| Contrat API | Jest + Supertest | Routes HTTP, codes retour, payloads | ✅ OpenCode |
| Sécurité / RBAC | Jest + Supertest | Guards, absence de champs sensibles | ❌ Manuel |
| E2E browser | Cypress | Flows utilisateur dans l'UI | ✅ OpenCode (nominaux) |

---

## Phase 0 — Fondations (avant Sprint 1, ~2.5 jours)

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
| 0.10 | Configuration Jest + Supertest dans `backend/` | 🟡 Manuel | Voir section "Setup stack de test" ci-dessous |
| 0.11 | Configuration Cypress dans `frontend/` | 🟡 Manuel | Voir section "Setup stack de test" ci-dessous |

**Gate de sortie Phase 0 :** `docker-compose up` fonctionne, Prisma se connecte, POC React Flow concluant, `WITH RECURSIVE` validée, **un test Jest tourne sans erreur, Cypress s'ouvre sur le frontend**.

---

## Setup stack de test (Phase 0 — tâches 0.10 et 0.11)

### Backend — Jest + Supertest (tâche 0.10)

```bash
# Dans backend/
npm install --save-dev @nestjs/testing supertest @types/supertest

# Vérifier que jest est configuré dans package.json (NestJS CLI l'installe par défaut)
# Ajouter dans package.json :
# "jest": {
#   "moduleFileExtensions": ["js", "json", "ts"],
#   "rootDir": "src",
#   "testRegex": ".*\\.spec\\.ts$",        ← tests unitaires
#   "transform": { "^.+\\.(t|j)s$": "ts-jest" },
#   "collectCoverageFrom": ["**/*.(t|j)s"],
#   "coverageDirectory": "../coverage",
#   "testEnvironment": "node",
#   "roots": ["<rootDir>", "<rootDir>/../test"]  ← inclure le dossier test/ pour e2e
# }
```

Convention de nommage des fichiers :
- Unit : `src/<domaine>/<domaine>.service.spec.ts`
- E2E API : `test/<domaine>.e2e-spec.ts`

### Frontend — Cypress (tâche 0.11)

```bash
# Dans frontend/
npm install --save-dev cypress

# Initialiser Cypress
npx cypress open  # génère cypress/ + cypress.config.ts

# Convention de nommage :
# cypress/e2e/<domaine>.cy.ts
# cypress/support/commands.ts  ← helpers globaux (setToken, login, etc.)
```

Ajouter dans `cypress/support/commands.ts` :

```typescript
// Helper de login réutilisable dans tous les tests Cypress
Cypress.Commands.add('login', (email: string, password: string) => {
  cy.request('POST', `${Cypress.env('apiUrl')}/auth/login`, { email, password })
    .then((response) => {
      // Stocker le token pour les cy.request() suivants
      Cypress.env('token', response.body.accessToken);
      // Injecter dans le store mémoire React
      cy.window().then((win: any) => {
        if (win.__ark_setAuth) {
          win.__ark_setAuth(response.body.accessToken, response.body.user);
        }
      });
    });
});
```

> ⚠️ Le frontend doit exposer `window.__ark_setAuth` en mode test (variable d'env `VITE_TEST_MODE=true`) pour que Cypress puisse injecter le token dans le store mémoire React (voir `store/auth.ts` de FS-01).

---

## Sprint 1 — Auth & RBAC end-to-end (S1–S2, ~5.5 jours)

> Objectif : l'authentification et les droits sont opérationnels de bout en bout. Tout le reste du MVP s'appuie dessus.

| # | Tâche | Mode | Notes |
|---|---|---|---|
| 1.1 | Rédiger et valider **FS-01** (Auth & RBAC) | 📄 Spec | Gate obligatoire avant 1.2 |
| 1.2 | Backend Auth — `POST /auth/login`, `POST /auth/logout`, `GET /auth/me`, hash Bcrypt, JWT | 🟡 Manuel | Sécurité — ne pas déléguer à OpenCode |
| 1.3 | Backend RBAC — CRUD `/roles`, `/permissions`, `/users` + guards `JwtAuthGuard` | 🤖 OpenCode | Injecter FS-01 complète |
| 1.4 | Frontend — écran Login + gestion token JWT | 🤖 OpenCode | Injecter FS-01 + contrat `/auth/*` |
| 1.5 | `[Jest]` Tests unit `AuthService` + `UsersService` | 🤖 OpenCode | Généré dans la session 1.3 — cas section 7 FS-01 |
| 1.6 | `[Supertest]` Tests contrat API `/auth/*`, `/users`, `/roles` | 🤖 OpenCode | Généré dans la session 1.3 — cas nominaux uniquement |
| 1.7 | `[Cypress]` Test flow login complet + `PrivateRoute` | 🤖 OpenCode | Généré dans la session 1.4 |
| 1.8 | `[Manuel]` Tests RBAC sécurité — guards, `passwordHash` absent des réponses | 🟡 Manuel | **Ne jamais déléguer** — voir règles ci-dessous |

**Gate de sortie Sprint 1 :** Login fonctionnel, token JWT valide, routes protégées bloquent les accès non autorisés, **tests Jest passent, Cypress login flow vert, tests RBAC manuels validés**.

---

## Sprint 2 — Entités racines end-to-end (S3–S4, ~6 jours)

> Objectif : Domains, Providers, IT Components et Data Objects livrés end-to-end. FS-02 devient le **module de référence** pour tous les suivants.

| # | Tâche | Mode | Notes |
|---|---|---|---|
| 2.1 | Rédiger et valider **FS-02** (Domains) | 📄 Spec | Sera le module de référence — soigner la spec |
| 2.2 | Feature Domains — CRUD backend + écran liste/new/edit React | 🤖 OpenCode | Injecter FS-02. Valider soigneusement avant de continuer. |
| 2.3 | `[Jest]` Tests unit `DomainsService` | 🤖 OpenCode | Généré dans la session 2.2 |
| 2.4 | `[Supertest]` Tests contrat API `/domains` — nominaux + 409 + 404 | 🤖 OpenCode | Généré dans la session 2.2 |
| 2.5 | `[Cypress]` Tests CRUD Domains dans l'UI | 🤖 OpenCode | Généré dans la session 2.2 — flow liste/création/édition/suppression |
| 2.6 | `[Manuel]` Valider guards Domains (`domains:read` / `domains:write`) | 🟡 Manuel | Vérifier 401 sans token, 403 sans permission |
| 2.7 | Rédiger et valider **FS-03** (Providers) | 📄 Spec | Utiliser FS-02 comme référence de pattern |
| 2.8 | Feature Providers — CRUD backend + écran + tests (même pattern FS-02) | 🤖 OpenCode | Injecter FS-03 + module Domains comme référence |
| 2.9 | Rédiger et valider **FS-04** (IT Components) + **FS-05** (Data Objects) | 📄 Spec | Inclure les tables de liaison n:n dans les specs |
| 2.10 | Feature IT Components — CRUD + liaison n:n + écran + tests | 🤖 OpenCode | Injecter FS-04 |
| 2.11 | Feature Data Objects — CRUD + liaison n:n (rôle) + écran + tests | 🤖 OpenCode | Injecter FS-05 |

**Gate de sortie Sprint 2 :** 4 entités racines livrées end-to-end. Module Domains validé comme référence OpenCode. **Tests Jest + Supertest passent pour les 4 entités. Guards validés manuellement.**

---

## Sprint 3 — Applications & Business Capabilities end-to-end (S5–S6, ~7 jours)

> Objectif : les deux entités centrales du MVP sont livrées. C'est le sprint le plus dense techniquement.

| # | Tâche | Mode | Notes |
|---|---|---|---|
| 3.1 | Rédiger et valider **FS-06** (Applications) | 📄 Spec | Feature la plus riche en règles métier |
| 3.2 | Feature Applications — CRUD + liaisons multi-entités + écran inventaire + fiche détail | 🤖 OpenCode | Injecter FS-06. C'est la feature centrale. |
| 3.3 | `[Jest]` + `[Supertest]` Tests Applications | 🤖 OpenCode | Généré dans la session 3.2 — inclure liaisons multi-entités |
| 3.4 | `[Cypress]` Tests inventaire applicatif + fiche détail | 🤖 OpenCode | Généré dans la session 3.2 |
| 3.5 | Rédiger et valider **FS-07** (Business Capabilities) | 📄 Spec | Intégrer la requête `WITH RECURSIVE` validée en Phase 0 |
| 3.6 | Feature Business Capabilities — CRUD backend + récursion | 🤖 OpenCode | Injecter FS-07 + requête SQL validée |
| 3.7 | Intégration manuelle `$queryRaw` pour la récursion | 🟡 Manuel | Vérifier que la requête générée est identique à celle validée en Phase 0 |
| 3.8 | `[Jest]` + `[Supertest]` Tests Business Capabilities — arbre récursif | 🤖 OpenCode | Inclure cas : racine, 3 niveaux, déplacement de nœud |
| 3.9 | Frontend Business Capabilities — écran arbre hiérarchique | 🤖 OpenCode | Injecter FS-07 + structure de données de l'arbre |
| 3.10 | `[Cypress]` Tests arbre hiérarchique dans l'UI | 🤖 OpenCode | Créer/déplacer/supprimer un nœud dans l'arbre |

**Gate de sortie Sprint 3 :** Applications et Business Capabilities fonctionnelles. Récursion validée sur données réelles. **Suite de tests complète — Jest + Supertest + Cypress verts.**

---

## Sprint 4 — Graphe de dépendances end-to-end (S7–S8, ~5.5 jours)

> Objectif : la feature différenciante du MVP est livrée. C'est la valeur principale d'ARK.

| # | Tâche | Mode | Notes |
|---|---|---|---|
| 4.1 | Rédiger et valider **FS-08** (Interfaces) | 📄 Spec | Documenter les règles unidirectionnelles |
| 4.2 | Feature Interfaces — CRUD unidirectionnel Source→Cible + écran liste | 🤖 OpenCode | Injecter FS-08 |
| 4.3 | `[Jest]` + `[Supertest]` Tests Interfaces | 🤖 OpenCode | Inclure cas : interface dupliquée (non bloquée), sens unique |
| 4.4 | Atelier filtres graphe — valider les dimensions de filtrage | 🟡 Manuel | Livrable : liste des filtres + structure des props React Flow |
| 4.5 | Rédiger et valider **FS-09** (Dependency Graph) | 📄 Spec | Intégrer structure props React Flow validée en atelier |
| 4.6 | Endpoint backend `/graph` — agrégation nœuds + arêtes | 🤖 OpenCode | Injecter FS-09 section backend |
| 4.7 | `[Supertest]` Tests endpoint `/graph` — structure nœuds/arêtes, filtres | 🤖 OpenCode | Valider la forme du payload avant le frontend |
| 4.8 | Composant React Flow — graphe + filtres | 🤖 OpenCode | Injecter FS-09 section frontend + structure props |
| 4.9 | Validation visuelle sur données réelles | 🟡 Manuel | Tester les cas limites : graphe dense, nœuds isolés, cycles |
| 4.10 | `[Cypress]` Test affichage graphe + filtres domaine/criticité | 🤖 OpenCode | Scénarios nominaux seulement — validation visuelle reste manuelle |

**Gate de sortie Sprint 4 :** Graphe de dépendances fonctionnel avec filtres. Validé sur données réelles. **Tests `/graph` Supertest verts. Cypress affichage graphe nominal vert.**

---

## Sprint 5 — Import Excel & Finalisation MVP (S9–S10, ~6 jours)

> Objectif : l'import des inventaires existants est opérationnel. Le MVP est livrable.

| # | Tâche | Mode | Notes |
|---|---|---|---|
| 5.1 | Spécification format Excel — mapping colonnes → modèle ARK | 🟡 Manuel | Livrable : document de mapping + règles de validation. Gate obligatoire avant 5.2. |
| 5.2 | Rédiger et valider **FS-10** (Import Excel) | 📄 Spec | Intégrer le document de mapping dans la spec |
| 5.3 | Feature Import Excel — upload + validation + insertion 6 entités | 🤖 OpenCode | Injecter FS-10 + document de mapping |
| 5.4 | `[Jest]` + `[Supertest]` Tests Import Excel — fichier valide, erreurs de validation | 🤖 OpenCode | Inclure cas : colonne manquante, type invalide, doublon |
| 5.5 | Rédiger et valider **FS-11** (Navigation & UX transverse) | 📄 Spec | Menu, breadcrumb, erreurs globales, loading states |
| 5.6 | Feature Navigation & UX — composants transverses | 🤖 OpenCode | Injecter FS-11 |
| 5.7 | `[Cypress]` Tests d'intégration E2E — flux complet Import → inventaire → graphe | 🤖 OpenCode | Scénario complet sur données réelles |
| 5.8 | `[Manuel]` Validation tests d'intégration E2E sur flux complet | 🟡 Manuel | Import Excel → inventaire → graphe — cas limites |
| 5.9 | `docker-compose up` sur machine vierge — validation déploiement | 🟡 Manuel | Simuler le déploiement chez un client |

**Gate de sortie Sprint 5 :** MVP complet, déployable en `docker-compose up`, importable depuis Excel. **Tous les tests Jest + Supertest passent. Suite Cypress complète verte sur données réelles.**

---

## Ce qu'il ne faut jamais déléguer à OpenCode

| Sujet | Raison |
|---|---|
| **Logon Bcrypt + endpoints `/auth/*`** | Sécurité — une erreur silencieuse est indétectable à la relecture |
| **Tests RBAC et sécurité** | OpenCode génère des guards syntaxiquement corrects, pas nécessairement sémantiquement. Les cas limites de sécurité (403 vs 401, absence de champs sensibles) doivent être écrits et relus par un humain. |
| **Migrations Prisma** (`prisma migrate dev`) | Toujours relire le fichier de migration avant d'appliquer — une migration destructive ne se rattrape pas |
| **Requêtes `$queryRaw` et `$executeRaw`** | Prisma ne les valide pas à la compilation — relire ligne par ligne |
| **POC React Flow** | Décision go/no-go sur une librairie — doit être validée par un humain sur données réelles |
| **Validation visuelle du graphe** | Les cas limites (graphe dense, cycles) ne sont pas testables automatiquement |
| **Tests Cypress de sécurité** | Un test Cypress qui vérifie qu'un champ sensible ne s'affiche pas dans l'UI doit être écrit manuellement — OpenCode ne connaît pas les exigences de sécurité implicites |

---

## Règles d'utilisation d'OpenCode

1. **Une Feature-Spec = une session OpenCode.** Ne pas mélanger plusieurs features dans un même contexte.
2. **Toujours commencer par la commande de la section 9 du template** — elle charge le contexte projet avant la spec.
3. **Mode Plan avant Mode Build** sur les features complexes (FS-07, FS-09, FS-10) — valider l'approche proposée avant l'exécution.
4. **Relire systématiquement** les guards, DTOs, relations Prisma et requêtes raw générés avant d'intégrer.
5. **Fournir le module de référence** (FS-02 Domains) comme exemple de pattern dans chaque prompt OpenCode.
6. **Les tests sont générés dans la même session** que le code de production — ne pas les différer à une session séparée.
7. **Relire les tests générés** aussi soigneusement que le code de production — un test mal écrit donne une fausse confiance.

---

## Vue synthétique — dépendances des sprints

```
Phase 0 (Fondations + stack de test)
  └── Sprint 1 (FS-01: Auth & RBAC + tests)
        ├── Sprint 2 (FS-02 to FS-05: Domains, Providers, IT-Components, Data-Objects + tests)
        ├── Sprint 3 (FS-06: Applications, FS-07: Business-Capabilities + tests)
        │     └── Sprint 4 (FS-08: Interfaces, FS-09: Dependency Graph + tests)
        └── Sprint 5 (FS-10: Import Excel, FS-11: Navigation + tests E2E complets)
```

---

## Voir aussi

- **Roadmap:** `ARK-Roadmap-P1.md`
- **Template Feature-Spec:** `ARK - Template FeatureSpec.md`
- **Brief Application:** `ARK - Brief Application.md`
- **Setup Technique:** `ARK - Setup technique.md`

---

_Document v0.4 — Intégration tests dans le sprint_