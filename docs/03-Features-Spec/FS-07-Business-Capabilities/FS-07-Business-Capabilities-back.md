# ARK — Feature Spec FS-07-BACK : Business Capabilities (Backend)

_Version 1.2 — Avril 2026_

> **Changelog v1.2 :** Amendment T-047 (2026-04-21) — Ajout du filtrage `search` et `domainId` sur l'endpoint `GET /tree`. L'arbre est élagué côté serveur : nœuds matchants + tous leurs descendants + leurs ancêtres. Suppression du filtrage client-side temporaire dans `BusinessCapabilitiesPage.tsx`. Ajout RM-12 et 5 cas de test Supertest.
>
> **Changelog v1.1 :** Amendment T-019 (2026-04-08) — Ajout des champs `criticality` (enum LOW/MEDIUM/HIGH/CRITICAL) et `technicalFit` (enum ADEQUATE/PARTIAL/INADEQUATE/LEGACY) pour répondre aux US09 et US10 de FS-07-FRONT. Migration SQL (CREATE TYPE + ALTER TABLE), ajout dans Prisma model, DTOs (Create/Update/Response/ListItem/TreeNode), seed (12 capabilities existantes alimentées). Gate bloquante pour T-018 (impl frontend).
>
> **Changelog v1.0 :** Création initiale — module Business Capabilities conforme NFR-GOV-005. Implémente le CRUD complet avec migration schéma (ajout comment, UNIQUE name, fix id default gen_random_uuid(), updatedAt @updatedAt), suppression du champ legacy `tags TEXT[]`, liaison tags F-03 polymorphe. Relation auto-référente hiérarchique (`parent_id` → self, `children[]`) avec `level` auto-calculé, prévention des références circulaires. Endpoint `GET /tree` via `WITH RECURSIVE` PostgreSQL. Hiérarchie illimitée en profondeur (conforme ARK-Product-Brief). Relation N:N `app_capability_map` sans rôle (simple liaison). Onglet Relations (`_count.applicationMappings` + `GET /:id/applications`) et enfants (`_count.children` + `GET /:id/children`). Gestion des dépendances (blocage suppression si enfants ou applications liées).

---

## En-tête

| Champ | Valeur |
|---|---|
| **ID** | FS-07-BACK |
| **Titre** | Business Capabilities — API REST Backend |
| **Priorité** | P1 |
| **Statut** | ✅ `done` *(v1.0 done 2026-04-08, v1.1 amendment T-019 pending)* |
| **Dépend de** | FS-01, **FS-06-BACK**, F-03 |
| **Spec mère** | FS-07 Business Capabilities v1.0 |
| **Spec front** | FS-07-FRONT — bloquée tant que T-019 n'est pas `done` |
| **Estimé** | 1.5 jour (v1.0) + 0.5 jour (amendment v1.1) |
| **Version** | 1.1 |

> **Note FK entrantes (N:N) :** Cette entité expose `_count.applicationMappings` et `GET /:id/applications`. Elle est référencée via la table de jonction `app_capability_map`. FS-06-BACK est requis en dépendance BACK pour implémenter les DTOs et endpoints côté Application.

> **Note hiérarchie unique :** FS-07 est la seule entité avec auto-référence hiérarchique (`parent_id` → self). Les endpoints `/tree` et `/:id/children`, les règles `level` auto-calculé, et prévention circulaire sont **spécifiques** à cette feature.

---

## 1. Objectif & Périmètre ⚠️

**Ce que cette spec fait :**

Implémenter l'API REST complète pour la gestion des Capacités Métier (Business Capabilities) : création, lecture, modification et suppression. La Business Capability représente une capacité organisationnelle permettant de mener à bien une activité métier, structurée en **hiérarchie arborescente** (capacité parent/enfants).

Le backend expose :
- CRUD complet conforme NFR-GOV-005 (5 champs socle + liaison tags F-03)
- **Hiérarchie récursive** : `parentId` → self-reference, `children[]` relation
- **Endpoint `/tree`** : arbre complet en une réponse nested via `WITH RECURSIVE` PostgreSQL
- **Endpoint `/:id/children`** : liste paginée des enfants directs
- **Endpoint `/:id/applications`** : applications liées (pagination)
- Compteurs `_count.applicationMappings` et `_count.children` dans les réponses
- `level` auto-calculé à partir de la profondeur dans l'arbre (0 = racine, puis +1 par niveau)
- Prévention des **références circulaires** (impossible de se référencer soi-même ou ses descendants)
- Blocage suppression si enfants ou applications liées
- Relation N:1 optionnelle avec Domain (`domainId`)
- **⭐ Amendment v1.1 (T-019)** : champs `criticality` et `technicalFit` (enums) pour US09/US10 frontend

**Hors périmètre :**
- Frontend — couvert par `FS-07-FRONT`
- Drag & drop pour réorganiser l'arbre hiérarchique — P2
- Bulk move/reparent multiple — P2
- Validation métier de cohérence domain/capability (p.ex. une L2 doit-elle être dans le même domain que sa L1 ?) — P2

**Migration BDD requise (v1.0) :**

```sql
-- Ajouter les champs socle manquants et corriger les défauts
ALTER TABLE business_capabilities
  ADD COLUMN IF NOT EXISTS comment TEXT,
  ALTER COLUMN id SET DEFAULT gen_random_uuid(),
  ALTER COLUMN updated_at SET DEFAULT NOW();

-- Ajouter la contrainte UNIQUE sur name (NFR-GOV-005)
ALTER TABLE business_capabilities
  ADD CONSTRAINT IF NOT EXISTS business_capabilities_name_key UNIQUE (name);

-- Supprimer le champ legacy tags TEXT[] (remplacé par entity_tags polymorphe F-03)
ALTER TABLE business_capabilities DROP COLUMN IF EXISTS tags;

-- Vérifier/corriger le DEFAULT sur business_capabilities.id
-- (Ne pas exécuter si déjà présent — vérifier avec \d business_capabilities)
-- Attendu : DEFAULT gen_random_uuid()

-- Note : le champ level reste dans le schéma mais est auto-calculé,
-- pas de NOT NULL constraint pour permettre les migrations de données
```

**Migration BDD requise (v1.1 — Amendment T-019) :**

```sql
-- Créer les types enum
CREATE TYPE "CriticalityLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
CREATE TYPE "TechnicalFitLevel" AS ENUM ('ADEQUATE', 'PARTIAL', 'INADEQUATE', 'LEGACY');

-- Ajouter les colonnes (nullable pour rétrocompatibilité)
ALTER TABLE business_capabilities
  ADD COLUMN IF NOT EXISTS criticality "CriticalityLevel",
  ADD COLUMN IF NOT EXISTS technical_fit "TechnicalFitLevel";
```

> **Note :** Ces migrations sont **idempotentes** (IF EXISTS / IF NOT EXISTS). Elles ne rompent pas si partiellement appliquées. Vérifier avec `\d business_capabilities` dans psql avant exécution.

---

> **Pattern FK entrantes (N:N) :** La Business Capability est référencée via la table de jonction `app_capability_map`. Implémentation complète avec `FS-06-BACK` done :
>
> | Niveau | Contenu | Dépendance |
> |---|---|---|
> | **BACK complet** | `_count.applicationMappings` réel + `GET /:id/applications` + test `DEPENDENCY_CONFLICT` avec Application réelle liée via map | `FS-06-BACK` requis |
>
> Les tests Supertest créent une Application de test (via `POST /applications` avec `capabilityIds[]`) pour valider le blocage de suppression.

