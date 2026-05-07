# FS-12-BACK — Dashboard d'Accueil — Backend

_Version 0.1 — 2026-05-06_

## En-tête

| Champ | Valeur |
|---|---|
| **ID** | FS-12-BACK |
| **Titre** | Dashboard d'Accueil — Backend |
| **Priorité** | P1 |
| **Statut** | `draft` |
| **Dépend de** | FS-01, FS-06-BACK, FS-07-BACK |
| **Spec mère** | FS-12 Dashboard d'Accueil |
| **Spec front** | FS-12-FRONT — bloquée tant que cette spec n'est pas `done` |
| **Estimé** | 2j |
| **Version** | 0.1 |

---

## 1. Objectif & Périmètre

**Ce que cette spec fait :**

- Crée le modèle Prisma `UserDomainScope` (N:N User ↔ Domain, table de présence pure sans champ `role`)
- Amende `AuthService.getProfile()` pour inclure `domainIds[]` et noms des domaines assignés à l'utilisateur connecté
- Crée le nouveau `HomeModule` NestJS avec `GET /api/v1/home/summary` — endpoint BFF qui orchestre 6 requêtes internes en `Promise.allSettled()`, retourne toujours `200`, champs `null` en cas d'erreur partielle
- Amende `ApplicationsService` pour accepter un filtre `domainIds[]` optionnel sur `count()` et `findAll()` (0 domaines = portée globale)
- Amende `BusinessCapabilitiesService` pour accepter un filtre `domainIds[]` optionnel sur le count des BC couvertes (BC avec ≥ 1 app liée dans le périmètre)
- Amende `UsersService` pour gérer les domaines assignés lors de create/update utilisateur (diff transactionnel sur `user_domain_scope`)

**Hors périmètre :**

- Frontend — couvert par FS-12-FRONT
- Droits différenciés par domaine (`role` dans `user_domain_scope`) — P2
- Filtrage sur interfaces ou IT components (entités transverses) — P2
- Sélecteur de domaine manuel dans le dashboard — P2

---

## 2. Modèle BDD

### 2.1 Nouveau modèle `UserDomainScope`

```prisma
model UserDomainScope {
  userId     String   @map("user_id") @db.Uuid
  domainId   String   @map("domain_id") @db.Uuid
  assignedAt DateTime @default(now()) @map("assigned_at") @db.Timestamptz(6)

  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  domain Domain @relation(fields: [domainId], references: [id], onDelete: Cascade)

  @@id([userId, domainId])
  @@index([userId], map: "idx_user_domain_scope_user")
  @@map("user_domain_scope")
}
```

Relations à ajouter sur les modèles existants :

```prisma
model User {
  // ... champs existants inchangés
  domainScopes  UserDomainScope[]   // NOUVEAU
}

model Domain {
  // ... champs existants inchangés
  userScopes    UserDomainScope[]   // NOUVEAU
}
```

Migration : `npx prisma migrate dev --name add_user_domain_scope`

SQL généré :

```sql
CREATE TABLE user_domain_scope (
  user_id     UUID NOT NULL REFERENCES users(id)   ON DELETE CASCADE,
  domain_id   UUID NOT NULL REFERENCES domains(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, domain_id)
);
CREATE INDEX idx_user_domain_scope_user ON user_domain_scope(user_id);
```

> Aucun audit trigger sur `user_domain_scope` — table de configuration technique, pas de donnée métier.

### 2.2 Tables utilisées en lecture par HomeService

```
applications        → count, group by lifecycle_status, filter domain_id IN [...]
app_capability_map  → count DISTINCT capability_id (BC couvertes), filtré via application.domain_id
interfaces          → count global (non filtré domaine — entité transverse)
providers           → expiry_date filter, jointure via app_provider_map
app_provider_map    → jointure providers ↔ applications (pour périmètre domaine)
user_domain_scope   → lookup domainIds du user connecté (via getProfile)
```

---

## 3. Contrat API (OpenAPI)

### 3.1 Amendment `GET /api/v1/auth/me`

Réponse enrichie — 2 nouveaux champs en fin d'objet `UserProfileResponse` :

