# FS-13-BACK — Espace Utilisateur (Settings + i18n EN) — Backend

_Version 0.1 — 2026-05-18_

## En-tête

| Champ | Valeur |
|---|---|
| **ID** | FS-13-BACK |
| **Titre** | Espace Utilisateur — Backend |
| **Priorité** | P1 |
| **Statut** | `done` |
| **Dépend de** | FS-01 (Auth & RBAC) |
| **Spec mère** | FS-13 Espace Utilisateur |
| **Spec front** | FS-13-FRONT — bloquée tant que cette spec n'est pas `done` |
| **Estimé** | 1.5j |
| **Version** | 0.1 |

> **Note :** Cette feature n'est pas une entité EA classique — elle s'enrichit du module `users` existant. Aucune suppression bloquée par entités liées (pas de `DELETE` exposé pour les préférences).

---

## 1. Objectif & Périmètre

**Ce que cette spec fait :**

- Crée le modèle Prisma `UserPreference` (1:1 avec `users`) pour persister les réglages utilisateur
- Amende `AuthService.getProfile()` et les réponses login/refresh pour inclure `preferences: { language }`
- Amende `UsersService.create()` pour créer une row `user_preferences` par défaut (`language = "fr"`) lors du signup
- Crée le endpoint `PATCH /api/v1/users/me` dans `UsersController` pour permettre à tout utilisateur authentifié de modifier ses propres préférences
- Crée la migration data pour backfiller les `user_preferences` des utilisateurs existants avec `language = "fr"`
- Met à jour `docs/04-Tech/openapi.yaml` avec les nouveaux endpoints

**Hors périmètre :**

- Frontend — couvert par FS-13-FRONT
- Traduction anglaise complète (`en.json` exhaustif) — tâche séparée
- Autres paramètres utilisateur (thème, notifications, timezone, etc.) — P2
- Détection navigateur `Accept-Language` — P2
- Permission spécifique `users:settings` — P1 utilise JWT uniquement
- Changement de mot de passe depuis settings — P2

---

## 2. Modèle BDD

### 2.1 Nouveau modèle `UserPreference`

```prisma
model UserPreference {
  id        String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  userId    String   @unique @map("user_id") @db.Uuid
  language  String   @default("fr") @map("language") @db.VarChar(10)
  createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt DateTime @default(now()) @updatedAt @map("updated_at") @db.Timestamptz(6)

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("user_preferences")
}
```

Relations à ajouter sur le modèle `User` existant :

```prisma
model User {
  // ... champs existants inchangés
  preference UserPreference?   // NOUVEAU — 1:1 optionnel (row créée au signup ou migration)
}
```

> **Convention :** La relation est `1:1 optionnelle` côté `User` (`UserPreference?`) car les users existants avant le déploiement de FS-13 n'auront pas de row `user_preferences` jusqu'à la migration data. Après migration, la relation devient effectivement `1:1 required` mais Prisma ne supporte pas `1:1 required` avec `onDelete: Cascade` côté enfant — on garde donc `?` côté parent et on gère le fallback en code.

Migration : `npx prisma migrate dev --name add_user_preference`

SQL généré :

```sql
CREATE TABLE user_preferences (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  language    VARCHAR(10) NOT NULL DEFAULT 'fr',
  created_at  TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  CONSTRAINT uq_user_preferences_user_id UNIQUE (user_id)
);

CREATE INDEX idx_user_preferences_user ON user_preferences(user_id);

-- Trigger audit automatique (déjà actif via fn_audit_trigger)
```

### 2.2 Vue des relations globales

```
users (1) ──── (1) user_preferences
    │
    │ 1:N
    │
user_domain_scope (N:N Domain) — FS-12
```

---

## 3. Contrat API (OpenAPI)

### 3.1 Endpoints existants amendés

#### `GET /api/v1/auth/me`

Amendement de la réponse pour inclure `preferences` :