---

## 2. Modèle BDD ⚠️

### 2.1 Schema relationnel

**Schéma BDD complet — Business Capabilities et ses relations (F-03 + FS-06 + hiérarchie)**

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
│ updated_at   TIMESTAMPTZ auto-update     │
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
│               entity_tags              │
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
                    │ via entity_type='business-capability'
                    │ entity_id = business_capabilities.id
                    │
┌───────────────────┴──────────────────────┐
│          business_capabilities           │
├──────────────────────────────────────────┤
│ id              UUID        PK            │
│ name            VARCHAR(255) NOT NULL    │
│   UNIQUE (name)                          │
│ description     TEXT        nullable       │
│ comment         TEXT        nullable       │
│ parent_id       UUID        nullable FK   │
│   → self (capability parent)             │
│ level           SMALLINT   nullable      │
│   (auto-calculé: root=0, +1 par niveau)  │
│ domain_id       UUID        nullable FK   │
│   → domains.id (optionnel)               │
│ created_at      TIMESTAMPTZ default now()│
│ updated_at      TIMESTAMPTZ auto-update  │
├──────────────────────────────────────────┤
│ → children[] (1:N self-relation)         │
│ → parent (N:1 self-relation)             │
│ → applicationMappings[] (N:N via       │
│   app_capability_map)                    │
│ → entityTags[] (polymorphe via           │
│   entity_tags)                           │
│ Suppression bloquée si:                  │
│   - children count > 0                   │
│   - applicationMappings count > 0        │
└──────────────────────────────────────────┘
       │ 1:N self-rel
       │ (parent_id)
       │
       ▼
┌──────────────────────────────────────────┐
│          (même table) enfants          │
│    (hierarchical tree structure)         │
└──────────────────────────────────────────┘
       │ N:N
       │
┌──────▼───────────────────────────────────┐
│         app_capability_map               │
├──────────────────────────────────────────┤
│ application_id  UUID   FK → applications │
│ capability_id   UUID   FK → business_cap.  │
│                                          │
│ PK (application_id, capability_id)       │
│ (pas de champ role, simple liaison N:N)    │
└──────────────────────────────────────────┘
       │
       │ N
       │
┌──────▼───────────────────────────────────┐
│            applications                  │
├──────────────────────────────────────────┤
│ id    UUID PK                            │
│ name  VARCHAR(255)                       │
│ ...                                      │
└──────────────────────────────────────────┘
```

**Vue des relations globales**

```
tag_values ──1:N──► entity_tags ◄── (entity_type='business-capability', entity_id)
                                                            ▲
                                                            │
                                   business_capabilities.id │
                                                            │
                                                            │
business_capabilities ──N:N──► applications (via app_capability_map)
         │
         │ 1:N self-ref
         ▼
   business_capabilities (children)

business_capabilities:
  - parent (N:1 self, nullable → root capability)
  - children (1:N self, via parent_id)
  - applicationMappings[] via table junction app_capability_map (sans rôle)
  - entityTags[] via polymorphisme entity_type='business-capability'
  - domain (N:1, optional)
```

### 2.2 Modèle Prisma ⚠️

```prisma
model BusinessCapability {
  id                  String               @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  name                String               @unique @db.VarChar(255)
  description         String?              @db.Text
  comment             String?              @db.Text
  parentId            String?              @map("parent_id") @db.Uuid
  level               Int?                 @db.SmallInt
  domainId            String?              @map("domain_id") @db.Uuid
  criticality         CriticalityLevel?    // ⭐ T-019 v1.1
  technicalFit        TechnicalFitLevel?   @map("technical_fit") // ⭐ T-019 v1.1
  createdAt           DateTime             @default(now()) @map("created_at") @db.Timestamptz
  updatedAt           DateTime             @updatedAt @map("updated_at") @db.Timestamptz

  applicationMappings AppCapabilityMap[]
  domain              Domain?              @relation(fields: [domainId], references: [id], onDelete: NoAction, onUpdate: NoAction)
  parent              BusinessCapability?  @relation("CapabilityHierarchy", fields: [parentId], references: [id], onUpdate: NoAction)
  children            BusinessCapability[] @relation("CapabilityHierarchy")
  entityTags          EntityTag[]

  @@index([parentId], map: "idx_bus_cap_parent")
  @@map("business_capabilities")
}

// ⭐ T-019 v1.1 — Enums pour criticality et technicalFit
enum CriticalityLevel {
  LOW
  MEDIUM
  HIGH
  CRITICAL
}

enum TechnicalFitLevel {
  ADEQUATE
  PARTIAL
  INADEQUATE
  LEGACY
}

model AppCapabilityMap {
  applicationId String             @map("application_id") @db.Uuid
  capabilityId  String             @map("capability_id") @db.Uuid
  application   Application        @relation(fields: [applicationId], references: [id], onDelete: Cascade, onUpdate: NoAction)
  capability    BusinessCapability @relation(fields: [capabilityId], references: [id], onDelete: Cascade, onUpdate: NoAction)

  @@id([applicationId, capabilityId])
  @@map("app_capability_map")
}

model Domain {
  id                  String               @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  name                String               @unique @db.VarChar(255)
  // ... autres champs
  businessCapabilities BusinessCapability[]

  @@map("domains")
}