```yaml
UserProfileResponse:
  type: object
  properties:
    # champs existants inchangés...
    id:         { type: string, format: uuid }
    email:      { type: string }
    firstName:  { type: string, nullable: true }
    lastName:   { type: string, nullable: true }
    isActive:   { type: boolean }
    role:
      type: object
      nullable: true
      properties:
        id:   { type: string, format: uuid }
        name: { type: string }
        permissions:
          type: array
          items: { properties: { name: { type: string } } }
    createdAt: { type: string, format: date-time }
    # NOUVEAUX CHAMPS
    domainIds:
      type: array
      items: { type: string, format: uuid }
      description: "UUIDs des domaines assignés. Tableau vide = portée globale."
    domains:
      type: array
      description: "Objets domaines pour affichage (WelcomeBanner). Même longueur que domainIds."
      items:
        type: object
        properties:
          id:   { type: string, format: uuid }
          name: { type: string }
```

### 3.2 Nouveau `GET /api/v1/home/summary`

```yaml
paths:
  /api/v1/home/summary:
    get:
      summary: Résumé dashboard — BFF agrégé
      tags: [Home]
      security:
        - bearerAuth: []
      responses:
        '200':
          description: >
            Toujours 200. Les champs sont null en cas d'erreur partielle sur un sous-call.
            Le client affiche "—" pour les sections avec valeur null.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/HomeSummaryResponse'
        '401':
          description: Non authentifié
        '403':
          description: Permission insuffisante (applications:read requis)

components:
  schemas:
    HomeSummaryResponse:
      type: object
      properties:
        kpis:
          nullable: true
          description: "null si erreur sur ce sous-call"
          type: object
          properties:
            appsCount:
              type: integer
              nullable: true
            missionCriticalPercent:
              type: number
              format: float
              nullable: true
              description: "null si aucune app avec criticité renseignée (dénominateur=0)"
            missionCriticalDenominator:
              type: integer
              nullable: true
              description: "Nombre d'apps avec criticité renseignée (dénominateur du %)"
            interfacesCount:
              type: integer
              nullable: true
              description: "COUNT global, non filtré domaine (entité transverse)"
            coveredCapabilitiesCount:
              type: integer
              nullable: true
              description: "COUNT DISTINCT capability_id via app_capability_map, filtré domaine"

        incompleteApps:
          nullable: true
          type: array
          description: "null si erreur. Max 5 items, triés created_at ASC."
          items:
            type: object
            properties:
              id:           { type: string, format: uuid }
              name:         { type: string }
              missingFields:
                type: array
                items:
                  type: string
                  enum: [owner, criticality, lifecycle]
              businessCapability:
                nullable: true
                description: "BC de contexte à afficher dans le widget (règle N:N définie en RM-07)."
                type: object
                properties:
                  id:   { type: string, format: uuid }
                  name: { type: string }
                  ancestors:
                    type: array
                    description: "Chemin hiérarchique racine -> parent direct de la BC sélectionnée."
                    items:
                      type: object
                      properties:
                        id:   { type: string, format: uuid }
                        name: { type: string }
              createdAt:    { type: string, format: date-time }

        expiringProviders:
          nullable: true
          type: array
          description: "null si erreur. Max 5 items, triés expiry_date ASC."
          items:
            type: object
            properties:
              id:               { type: string, format: uuid }
              name:             { type: string }
              expiryDate:       { type: string, format: date }
              daysUntilExpiry:
                type: integer
                description: "Calculé côté backend : floor((expiryDate - today) / 1 day)"

        lifecycleDistribution:
          nullable: true
          type: object
          description: "null si erreur. Toujours les 5 statuts présents, valeur 0 si aucune app."
          properties:
            draft:       { type: integer }
            in_progress: { type: integer }
            production:  { type: integer }
            deprecated:  { type: integer }
            retired:     { type: integer }
            total:       { type: integer }

        dataQuality:
          nullable: true
          type: object
          description: "null si erreur."
          properties:
            completeCount: { type: integer }
            totalCount:    { type: integer }
            scorePercent:
              type: integer
              nullable: true
              description: "floor(completeCount/totalCount * 100). null si totalCount=0."
```

> Le BFF récupère les `domainIds` depuis le JWT/user en session — PAS depuis un query param. L'endpoint n'accepte aucun paramètre de filtrage externe.

### 3.3 Amendment `POST /api/v1/users` et `PATCH /api/v1/users/:id`

Extension des DTOs existants :

```yaml
CreateUserDto / UpdateUserDto (amendment):
  properties:
    # champs existants inchangés...
    domainIds:
      type: array
      items: { type: string, format: uuid }
      description: >
        Optionnel. Si présent, remplace intégralement les domaines assignés
        (diff atomique : deleteMany anciens + createMany nouveaux).
        Tableau vide [] = portée globale (0 lignes dans user_domain_scope).
```