```yaml
paths:
  /api/v1/auth/me:
    get:
      summary: Profil utilisateur connecté
      tags: [Auth]
      security:
        - bearerAuth: []
      responses:
        '200':
          description: Profil utilisateur
          content:
            application/json:
              schema:
                type: object
                properties:
                  id: { type: string, format: uuid }
                  email: { type: string }
                  firstName: { type: string, nullable: true }
                  lastName: { type: string, nullable: true }
                  isActive: { type: boolean }
                  role:
                    type: object
                    properties:
                      id: { type: string, format: uuid }
                      name: { type: string }
                      description: { type: string, nullable: true }
                      permissions:
                        type: array
                        items:
                          type: object
                          properties:
                            name: { type: string }
                            description: { type: string, nullable: true }
                  domainIds:
                    type: array
                    items: { type: string, format: uuid }
                  domains:
                    type: array
                    items:
                      type: object
                      properties:
                        id: { type: string, format: uuid }
                        name: { type: string }
                  preferences:
                    type: object
                    nullable: true
                    properties:
                      language: { type: string, example: "fr" }
                  createdAt: { type: string, format: date-time }
        '401':
          description: Non authentifié
```

> **Note :** `preferences` est `nullable` car les users legacy sans row `user_preferences` retournent `null`. Le frontend applique le fallback `"fr"`.

#### `POST /api/v1/auth/login` et `POST /api/v1/auth/refresh`

Amendement identique : la propriété `user` dans la réponse inclut `preferences` (même schéma que `GET /auth/me`).

### 3.2 Nouveaux endpoints

#### `PATCH /api/v1/users/me`

```yaml
paths:
  /api/v1/users/me:
    patch:
      summary: Modifier les préférences de l'utilisateur connecté
      tags: [Users]
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                language:
                  type: string
                  minLength: 2
                  maxLength: 10
                  description: Code langue ISO (fr, en, ...)
              required: [language]
      responses:
        '200':
          description: Préférences mises à jour
          content:
            application/json:
              schema:
                type: object
                properties:
                  id: { type: string, format: uuid }
                  userId: { type: string, format: uuid }
                  language: { type: string }
                  createdAt: { type: string, format: date-time }
                  updatedAt: { type: string, format: date-time }
        '400':
          description: Validation échouée (langue manquante ou invalide)
        '401':
          description: Non authentifié
```

> **Pas de permission spécifique requise** — tout utilisateur authentifié peut modifier ses propres préférences. Le `userId` est extrait du JWT (`req.user.userId`), jamais du body.

---

## 4. Règles Métier Backend

- **RM-01 — Langue acceptée :** Seules les langues pour lesquelles un fichier i18n existe dans le frontend sont acceptées. P1 : `"fr"`, `"en"`. Validation DTO : `@IsIn(['fr', 'en'])`.

- **RM-02 — Auto-creation au signup :** `AuthService.signup()` (ou `UsersService.create()` si signup passe par là) doit créer une row `UserPreference` avec `language = "fr"` dans la même transaction que la création du `User`.

- **RM-03 — Migration data legacy :** Un script de migration (Prisma `migrate dev` + seed ou SQL ad-hoc) doit créer une row `user_preferences` avec `language = "fr"` pour chaque `User` existant n'ayant pas encore de préférence.

- **RM-04 — Fallback "fr" :** Si `AuthService.getProfile()` ne trouve pas de `UserPreference` pour le user (cas transitoire post-déploiement, pre-migration), la réponse retourne `preferences: null`. Le frontend gère le fallback.

- **RM-05 — Self-update uniquement :** `PATCH /api/v1/users/me` utilise `req.user.userId` comme `userId` cible. Aucun paramètre `userId` n'est accepté dans le body. Un user ne peut modifier que ses propres préférences.

- **RM-06 — Audit trail :** `PATCH /api/v1/users/me` est une écriture — `SET LOCAL ark.current_user_id` doit être exécuté avant la requête Prisma `upsert` ou `update`.

---

## 5. Comportements Backend par Cas d'Usage

