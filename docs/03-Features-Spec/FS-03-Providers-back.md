# ARK — Feature Spec FS-03-BACK : Providers (Backend)

_Version 1.3 — Mars 2026_

> **Changelog v1.3 :** **ÉVOLUTION MAJEURE** — Migration modèle 1:N → N:N. Une application peut désormais être liée à plusieurs providers avec des rôles distincts (éditeur, intégrateur, support). Suppression colonne `applications.provider_id`, création table `app_provider_map` avec colonne `provider_role`. RM-03 adapté pour vérifier `_count.appProviderMaps`. Impact sur FS-06-BACK et DTOs (CreateApplicationDto, UpdateApplicationDto).
>
> **Changelog v1.2 :** Ajout exigence mise à jour `docs/04-Tech/openapi.yaml` — instruction §8, gate G-14, checklist §10. Conformité NFR-GOV-001 désormais traçable.
>
> **Changelog v1.1 :** Ajout section §12 Données de seed (8 providers). Ajout gate G-13 et test Supertest audit trail (NFR-SEC-009). Complément checklist post-session.
>
> **Changelog v1.0 :** Création initiale — module Providers conforme NFR-GOV-005. Implémente le CRUD complet avec tags F-03, onglet Relations (`_count.applications` + endpoint `GET /:id/applications`), et gestion des dépendances (blocage suppression si applications liées). Migration schema.sql : ajout de `description`, `comment`, `updated_at`, et contrainte UNIQUE sur `name`. Champ `expiry_date` exposé en API P1 sans logique d'alerte (FS-24 P2).

---

## En-tête

| Champ | Valeur |
|---|---|
| **ID** | FS-03-BACK |
| **Titre** | Providers — API REST Backend |
| **Priorité** | P1 |
| **Statut** | `stable` |
| **Dépend de** | FS-01, **FS-06-BACK**, F-03 |
| **Spec mère** | FS-03 Providers v1.0 |
| **Spec front** | FS-03-FRONT — bloquée tant que cette spec n'est pas `done` |
| **Estimé** | 0.5 jour |
| **Version** | 1.3 |

> **Note FK entrantes (N:N) :** Cette entité expose `_count.appProviderMaps` et `GET /:id/applications`. Elle est référencée via la table de jonction `app_provider_map`. FS-06-BACK est requis en dépendance BACK pour implémenter les DTOs et endpoints côté Application.

---

## 1. Objectif & Périmètre

**Ce que cette spec fait :**

Implémenter l'API REST complète pour la gestion des Fournisseurs (Providers) : création, lecture, modification et suppression. Le Provider représente un fournisseur externe (SaaS, éditeur logiciel, consultant) avec lequel l'entreprise entretient une relation contractuelle.