### 3.4 Amendment `GET /api/v1/users/:id`

Réponse enrichie — 2 nouveaux champs :

```yaml
UserDetailResponse (amendment):
  properties:
    # champs existants inchangés...
    domainIds:
      type: array
      items: { type: string, format: uuid }
    domains:
      type: array
      items:
        type: object
        properties:
          id:   { type: string, format: uuid }
          name: { type: string }
```

---

## 4. Règles Métier Backend

- **RM-01 — Convention 0 domaine = portée globale :** Si `domainIds.length === 0`, toutes les requêtes filtrées retournent le périmètre global (pas de clause `WHERE domain_id IN [...]`). Implémentation : `const domainFilter = domainIds.length > 0 ? { domainId: { in: domainIds } } : {}`.

- **RM-02 — Récupération des domainIds dans HomeService :** `HomeService` reçoit `userId` en paramètre (extrait de `req.user.userId` dans le controller). Il effectue `prisma.userDomainScope.findMany({ where: { userId }, select: { domainId: true } })` en tête de `getSummary()`. Les 6 sous-calls utilisent ensuite ce tableau.

- **RM-03 — Promise.allSettled — gestion partielle :** Les 6 sous-calls sont lancés en parallèle. Chaque résultat `status === 'rejected'` produit `null` dans le champ correspondant. Le service logge l'erreur (`this.logger.error(...)`) mais ne lance pas d'exception. Le controller retourne toujours HTTP 200.

- **RM-04 — Calcul % mission-critical :**
  - Numérateur : `COUNT(*) WHERE criticality = 'mission-critical' AND domain_id IN [...]`
  - Dénominateur : `COUNT(*) WHERE criticality IS NOT NULL AND domain_id IN [...]`
  - Si dénominateur = 0 → `missionCriticalPercent = null`
  - Arrondi : `Math.round((num / denom) * 100)`

- **RM-05 — BC couvertes (coveredCapabilitiesCount) :** `COUNT DISTINCT capability_id` via `app_capability_map` filtré sur les apps du périmètre. Prisma : `prisma.appCapabilityMap.findMany({ where: { application: domainFilter }, select: { capabilityId: true }, distinct: ['capabilityId'] })` puis `.length`.

- **RM-06 — Interfaces count global :** `prisma.interface.count()` sans aucun filtre domaine. Décision explicite : les interfaces sont une entité transverse (pas de `domain_id`).

- **RM-07 — Applications incomplètes :** `WHERE (ownerId IS NULL OR criticality IS NULL OR lifecycleStatus IS NULL) AND domainFilter`, `ORDER BY createdAt ASC`, `TAKE 5`. Pour chaque app, construire `missingFields` en inspectant les 3 champs.
  - Enrichir chaque item avec `businessCapability` (ou `null` si aucune BC liée).
  - En cas de rattachement N:N app ↔ BC, sélectionner la BC la plus profonde (feuille la plus spécifique).
  - Tie-break stable si même profondeur : `name ASC`, puis `id ASC`.
  - `ancestors[]` contient le chemin racine -> parent direct de la BC sélectionnée.

- **RM-08 — Fournisseurs expirants :** Jointure `providers → app_provider_map → applications`. Filtre : `expiryDate IS NOT NULL AND expiryDate <= today + 90j`. Filtre domaine : via `application.domainId IN domainIds`. `ORDER BY expiryDate ASC TAKE 5`. `daysUntilExpiry = Math.floor((expiryDate.getTime() - Date.now()) / 86_400_000)`.

- **RM-09 — Distribution lifecycle :** 5 statuts fixes : `['draft', 'in_progress', 'production', 'deprecated', 'retired']`. Utiliser `prisma.application.groupBy({ by: ['lifecycleStatus'], where: domainFilter, _count: true })`. Tout statut absent du résultat → valeur `0`. `total` = somme des 5 valeurs.

- **RM-10 — Data quality score :** Applications "complètes" = `ownerId IS NOT NULL AND criticality IS NOT NULL AND lifecycleStatus IS NOT NULL`. `scorePercent = totalCount > 0 ? Math.floor(completeCount / totalCount * 100) : null`.

- **RM-11 — Permission :** `@RequirePermissions('applications:read')` sur `HomeController`. Réutilise la permission existante — aucune nouvelle permission à créer.