**Nominal :**
- `GET /api/v1/auth/me` authentifié avec préférences existantes → `200` avec `preferences.language = "fr" | "en"`
- `GET /api/v1/auth/me` authentifié sans préférences (legacy) → `200` avec `preferences = null`
- `POST /api/v1/auth/login` → `200` avec `user.preferences` (créé au signup)
- `POST /api/v1/auth/refresh` → `200` avec `user.preferences`
- `PATCH /api/v1/users/me` avec `{ "language": "en" }` → `200` avec `UserPreference` mis à jour
- `PATCH /api/v1/users/me` avec `{ "language": "fr" }` → `200` avec `UserPreference` mis à jour

**Erreurs :**
- `PATCH /api/v1/users/me` sans `language` → `400` (validation classique NestJS)
- `PATCH /api/v1/users/me` avec `language = "de"` → `400` (IsIn validator)
- `PATCH /api/v1/users/me` avec `language` > 10 caractères → `400` (MaxLength)
- Toute route sans token → `401`

---

## 6. Structure de Fichiers Backend

Aucun nouveau module NestJS requis — les changements s'intègrent dans les modules existants :

```
backend/src/
├── auth/
│   ├── auth.service.ts          ← amendé (getProfile enrichi, signup crée preference)
│   └── auth.controller.ts       ← amendé (réponses login/refresh enrichies)
├── users/
│   ├── users.controller.ts      ← amendé (PATCH /me ajouté)
│   ├── users.service.ts         ← amendé (create() crée preference, updateMe() nouveau)
│   └── dto/
│       └── update-me.dto.ts     ← NOUVEAU (UpdateMeDto)
├── prisma/
│   └── schema.prisma            ← amendé (model UserPreference + relation User)
└── test/
    └── FS-13-user-settings.e2e-spec.ts   ← NOUVEAU (tests Supertest)
```

> **Pas de nouveau module** — `UserPreference` n'est pas une entité EA exposée en CRUD indépendant. Elle est gérée comme une propriété du module `users`.

---

## 7. Tests Backend

> **AGENT-DECISION: spec — T-116** : les tests API sont reportés à la tâche T-116-suite / T-118 et seront écrits en **Playwright API** (conformément à la stratégie actuelle du projet, `e2e/AGENTS.md` §1). Les tests unitaires Jest restent pertinents pour les services amendés.

### Outil par niveau

| Niveau | Outil | Fichier cible | Déléguable à OpenCode |
|---|---|---|---|
| Unit (services NestJS) | **Jest** | `src/users/users.service.spec.ts` (amendé) | ✅ Oui |
| API / contrat HTTP | **Playwright API** | `e2e/tests/users/user-settings.api.spec.ts` | ✅ Oui |
| Sécurité / RBAC | **Playwright API** | `e2e/tests/users/user-settings.api.spec.ts` | ❌ **Manuel** |

### Tests Jest — Unit (amendements)

- [ ] `[Jest]` `UsersService.create()` crée un `UserPreference` avec `language = "fr"` dans la même transaction
- [ ] `[Jest]` `UsersService.updateMe()` met à jour `language` de l'utilisateur connecté
- [ ] `[Jest]` `UsersService.updateMe()` crée une row `UserPreference` si elle n'existe pas (upsert)
- [ ] `[Jest]` `AuthService.getProfile()` retourne `preferences: null` si aucune row
- [ ] `[Jest]` `AuthService.getProfile()` retourne `preferences.language` si row existe

### Tests Playwright API — Contrat HTTP