Le backend expose :
- CRUD complet conforme NFR-GOV-005 (5 champs socle + liaison tags)
- Endpoint `GET /:id/applications` listant les applications liées (pagination)
- Compteur `_count.applications` dans `ProviderResponse`
- Support des tags dimensionnels via `EntityTag` (F-03)
- Champs contractuels `contractType` et `expiryDate` exposés en P1 (sans logique d'alerte — FS-24 P2)

**Hors périmètre :**
- Frontend — couvert par `FS-03-FRONT`
- Système d'alerte sur expiration de contrat — couvert par FS-24 (P2)
- Gestion des contrats détaillés (numéro, montant, renouvellement auto) — P2

**Migration BDD requise :**
```sql
-- Créer la table de jonction N:N
CREATE TABLE app_provider_map (
  application_id UUID NOT NULL,
  provider_id UUID NOT NULL,
  provider_role VARCHAR(50),
  added_at TIMESTAMPTZ DEFAULT NOW(),
  
  PRIMARY KEY (application_id, provider_id),
  FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE,
  FOREIGN KEY (provider_id) REFERENCES providers(id) ON DELETE CASCADE
);

-- Migrer les données existantes (provider_id → app_provider_map)
INSERT INTO app_provider_map (application_id, provider_id, added_at)
SELECT id, provider_id, NOW()
FROM applications
WHERE provider_id IS NOT NULL;

-- Supprimer l'ancienne colonne FK
ALTER TABLE applications DROP COLUMN provider_id;
```

---

> **Pattern FK entrantes (N:N) :** Le Provider est référencé via la table de jonction `app_provider_map`. Implémentation complète avec `FS-06-BACK` done :
>
> | Niveau | Contenu | Dépendance |
> |---|---|---|
> | **BACK complet** | `_count.appProviderMaps` réel + `GET /:id/applications` + test `DEPENDENCY_CONFLICT` avec Application réelle liée via map | `FS-06-BACK` requis |
>
> Les tests Supertest créent une Application de test (via `POST /applications` avec `providers[]`) pour valider le blocage de suppression.

---

## 2. Modèle BDD

### 2.1 Schéma relationnel

**Schéma BDD complet — Providers et ses relations (F-03 + FS-06)**

```
┌──────────────────────────────────────────┐
│              tag_dimensions              │
├──────────────────────────────────────────┤
│ id           UUID        PK              │
│ name         VARCHAR(255) UNIQUE         │
│ description  TEXT        nullable        │
│ color        VARCHAR(7)  nullable        │
│ icon         VARCHAR(50) nullable        │
│ multi_value  BOOLEAN     default true    │
│ entity_scope TEXT[]      default []      │
│ sort_order   INT         default 0       │
│ created_at   TIMESTAMPTZ default now()   │
└───────────────────┬──────────────────────┘
                    │ 1
                    │ N
┌───────────────────▼──────────────────────┐
│               tag_values               │
├──────────────────────────────────────────┤
│ id            UUID       PK              │
│ dimension_id  UUID       FK → tag_dim.   │
│ path          VARCHAR(500)               │
│ label         VARCHAR(255)               │
│ parent_id     UUID       FK → self null  │
│ depth         SMALLINT   default 0       │
│ created_at    TIMESTAMPTZ default now()  │
└──────┬───────────────────────────────────┘
       │ N
       │
┌──────▼───────────────────────────────────┐
│               entity_tags                │
├──────────────────────────────────────────┤
│ entity_type   VARCHAR(50)                │
│ entity_id     UUID                       │
│ tag_value_id  UUID       FK → tag_values │
│ tagged_at     TIMESTAMPTZ default now()  │
│ tagged_by     UUID       nullable        │
├──────────────────────────────────────────┤
│ PK (entity_type, entity_id, tag_value_id)│
│ INDEX (entity_type, entity_id)           │
└───────────────────▲──────────────────────┘
                    │ via entity_type='provider'
                    │ entity_id = providers.id
                    │
┌───────────────────┴──────────────────────┐
│               providers                │
├──────────────────────────────────────────┤
│ id            UUID        PK             │
│ name          VARCHAR(255) NOT NULL      │
│   UNIQUE (name)                          │
│ description   TEXT        nullable       │
│ comment       TEXT        nullable       │
│ contract_type VARCHAR(100) nullable      │
│ expiry_date   DATE        nullable       │
│ created_at    TIMESTAMPTZ default now()  │
│ updated_at    TIMESTAMPTZ auto-update    │
├──────────────────────────────────────────┤
│ → appProviderMaps[] (N:N via             │
│   app_provider_map.provider_id)          │
│ Suppression bloquée si count > 0 (RM-03) │
└──────────────────────────────────────────┘
```

**Vue des relations globales**

```
tag_values ──1:N──► entity_tags ◄── (entity_type='provider', entity_id)
                                                          ▲
                                                          │
                                                    providers.id
                                                          │
                                                          │
providers ──N:N──► applications (via app_provider_map)

providers:
  - appProviderMaps[] via table junction app_provider_map
  - entityTags[] via polymorphisme entity_type='provider'
```

### 2.2 Modèle Prisma

```prisma
model Provider {
  id            String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  name          String    @unique @db.VarChar(255)
  description   String?   @db.Text
  comment       String?   @db.Text
  contractType  String?   @map("contract_type") @db.VarChar(100)
  expiryDate    DateTime? @map("expiry_date") @db.Date
  createdAt     DateTime  @default(now()) @map("created_at") @db.Timestamptz
  updatedAt     DateTime  @updatedAt @map("updated_at") @db.Timestamptz

  appProviderMaps ApplicationProviderMap[]
  entityTags      EntityTag[]

  @@map("providers")
}

model ApplicationProviderMap {
  applicationId String    @map("application_id") @db.Uuid
  providerId    String    @map("provider_id") @db.Uuid
  role          String?   @map("provider_role") @db.VarChar(50)
  addedAt       DateTime  @default(now()) @map("added_at") @db.Timestamptz

  application   Application @relation(fields: [applicationId], references: [id], onDelete: Cascade)
  provider      Provider    @relation(fields: [providerId], references: [id], onDelete: Cascade)

  @@id([applicationId, providerId])
  @@map("app_provider_map")
}

model Application {
  id               String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  name             String   @db.VarChar(255)
  // ... autres champs
  providerId       String?  @map("provider_id") @db.Uuid

  provider         Provider? @relation(fields: [providerId], references: [id])
  entityTags       EntityTag[]

  @@map("applications")
}

model EntityTag {
  entityType String   @map("entity_type") @db.VarChar(50)
  entityId   String   @map("entity_id") @db.Uuid
  tagValueId String   @map("tag_value_id") @db.Uuid
  taggedAt   DateTime @default(now()) @map("tagged_at") @db.Timestamptz
  taggedById String?  @map("tagged_by") @db.Uuid

  tagValue TagValue @relation(fields: [tagValueId], references: [id], onDelete: Cascade)

  @@id([entityType, entityId, tagValueId])
  @@index([entityType, entityId], name: "idx_entity_tags_lookup")
  @@index([tagValueId], name: "idx_entity_tags_by_value")
  @@map("entity_tags")
}
```

> **Notes :**
> - `Provider` suit les 5 champs socle NFR-GOV-005 (name, description, comment, createdAt, updatedAt)
> - `contractType` : string libre, pas d'enum P1 (permet "SaaS", "Licence annuelle", "Maintenance", etc.)
> - `expiryDate` : exposé en P1, alertes différées FS-24 P2
> - Trigger audit `trg_audit_providers` déjà présent en base

---

## 3. Contrat API (OpenAPI)

```yaml
paths:

  /api/v1/providers:
    get:
      summary: Liste de tous les providers
      tags: [Providers]
      security:
        - bearerAuth: []
      parameters:
        - name: page
          in: query
          schema: { type: integer, default: 1 }
        - name: limit
          in: query
          schema: { type: integer, default: 20 }
        - name: sortBy
          in: query
          schema: { type: string, enum: [name, createdAt, expiryDate], default: name }
        - name: sortOrder
          in: query
          schema: { type: string, enum: [asc, desc], default: asc }
        - name: search
          in: query
          schema: { type: string }
          description: Recherche textuelle sur le nom
      responses:
        '200':
          content:
            application/json:
              schema:
                type: object
                properties:
                  data:
                    type: array
                    items:
                      $ref: '#/components/schemas/ProviderListItem'
                  meta:
                    type: object
                    properties:
                      page: { type: integer }
                      limit: { type: integer }
                      total: { type: integer }
                      totalPages: { type: integer }
        '401':
          description: Non authentifié

    post:
      summary: Créer un provider
      tags: [Providers]
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateProviderDto'
      responses:
        '201':
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ProviderResponse'
        '400':
          description: Validation échouée
        '401':
          description: Non authentifié
        '403':
          description: Permission insuffisante
        '409':
          description: Nom de provider déjà utilisé
          content:
            application/json:
              schema:
                type: object
                properties:
                  statusCode: { type: integer, example: 409 }
                  code:       { type: string,  example: "CONFLICT" }
                  message:    { type: string }
                  timestamp:  { type: string, format: date-time }
                  path:       { type: string }

  /api/v1/providers/{id}:
    get:
      summary: Détail d'un provider
      tags: [Providers]
      security:
        - bearerAuth: []
      parameters:
        - name: id
          in: path
          required: true
          schema: { type: string, format: uuid }
      responses:
        '200':
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ProviderResponse'
        '401':
          description: Non authentifié
        '404':
          description: Provider introuvable

    patch:
      summary: Modifier un provider
      tags: [Providers]
      security:
        - bearerAuth: []
      parameters:
        - name: id
          in: path
          required: true
          schema: { type: string, format: uuid }
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/UpdateProviderDto'
      responses:
        '200':
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ProviderResponse'
        '400':
          description: Validation échouée
        '401':
          description: Non authentifié
        '403':
          description: Permission insuffisante
        '404':
          description: Provider introuvable
        '409':
          description: Nom de provider déjà utilisé
          content:
            application/json:
              schema:
                type: object
                properties:
                  statusCode: { type: integer, example: 409 }
                  code:       { type: string,  example: "CONFLICT" }
                  message:    { type: string }
                  timestamp:  { type: string, format: date-time }
                  path:       { type: string }

    delete:
      summary: Supprimer un provider
      tags: [Providers]
      security:
        - bearerAuth: []
      parameters:
        - name: id
          in: path
          required: true
          schema: { type: string, format: uuid }
      responses:
        '204':
          description: Provider supprimé
        '401':
          description: Non authentifié
        '403':
          description: Permission insuffisante
        '404':
          description: Provider introuvable
        '409':
          description: Provider utilisé par des applications
          content:
            application/json:
              schema:
                type: object
                properties:
                  statusCode: { type: integer, example: 409 }
                  code:       { type: string,  example: "DEPENDENCY_CONFLICT" }
                  message:    { type: string, example: "Provider is used by 3 application(s)" }
                  details:
                    type: object
                    properties:
                      applicationsCount: { type: integer }
                  timestamp:  { type: string, format: date-time }
                  path:       { type: string }

  /api/v1/providers/{id}/applications:
    get:
      summary: Liste des applications liées à un provider
      tags: [Providers]
      security:
        - bearerAuth: []
      parameters:
        - name: id
          in: path
          required: true
          schema: { type: string, format: uuid }
        - name: page
          in: query
          schema: { type: integer, default: 1 }
        - name: limit
          in: query
          schema: { type: integer, default: 20 }
      responses:
        '200':
          content:
            application/json:
              schema:
                type: object
                properties:
                  data:
                    type: array
                    items:
                      $ref: '#/components/schemas/ApplicationListItem'
                  meta:
                    type: object
                    properties:
                      page: { type: integer }
                      limit: { type: integer }
                      total: { type: integer }
                      totalPages: { type: integer }
        '401':
          description: Non authentifié
        '404':
          description: Provider introuvable

components:
  schemas:

    ProviderListItem:
      type: object
      properties:
        id:          { type: string, format: uuid }
        name:        { type: string }
        contractType: { type: string, nullable: true }
        expiryDate:  { type: string, format: date, nullable: true }
        createdAt:   { type: string, format: date-time }
        _count:
          type: object
          properties:
            applications: { type: integer, example: 5 }

    ProviderResponse:
      type: object
      properties:
        id:          { type: string, format: uuid }
        name:        { type: string }
        description: { type: string, nullable: true }
        comment:     { type: string, nullable: true }
        contractType: { type: string, nullable: true }
        expiryDate:  { type: string, format: date, nullable: true }
        createdAt:   { type: string, format: date-time }
        updatedAt:   { type: string, format: date-time }
        _count:
          type: object
          properties:
            applications: { type: integer, example: 5 }
        tags:
          type: array
          description: Tous les entity_tags sans filtrage (déduplication côté frontend)
          items:
            $ref: '#/components/schemas/EntityTagResponse'

    CreateProviderDto:
      type: object
      required: [name]
      properties:
        name:
          type: string
          minLength: 1
          maxLength: 255
          example: "Salesforce"
        description:
          type: string
          nullable: true
          maxLength: 2000
        comment:
          type: string
          nullable: true
          maxLength: 2000
        contractType:
          type: string
          nullable: true
          maxLength: 100
          example: "SaaS"
        expiryDate:
          type: string
          format: date
          nullable: true
          example: "2025-12-31"

    UpdateProviderDto:
      type: object
      properties:
        name:
          type: string
          minLength: 1
          maxLength: 255
        description:
          type: string
          nullable: true
          maxLength: 2000
        comment:
          type: string
          nullable: true
          maxLength: 2000
        contractType:
          type: string
          nullable: true
          maxLength: 100
        expiryDate:
          type: string
          format: date
          nullable: true

    ApplicationListItem:
      type: object
      properties:
        id: { type: string, format: uuid }
        name: { type: string }
        description: { type: string, nullable: true }
        domain:
          type: object
          nullable: true
          properties:
            id: { type: string, format: uuid }
            name: { type: string }
        owner:
          type: object
          nullable: true
          properties:
            id: { type: string, format: uuid }
            firstName: { type: string }
            lastName: { type: string }
        criticality: { type: string, nullable: true }
        lifecycleStatus: { type: string, nullable: true }
        createdAt: { type: string, format: date-time }

    EntityTagResponse:
      type: object
      properties:
        entityType: { type: string }
        entityId:   { type: string, format: uuid }
        tagValue:
          type: object
          properties:
            id:            { type: string, format: uuid }
            dimensionId:   { type: string, format: uuid }
            dimensionName: { type: string }
            dimensionColor: { type: string, nullable: true }
            path:          { type: string }
            label:         { type: string }
            depth:         { type: integer }
            parentId:      { type: string, format: uuid, nullable: true }
        taggedAt: { type: string, format: date-time }
```

---

## 4. Règles Métier Backend

- **RM-01 — Nom unique :** Deux providers ne peuvent pas avoir le même nom. `409` + code `"CONFLICT"` + message `"Provider name already in use"`. Intercepter l'erreur Prisma `P2002` dans un try/catch ciblé.

- **RM-02 — Nom non vide :** `name` obligatoire, non vide, non uniquement espaces. `@IsNotEmpty()` + `@Transform(() => value.trim())` avant validation. Les espaces uniquement sont rejetés comme vide → `400`.

- **RM-03 — Suppression bloquée si provider utilisé :**

```typescript
async remove(id: string): Promise<void> {
  const provider = await this.prisma.provider.findUnique({
    where: { id },
    select: {
      _count: { select: { appProviderMaps: true } }
    }
  });
  if (!provider) throw new NotFoundException('Provider not found');

  if (provider._count.appProviderMaps > 0) {
    throw new ConflictException({
      code: 'DEPENDENCY_CONFLICT',
      message: `Provider is used by ${provider._count.appProviderMaps} application(s)`,
      details: { applicationsCount: provider._count.appProviderMaps }
    });
  }
  await this.prisma.provider.delete({ where: { id } });
}
```

> **Pattern FK entrantes (N:N) :** Le compteur `appProviderMaps` vérifie les liens dans la table de jonction. Nécessite `FS-06-BACK` done pour être testé avec des données réelles.

- **RM-04 — Droits requis :** `providers:read` sur GET. `providers:write` sur POST/PATCH/DELETE.

- **RM-05 — Pas de soft delete :** Suppression physique après vérification RM-03.

- **RM-06 — Endpoint applications liées :** `GET /:id/applications` retourne une liste paginée d'`ApplicationListItem` (même schéma que `GET /applications`). Le provider doit exister → `404` si UUID inexistant.

- **RM-07 — Contract fields P1 :** `contractType` et `expiryDate` sont exposés en API P1 sans logique métier (simple stockage). Les alertes d'expiration sont différées FS-24 P2.

- **RM-08 — Rôle provider dans la relation N:N :** Le champ `provider_role` dans `app_provider_map` est optionnel (nullable). Valeurs courantes (non énumérées) : `'editor'`, `'integrator'`, `'support'`, `'vendor'`, `'custom'`. Chaque application peut associer le même provider avec des rôles différents (rare mais possible — ex: un intégrateur qui est aussi support).

---

## 5. Structure de Fichiers Backend

```
backend/src/providers/
├── providers.module.ts
├── providers.controller.ts
├── providers.service.ts
├── providers.service.spec.ts      ← tests unit Jest
└── dto/
    ├── create-provider.dto.ts
    ├── update-provider.dto.ts
    └── query-providers.dto.ts       ← pagination/filtres

backend/test/
└── FS-03-providers.e2e-spec.ts    ← tests Supertest
```

---

## 5.1 Integration with Tags (F-03)

Les Providers supportent le système de tags dimensionnels via la relation polymorphe `EntityTag`.

**Principe de responsabilité :**

> Le backend retourne **l'intégralité** des `entity_tags` d'un provider, sans filtrage ni déduplication. La déduplication par profondeur (F-03 RM-11) est une règle d'affichage **côté frontend** appliquée par `TagChipList`.

**Endpoints impliqués :**

- **GET /api/v1/providers** — Retourne `tags` pour chaque provider (chargé via join)
- **GET /api/v1/providers/:id** — Retourne le provider avec le tableau `tags`
- **PUT /tags/entity/provider/:id** — Endpoint F-03 pour mettre à jour les tags

**Service pattern:**

```typescript
async findOne(id: string): Promise<ProviderWithTags> {
  const provider = await this.prisma.provider.findUnique({ where: { id } });
  if (!provider) throw new NotFoundException();

  const tags = await this.tagService.getEntityTags('provider', id);
  return { ...provider, tags };
}
```

---

## 6. Tests Backend

### Tests Jest — Unit

- [ ] `[Jest]` `ProvidersService.findAll()` retourne un objet paginé `{ data, meta }`
- [ ] `[Jest]` `ProvidersService.findAll()` avec filtre `search` → recherche textuelle sur `name`
- [ ] `[Jest]` `ProvidersService.create()` retourne le provider créé
- [ ] `[Jest]` `ProvidersService.create()` lève `ConflictException` sur erreur Prisma `P2002`
- [ ] `[Jest]` `ProvidersService.findOne()` retourne le provider avec tags et `_count.applications`
- [ ] `[Jest]` `ProvidersService.findOne()` lève `NotFoundException` si UUID inexistant
- [ ] `[Jest]` `ProvidersService.getApplications()` retourne la liste paginée des apps liées
- [ ] `[Jest]` `ProvidersService.remove()` lève `NotFoundException` si UUID inexistant
- [ ] `[Jest]` `ProvidersService.remove()` lève `ConflictException` si des applications sont liées
- [ ] `[Jest]` `ProvidersService.remove()` appelle `prisma.provider.delete()` si aucune application liée

### Tests Supertest — Contrat API

- [ ] `[Supertest]` `GET /api/v1/providers` authentifié → `200` avec objet paginé
- [ ] `[Supertest]` `GET /api/v1/providers` liste vide → `200` avec `{ data: [], meta: {...} }`
- [ ] `[Supertest]` `GET /api/v1/providers?search=sales` → filtre appliqué sur name
- [ ] `[Supertest]` `POST /api/v1/providers` nom valide → `201` avec `ProviderResponse`
- [ ] `[Supertest]` `POST /api/v1/providers` nom valide → audit_trail contient 1 ligne avec entity_type='providers' et changed_by non NULL
- [ ] `[Supertest]` `POST /api/v1/providers` nom dupliqué → `409` + `code: "CONFLICT"`
- [ ] `[Supertest]` `POST /api/v1/providers` sans `name` → `400`
- [ ] `[Supertest]` `POST /api/v1/providers` name uniquement espaces → `400`
- [ ] `[Supertest]` `POST /api/v1/providers` avec `expiryDate` → `201` date correctement stockée
- [ ] `[Supertest]` `GET /api/v1/providers/{id}` existant → `200` avec `_count.applications` et `tags`
- [ ] `[Supertest]` `GET /api/v1/providers/{id}` UUID inexistant → `404`
- [ ] `[Supertest]` `GET /api/v1/providers/{id}/applications` → `200` liste paginée d'`ApplicationListItem`
- [ ] `[Supertest]` `GET /api/v1/providers/{id}/applications` provider inexistant → `404`
- [ ] `[Supertest]` `PATCH /api/v1/providers/{id}` changement description → `200`
- [ ] `[Supertest]` `PATCH /api/v1/providers/{id}` nom dupliqué → `409` + `code: "CONFLICT"`
- [ ] `[Supertest]` `DELETE /api/v1/providers/{id}` sans applications liées → `204`
- [ ] `[Supertest]` `DELETE /api/v1/providers/{id}` avec applications liées → `409` + `code: "DEPENDENCY_CONFLICT"` + compteurs

> **FK entrantes — test `DEPENDENCY_CONFLICT` avec Applications :**
> 1. Créer un provider (`POST /providers`)
> 2. Créer une Application liée (`POST /applications` avec `providerId` rempli) — **requiert `FS-06-BACK` `done`**
> 3. Tenter `DELETE /providers/{id}` → vérifier `409` + `code: "DEPENDENCY_CONFLICT"`

### Tests Sécurité / RBAC — Manuel ❌

- [ ] `[Manuel]` `GET /api/v1/providers` sans token → `401`
- [ ] `[Manuel]` `POST /api/v1/providers` rôle sans `providers:write` → `403`
- [ ] `[Manuel]` `PATCH /api/v1/providers/{id}` rôle sans `providers:write` → `403`
- [ ] `[Manuel]` `DELETE /api/v1/providers/{id}` rôle sans `providers:write` → `403`
- [ ] `[Manuel]` `GET /api/v1/providers/{id}/applications` sans `providers:read` → `403`

---

## 7. Contraintes Techniques

- **Audit context :** Toute écriture en base passe par `await prisma.$executeRaw\`SET LOCAL ark.current_user_id = ${userId}\`` — convention F-00 RM-02.
- **Gestion erreur P2002 :** try/catch ciblé → `ConflictException({ code: 'CONFLICT', message: '...' })`. Ne pas laisser remonter l'erreur Prisma brute.
- **Pattern suppression :** Vérifier `_count.applications` avant `delete` (RM-03).
- **Permissions :** `@RequirePermission('providers:read')` sur GET, `@RequirePermission('providers:write')` sur POST/PATCH/DELETE.
- **Validation DTO :** `@IsString()`, `@IsNotEmpty()`, `@IsOptional()`, `@MaxLength()`.
- **TagValueResponse :** Le join sur `tag_dimensions` est obligatoire pour peupler `dimensionColor` et `depth`.
- **Pas de filtrage backend par depth :** Ne jamais implémenter `deduplicateByDepth` côté NestJS.
- **Mock Prisma dans les tests unit :** `jest.mock()` — pas de base réelle.
- **Requêtes raw :** Tagged template obligatoire — jamais `Prisma.raw()` avec interpolation.
- **Migration BDD :** Documenter l'ALTER TABLE dans §1 — exécuter avant `prisma migrate dev`.

---

## 8. Commande OpenCode — Backend

```
Contexte projet ARK — Session Backend FS-03-BACK :

Stack : NestJS strict mode + Prisma ORM + PostgreSQL 16 + TypeScript strict
Structure modules : src/<domaine>/<domaine>.module.ts / .controller.ts / .service.ts / dto/

Conventions obligatoires :
- Toute écriture en base : await prisma.$executeRaw`SET LOCAL ark.current_user_id = ${userId}`
- PrismaModule est global (APP_MODULE) — ne jamais le réimporter dans un module feature
- JwtAuthGuard est global — décorer avec @Public() les seules routes publiques
- @RequirePermission() disponible — utiliser sur chaque handler controller
- Format d'erreur standard : { statusCode, code, message, timestamp, path }
  → ConflictException({ code: 'CONFLICT', message: '...' }) pour P2002
  → ConflictException({ code: 'DEPENDENCY_CONFLICT', message: '...', details: {...} }) pour suppression bloquée
- Vérification _count Prisma AVANT toute suppression — pattern RM-03 de cette spec
- P2002 intercepté dans un try/catch ciblé → ConflictException
- Requêtes raw : tagged template backtick uniquement
- Tests unit : jest.mock() sur PrismaService
- Fichier test e2e : backend/test/FS-03-providers.e2e-spec.ts

Intégration tags F-03 :
- TagsModule est @Global() — TagService injectable sans réimporter TagsModule
- getEntityTags('provider', id) retourne TOUS les entity_tags sans filtrage
- Le join sur tag_dimensions est obligatoire pour peupler dimensionColor et depth
- NE PAS implémenter deduplicateByDepth() côté backend

Migration requise avant implémentation :
```sql
ALTER TABLE providers
  ADD COLUMN description TEXT,
  ADD COLUMN comment TEXT,
  ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW(),
  ADD CONSTRAINT providers_name_key UNIQUE (name);
```

Documentation obligatoire (NFR-GOV-001) :
- À la fin de la session, recopier le contenu YAML de la section §3 (Contrat API) de cette spec dans le fichier `docs/04-Tech/openapi.yaml`
- Les paths `/providers` et `/providers/{id}` (GET/POST/PATCH/DELETE) et `/providers/{id}/applications` doivent être ajoutés/mis à jour
- Vérifier la cohérence avec les entités existantes (domains, tags)
- Ne pas générer de documentation OpenAPI/Swagger automatique — le fichier YAML central est la source de vérité

Pattern de référence NestJS : module Domains (FS-02-BACK) — s'y conformer pour la structure et le style.
Ce module débloque F-999 Item 12 (remplacement des mocks Providers dans ApplicationForm).

Implémente la feature "Providers" backend (FS-03-BACK) en respectant strictement le contrat ci-dessous.
Génère : module NestJS complet (controller, service, DTOs, module) + tests Jest unit + tests Supertest.
Ne génère PAS les tests marqués [Manuel].
Ne génère PAS de code frontend.
Ne fais aucune hypothèse non documentée. Si un point est ambigu, pose une question avant de coder.

[COLLER LE CONTENU COMPLET DE FS-03-BACK.md ICI]
```

---

## 9. Gate de Validation Backend

> À valider **avant** de passer `FS-03-FRONT` au statut `stable`.
> FS-03-FRONT reste à `draft` tant que toutes ces gates ne sont pas cochées.

| # | Gate | Vérification | Bloquant |
|---|------|--------------|----------|
| G-01 | Migration Prisma appliquée | Table `providers` avec description, comment, updated_at, contrainte UNIQUE(name) | ✅ Oui |
| G-02 | Seed permissions | `providers:read` et `providers:write` en base | ✅ Oui |
| G-03 | Tests Jest passent | `npm run test -- --testPathPattern=providers` → 0 failed | ✅ Oui |
| G-04 | Tests Supertest passent | `npm run test:e2e -- --testPathPattern=FS-03` → 0 failed | ✅ Oui |
| G-05 | Tests RBAC manuels validés | Les 5 cas [Manuel] §6 vérifiés à la main | ✅ Oui |
| G-06 | Aucune erreur TypeScript | `npm run build` → 0 error | ✅ Oui |
| G-07 | Statut mis à jour | Passer `FS-03-BACK` à `done` dans cet en-tête | ✅ Oui |
| G-08 | Revue TD backend | TD-1 à TD-6 du template vérifiés, F-999 mis à jour | ✅ Oui |
| G-09 | `_count.applications` présent | Vérifier dans `ProviderResponse` | ✅ Oui |
| G-10 | Endpoint `GET /:id/applications` | Liste paginée des apps liées fonctionnelle | ✅ Oui |
| G-11 | Test `DEPENDENCY_CONFLICT` avec Application réelle | Créer une Application via `POST /applications` puis tenter suppression | ✅ Oui |
| G-12 | F-999 Item 12 coché | Remplacement des mocks Providers dans ApplicationForm documenté | ✅ Oui |
| G-13 | Audit trail actif | `POST /providers` → vérifier ligne dans audit_trail (changed_by non NULL) | ✅ Oui |
| G-14 | `openapi.yaml` mis à jour | Paths `/providers` présents dans `docs/04-Tech/openapi.yaml` (recopiés de §3) | ✅ Oui |

---

## 10. Checklist de Validation Post-Session

- [ ] `POST /api/v1/providers` retourne `201` avec `ProviderResponse` complet
- [ ] `POST /api/v1/providers` → audit_trail.changed_by non NULL (NFR-SEC-009)
- [ ] `DELETE` avec applications liées retourne `409` + `code: "DEPENDENCY_CONFLICT"` + details
- [ ] Toutes les réponses `409` incluent le champ `code` explicite (NFR-MAINT-001)
- [ ] `name` uniquement espaces → `400`
- [ ] `GET /api/v1/providers/:id` avec tags ancêtre + descendant → les deux présents (pas de filtrage backend)
- [ ] `GET /api/v1/providers/:id/applications` retourne la liste paginée correcte
- [ ] `_count.applications` présent dans `ProviderResponse`
- [ ] Pagination fonctionnelle (page, limit, meta)
- [ ] Filtre `search` fonctionnel sur le nom
- [ ] `docs/04-Tech/openapi.yaml` mis à jour avec les paths `/providers` (NFR-GOV-001)
- [ ] Aucun `TODO / FIXME / HACK` non tracé dans le code livré
- [ ] Aucune erreur TypeScript strict
- [ ] Conventions AGENTS.md respectées

---

## 11. Revue de Dette Technique

### Gates TD

| # | Vérification | Commande / Action |
|---|------------|------------------|
| TD-1 | Aucun `TODO / FIXME / HACK` non tracé | `git grep -n "TODO\|FIXME\|HACK" -- '*.ts'` |
| TD-2 | Items F-999 activés par cette feature | Relire F-999 §2 |
| TD-3 | Checklist F-999 §4 : cases cochées | F-999 §4 |
| TD-4 | AGENTS.md : aucun pattern nouveau non documenté | Relire AGENTS.md |
| TD-5 | ARK-NFR.md : NFR impactés mis à jour | NFR-MAINT-002 (politique suppression providers) |
| TD-6 | Nouvelles décisions transverses → nouvel Item F-999 | Jugement |

### Items F-999 impactés

- **Item 12 — APIs Providers et Users mockées** : Ce backend débloque le remplacement du mock `MOCK_PROVIDERS` dans `ApplicationForm.tsx`. À vérifier dans la gate G-12 et documenter dans le Résultat de la Revue.

### Résultat de la Revue

| Champ | Valeur |
|---|------|
| **Sprint** | Sprint 2 |
| **Date de revue** | *(à compléter)* |
| **Items F-999 fermés** | Item 12 (APIs Providers remplacent les mocks) |
| **Items F-999 ouverts** | *(à compléter)* |
| **Nouveaux items F-999 créés** | *(à compléter)* |
| **NFR mis à jour** | NFR-MAINT-002 → `covered` pour providers |
| **TODOs résiduels tracés** | *(à compléter)* |
| **Statut gates TD** | *(à compléter)* |

---

## 12. Données de Seed ⚠️

> Documenter les données de démonstration à insérer dans `backend/prisma/seed.ts`. Pattern idempotent obligatoire : vérifier l'existence avant chaque insert.
> Les providers sont créés **avant** `seed-applications.ts` — sans providers, les applications sont créées sans `providerId` (champ nullable mais moins réaliste).

### Pertinence

✅ **Utile** — Le Provider est un référentiel sélectionnable dans le formulaire Application (F-999 Item 12). Un seed vide rend le sélecteur inutilisable pour les premiers tests utilisateur.

### Données de démonstration

| # | Nom | contractType | expiryDate | Description |
|---|-----|--------------|------------|-------------|
| 1 | Salesforce | SaaS | 2026-12-31 | CRM cloud leader — référence dans 25% des apps seedées |
| 2 | SAP | Licence | 2027-06-30 | ERP legacy — Temenos T24, legacy AS400 |
| 3 | Microsoft | SaaS | 2026-09-30 | 365, Azure — ERP SAP S/4HANA, CyberArk, Okta |
| 4 | Atlassian | SaaS | 2026-12-31 | Jira, Confluence — Suite DevOps |
| 5 | ServiceNow | SaaS | 2027-03-31 | ITSM, CMDB — Gestion des tickets |
| 6 | GitLab | SaaS | 2026-06-30 | DevOps CI/CD — GitLab Enterprise |
| 7 | AWS | SaaS | null | Cloud infrastructure — Snowflake DWH, Databricks, Elastic |
| 8 | Snowflake | SaaS | 2027-12-31 | Data warehouse cloud — Snowflake DWH |

### Bloc de code seed (pour seed.ts)

```typescript
// Insert sample providers if they don't exist
const sampleProviders = [
  { name: 'Salesforce', contractType: 'SaaS', expiryDate: '2026-12-31', description: 'CRM cloud leader' },
  { name: 'SAP', contractType: 'Licence', expiryDate: '2027-06-30', description: 'ERP legacy' },
  { name: 'Microsoft', contractType: 'SaaS', expiryDate: '2026-09-30', description: 'Suite Office 365 et Azure' },
  { name: 'Atlassian', contractType: 'SaaS', expiryDate: '2026-12-31', description: 'Jira, Confluence' },
  { name: 'ServiceNow', contractType: 'SaaS', expiryDate: '2027-03-31', description: 'ITSM et CMDB' },
  { name: 'GitLab', contractType: 'SaaS', expiryDate: '2026-06-30', description: 'DevOps CI/CD' },
  { name: 'AWS', contractType: 'SaaS', expiryDate: null, description: 'Infrastructure cloud' },
  { name: 'Snowflake', contractType: 'SaaS', expiryDate: '2027-12-31', description: 'Data warehouse cloud' },
];

for (const provider of sampleProviders) {
  const existing = await prisma.provider.findUnique({ where: { name: provider.name } });
  if (!existing) {
    await prisma.$executeRaw`INSERT INTO providers (id, name, contract_type, expiry_date, description) 
      VALUES (gen_random_uuid(), ${provider.name}::varchar, ${provider.contractType}::varchar, 
      ${provider.expiryDate}::date, ${provider.description}::text)`;
    console.log(`✓ Created provider: ${provider.name}`);
  }
}
console.log('Seed providers completed');
```

> **Note sur F-999 Item 8 :** Le `$executeRawUnsafe` dans `seed-applications.ts` est un anti-pattern identifié. Ne pas répliquer — utiliser le tagged template `$executeRaw` ci-dessus (conforme F-999 Item 8). Correction de `seed-applications.ts` hors périmètre de cette spec.

---

_FS-03-BACK v1.3 — ARK_