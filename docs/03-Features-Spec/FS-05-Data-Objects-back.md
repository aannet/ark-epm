# ARK — Feature Spec FS-05-BACK : Data Objects (Backend)

_Version 1.0 — Avril 2026_

> **Changelog v1.0 :** Création initiale — module Data Objects conforme NFR-GOV-005. Implémente le CRUD complet avec migration schéma (ajout description, comment, updatedAt, UNIQUE name), suppression du champ legacy `tags TEXT[]`, liaison tags F-03 polymorphe. Relation N:N `app_data_object_map` avec rôles énumérés (consumer, producer, owner). Onglet Relations (`_count.applications` + endpoint `GET /:id/applications`). Gestion des dépendances (blocage suppression si applications liées).

---

## En-tête

| Champ | Valeur |
|---|---|
| **ID** | FS-05-BACK |
| **Titre** | Data Objects — API REST Backend |
| **Priorité** | P1 |
| **Statut** | `done` |
| **Dépend de** | FS-01, **FS-06-BACK**, F-03 |
| **Spec mère** | FS-05 Data Objects v1.0 |
| **Spec front** | FS-05-FRONT — bloquée tant que cette spec n'est pas `done` |
| **Estimé** | 0.5 jour |
| **Version** | 1.0 |

> **Note FK entrantes (N:N) :** Cette entité expose `_count.applications` et `GET /:id/applications`. Elle est référencée via la table de jonction `app_data_object_map`. FS-06-BACK est requis en dépendance BACK pour implémenter les DTOs et endpoints côté Application.

> **Amendements pré-requis pour FS-05-FRONT ⚠️ :**
>
> La spec frontend (FS-05-FRONT) requiert deux modifications mineures à cette implémentation backend :
>
> | # | Amendement | Raison | Impact |
> |---|---|---|---|
> | **A** | Ajouter `type` (string, filtré) et `isSourceOfTruth` (boolean, filtré) comme query params à `GET /api/v1/data-objects` | Filtres avancés ListPage côté serveur (type + source officielle) | Modificateur controller : accepter `@Query('type')` et `@Query('isSourceOfTruth')`, passer au service, implémenter la logique filtrée |
> | **B** | Ajouter le champ `role` (consumer/producer/owner) dans la réponse de `GET /api/v1/data-objects/:id/applications` pour chaque application liée | Affichage colonne Role dans l'onglet Applications (drawer + détail frontend) | Modificateur mapper ApplicationListItem : inclure le champ `role` depuis la table de jonction `app_data_object_map` |
>
> Ces amendements sont documentés en détail dans **FS-05-FRONT §9 (Session Gate)** comme pré-conditions avant lancement de la session OpenCode frontend.

---

## 1. Objectif & Périmètre ⚠️

**Ce que cette spec fait :**

Implémenter l'API REST complète pour la gestion des Objets de Données (Data Objects) : création, lecture, modification et suppression. Le Data Object représente un ensemble de données métier (base de données, dataset, fichier) avec des propriétés d'intégrité (source of truth) et des relations vers les applications qui les consomment ou les produisent.

Le backend expose :
- CRUD complet conforme NFR-GOV-005 (5 champs socle + liaison tags F-03)
- Endpoint `GET /:id/applications` listant les applications liées (pagination)
- Compteur `_count.applications` dans `DataObjectResponse`
- Champ `isSourceOfTruth` pour marquer la source officielle
- Champ `type` libre (avec suggestions : database, dataset, file)
- Support des tags dimensionnels via `EntityTag` (F-03)
- Rôles énumérés (consumer, producer, owner) dans la relation N:N

**Hors périmètre :**
- Frontend — couvert par `FS-05-FRONT`
- Validation de la qualité des données — P2
- Data lineage (traçabilité des flux) — FS-09 (P2)

**Migration BDD requise :**