- [ ] `[Playwright API]` `GET /api/v1/auth/me` authentifié → `200` avec `preferences.language`
- [ ] `[Playwright API]` `GET /api/v1/auth/me` authentifié sans préférences → `200` avec `preferences = null`
- [ ] `[Playwright API]` `POST /api/v1/auth/login` → `200` avec `user.preferences.language = "fr"`
- [ ] `[Playwright API]` `POST /api/v1/auth/refresh` → `200` avec `user.preferences.language`
- [ ] `[Playwright API]` `PATCH /api/v1/users/me` `{ "language": "en" }` → `200`, `language = "en"`
- [ ] `[Playwright API]` `PATCH /api/v1/users/me` `{ "language": "fr" }` → `200`, `language = "fr"`
- [ ] `[Playwright API]` `PATCH /api/v1/users/me` sans body → `400`
- [ ] `[Playwright API]` `PATCH /api/v1/users/me` `{ "language": "de" }` → `400`
- [ ] `[Playwright API]` `PATCH /api/v1/users/me` avec langue > 10 caractères → `400`
- [ ] `[Playwright API]` `PATCH /api/v1/users/me` → audit_trail contient 1 ligne avec entity_type='user_preferences' et changed_by non NULL

### Tests Sécurité / RBAC — Manuel ❌

- [ ] `[Manuel]` `GET /api/v1/auth/me` sans token → `401`
- [ ] `[Manuel]` `PATCH /api/v1/users/me` sans token → `401`
- [ ] `[Manuel]` `PATCH /api/v1/users/me` avec token valide → `200` (aucune permission spécifique requise, JWT suffit)

---

## 8. Commande OpenCode — Backend

```
Contexte projet ARK — Session Backend FS-13-BACK :

Stack : NestJS strict mode + Prisma ORM + PostgreSQL 16 + TypeScript strict
Structure modules : src/<domaine>/<domaine>.module.ts / .controller.ts / .service.ts / dto/

Conventions obligatoires :
- Toute écriture en base : await prisma.$executeRaw`SET LOCAL ark.current_user_id = ${userId}`
- PrismaModule est global (APP_MODULE) — ne jamais le réimporter dans un module feature
- JwtAuthGuard est global — décorer avec @Public() les seules routes publiques
- @RequirePermission() disponible — utiliser sur chaque handler controller
- Format d'erreur standard : { statusCode, code, message, timestamp, path }
  → ConflictException({ code: 'CONFLICT', message: '...' }) pour P2002
- P2002 intercepté dans un try/catch ciblé → ConflictException — ne jamais laisser remonter l'erreur Prisma brute
- Requêtes raw : tagged template backtick uniquement — jamais Prisma.raw() avec interpolation
- Tests unit : jest.mock() sur PrismaService — pas de base réelle
- Fichier test API : e2e/tests/users/user-settings.api.spec.ts (Playwright API, non Supertest)

Documentation obligatoire (NFR-GOV-001) :
- À la fin de la session, recopier le contenu YAML de la section §3 (Contrat API) de cette spec dans le fichier `docs/04-Tech/openapi.yaml`
  en remplaçant la section `paths:` correspondante
  OU en ajoutant les nouveaux paths si l'entité n'existait pas
- Ne pas générer de documentation OpenAPI/Swagger automatique — le fichier YAML central est la source de vérité

Implémente la feature "Espace Utilisateur Settings" backend (FS-13-BACK) en respectant strictement le contrat ci-dessous.
Génère : amendements Prisma schema, amendements AuthService/UsersService/UsersController, UpdateMeDto, tests Jest unit.
Les tests API Playwright sont reportés à la tâche T-116-suite / T-118.
Ne génère PAS les tests marqués [Manuel].
Ne génère PAS de code frontend.
Ne fais aucune hypothèse non documentée. Si un point est ambigu, pose une question avant de coder.

[COLLER LE CONTENU COMPLET DE FS-13-BACK.md ICI]
```

---

## 9. Gate de Validation Backend