- **RM-12 — Diff domaines dans UsersService :** `update()` avec `domainIds` présent → transaction atomique : `prisma.$transaction([ prisma.userDomainScope.deleteMany({ where: { userId: id } }), prisma.userDomainScope.createMany({ data: domainIds.map(domainId => ({ userId: id, domainId })) }) ])`. Validation préalable : chaque UUID de `domainIds` doit exister dans `domains` → `NotFoundException({ code: 'DOMAIN_NOT_FOUND' })` si absent.

- **RM-13 — Pas d'audit trail sur user_domain_scope :** Table de configuration. Pas de `SET LOCAL ark.current_user_id` pour cette table.

---

## 5. Comportements Backend par Cas d'Usage

**Nominal :**

- `GET /api/v1/home/summary` (user sans domaine) → `200` avec `kpis.appsCount` = total global
- `GET /api/v1/home/summary` (user avec 1 domaine) → `200` avec données filtrées sur ce domaine
- `GET /api/v1/auth/me` → réponse avec `domainIds: []` (user global) ou `domainIds: [uuid1, ...]`
- `PATCH /api/v1/users/:id` avec `domainIds: [valid-uuid]` → `200` user retourné avec `domains`
- `PATCH /api/v1/users/:id` avec `domainIds: []` → `200` user avec portée globale (0 lignes en base)

**Erreurs :**

- `GET /api/v1/home/summary` sans token → `401`
- `GET /api/v1/home/summary` avec token sans `applications:read` → `403`
- `PATCH /api/v1/users/:id` avec `domainIds: ["uuid-inexistant"]` → `404 DOMAIN_NOT_FOUND`
- Sous-call HomeService échoue (ex: timeout DB) → champ `null` dans la réponse, autres champs présents, HTTP 200

---

## 6. Structure de Fichiers Backend

```
backend/src/home/
├── home.module.ts
├── home.controller.ts        (GET /home/summary, @RequirePermissions('applications:read'))
├── home.service.ts           (getSummary(userId: string): Promise<HomeSummaryDto>)
└── dto/
    └── home-summary.dto.ts   (HomeSummaryDto + sous-interfaces)

Amendments :
backend/src/auth/auth.service.ts                           (getProfile() — ajouter domainScopes)
backend/src/users/users.service.ts                          (create/update/findOne — domainIds diff)
backend/src/applications/applications.service.ts            (findAll + count — domainIds filter)
backend/src/business-capabilities/                          (méthode countCovered + domainIds filter)
  business-capabilities.service.ts
backend/prisma/schema.prisma                                (UserDomainScope + relations User/Domain)
backend/src/app.module.ts                                   (HomeModule import)
docs/04-Tech/openapi.yaml                                   (path /home/summary + amendments)
```

> **Injection PrismaService directement dans HomeService** — pas d'import inter-modules (`ApplicationsModule`, etc.). `HomeService` exécute ses propres requêtes Prisma pour le BFF. Cela évite les dépendances circulaires et maintient le HomeModule isolé.

---

## 7. Ordre d'Implémentation

**Étape 1 — D-01 (bloquant tout) :** Migration Prisma `UserDomainScope`. Mettre à jour `schema.prisma`, ajouter les relations sur `User` et `Domain`, exécuter `prisma migrate dev`. Valider avec `prisma studio` ou `prisma db pull`.

**Étape 2 — D-02 (bloquant le front) :** Amender `AuthService.getProfile()` — ajouter `include: { domainScopes: { include: { domain: { select: { id: true, name: true } } } } }`. Mapper vers `domainIds: string[]` et `domains: { id, name }[]` dans la réponse.

**Étape 3 — D-04 + D-05 (en parallèle) :** Amender `ApplicationsService` (ajouter filtre `domainIds` sur `findAll()` et `count()`) et `BusinessCapabilitiesService` (ajouter méthode `countCoveredByDomains(domainIds: string[])`).

**Étape 4 — D-06 :** Amender `UsersService.create()` et `update()` pour gérer `domainIds[]` (diff transactionnel + validation). Amender `findOne()` pour inclure les domaines assignés.

**Étape 5 — D-03 :** Créer `HomeModule` complet. Injecter `PrismaService`. Enregistrer dans `AppModule`.

**Étape 6 — OpenAPI :** Mettre à jour `docs/04-Tech/openapi.yaml` avec le path `/home/summary` et les amendments `/auth/me` et `/users`.

---

## 8. Tests Backend

### Outil par niveau

| Niveau | Outil | Fichier cible |
|---|---|---|
| Unit (service) | **Jest** | `src/home/home.service.spec.ts` |
| API / contrat HTTP | **Supertest** (Playwright) | `e2e/tests/home/home-summary.api.spec.ts` |
| Sécurité / RBAC | **Manuel** | — |