```sql
-- Créer la table de jonction N:N (si pas déjà présente)
CREATE TABLE IF NOT EXISTS app_data_object_map (
  application_id UUID NOT NULL,
  data_object_id UUID NOT NULL,
  role VARCHAR(50) DEFAULT 'consumer' CHECK (role IN ('consumer', 'producer', 'owner')),
  
  PRIMARY KEY (application_id, data_object_id),
  FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE,
  FOREIGN KEY (data_object_id) REFERENCES data_objects(id) ON DELETE CASCADE
);

-- Ajouter les champs socle manquants à data_objects
ALTER TABLE data_objects
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS comment TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Ajouter la contrainte UNIQUE sur name (si pas déjà présente)
ALTER TABLE data_objects
  ADD CONSTRAINT IF NOT EXISTS data_objects_name_key UNIQUE (name);

-- Supprimer le champ legacy tags TEXT[] (remplacé par entity_tags polymorphe F-03)
ALTER TABLE data_objects DROP COLUMN IF EXISTS tags;

-- Vérifier/corriger le DEFAULT sur data_objects.id
-- (Ne pas exécuter si déjà présent — vérifier avec \d data_objects)
-- Attendu : DEFAULT gen_random_uuid()
```

> **Note :** Ces migrations sont **idempotentes** (IF EXISTS / IF NOT EXISTS). Elles ne rompent pas si partiellement appliquées. Vérifier avec `\d data_objects` dans psql avant exécution.

---

> **Pattern FK entrantes (N:N) :** Le DataObject est référencé via la table de jonction `app_data_object_map`. Implémentation complète avec `FS-06-BACK` done :
>
> | Niveau | Contenu | Dépendance |
> |---|---|---|
> | **BACK complet** | `_count.applications` réel + `GET /:id/applications` + test `DEPENDENCY_CONFLICT` avec Application réelle liée via map | `FS-06-BACK` requis |
>
> Les tests Supertest créent une Application de test (via `POST /applications` avec `dataObjects[]`) pour valider le blocage de suppression.

---

## 2. Modèle BDD  ⚠️

### 2.1 Schema relationnel 

**Schéma BDD complet — Data Objects et ses relations (F-03 + FS-06)**

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
│               tag_values                │
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
                    │ via entity_type='data_object'
                    │ entity_id = data_objects.id
                    │
┌───────────────────┴──────────────────────┐
│             data_objects                 │
├──────────────────────────────────────────┤
│ id              UUID        PK            │
│ name            VARCHAR(255) NOT NULL    │
│   UNIQUE (name)                          │
│ description     TEXT        nullable     │
│ comment         TEXT        nullable     │
│ type            VARCHAR(100) nullable    │
│   (suggestions: database, dataset, file) │
│ is_source_of_truth BOOLEAN default false │
│ created_at      TIMESTAMPTZ default now()│
│ updated_at      TIMESTAMPTZ auto-update  │
├──────────────────────────────────────────┤
│ → appDataObjectMaps[] (N:N via           │
│   app_data_object_map.data_object_id)    │
│ → entityTags[] (polymorphe via           │
│   entity_tags.entity_type='data_object') │
│ Suppression bloquée si count > 0 (RM-03) │
└──────────────────────────────────────────┘
       │ N:N
       ├──────────────────────────────────┐
       │                                  │
┌──────▼───────────────────────────────────┐
│         app_data_object_map              │
├──────────────────────────────────────────┤
│ application_id  UUID   FK → applications │
│ data_object_id  UUID   FK → data_objects │
│ role            VARCHAR(50)              │
│   CHECK (consumer, producer, owner)      │
│                                          │
│ PK (application_id, data_object_id)      │
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
tag_values ──1:N──► entity_tags ◄── (entity_type='data_object', entity_id)
                                                           ▲
                                                           │
                                               data_objects.id
                                                           │
                                                           │
data_objects ──N:N──► applications (via app_data_object_map with role enum)

data_objects:
  - appDataObjectMaps[] via table junction app_data_object_map (role: consumer/producer/owner)
  - entityTags[] via polymorphisme entity_type='data_object'
```

### 2.2 Modèle Prisma ⚠️

```prisma
model DataObject {
  id              String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  name            String    @unique @db.VarChar(255)
  description     String?   @db.Text
  comment         String?   @db.Text
  type            String?   @db.VarChar(100)
  isSourceOfTruth Boolean   @default(false) @map("is_source_of_truth")
  createdAt       DateTime  @default(now()) @map("created_at") @db.Timestamptz
  updatedAt       DateTime  @updatedAt @map("updated_at") @db.Timestamptz

  appDataObjectMaps AppDataObjectMap[]
  entityTags        EntityTag[]

  @@map("data_objects")
}