model Application {
  id               String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  name             String   @db.VarChar(255)
  // ... autres champs
  appCapabilityMaps AppCapabilityMap[]
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
> - `BusinessCapability` suit les 5 champs socle NFR-GOV-005 (name, description, comment, createdAt, updatedAt)
> - `level` : auto-calculé par le service, nullable en DB pour flexibilité migration, non exposé dans create/update DTOs
> - `parentId` : self-reference nullable (null = racine de l'arbre)
> - `domainId` : FK optionnelle vers domains
> - **⭐ T-019 v1.1** : `criticality` et `technicalFit` : enums nullable (rétrocompatibilité avec données existantes), exposés dans create/update DTOs
> - Trigger audit `trg_audit_business_capabilities` déjà présent en base (ou créé via Prisma)
> - Champ legacy `tags TEXT[]` supprimé — remplacé par F-03 `entity_tags` polymorphe
> - Relation N:N avec Applications **sans rôle** (contrairement à providers/data-objects qui ont des rôles)

---

## 3. Contrat API (OpenAPI) ⚠️

```yaml
paths:

  /api/v1/business-capabilities:
    get:
      summary: Liste de toutes les business capabilities (flat, paginé)
      tags: [BusinessCapabilities]
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
          schema: { type: string, enum: [name, createdAt, level], default: name }
        - name: sortOrder
          in: query
          schema: { type: string, enum: [asc, desc], default: asc }
        - name: search
          in: query
          schema: { type: string }
          description: Recherche textuelle sur le nom
        - name: domainId
          in: query
          schema: { type: string, format: uuid }
          description: Filtrer par domaine
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
                      $ref: '#/components/schemas/BusinessCapabilityListItem'
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
      summary: Créer une business capability
      tags: [BusinessCapabilities]
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateBusinessCapabilityDto'
      responses:
        '201':
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/BusinessCapabilityResponse'
        '400':
          description: Validation échouée (nom vide, parentId inexistant)
        '401':
          description: Non authentifié
        '403':
          description: Permission insuffisante
        '409':
          description: Nom déjà utilisé
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

  /api/v1/business-capabilities/{id}:
    get:
      summary: Détail d'une business capability
      tags: [BusinessCapabilities]
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
                $ref: '#/components/schemas/BusinessCapabilityResponse'
        '401':
          description: Non authentifié
        '404':
          description: Business capability introuvable

    patch:
      summary: Modifier une business capability (inclut reparenting)
      tags: [BusinessCapabilities]
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
              $ref: '#/components/schemas/UpdateBusinessCapabilityDto'
      responses:
        '200':
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/BusinessCapabilityResponse'
        '400':
          description: Validation échouée (circular reference, parentId inexistant)
          content:
            application/json:
              schema:
                type: object
                properties:
                  statusCode: { type: integer, example: 400 }
                  code:       { type: string,  example: "CIRCULAR_REFERENCE" }
                  message:    { type: string }
                  timestamp:  { type: string, format: date-time }
                  path:       { type: string }
        '401':
          description: Non authentifié
        '403':
          description: Permission insuffisante
        '404':
          description: Business capability introuvable
        '409':
          description: Nom déjà utilisé
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
      summary: Supprimer une business capability
      tags: [BusinessCapabilities]
      security:
        - bearerAuth: []
      parameters:
        - name: id
          in: path
          required: true
          schema: { type: string, format: uuid }
      responses:
        '204':
          description: Business capability supprimée
        '401':
          description: Non authentifié
        '403':
          description: Permission insuffisante
        '404':
          description: Business capability introuvable
        '409':
          description: Business capability utilisée (enfants ou applications liées)
          content:
            application/json:
              schema:
                type: object
                properties:
                  statusCode: { type: integer, example: 409 }
                  code:       { type: string,  example: "DEPENDENCY_CONFLICT" }
                  message:    { type: string, example: "Business capability is used by 2 application(s) and has 3 children" }
                  details:
                    type: object
                    properties:
                      applicationsCount: { type: integer }
                      childrenCount: { type: integer }
                  timestamp:  { type: string, format: date-time }
                  path:       { type: string }

  /api/v1/business-capabilities/tree:
    get:
      summary: Arbre hiérarchique avec filtrage optionnel (élagage serveur)
      tags: [BusinessCapabilities]
      security:
        - bearerAuth: []
      parameters:
        - name: search
          in: query
          schema: { type: string }
          description: Recherche textuelle sur le nom (insensible à la casse)
        - name: domainId
          in: query
          schema: { type: string, format: uuid }
          description: Filtrer par domaine
      responses:
        '200':
          description: Arbre hiérarchique complet en structure nested
          content:
            application/json:
              schema:
                type: object
                properties:
                  data:
                    type: array
                    description: Liste des racines (parentId = null)
                    items:
                      $ref: '#/components/schemas/BusinessCapabilityTreeNode'
        '401':
          description: Non authentifié

  /api/v1/business-capabilities/{id}/children:
    get:
      summary: Liste des enfants directs (pagination)
      tags: [BusinessCapabilities]
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
                      $ref: '#/components/schemas/BusinessCapabilityListItem'
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
          description: Business capability parent introuvable

  /api/v1/business-capabilities/{id}/applications:
    get:
      summary: Liste des applications liées à une capability
      tags: [BusinessCapabilities]
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
          description: Business capability introuvable

components:
  schemas:

    BusinessCapabilityListItem:
      type: object
      properties:
        id:          { type: string, format: uuid }
        name:        { type: string }
        level:       { type: integer, example: 2, description: "Profondeur dans l'arbre (auto-calculé)" }
        domain:
          type: object
          nullable: true
          properties:
            id:   { type: string, format: uuid }
            name: { type: string }
        criticality: { type: string, enum: [LOW, MEDIUM, HIGH, CRITICAL], nullable: true, description: "⭐ T-019 v1.1" }
        technicalFit: { type: string, enum: [ADEQUATE, PARTIAL, INADEQUATE, LEGACY], nullable: true, description: "⭐ T-019 v1.1" }
        createdAt:   { type: string, format: date-time }
        _count:
          type: object
          properties:
            applicationMappings: { type: integer, example: 3 }
            children: { type: integer, example: 2 }

    BusinessCapabilityResponse:
      type: object
      properties:
        id:          { type: string, format: uuid }
        name:        { type: string }
        description: { type: string, nullable: true }
        comment:     { type: string, nullable: true }
        level:       { type: integer, example: 2, description: "Profondeur dans l'arbre" }
        parentId:    { type: string, format: uuid, nullable: true }
        parent:
          type: object
          nullable: true
          properties:
            id:   { type: string, format: uuid }
            name: { type: string }
        domainId:    { type: string, format: uuid, nullable: true }
        domain:
          type: object
          nullable: true
          properties:
            id:   { type: string, format: uuid }
            name: { type: string }
        criticality: { type: string, enum: [LOW, MEDIUM, HIGH, CRITICAL], nullable: true, description: "⭐ T-019 v1.1" }
        technicalFit: { type: string, enum: [ADEQUATE, PARTIAL, INADEQUATE, LEGACY], nullable: true, description: "⭐ T-019 v1.1" }
        createdAt:   { type: string, format: date-time }
        updatedAt:   { type: string, format: date-time }
        _count:
          type: object
          properties:
            applicationMappings: { type: integer, example: 3 }
            children: { type: integer, example: 2 }
        tags:
          type: array
          description: Tous les entity_tags sans filtrage (déduplication côté frontend)
          items:
            $ref: '#/components/schemas/EntityTagResponse'

    BusinessCapabilityTreeNode:
      type: object
      description: Nœud de l'arbre hiérarchique (structure récursive nested)
      properties:
        id:          { type: string, format: uuid }
        name:        { type: string }
        level:       { type: integer, example: 2 }
        domain:
          type: object
          nullable: true
          properties:
            id:   { type: string, format: uuid }
            name: { type: string }
        criticality: { type: string, enum: [LOW, MEDIUM, HIGH, CRITICAL], nullable: true, description: "⭐ T-019 v1.1" }
        technicalFit: { type: string, enum: [ADEQUATE, PARTIAL, INADEQUATE, LEGACY], nullable: true, description: "⭐ T-019 v1.1" }
        _count:
          type: object
          properties:
            applicationMappings: { type: integer, example: 3 }
            children: { type: integer, example: 2 }
        children:
          type: array
          description: Liste récursive des enfants (même structure TreeNode)
          items:
            $ref: '#/components/schemas/BusinessCapabilityTreeNode'

    CreateBusinessCapabilityDto:
      type: object
      required: [name]
      properties:
        name:
          type: string
          minLength: 1
          maxLength: 255
          example: "Financial Planning"
        description:
          type: string
          nullable: true
          maxLength: 2000
        comment:
          type: string
          nullable: true
          maxLength: 2000
        parentId:
          type: string
          format: uuid
          nullable: true
          description: "ID de la capability parent (null = racine)"
        domainId:
          type: string
          format: uuid
          nullable: true
          description: "Domaine optionnel"
        criticality:
          type: string
          enum: [LOW, MEDIUM, HIGH, CRITICAL]
          nullable: true
          description: "⭐ T-019 v1.1 — Niveau de criticité métier"
        technicalFit:
          type: string
          enum: [ADEQUATE, PARTIAL, INADEQUATE, LEGACY]
          nullable: true
          description: "⭐ T-019 v1.1 — Maturité technique"

    UpdateBusinessCapabilityDto:
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
        parentId:
          type: string
          format: uuid
          nullable: true
          description: "Reparenting possible (null = devenir racine)"
        domainId:
          type: string
          format: uuid
          nullable: true
        criticality:
          type: string
          enum: [LOW, MEDIUM, HIGH, CRITICAL]
          nullable: true
          description: "⭐ T-019 v1.1 — Niveau de criticité métier"
        technicalFit:
          type: string
          enum: [ADEQUATE, PARTIAL, INADEQUATE, LEGACY]
          nullable: true
          description: "⭐ T-019 v1.1 — Maturité technique"

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

## 4. Règles Métier Backend ⚠️

- **RM-01 — Nom unique :** Deux business capabilities ne peuvent pas avoir le même nom. `409` + code `"CONFLICT"` + message `"Business capability name already in use"`. Intercepter l'erreur Prisma `P2002` dans un try/catch ciblé.

- **RM-02 — Nom non vide :** `name` obligatoire, non vide, non uniquement espaces. `@IsNotEmpty()` + `@Transform(({ value }) => value?.trim())` avant validation. Les espaces uniquement sont rejetés comme vide → `400`.

- **RM-03 — Suppression bloquée si entités liées :**

```typescript
async remove(id: string): Promise<void> {
  const capability = await this.prisma.businessCapability.findUnique({
    where: { id },
    select: {
      _count: {
        select: {
          children: true,
          applicationMappings: true
        }
      }
    }
  });
  if (!capability) throw new NotFoundException('Business capability not found');

  const { children, applicationMappings } = capability._count;
  if (children > 0 || applicationMappings > 0) {
    throw new ConflictException({
      code: 'DEPENDENCY_CONFLICT',
      message: `Business capability is used by ${applicationMappings} application(s) and has ${children} children`,
      details: {
        applicationsCount: applicationMappings,
        childrenCount: children
      }
    });
  }
  await this.prisma.businessCapability.delete({ where: { id } });
}
```

> **Pattern FK entrantes (N:N) :** Le compteur `applicationMappings` vérifie les liens dans la table de jonction. Le compteur `children` vérifie les enfants directs. Nécessite `FS-06-BACK` done pour être testé avec des données réelles.

- **RM-04 — Droits requis :** `business-capabilities:read` sur GET. `business-capabilities:write` sur POST/PATCH/DELETE.

- **RM-05 — Pas de soft delete :** Suppression physique après vérification RM-03.

- **RM-06 — Endpoint applications liées :** `GET /:id/applications` retourne une liste paginée d'`ApplicationListItem` (même schéma que `GET /applications`). La capability doit exister → `404` si UUID inexistant.

- **RM-07 — Level auto-calculé :** Le champ `level` n'est pas exposé dans les DTOs de création/modification. Il est calculé automatiquement par le backend :
  - Si `parentId = null` → `level = 0` (racine)
  - Si `parentId != null` → `level = parent.level + 1`
  - En cas de reparenting (PATCH `parentId`), recalculer le `level` et **cascader** le recalcul sur tous les descendants.

- **RM-08 — Prévention référence circulaire :** Lors d'un PATCH `parentId`, vérifier que le nouveau parent n'est pas :
  - L'entité elle-même
  - Un descendant de l'entité (circular reference)
  
  En cas de violation → `400` + code `"CIRCULAR_REFERENCE"` + message `"Cannot set parent to self or descendant (circular reference)"`.

- **RM-09 — Validation parentId :** Si fourni, `parentId` doit référencer une capability existante → `404` si inexistant.

- **RM-10 — Validation domainId :** Si fourni, `domainId` doit référencer un domain existant → `404` si inexistant.

- **RM-11 — Endpoint `/tree` WITH RECURSIVE :** Requête SQL récursive pour retourner l'arbre complet. Structure de réponse : tableau de racines (`parentId = null`), chaque nœud contenant ses enfants nested.

- **RM-12 — Filtrage `/tree` par search et domainId (T-047) :** Quand au moins un des query params `search` ou `domainId` est fourni, l'arbre est **élagué côté serveur** :

  1. **Identification des nœuds matchants** : `name ILIKE '%search%'` (insensible à la casse) ET/OU `domainId = valeur`. Les filtres se combinent en AND.
  2. **Inclusion des ancêtres** : pour chaque nœud matchant, remonter la chaîne des `parentId` jusqu'à la racine — ces ancêtres sont inclus pour conserver la structure hiérarchique.
  3. **Inclusion de tous les descendants** : pour chaque nœud matchant, inclure récursivement tous ses enfants (et petits-enfants, etc.) — comportement intuitif : si un L1 matche, on voit tout son sous-arbre.
  4. **Élagage** : les nœuds qui ne sont ni matchants, ni ancêtres, ni descendants sont exclus de la réponse.
  5. **Sans filtre** : comportement inchangé — retourne l'arbre complet.

---

## 5. Comportements Backend par Cas d'Usage

**Nominal :**
- `GET /api/v1/business-capabilities` authentifié → `200` avec tableau paginé (vide = `[]`)
- `POST /api/v1/business-capabilities` valide (sans `parentId`) → `201` avec `level = 0`
- `POST /api/v1/business-capabilities` valide (avec `parentId`) → `201` avec `level = parent.level + 1`
- `PATCH /api/v1/business-capabilities/{id}` reparenting valide → `200` avec nouveau `level` et recalcul en cascade sur descendants
- `DELETE /api/v1/business-capabilities/{id}` sans dépendances → `204`
- `GET /api/v1/business-capabilities/tree` → `200` avec arbre nested complet
- `GET /api/v1/business-capabilities/{id}/children` → `200` liste paginée des enfants directs
- `GET /api/v1/business-capabilities/{id}/applications` → `200` liste paginée des applications liées

**Erreurs :**
- `POST` sans `name` → `400`
- `POST` `name` uniquement espaces → `400`
- `POST` / `PATCH` nom dupliqué → `409` + `code: "CONFLICT"`
- `POST` / `PATCH` `parentId` inexistant → `404`
- `POST` / `PATCH` `domainId` inexistant → `404`
- `PATCH` reparenting circulaire (`parentId` = self ou descendant) → `400` + `code: "CIRCULAR_REFERENCE"`
- `GET` / `PATCH` / `DELETE` UUID inexistant → `404`
- `DELETE` avec enfants ou applications liées → `409` + `code: "DEPENDENCY_CONFLICT"` + compteurs dans `details`
- Toute route sans token → `401`
- Route `write` sans permission → `403`

---

## 6. Structure de Fichiers Backend

```
backend/src/business-capabilities/
├── business-capabilities.module.ts
├── business-capabilities.controller.ts
├── business-capabilities.service.ts
├── business-capabilities.service.spec.ts      ← tests unit Jest
└── dto/
    ├── create-business-capability.dto.ts
    ├── update-business-capability.dto.ts
    └── query-business-capabilities.dto.ts       ← pagination/filtres

backend/test/
└── FS-07-business-capabilities.e2e-spec.ts    ← tests Supertest
```

---

## 6.1 Integration with Tags (F-03)

Les Business Capabilities supportent le système de tags dimensionnels via la relation polymorphe `EntityTag`.

**Principe de responsabilité :**

> Le backend retourne **l'intégralité** des `entity_tags` d'une capability, sans filtrage ni déduplication. La déduplication par profondeur (F-03 RM-11) est une règle d'affichage **côté frontend** appliquée par `TagChipList`.

**Endpoints impliqués :**

- **GET /api/v1/business-capabilities** — Retourne `tags` pour chaque capability (chargé via join)
- **GET /api/v1/business-capabilities/:id** — Retourne la capability avec le tableau `tags`
- **PUT /tags/entity/business-capability/:id** — Endpoint F-03 pour mettre à jour les tags

**Service pattern:**

```typescript
async findOne(id: string): Promise<BusinessCapabilityWithTags> {
  const capability = await this.prisma.businessCapability.findUnique({
    where: { id },
    include: { _count: { select: { children: true, applicationMappings: true } } }
  });
  if (!capability) throw new NotFoundException();

  const tags = await this.tagService.getEntityTags('business-capability', id);
  return { ...capability, tags };
}
```

---

## 7. Tests Backend ⚠️

> À remplir exhaustivement — OpenCode génère les tests à partir de cette section.

### Outil par niveau

| Niveau | Outil | Fichier cible | Délégable à OpenCode |
|---|---|---|---|
| Unit (services NestJS) | **Jest** | `src/business-capabilities/business-capabilities.service.spec.ts` | ✅ Oui |
| API / contrat HTTP | **Supertest** | `test/FS-07-business-capabilities.e2e-spec.ts` | ✅ Oui |
| Sécurité / RBAC | **Supertest** | `test/FS-07-business-capabilities.e2e-spec.ts` | ❌ **Manuel** |

> **Règle absolue :** Les tests RBAC ne sont jamais délégués à OpenCode.

### Tests Jest — Unit

- [ ] `[Jest]` `BusinessCapabilitiesService.findAll()` retourne un objet paginé `{ data, meta }`
- [ ] `[Jest]` `BusinessCapabilitiesService.findAll()` avec filtre `search` → recherche textuelle sur `name`
- [ ] `[Jest]` `BusinessCapabilitiesService.findAll()` avec filtre `domainId` → filtrage par domaine
- [ ] `[Jest]` `BusinessCapabilitiesService.findTree()` retourne l'arbre nested complet
- [ ] `[Jest]` `BusinessCapabilitiesService.create()` avec `parentId = null` → `level = 0`
- [ ] `[Jest]` `BusinessCapabilitiesService.create()` avec `parentId` valide → `level = parent.level + 1`
- [ ] `[Jest]` `BusinessCapabilitiesService.create()` lève `ConflictException` sur erreur Prisma `P2002`
- [ ] `[Jest]` `BusinessCapabilitiesService.findOne()` retourne la capability avec tags et `_count`
- [ ] `[Jest]` `BusinessCapabilitiesService.findOne()` lève `NotFoundException` si UUID inexistant
- [ ] `[Jest]` `BusinessCapabilitiesService.getChildren()` retourne la liste paginée des enfants
- [ ] `[Jest]` `BusinessCapabilitiesService.getApplications()` retourne la liste paginée des apps liées
- [ ] `[Jest]` `BusinessCapabilitiesService.update()` reparenting valide → recalcule `level` et cascade sur descendants
- [ ] `[Jest]` `BusinessCapabilitiesService.update()` reparenting circulaire → lève `BadRequestException`
- [ ] `[Jest]` `BusinessCapabilitiesService.remove()` lève `NotFoundException` si UUID inexistant
- [ ] `[Jest]` `BusinessCapabilitiesService.remove()` lève `ConflictException` si enfants > 0
- [ ] `[Jest]` `BusinessCapabilitiesService.remove()` lève `ConflictException` si applications liées
- [ ] `[Jest]` `BusinessCapabilitiesService.remove()` appelle `prisma.businessCapability.delete()` si aucune dépendance
- [ ] `[Jest]` `BusinessCapabilitiesService.calculateLevel()` retourne 0 pour racine
- [ ] `[Jest]` `BusinessCapabilitiesService.calculateLevel()` retourne niveau correct pour enfant

### Tests Supertest — Contrat API

- [ ] `[Supertest]` `GET /api/v1/business-capabilities` authentifié → `200` avec objet paginé
- [ ] `[Supertest]` `GET /api/v1/business-capabilities` liste vide → `200` avec `{ data: [], meta: {...} }`
- [ ] `[Supertest]` `GET /api/v1/business-capabilities?search=finance` → filtre appliqué sur name
- [ ] `[Supertest]` `GET /api/v1/business-capabilities?domainId=xxx` → filtre appliqué
- [ ] `[Supertest]` `POST /api/v1/business-capabilities` racine (sans parentId) → `201` avec `level: 0`
- [ ] `[Supertest]` `POST /api/v1/business-capabilities` avec parentId → `201` avec `level` auto-calculé
- [ ] `[Supertest]` `POST /api/v1/business-capabilities` nom valide → `201` avec `BusinessCapabilityResponse`
- [ ] `[Supertest]` `POST /api/v1/business-capabilities` nom valide → audit_trail contient 1 ligne avec entity_type='business_capabilities' et changed_by non NULL
- [ ] `[Supertest]` `POST /api/v1/business-capabilities` nom dupliqué → `409` + `code: "CONFLICT"`
- [ ] `[Supertest]` `POST /api/v1/business-capabilities` sans `name` → `400`
- [ ] `[Supertest]` `POST /api/v1/business-capabilities` name uniquement espaces → `400`
- [ ] `[Supertest]` `POST /api/v1/business-capabilities` avec `domainId` inexistant → `404`
- [ ] `[Supertest]` `GET /api/v1/business-capabilities/{id}` existant → `200` avec `_count` et `tags`
- [ ] `[Supertest]` `GET /api/v1/business-capabilities/{id}` UUID inexistant → `404`
- [ ] `[Supertest]` `GET /api/v1/business-capabilities/{id}/children` → `200` liste paginée
- [ ] `[Supertest]` `GET /api/v1/business-capabilities/{id}/applications` → `200` liste paginée
- [ ] `[Supertest]` `GET /api/v1/business-capabilities/tree` → `200` avec structure arborescente
- [ ] `[Supertest]` `GET /api/v1/business-capabilities/tree?search=Finance` → `200` arbre élagué (nœuds matchants + descendants + ancêtres uniquement)
- [ ] `[Supertest]` `GET /api/v1/business-capabilities/tree?domainId=xxx` → `200` arbre élagué par domaine
- [ ] `[Supertest]` `GET /api/v1/business-capabilities/tree?search=Finance&domainId=xxx` → `200` arbre élagué par combinaison AND des filtres
- [ ] `[Supertest]` `GET /api/v1/business-capabilities/tree?search=ZZZ` → `200` avec `{ data: [] }` (aucun match)
- [ ] `[Supertest]` `GET /api/v1/business-capabilities/tree` sans filtre → `200` arbre complet (comportement inchangé)
- [ ] `[Supertest]` `PATCH /api/v1/business-capabilities/{id}` changement nom → `200`
- [ ] `[Supertest]` `PATCH /api/v1/business-capabilities/{id}` reparenting valide → `200` avec nouveau `level`
- [ ] `[Supertest]` `PATCH /api/v1/business-capabilities/{id}` reparenting circulaire → `400` + `code: "CIRCULAR_REFERENCE"`
- [ ] `[Supertest]` `PATCH /api/v1/business-capabilities/{id}` nom dupliqué → `409` + `code: "CONFLICT"`
- [ ] `[Supertest]` `DELETE /api/v1/business-capabilities/{id}` sans dépendances → `204`
- [ ] `[Supertest]` `DELETE /api/v1/business-capabilities/{id}` avec enfants → `409` + `code: "DEPENDENCY_CONFLICT"` + childrenCount
- [ ] `[Supertest]` `DELETE /api/v1/business-capabilities/{id}` avec applications → `409` + `code: "DEPENDENCY_CONFLICT"` + applicationsCount

> **FK entrantes — test `DEPENDENCY_CONFLICT` avec Applications :**
> 1. Créer une capability (`POST /business-capabilities`)
> 2. Créer une Application liée (`POST /applications` avec `capabilityIds[]` rempli) — **requiert `FS-06-BACK` `done`**
> 3. Tenter `DELETE /business-capabilities/{id}` → vérifier `409` + `code: "DEPENDENCY_CONFLICT"`

> **Audit trail — test obligatoire (NFR-SEC-009) :** Le trigger `fn_audit_trigger()` est actif sur la table `business_capabilities`. Tout `INSERT` sans `SET LOCAL ark.current_user_id` positionné par le middleware génère un rollback silencieux (voir AGENTS.md). Ce test Supertest vérifie que le middleware audit context est correctement câblé et que le trigger remplit bien le champ `changed_by`.
>
> Format du test : après un `POST /business-capabilities` valide, requêter `audit_trail` sur `entity_type='business_capabilities'` et `entity_id=[id_créée]` → vérifier `changed_by IS NOT NULL`.

### Tests Sécurité / RBAC — Manuel ❌

> À écrire et valider à la main. Ne pas déléguer à OpenCode.

- [ ] `[Manuel]` `GET /api/v1/business-capabilities` sans token → `401`
- [ ] `[Manuel]` `GET /api/v1/business-capabilities/tree` sans token → `401`
- [ ] `[Manuel]` `POST /api/v1/business-capabilities` rôle sans `business-capabilities:write` → `403`
- [ ] `[Manuel]` `PATCH /api/v1/business-capabilities/{id}` rôle sans `business-capabilities:write` → `403`
- [ ] `[Manuel]` `DELETE /api/v1/business-capabilities/{id}` rôle sans `business-capabilities:write` → `403`
- [ ] `[Manuel]` `GET /api/v1/business-capabilities/{id}/children` sans `business-capabilities:read` → `403`
- [ ] `[Manuel]` `GET /api/v1/business-capabilities/{id}/applications` sans `business-capabilities:read` → `403`

---

## 8. Commande OpenCode — Backend ⚠️

> Copier-coller intégralement en début de session OpenCode.
> Ne pas remplacer les conventions par un pointeur vers AGENTS.md — OpenCode doit les recevoir inline.

```
Contexte projet ARK — Session Backend FS-07-BACK :

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
  → BadRequestException({ code: 'CIRCULAR_REFERENCE', message: '...' }) pour référence circulaire
- Vérification _count Prisma AVANT toute suppression — pattern RM-03 de cette spec
- P2002 intercepté dans un try/catch ciblé → ConflictException — ne jamais laisser remonter l'erreur Prisma brute
- Requêtes raw : tagged template backtick uniquement — jamais Prisma.raw() avec interpolation
- Tests unit : jest.mock() sur PrismaService — pas de base réelle
- Fichier test e2e : backend/test/FS-07-business-capabilities.e2e-spec.ts
- Tests DEPENDENCY_CONFLICT avec Applications : créer une Application réelle en base (POST /applications) dans le beforeEach du test — ne pas mocker

Intégration tags F-03 :
- TagsModule est @Global() — TagService injectable sans réimporter TagsModule
- getEntityTags('business-capability', id) retourne TOUS les entity_tags sans filtrage
- Le join sur tag_dimensions est obligatoire pour peupler dimensionColor et depth
- NE PAS implémenter deduplicateByDepth() côté backend

Migration requise avant implémentation :
```sql
ALTER TABLE business_capabilities
  ADD COLUMN IF NOT EXISTS comment TEXT,
  ALTER COLUMN id SET DEFAULT gen_random_uuid(),
  ALTER COLUMN updated_at SET DEFAULT NOW();

ALTER TABLE business_capabilities
  ADD CONSTRAINT IF NOT EXISTS business_capabilities_name_key UNIQUE (name);

ALTER TABLE business_capabilities DROP COLUMN IF EXISTS tags;
```

Spécificités FS-07 (hiérarchie récursive) :

**1. Calcul du level (RM-07) :**
```typescript
// Dans create() et update() quand parentId change
async calculateLevel(parentId: string | null): Promise<number> {
  if (!parentId) return 0;
  const parent = await this.prisma.businessCapability.findUnique({
    where: { id: parentId },
    select: { level: true }
  });
  if (!parent) throw new NotFoundException('Parent not found');
  return (parent.level ?? 0) + 1;
}
```

**2. Vérification circular reference (RM-08) :**
```typescript
// Dans update() quand parentId est fourni
async isDescendant(ancestorId: string, descendantId: string): Promise<boolean> {
  if (ancestorId === descendantId) return true;
  // WITH RECURSIVE pour vérifier si descendantId est dans la descendance d'ancestorId
  const result = await this.prisma.$queryRaw<{ exists: boolean }[]>`
    WITH RECURSIVE descendants AS (
      SELECT id, parent_id FROM business_capabilities WHERE id = ${descendantId}::uuid
      UNION ALL
      SELECT c.id, c.parent_id FROM business_capabilities c
      INNER JOIN descendants d ON c.parent_id = d.id
    )
    SELECT EXISTS(SELECT 1 FROM descendants WHERE id = ${ancestorId}::uuid) as exists
  `;
  return result[0]?.exists ?? false;
}

// Dans update()
if (parentId && await this.isDescendant(parentId, id)) {
  throw new BadRequestException({
    code: 'CIRCULAR_REFERENCE',
    message: 'Cannot set parent to self or descendant (circular reference)'
  });
}
```

**3. Cascading level recalculation :**
```typescript
// Après reparenting, recalculer le level de tous les descendants
async recalculateLevelsRecursively(rootId: string): Promise<void> {
  const root = await this.prisma.businessCapability.findUnique({
    where: { id: rootId },
    select: { level: true }
  });
  if (!root) return;
  // WITH RECURSIVE pour mettre à jour tous les descendants
  await this.prisma.$executeRaw`
    WITH RECURSIVE descendants AS (
      SELECT id, parent_id, ${root.level} + 1 as new_level 
      FROM business_capabilities WHERE parent_id = ${rootId}::uuid
      UNION ALL
      SELECT c.id, c.parent_id, d.new_level + 1
      FROM business_capabilities c
      INNER JOIN descendants d ON c.parent_id = d.id
    )
    UPDATE business_capabilities bc
    SET level = d.new_level
    FROM descendants d
    WHERE bc.id = d.id
  `;
}
```

**4. Requête WITH RECURSIVE pour /tree (RM-11) :**
```typescript
async findTree(): Promise<BusinessCapabilityTreeNode[]> {
  // Récupérer d'abord toutes les capabilities
  const allCapabilities = await this.prisma.businessCapability.findMany({
    include: {
      domain: { select: { id: true, name: true } },
      _count: { select: { children: true, applicationMappings: true } }
    },
    orderBy: { name: 'asc' }
  });
  
  // Construire l'arbre en mémoire (plus efficace que N+1 queries)
  const map = new Map(allCapabilities.map(c => [c.id, { ...c, children: [] }]));
  const roots: BusinessCapabilityTreeNode[] = [];
  
  for (const cap of allCapabilities) {
    const node = map.get(cap.id)!;
    if (cap.parentId) {
      const parent = map.get(cap.parentId);
      if (parent) parent.children.push(node);
    } else {
      roots.push(node);
    }
  }
  
  return roots;
}
```

**5. Suppression avec 2 compteurs (RM-03) :**
Vérifier `children` ET `applicationMappings` avant delete.

Documentation obligatoire (NFR-GOV-001) :
- À la fin de la session, recopier le contenu YAML de la section §3 (Contrat API) de cette spec dans le fichier `docs/04-Tech/openapi.yaml`
  en remplaçant la section `paths:` correspondante
  OU en ajoutant les nouveaux paths si l'entité n'existait pas
- Ne pas générer de documentation OpenAPI/Swagger automatique — le fichier YAML central est la source de vérité

Pattern de référence NestJS : module Domains (FS-02-BACK) — s'y conformer pour la structure et le style.

Implémente la feature "Business Capabilities" backend (FS-07-BACK) en respectant strictement le contrat ci-dessous.
Génère : module NestJS complet (controller, service, DTOs, module) + tests Jest unit + tests Supertest.
Ne génère PAS les tests marqués [Manuel].
Ne génère PAS de code frontend.
Ne fais aucune hypothèse non documentée. Si un point est ambigu, pose une question avant de coder.

[COLLER LE CONTENU COMPLET DE FS-07-BACK.md ICI]
```

---

## 9. Gate de Validation Backend ⚠️

> À valider **avant** de passer `FS-07-FRONT` au statut `stable`.
> FS-07-FRONT reste à `draft` tant que toutes ces gates ne sont pas cochées.

| # | Gate | Vérification | Bloquant |
|---|---|---|---|
| G-01 | Migration Prisma appliquée | Table `business_capabilities` avec comment, UNIQUE(name), id gen_random_uuid(), updatedAt @updatedAt, tags supprimé | ✅ Oui |
| G-02 | Seed permissions | `business-capabilities:read` et `business-capabilities:write` en base | ✅ Oui |
| G-03 | Tests Jest passent | `npm run test -- --testPathPattern=business-capabilities` → 0 failed | ✅ Oui |
| G-04 | Tests Supertest passent | `npm run test:e2e -- --testPathPattern=FS-07` → 0 failed | ✅ Oui |
| G-05 | Tests RBAC manuels validés | Les 7 cas [Manuel] §7 vérifiés à la main | ✅ Oui |
| G-06 | Aucune erreur TypeScript | `npm run build` → 0 error | ✅ Oui |
| G-07 | Statut mis à jour | Passer `FS-07-BACK` à `done` dans cet en-tête | ✅ Oui |
| G-08 | Revue TD backend | TD-1 à TD-6 vérifiés, F-999 mis à jour | ✅ Oui |
| G-09 | `_count.applicationMappings` et `_count.children` présents | Vérifier dans `BusinessCapabilityResponse` | ✅ Oui |
| G-10 | Endpoint `GET /:id/applications` | Liste paginée des apps liées fonctionnelle | ✅ Oui |
| G-11 | Endpoint `GET /:id/children` | Liste paginée des enfants fonctionnelle | ✅ Oui |
| G-12 | Endpoint `GET /tree` | Retourne un arbre nested complet | ✅ Oui |
| G-13 | Test `DEPENDENCY_CONFLICT` avec Application réelle | Créer une Application via `POST /applications` puis tenter suppression | ✅ Oui |
| G-14 | Level auto-calculé vérifié | Créer racine (level=0), créer enfant (level=1), reparenter (recalcul) | ✅ Oui |
| G-15 | Circular reference bloquée | PATCH avec parentId descendant → `400 CIRCULAR_REFERENCE` | ✅ Oui |
| G-16 | Audit trail actif | `POST /business-capabilities` → vérifier ligne dans audit_trail (changed_by non NULL) | ✅ Oui |
| G-17 | `openapi.yaml` mis à jour | Paths `/business-capabilities` présents dans `docs/04-Tech/openapi.yaml` (recopiés de §3) | ✅ Oui |

---

## 10. Checklist de Validation Post-Session

> À compléter après génération OpenCode, avant de cocher les gates §9.

- [ ] `POST /api/v1/business-capabilities` racine → `201` avec `level: 0`
- [ ] `POST /api/v1/business-capabilities` avec parent → `201` avec `level` auto
- [ ] `POST /api/v1/business-capabilities` → audit_trail.changed_by non NULL (NFR-SEC-009)
- [ ] `PATCH` reparenting → `200` avec nouveau `level` et cascade descendants
- [ ] `PATCH` reparenting circulaire → `400 CIRCULAR_REFERENCE`
- [ ] `DELETE` avec enfants → `409 DEPENDENCY_CONFLICT` + childrenCount
- [ ] `DELETE` avec applications → `409 DEPENDENCY_CONFLICT` + applicationsCount
- [ ] `GET /tree` → structure arborescente complète (nested children)
- [ ] `GET /:id/children` → enfants directs paginés
- [ ] `GET /:id/applications` → applications liées paginées
- [ ] `GET /:id` retourne `parent` et `domain` populés
- [ ] `_count.applicationMappings` et `_count.children` présents dans les réponses
- [ ] Nom unique global fonctionnel (409 CONFLICT)
- [ ] `domainId` validation → 404 si inexistant
- [ ] `parentId` validation → 404 si inexistant
- [ ] Tags F-03 retournés sans filtrage
- [ ] `docs/04-Tech/openapi.yaml` mis à jour avec les paths `/business-capabilities` (NFR-GOV-001)
- [ ] Aucun `TODO / FIXME / HACK` non tracé dans le code livré
- [ ] Aucune erreur TypeScript strict

---

## 11. Revue de Dette Technique *(gate de fin de sprint — obligatoire)* ⚠️

> À remplir **après** implémentation backend, avant de clore la partie backend du sprint.

### Gates TD

| # | Vérification | Commande / Action |
|---|---|---|
| TD-1 | Aucun `TODO / FIXME / HACK` non tracé dans le code livré | `git grep -n "TODO\|FIXME\|HACK" -- '*.ts'` |
| TD-2 | Items F-999 activés par cette feature : statut mis à jour | Relire F-999 §2 |
| TD-3 | Checklist F-999 §4 : cases cochées pour les items de ce sprint | F-999 §4 |
| TD-4 | AGENTS.md : aucun pattern nouveau non documenté introduit | Relire AGENTS.md |
| TD-5 | ARK-NFR.md : NFR impactés mis à jour (`missing` → `covered` / `partial`) | ARK-NFR.md NFR-GOV-005 |
| TD-6 | Nouvelles décisions transverses → nouvel Item F-999 créé si applicable | Jugement |

### Items F-999 impactés

- **Item 8 — Requêtes raw SQL** : Cette feature utilise intensivement `$executeRaw` pour WITH RECURSIVE et cascading updates. À vérifier que le pattern tagged template est respecté partout (pas de `$executeRawUnsafe`).
- **Item potentiel nouveau** : Pattern hiérarchie récursive (self-relation + level auto + circular ref check) — si réutilisable pour d'autres entités futures, documenter comme pattern dans AGENTS.md.

### Résultat de la Revue

| Champ | Valeur |
|---|---|
| **Sprint** | Sprint 3 |
| **Date de revue** | *(à compléter)* |
| **Items F-999 fermés** | *(à compléter)* |
| **Items F-999 ouverts** | *(à compléter)* |
| **Nouveaux items F-999 créés** | *(à compléter si pattern hiérarchie générique)* |
| **NFR mis à jour** | NFR-GOV-005 → `covered` pour business_capabilities |
| **TODOs résiduels tracés** | *(à compléter)* |
| **Statut gates TD** | *(à compléter)* |

---

## 12. Données de Seed ⚠️

> Documenter ici les données de démonstration à insérer dans `backend/prisma/seed.ts`.
> Pattern obligatoire : vérifier existence avant insert (idempotent).
> S'assurer que ces données sont créées AVANT les seeds dépendants.

### Pertinence

✅ **Utile** — Les Business Capabilities sont des référentiels sélectionnables dans le formulaire Application (capacités métier réalisées par l'app). Un seed avec hiérarchie permet de tester l'écran arbre dès le premier démarrage.

### Données de démonstration (Arbre hiérarchique 3-4 niveaux)

| # | Nom | Level | Parent | Domain | Description |
|---|-----|-------|--------|--------|-------------|
| 1 | Strategy & Planning | 0 | — | — | Capacités stratégiques de niveau 0 |
| 2 | Financial Planning | 1 | Strategy & Planning | Finance | Planification financière annuelle |
| 3 | Budget Management | 2 | Financial Planning | Finance | Gestion des budgets opérationnels |
| 4 | Revenue Forecasting | 2 | Financial Planning | Finance | Prévisions de revenus |
| 5 | Portfolio Management | 1 | Strategy & Planning | IT | Gestion du portefeuille projets |
| 6 | Customer Engagement | 0 | — | — | Capacités client de niveau 0 |
| 7 | Sales Management | 1 | Customer Engagement | Sales | Gestion des ventes et commerciaux |
| 8 | Lead Generation | 2 | Sales Management | Marketing | Génération de leads |
| 9 | Customer Service | 1 | Customer Engagement | Support | Service client et support |
| 10 | Technology Management | 0 | — | — | Capacités IT de niveau 0 |
| 11 | Infrastructure Management | 1 | Technology Management | IT | Gestion infrastructure on-premise et cloud |
| 12 | Application Development | 1 | Technology Management | IT | Développement et maintenance applicative |

### Bloc de code seed (pour seed.ts)

```typescript
// Seed business capabilities with hierarchical structure
// First pass: create all capabilities without parent references
const sampleCapabilities = [
  // Level 0 (roots)
  { name: 'Strategy & Planning', level: 0, parentName: null, domainName: null, description: 'Capacités stratégiques de niveau 0' },
  { name: 'Customer Engagement', level: 0, parentName: null, domainName: null, description: 'Capacités client de niveau 0' },
  { name: 'Technology Management', level: 0, parentName: null, domainName: null, description: 'Capacités IT de niveau 0' },
  // Level 1
  { name: 'Financial Planning', level: 1, parentName: 'Strategy & Planning', domainName: 'Finance', description: 'Planification financière annuelle' },
  { name: 'Portfolio Management', level: 1, parentName: 'Strategy & Planning', domainName: 'IT', description: 'Gestion du portefeuille projets' },
  { name: 'Sales Management', level: 1, parentName: 'Customer Engagement', domainName: 'Sales', description: 'Gestion des ventes et commerciaux' },
  { name: 'Customer Service', level: 1, parentName: 'Customer Engagement', domainName: 'Support', description: 'Service client et support' },
  { name: 'Infrastructure Management', level: 1, parentName: 'Technology Management', domainName: 'IT', description: 'Gestion infrastructure on-premise et cloud' },
  { name: 'Application Development', level: 1, parentName: 'Technology Management', domainName: 'IT', description: 'Développement et maintenance applicative' },
  // Level 2
  { name: 'Budget Management', level: 2, parentName: 'Financial Planning', domainName: 'Finance', description: 'Gestion des budgets opérationnels' },
  { name: 'Revenue Forecasting', level: 2, parentName: 'Financial Planning', domainName: 'Finance', description: 'Prévisions de revenus' },
  { name: 'Lead Generation', level: 2, parentName: 'Sales Management', domainName: 'Marketing', description: 'Génération de leads' },
];

// Helper to get domain ID by name
const getDomainId = async (name: string | null): Promise<string | null> => {
  if (!name) return null;
  const domain = await prisma.domain.findUnique({ where: { name } });
  return domain?.id ?? null;
};

// Create capabilities and store their IDs
const createdCapabilities: Record<string, string> = {};

for (const cap of sampleCapabilities) {
  const existing = await prisma.businessCapability.findUnique({ where: { name: cap.name } });
  if (!existing) {
    const parentId = cap.parentName ? createdCapabilities[cap.parentName] : null;
    const domainId = await getDomainId(cap.domainName);
    
    const result = await prisma.$executeRaw`
      INSERT INTO business_capabilities (id, name, description, comment, parent_id, level, domain_id, created_at, updated_at)
      VALUES (
        gen_random_uuid(), 
        ${cap.name}::varchar, 
        ${cap.description}::text,
        null,
        ${parentId}::uuid,
        ${cap.level}::smallint,
        ${domainId}::uuid,
        NOW(),
        NOW()
      )
      RETURNING id
    `;
    // Note: $executeRaw doesn't return values directly, so we query back
    const created = await prisma.businessCapability.findUnique({ where: { name: cap.name } });
    if (created) {
      createdCapabilities[cap.name] = created.id;
      console.log(`✓ Created capability: ${cap.name} (level ${cap.level})`);
    }
  } else {
    createdCapabilities[cap.name] = existing.id;
    console.log(`✓ Capability exists: ${cap.name}`);
  }
}

console.log('Seed business capabilities completed');
```

> **Note sur F-999 Item 8 :** Utiliser le tagged template `$executeRaw` — jamais `$executeRawUnsafe` avec interpolation de string. Le pattern ci-dessus utilise des paramètres typés (`::uuid`, `::varchar`, etc.) pour éviter les erreurs de cast PostgreSQL.

---

_FS-07-BACK v1.0 — ARK_