### Tests Jest — Unit

- `[Jest]` `HomeService.getSummary()` user sans domaine → `kpis.appsCount` = total global (pas de filtre domain)
- `[Jest]` `HomeService.getSummary()` user avec domainIds[id1] → requête filtrée sur domain_id
- `[Jest]` `HomeService.getSummary()` sous-call apps rejette → `kpis: null`, autres champs présents
- `[Jest]` `HomeService.getSummary()` → `missionCriticalPercent: null` si dénominateur = 0
- `[Jest]` `HomeService.getSummary()` → `lifecycleDistribution` contient toujours les 5 statuts (0 si absent)
- `[Jest]` `HomeService.getSummary()` → `incompleteApps.length <= 5`
- `[Jest]` `HomeService.getSummary()` → `daysUntilExpiry` calculé correctement
- `[Jest]` `AuthService.getProfile()` → retourne `domainIds: string[]` et `domains: { id, name }[]`
- `[Jest]` `UsersService.update()` avec `domainIds: [id1, id2]` → deleteMany + createMany appelés en transaction
- `[Jest]` `UsersService.update()` avec `domainIds: []` → deleteMany appelé, createMany non appelé
- `[Jest]` `UsersService.update()` avec `domainIds: [uuid-inexistant]` → NotFoundException DOMAIN_NOT_FOUND

### Tests Supertest — Contrat API

- `[Supertest]` `GET /api/v1/home/summary` authentifié → `200` avec structure `HomeSummaryResponse`
- `[Supertest]` `GET /api/v1/home/summary` → `kpis.appsCount` est un entier ≥ 0
- `[Supertest]` `GET /api/v1/home/summary` → `lifecycleDistribution` contient exactement les 5 clés
- `[Supertest]` `GET /api/v1/home/summary` → `incompleteApps` est un tableau (peut être vide)
- `[Supertest]` `GET /api/v1/home/summary` → `expiringProviders` est un tableau (peut être vide)
- `[Supertest]` `GET /api/v1/auth/me` → réponse contient `domainIds` (tableau) et `domains` (tableau)
- `[Supertest]` `PATCH /api/v1/users/:id` avec `domainIds: [valid-uuid]` → `200` + `domains` présent dans la réponse
- `[Supertest]` `PATCH /api/v1/users/:id` avec `domainIds: [invalid-uuid]` → `404 DOMAIN_NOT_FOUND`
- `[Supertest]` `GET /api/v1/users/:id` → réponse contient `domainIds` et `domains`

### Tests RBAC — Manuel ❌

- `[Manuel]` `GET /api/v1/home/summary` sans token → `401`
- `[Manuel]` `GET /api/v1/home/summary` avec token sans `applications:read` → `403`

---

## 9. Commande OpenCode — Backend

```
Contexte projet ARK — Session Backend FS-12-BACK :

Stack : NestJS strict mode + Prisma ORM + PostgreSQL 16 + TypeScript strict
Structure modules : src/<domaine>/<domaine>.module.ts / .controller.ts / .service.ts / dto/

Conventions obligatoires :
- PrismaModule est global (APP_MODULE) — ne jamais le réimporter dans un module feature
- JwtAuthGuard est global — décorer avec @Public() les seules routes publiques
- @RequirePermissions('applications:read') sur HomeController
- Format d'erreur standard : { statusCode, code, message, timestamp, path }
  → NotFoundException({ code: 'DOMAIN_NOT_FOUND', message: '...' }) si domain UUID invalide
- Endpoint BFF READ-ONLY : pas de SET LOCAL ark.current_user_id, pas d'audit trail sur HomeService
- Amendments UsersService : utiliser SET LOCAL ark.current_user_id avant les writes (table users)
- Tests unit : jest.mock() sur PrismaService — pas de base réelle
- Fichier test e2e : e2e/tests/home/home-summary.api.spec.ts (Playwright/Supertest)

HomeService injecte PrismaService directement — ne PAS importer ApplicationsModule ou autres
modules feature dans HomeModule (évite dépendances circulaires).

Ordre d'implémentation obligatoire :
1. Migration Prisma UserDomainScope (D-01) — AVANT tout le reste
2. Amendment AuthService.getProfile() (D-02) — AVANT le front
3. Amendments ApplicationsService + BusinessCapabilitiesService (D-04, D-05) — en parallèle
4. Amendment UsersService create/update/findOne (D-06)
5. HomeModule complet (D-03) — en dernier
6. Update openapi.yaml (path /home/summary + amendments)

Pattern de référence NestJS : module Graph (FS-09-BACK) — s'y conformer pour la structure.

Implémente la feature "Dashboard Backend" (FS-12-BACK) en respectant strictement le contrat ci-dessous.
Génère : migration Prisma, HomeModule NestJS complet (controller, service, DTOs, module),
amendments AuthService/UsersService/ApplicationsService/BusinessCapabilitiesService,
tests Jest unit, tests Supertest.
Ne génère PAS les tests marqués [Manuel].
Ne génère PAS de code frontend.
Ne fais aucune hypothèse non documentée. Si un point est ambigu, pose une question avant de coder.

[COLLER LE CONTENU COMPLET DE FS-12-BACK.md ICI]
```