model AppDataObjectMap {
  applicationId String      @map("application_id") @db.Uuid
  dataObjectId  String      @map("data_object_id") @db.Uuid
  role          String      @default("consumer") @db.VarChar(50)

  application   Application @relation(fields: [applicationId], references: [id], onDelete: Cascade)
  dataObject    DataObject  @relation(fields: [dataObjectId], references: [id], onDelete: Cascade)

  @@id([applicationId, dataObjectId])
  @@map("app_data_object_map")
}

model Application {
  id               String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  name             String   @db.VarChar(255)
  // ... autres champs

  appDataObjectMaps AppDataObjectMap[]
  entityTags        EntityTag[]

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
> - `DataObject` suit les 5 champs socle NFR-GOV-005 (name, description, comment, createdAt, updatedAt)
> - `type` : string libre (suggestions : database, dataset, file), pas d'enum P1 (extensibilité future)
> - `isSourceOfTruth` : booléen marquant la source officielle de l'objet de données
> - Trigger audit `trg_audit_data_objects` déjà présent en base (schema.sql:280-282)
> - Champ legacy `tags TEXT[]` supprimé — remplacé par F-03 `entity_tags` polymorphe

---

## 3. Contrat API (OpenAPI) ⚠️

```yaml
paths:

  /api/v1/data-objects:
    get:
      summary: Liste de tous les data objects
      tags: [DataObjects]
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
          schema: { type: string, enum: [name, createdAt], default: name }
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
                      $ref: '#/components/schemas/DataObjectListItem'
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
      summary: Créer un data object
      tags: [DataObjects]
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateDataObjectDto'
      responses:
        '201':
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/DataObjectResponse'
        '400':
          description: Validation échouée
        '401':
          description: Non authentifié
        '403':
          description: Permission insuffisante
        '409':
          description: Nom de data object déjà utilisé
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

  /api/v1/data-objects/{id}:
    get:
      summary: Détail d'un data object
      tags: [DataObjects]
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
                $ref: '#/components/schemas/DataObjectResponse'
        '401':
          description: Non authentifié
        '404':
          description: Data object introuvable

    patch:
      summary: Modifier un data object
      tags: [DataObjects]
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
              $ref: '#/components/schemas/UpdateDataObjectDto'
      responses:
        '200':
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/DataObjectResponse'
        '400':
          description: Validation échouée
        '401':
          description: Non authentifié
        '403':
          description: Permission insuffisante
        '404':
          description: Data object introuvable
        '409':
          description: Nom de data object déjà utilisé
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
      summary: Supprimer un data object
      tags: [DataObjects]
      security:
        - bearerAuth: []
      parameters:
        - name: id
          in: path
          required: true
          schema: { type: string, format: uuid }
      responses:
        '204':
          description: Data object supprimé
        '401':
          description: Non authentifié
        '403':
          description: Permission insuffisante
        '404':
          description: Data object introuvable
        '409':
          description: Data object utilisé par des applications
          content:
            application/json:
              schema:
                type: object
                properties:
                  statusCode: { type: integer, example: 409 }
                  code:       { type: string,  example: "DEPENDENCY_CONFLICT" }
                  message:    { type: string, example: "Data object is used by 2 application(s)" }
                  details:
                    type: object
                    properties:
                      applicationsCount: { type: integer }
                  timestamp:  { type: string, format: date-time }
                  path:       { type: string }

  /api/v1/data-objects/{id}/applications:
    get:
      summary: Liste des applications liées à un data object
      tags: [DataObjects]
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
          description: Data object introuvable

components:
  schemas:

    DataObjectListItem:
      type: object
      properties:
        id:              { type: string, format: uuid }
        name:            { type: string }
        type:            { type: string, nullable: true, example: "database" }
        isSourceOfTruth: { type: boolean, example: false }
        createdAt:       { type: string, format: date-time }
        _count:
          type: object
          properties:
            applications: { type: integer, example: 3 }

    DataObjectResponse:
      type: object
      properties:
        id:              { type: string, format: uuid }
        name:            { type: string }
        description:     { type: string, nullable: true }
        comment:         { type: string, nullable: true }
        type:            { type: string, nullable: true }
        isSourceOfTruth: { type: boolean }
        createdAt:       { type: string, format: date-time }
        updatedAt:       { type: string, format: date-time }
        _count:
          type: object
          properties:
            applications: { type: integer, example: 3 }
        tags:
          type: array
          description: Tous les entity_tags sans filtrage (déduplication côté frontend)
          items:
            $ref: '#/components/schemas/EntityTagResponse'

    CreateDataObjectDto:
      type: object
      required: [name]
      properties:
        name:
          type: string
          minLength: 1
          maxLength: 255
          example: "Customer Database"
        description:
          type: string
          nullable: true
          maxLength: 2000
        comment:
          type: string
          nullable: true
          maxLength: 2000
        type:
          type: string
          nullable: true
          maxLength: 100
          example: "database"
        isSourceOfTruth:
          type: boolean
          default: false

    UpdateDataObjectDto:
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
        type:
          type: string
          nullable: true
          maxLength: 100
        isSourceOfTruth:
          type: boolean

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

- **RM-01 — Nom unique :** Deux data objects ne peuvent pas avoir le même nom. `409` + code `"CONFLICT"` + message `"Data object name already in use"`. Intercepter l'erreur Prisma `P2002` dans un try/catch ciblé.

- **RM-02 — Nom non vide :** `name` obligatoire, non vide, non uniquement espaces. `@IsNotEmpty()` + `@Transform(({ value }) => value?.trim())` avant validation. Les espaces uniquement sont rejetés comme vide → `400`.

- **RM-03 — Suppression bloquée si data object utilisé :**

```typescript
async remove(id: string): Promise<void> {
  const dataObject = await this.prisma.dataObject.findUnique({
    where: { id },
    select: {
      _count: { select: { appDataObjectMaps: true } }
    }
  });
  if (!dataObject) throw new NotFoundException('Data object not found');

  if (dataObject._count.appDataObjectMaps > 0) {
    throw new ConflictException({
      code: 'DEPENDENCY_CONFLICT',
      message: `Data object is used by ${dataObject._count.appDataObjectMaps} application(s)`,
      details: { applicationsCount: dataObject._count.appDataObjectMaps }
    });
  }
  await this.prisma.dataObject.delete({ where: { id } });
}
```

> **Pattern FK entrantes (N:N) :** Le compteur `appDataObjectMaps` vérifie les liens dans la table de jonction. Nécessite `FS-06-BACK` done pour être testé avec des données réelles.

- **RM-04 — Droits requis :** `data-objects:read` sur GET. `data-objects:write` sur POST/PATCH/DELETE.

- **RM-05 — Pas de soft delete :** Suppression physique après vérification RM-03.

- **RM-06 — Endpoint applications liées :** `GET /:id/applications` retourne une liste paginée d'`ApplicationListItem` (même schéma que `GET /applications`). Le data object doit exister → `404` si UUID inexistant.

- **RM-07 — Rôles dans la relation N:N :** Le champ `role` dans `app_data_object_map` est énuméré et obligatoire avec défaut `"consumer"`. Valeurs : `"consumer"` (consomme les données), `"producer"` (produit les données), `"owner"` (propriétaire/gestionnaire). Une application peut associer le même data object avec des rôles différents (rare mais possible).

- **RM-08 — Champ `isSourceOfTruth`** : booléen simple. Pas de logique métier associée en P1 (p.ex. validation que la source of truth n'existe qu'une fois) — cela relève de la data governance FS-09 (P2).

---

## 5. Comportements Backend par Cas d'Usage

**Nominal :**
- `GET /api/v1/data-objects` authentifié → `200` avec tableau paginé (vide = `[]`)
- `POST /api/v1/data-objects` valide → `201` avec `DataObjectResponse`
- `PATCH /api/v1/data-objects/{id}` existant + valide → `200` avec entité mise à jour
- `DELETE /api/v1/data-objects/{id}` sans dépendances → `204`

**Erreurs :**
- `POST` sans `name` → `400`
- `POST` `name` uniquement espaces → `400`
- `POST` / `PATCH` nom dupliqué → `409` + `code: "CONFLICT"`
- `GET` / `PATCH` / `DELETE` UUID inexistant → `404`
- `DELETE` avec applications liées → `409` + `code: "DEPENDENCY_CONFLICT"` + compteurs dans `details`
- Toute route sans token → `401`
- Route `write` sans permission `data-objects:write` → `403`

---

## 6. Structure de Fichiers Backend

```
backend/src/data-objects/
├── data-objects.module.ts
├── data-objects.controller.ts
├── data-objects.service.ts
├── data-objects.service.spec.ts      ← tests unit Jest
└── dto/
    ├── create-data-object.dto.ts
    ├── update-data-object.dto.ts
    └── query-data-objects.dto.ts       ← pagination/filtres

backend/test/
└── FS-05-data-objects.e2e-spec.ts    ← tests Supertest
```

---

## 6.1 Integration with Tags (F-03)

Les Data Objects supportent le système de tags dimensionnels via la relation polymorphe `EntityTag`.

**Principe de responsabilité :**

> Le backend retourne **l'intégralité** des `entity_tags` d'un data object, sans filtrage ni déduplication. La déduplication par profondeur (F-03 RM-11) est une règle d'affichage **côté frontend** appliquée par `TagChipList`.

**Endpoints impliqués :**

- **GET /api/v1/data-objects** — Retourne `tags` pour chaque data object (chargé via join)
- **GET /api/v1/data-objects/:id** — Retourne le data object avec le tableau `tags`
- **PUT /tags/entity/data-object/:id** — Endpoint F-03 pour mettre à jour les tags

**Service pattern:**

```typescript
async findOne(id: string): Promise<DataObjectWithTags> {
  const dataObject = await this.prisma.dataObject.findUnique({ where: { id } });
  if (!dataObject) throw new NotFoundException();

  const tags = await this.tagService.getEntityTags('data_object', id);
  return { ...dataObject, tags };
}
```

---

## 7. Tests Backend ⚠️

> À remplir exhaustivement — OpenCode génère les tests à partir de cette section.

### Outil par niveau

| Niveau | Outil | Fichier cible | Délégable à OpenCode |
|---|---|---|---|
| Unit (services NestJS) | **Jest** | `src/data-objects/data-objects.service.spec.ts` | ✅ Oui |
| API / contrat HTTP | **Supertest** | `test/FS-05-data-objects.e2e-spec.ts` | ✅ Oui |
| Sécurité / RBAC | **Supertest** | `test/FS-05-data-objects.e2e-spec.ts` | ❌ **Manuel** |

> **Règle absolue :** Les tests RBAC ne sont jamais délégués à OpenCode.

### Tests Jest — Unit

- [ ] `[Jest]` `DataObjectsService.findAll()` retourne un objet paginé `{ data, meta }`
- [ ] `[Jest]` `DataObjectsService.findAll()` avec filtre `search` → recherche textuelle sur `name`
- [ ] `[Jest]` `DataObjectsService.create()` retourne le data object créé
- [ ] `[Jest]` `DataObjectsService.create()` lève `ConflictException` sur erreur Prisma `P2002`
- [ ] `[Jest]` `DataObjectsService.findOne()` retourne le data object avec tags et `_count.applications`
- [ ] `[Jest]` `DataObjectsService.findOne()` lève `NotFoundException` si UUID inexistant
- [ ] `[Jest]` `DataObjectsService.getApplications()` retourne la liste paginée des apps liées
- [ ] `[Jest]` `DataObjectsService.remove()` lève `NotFoundException` si UUID inexistant
- [ ] `[Jest]` `DataObjectsService.remove()` lève `ConflictException` si applications liées
- [ ] `[Jest]` `DataObjectsService.remove()` appelle `prisma.dataObject.delete()` si aucune application liée

### Tests Supertest — Contrat API

- [ ] `[Supertest]` `GET /api/v1/data-objects` authentifié → `200` avec objet paginé
- [ ] `[Supertest]` `GET /api/v1/data-objects` liste vide → `200` avec `{ data: [], meta: {...} }`
- [ ] `[Supertest]` `GET /api/v1/data-objects?search=customer` → filtre appliqué sur name
- [ ] `[Supertest]` `POST /api/v1/data-objects` nom valide → `201` avec `DataObjectResponse`
- [ ] `[Supertest]` `POST /api/v1/data-objects` nom valide → audit_trail contient 1 ligne avec entity_type='data_objects' et changed_by non NULL
- [ ] `[Supertest]` `POST /api/v1/data-objects` nom dupliqué → `409` + `code: "CONFLICT"`
- [ ] `[Supertest]` `POST /api/v1/data-objects` sans `name` → `400`
- [ ] `[Supertest]` `POST /api/v1/data-objects` name uniquement espaces → `400`
- [ ] `[Supertest]` `POST /api/v1/data-objects` avec `type` et `isSourceOfTruth` → `201` champs correctement stockés
- [ ] `[Supertest]` `GET /api/v1/data-objects/{id}` existant → `200` avec `_count.applications` et `tags`
- [ ] `[Supertest]` `GET /api/v1/data-objects/{id}` UUID inexistant → `404`
- [ ] `[Supertest]` `GET /api/v1/data-objects/{id}/applications` → `200` liste paginée d'`ApplicationListItem`
- [ ] `[Supertest]` `GET /api/v1/data-objects/{id}/applications` data object inexistant → `404`
- [ ] `[Supertest]` `PATCH /api/v1/data-objects/{id}` changement description → `200`
- [ ] `[Supertest]` `PATCH /api/v1/data-objects/{id}` nom dupliqué → `409` + `code: "CONFLICT"`
- [ ] `[Supertest]` `DELETE /api/v1/data-objects/{id}` sans applications liées → `204`
- [ ] `[Supertest]` `DELETE /api/v1/data-objects/{id}` avec applications liées → `409` + `code: "DEPENDENCY_CONFLICT"` + compteurs

> **FK entrantes — test `DEPENDENCY_CONFLICT` avec Applications :**
> 1. Créer un data object (`POST /data-objects`)
> 2. Créer une Application liée (`POST /applications` avec `dataObjects[]` rempli) — **requiert `FS-06-BACK` `done`**
> 3. Tenter `DELETE /data-objects/{id}` → vérifier `409` + `code: "DEPENDENCY_CONFLICT"`

> **Audit trail — test obligatoire (NFR-SEC-009) :** Le trigger `fn_audit_trigger()` est actif sur la table `data_objects`. Tout `INSERT` sans `SET LOCAL ark.current_user_id` positionné par le middleware génère un rollback silencieux (voir AGENTS.md). Ce test Supertest vérifie que le middleware audit context est correctement câblé et que le trigger remplit bien le champ `changed_by`.
>
> Format du test : après un `POST /data-objects` valide, requêter `audit_trail` sur `entity_type='data_objects'` et `entity_id=[id_créée]` → vérifier `changed_by IS NOT NULL`.

### Tests Sécurité / RBAC — Manuel ❌

> À écrire et valider à la main. Ne pas déléguer à OpenCode.

- [ ] `[Manuel]` `GET /api/v1/data-objects` sans token → `401`
- [ ] `[Manuel]` `POST /api/v1/data-objects` rôle sans `data-objects:write` → `403`
- [ ] `[Manuel]` `PATCH /api/v1/data-objects/{id}` rôle sans `data-objects:write` → `403`
- [ ] `[Manuel]` `DELETE /api/v1/data-objects/{id}` rôle sans `data-objects:write` → `403`
- [ ] `[Manuel]` `GET /api/v1/data-objects/{id}/applications` sans `data-objects:read` → `403`

---

## 8. Commande OpenCode — Backend ⚠️

> Copier-coller intégralement en début de session OpenCode.
> Ne pas remplacer les conventions par un pointeur vers AGENTS.md — OpenCode doit les recevoir inline.

```
Contexte projet ARK — Session Backend FS-05-BACK :

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
- P2002 intercepté dans un try/catch ciblé → ConflictException — ne jamais laisser remonter l'erreur Prisma brute
- Requêtes raw : tagged template backtick uniquement — jamais Prisma.raw() avec interpolation
- Tests unit : jest.mock() sur PrismaService — pas de base réelle
- Fichier test e2e : backend/test/FS-05-data-objects.e2e-spec.ts
- Tests DEPENDENCY_CONFLICT avec Applications : créer une Application réelle en base (POST /applications) dans le beforeEach du test — ne pas mocker

Documentation obligatoire (NFR-GOV-001) :
- À la fin de la session, recopier le contenu YAML de la section §3 (Contrat API) de cette spec dans le fichier `docs/04-Tech/openapi.yaml`
  en remplaçant la section `paths:` correspondante
  OU en ajoutant les nouveaux paths si l'entité n'existait pas
- Ne pas générer de documentation OpenAPI/Swagger automatique — le fichier YAML central est la source de vérité

Intégration tags F-03 :
- TagsModule est @Global() — TagService injectable sans réimporter TagsModule
- getEntityTags('data_object', id) retourne TOUS les entity_tags sans filtrage
- Le join sur tag_dimensions est obligatoire pour peupler dimensionColor et depth
- NE PAS implémenter deduplicateByDepth() côté backend

Migration requise avant implémentation :
```sql
ALTER TABLE data_objects
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS comment TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE data_objects
  ADD CONSTRAINT IF NOT EXISTS data_objects_name_key UNIQUE (name);

ALTER TABLE data_objects DROP COLUMN IF EXISTS tags;
```

Pattern de référence NestJS : module Domains (FS-02-BACK) — s'y conformer pour la structure et le style.

Implémente la feature "Data Objects" backend (FS-05-BACK) en respectant strictement le contrat ci-dessous.
Génère : module NestJS complet (controller, service, DTOs, module) + tests Jest unit + tests Supertest.
Ne génère PAS les tests marqués [Manuel].
Ne génère PAS de code frontend.
Ne fais aucune hypothèse non documentée. Si un point est ambigu, pose une question avant de coder.

[COLLER LE CONTENU COMPLET DE FS-05-BACK.md ICI]
```

---

## 9. Gate de Validation Backend ⚠️

> À valider **avant** de passer `FS-05-FRONT` au statut `stable`.
> FS-05-FRONT reste à `draft` tant que toutes ces gates ne sont pas cochées.

| # | Gate | Vérification | Bloquant |
|---|------|--------------|----------|
| G-01 | Migration Prisma appliquée | Table `data_objects` avec description, comment, updated_at, contrainte UNIQUE(name), champ tags supprimé | ✅ Oui |
| G-02 | Seed permissions | `data-objects:read` et `data-objects:write` en base | ✅ Oui |
| G-03 | Tests Jest passent | `npm run test -- --testPathPattern=data-objects` → 0 failed | ✅ Oui |
| G-04 | Tests Supertest passent | `npm run test:e2e -- --testPathPattern=FS-05` → 0 failed | ✅ Oui |
| G-05 | Tests RBAC manuels validés | Les 5 cas [Manuel] §7 vérifiés à la main | ✅ Oui |
| G-06 | Aucune erreur TypeScript | `npm run build` → 0 error | ✅ Oui |
| G-07 | Statut mis à jour | Passer `FS-05-BACK` à `done` dans cet en-tête | ✅ Oui |
| G-08 | Revue TD backend | TD-1 à TD-6 vérifiés, F-999 mis à jour | ✅ Oui |
| G-09 | `_count.applications` présent | Vérifier dans `DataObjectResponse` | ✅ Oui |
| G-10 | Endpoint `GET /:id/applications` | Liste paginée des apps liées fonctionnelle | ✅ Oui |
| G-11 | Test `DEPENDENCY_CONFLICT` avec Application réelle | Créer une Application via `POST /applications` puis tenter suppression | ✅ Oui |
| G-12 | Audit trail actif | `POST /data-objects` → vérifier ligne dans audit_trail (changed_by non NULL) | ✅ Oui |
| G-13 | `openapi.yaml` mis à jour | Paths `/data-objects` présents dans `docs/04-Tech/openapi.yaml` (recopiés de §3) | ✅ Oui |

---

## 10. Checklist de Validation Post-Session

> À compléter après génération OpenCode, avant de cocher les gates §9.

- [ ] `POST /api/v1/data-objects` retourne `201` avec `DataObjectResponse` complet
- [ ] `POST /api/v1/data-objects` → audit_trail.changed_by non NULL (NFR-SEC-009)
- [ ] `DELETE` avec applications liées retourne `409` + `code: "DEPENDENCY_CONFLICT"` + details
- [ ] Toutes les réponses `409` incluent le champ `code` explicite (NFR-MAINT-001)
- [ ] `name` uniquement espaces → `400`
- [ ] `GET /api/v1/data-objects/:id` avec tags ancêtre + descendant → les deux présents (pas de filtrage backend)
- [ ] `GET /api/v1/data-objects/:id/applications` retourne la liste paginée correcte
- [ ] `_count.applications` présent dans `DataObjectResponse`
- [ ] Pagination fonctionnelle (page, limit, meta)
- [ ] Filtre `search` fonctionnel sur le nom
- [ ] `isSourceOfTruth` exposé et fonctionnel
- [ ] `type` accepte string libre (suggestions: database, dataset, file)
- [ ] Rôles enum (consumer, producer, owner) forcés dans `app_data_object_map`
- [ ] Champ legacy `tags TEXT[]` supprimé de la table
- [ ] `docs/04-Tech/openapi.yaml` mis à jour avec les paths `/data-objects` (NFR-GOV-001)
- [ ] Aucun `TODO / FIXME / HACK` non tracé dans le code livré
- [ ] Aucune erreur TypeScript strict
- [ ] Conventions AGENTS.md respectées

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

### Résultat de la Revue

| Champ | Valeur |
|---|---|
| **Sprint** | Sprint 3 |
| **Date de revue** | *(à compléter)* |
| **Items F-999 fermés** | *(à compléter)* |
| **Items F-999 ouverts** | *(à compléter)* |
| **Nouveaux items F-999 créés** | *(à compléter)* |
| **NFR mis à jour** | NFR-GOV-005 → `covered` pour data_objects |
| **TODOs résiduels tracés** | *(à compléter)* |
| **Statut gates TD** | *(à compléter)* |

---

## 12. Données de Seed ⚠️

> Documenter ici les données de démonstration à insérer dans `backend/prisma/seed.ts`.
> Pattern obligatoire : vérifier existence avant insert (idempotent).
> S'assurer que ces données sont créées AVANT les seeds dépendants
> (ex: data-objects avant seed-applications pour les relations N:N).

### Pertinence

✅ **Utile** — Le DataObject est un référentiel sélectionnable dans le formulaire Application. Un seed vide rend le sélecteur inutilisable pour les premiers tests utilisateur.

### Données de démonstration

| # | Nom | Type | isSourceOfTruth | Description |
|---|-----|------|-----------------|-------------|
| 1 | Customer Database | database | true | BD principale contenant les clients — source of truth |
| 2 | Product Catalog Dataset | dataset | false | Données produits — enrichi de plusieurs sources |
| 3 | Legacy CRM Files | file | false | Fichiers plats du CRM legacy — en voie de migration |
| 4 | ERP Master Data | database | true | Données de référence SAP — source officielle |
| 5 | Analytics Warehouse | database | false | DWH Snowflake — données agrégées |

### Bloc de code seed

> Bloc TypeScript prêt à copier dans seed.ts, avec pattern idempotent.

```typescript
// Insert sample data objects if they don't exist
const sampleDataObjects = [
  { name: 'Customer Database', type: 'database', isSourceOfTruth: true, description: 'BD principale contenant les clients' },
  { name: 'Product Catalog Dataset', type: 'dataset', isSourceOfTruth: false, description: 'Données produits enrichies de plusieurs sources' },
  { name: 'Legacy CRM Files', type: 'file', isSourceOfTruth: false, description: 'Fichiers plats du CRM legacy en voie de migration' },
  { name: 'ERP Master Data', type: 'database', isSourceOfTruth: true, description: 'Données de référence SAP — source officielle' },
  { name: 'Analytics Warehouse', type: 'database', isSourceOfTruth: false, description: 'DWH Snowflake avec données agrégées' },
];

for (const item of sampleDataObjects) {
  const existing = await prisma.dataObject.findUnique({ where: { name: item.name } });
  if (!existing) {
    await prisma.$executeRaw`INSERT INTO data_objects (id, name, type, is_source_of_truth, description) 
      VALUES (gen_random_uuid(), ${item.name}::varchar, ${item.type}::varchar, ${item.isSourceOfTruth}::boolean, ${item.description}::text)`;
    console.log(`✓ Created data object: ${item.name}`);
  }
}
console.log('Seed data objects completed');
```

> **Note sur F-999 Item 8 :** Utiliser le tagged template `$executeRaw` — jamais `$executeRawUnsafe` avec interpolation de string.

---

_FS-05-BACK v1.0 — ARK_