| # | Gate | Vérification | Bloquant |
|---|------|--------------|----------|
| G-01 | Migration Prisma appliquée | Table `user_preferences` présente en base | ✅ Oui |
| G-02 | Migration data legacy | Tous les users existants ont une row `user_preferences` avec `language = "fr"` | ✅ Oui |
| G-03 | Tests Jest passent | `npm run test -- --testPathPattern=users` → 0 failed (reportés à T-116-suite) | ✅ Oui |
| G-04 | Tests API Playwright passent | `make test-api -- tests/users/user-settings.api.spec.ts` → 0 failed (reportés à T-116-suite) | ✅ Oui |
| G-05 | Tests RBAC manuels validés | Les cas [Manuel] §7 vérifiés à la main | ✅ Oui |
| G-06 | Aucune erreur TypeScript | `npm run build` → 0 error | ✅ Oui |
| G-07 | Statut mis à jour | Passer `FS-13-BACK` à `done` dans cet en-tête | ✅ Oui |
| G-08 | Revue TD backend | TD-1 à TD-6 vérifiés, F-999 mis à jour | ✅ Oui |
| G-09 | Audit trail actif | `PATCH /api/v1/users/me` → vérifier ligne dans audit_trail (changed_by non NULL) | ✅ Oui |
| G-10 | `openapi.yaml` mis à jour | Paths `/auth/me`, `/users/me` présents dans `docs/04-Tech/openapi.yaml` | ✅ Oui |

---

## 10. Checklist de Validation Post-Session

- [ ] `GET /api/v1/auth/me` retourne `preferences.language` ou `null`
- [ ] `POST /api/v1/auth/login` retourne `user.preferences.language = "fr"` (signup)
- [ ] `PATCH /api/v1/users/me` retourne `200` avec `UserPreference` mis à jour
- [ ] `PATCH /api/v1/users/me` → audit_trail.changed_by non NULL (NFR-SEC-009)
- [ ] `PATCH /api/v1/users/me` sans `language` → `400`
- [ ] `PATCH /api/v1/users/me` avec langue invalide → `400`
- [ ] Aucun `TODO / FIXME / HACK` non tracé
- [ ] Aucune erreur TypeScript strict
- [ ] Conventions `$executeRaw`, structure modules, mock Prisma respectées
- [ ] `docs/04-Tech/openapi.yaml` mis à jour avec les paths de cette feature (NFR-GOV-001)

---

## 11. Revue de Dette Technique

### Gates TD

| # | Vérification | Commande / Action |
|---|--------------|-------------------|
| TD-1 | Aucun `TODO / FIXME / HACK` non tracé dans le code livré | `git grep -n "TODO\|FIXME\|HACK" -- '*.ts'` |
| TD-2 | Items F-999 activés par cette feature : statut mis à jour | Relire F-999 §2 |
| TD-3 | Checklist F-999 §4 : cases cochées pour les items de ce sprint | F-999 §4 |
| TD-4 | AGENTS.md : aucun pattern nouveau non documenté introduit | Relire AGENTS.md |
| TD-5 | ARK-NFR.md : NFR impactés mis à jour (`missing` → `covered` / `partial`) | ARK-NFR.md |
| TD-6 | Nouvelles décisions transverses → nouvel Item F-999 créé si applicable | Jugement |

### Résultat de la Revue

| Champ | Valeur |
|-------|--------|
| **Sprint** | S5 |
| **Date de revue** | *(à compléter)* |
| **Items F-999 fermés** | *(à compléter)* |
| **Items F-999 ouverts** | *(à compléter)* |
| **Nouveaux items F-999 créés** | *(à compléter)* |
| **NFR mis à jour** | *(à compléter)* |
| **TODOs résiduels tracés** | *(à compléter)* |
| **Statut gates TD** | *(à compléter)* |

---

## 12. Données de Seed

### Pertinence

❌ **Inutile** — `UserPreference` est créée automatiquement au signup (`language = "fr"`). Aucune donnée de démo pré-chargée nécessaire.

### Migration data legacy

Script SQL à exécuter après `prisma migrate dev` pour backfiller les users existants :

```sql
INSERT INTO user_preferences (user_id, language)
SELECT id, 'fr'
FROM users
WHERE id NOT IN (SELECT user_id FROM user_preferences);
```

Ou intégré dans la migration Prisma générée via `prisma migrate dev --name add_user_preference`.

---

_Feature-Spec Backend FS-13-BACK v0.1 — Projet ARK_