---

## 10. Gates de Validation Backend

| # | Gate | Vérification | Bloquant |
|---|---|---|---|
| G-01 | Migration `user_domain_scope` appliquée | Table présente en base, index créé | ✅ Oui |
| G-02 | `GET /api/v1/auth/me` → `domainIds[]` + `domains[]` présents | Réponse conforme | ✅ Oui |
| G-03 | `GET /api/v1/home/summary` → `200` avec tous les champs de structure | Response shape validée | ✅ Oui |
| G-04 | `lifecycleDistribution` contient toujours les 5 statuts | Test Jest + Supertest | ✅ Oui |
| G-05 | Erreur partielle BFF → champ `null`, autres présents, HTTP 200 | Test Jest | ✅ Oui |
| G-06 | `PATCH /api/v1/users/:id` avec `domainIds` → diff transactionnel | Supertest | ✅ Oui |
| G-07 | Tests Jest passent | 0 failed | ✅ Oui |
| G-08 | Tests Supertest passent | 0 failed | ✅ Oui |
| G-09 | Tests RBAC manuels validés | 401/403 vérifiés | ✅ Oui |
| G-10 | Build TypeScript sans erreur | `npm run build` → 0 error | ✅ Oui |
| G-11 | `docs/04-Tech/openapi.yaml` mis à jour | Path `/home/summary` présent | ✅ Oui |

---

## 11. Checklist Post-Session

- [ ] Migration `user_domain_scope` créée et appliquée en base
- [ ] `GET /api/v1/auth/me` retourne `domainIds` et `domains`
- [ ] `GET /api/v1/home/summary` → `200` avec structure complète
- [ ] `lifecycleDistribution` : toujours 5 statuts (0 si absent)
- [ ] Erreur partielle BFF → champ `null` uniquement, HTTP 200
- [ ] `PATCH /api/v1/users/:id` avec `domainIds` → diff atomique correct
- [ ] `domainIds: []` → portée globale (pas de filtre domain)
- [ ] `NotFoundException` sur `domainIds: [uuid-invalide]` → `DOMAIN_NOT_FOUND`
- [ ] `HomeService` n'importe aucun module feature (PrismaService direct)
- [ ] `HomeModule` enregistré dans `AppModule`
- [ ] Aucun `TODO / FIXME / HACK` non tracé
- [ ] Aucune erreur TypeScript strict
- [ ] `docs/04-Tech/openapi.yaml` mis à jour avec path `/home/summary`

---

## 12. Revue de Dette Technique

### Gates TD

| # | Vérification | Commande / Action |
|---|---|---|
| TD-1 | Aucun `TODO / FIXME / HACK` non tracé | `git grep -n "TODO\|FIXME\|HACK" -- '*.ts'` |
| TD-2 | Items F-999 activés par cette feature | Relire F-999 §2 |
| TD-3 | AGENTS.md : aucun pattern nouveau non documenté | Relire AGENTS.md |
| TD-4 | ARK-NFR.md : NFR impactés mis à jour | ARK-NFR.md |

### Résultat de la Revue

| Champ | Valeur |
|---|---|
| **Sprint** | S5 |
| **Date de revue** | *(à renseigner post-impl)* |
| **Items F-999 fermés** | *(à renseigner)* |
| **Items F-999 ouverts** | *(à renseigner)* |
| **NFR mis à jour** | *(à renseigner)* |
| **Statut gates TD** | *(à renseigner)* |

---

## 13. Données de Seed

Aucun seed requis pour `UserDomainScope` (table de configuration gérée par les admins via l'UI).
`HomeModule` est read-only — utilise les données existantes en base.

---

_FS-12-BACK v0.1 — draft — 2026-05-06_
