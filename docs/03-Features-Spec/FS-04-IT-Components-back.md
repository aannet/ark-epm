# ARK — Feature Spec FS-04-BACK : IT Components (Backend)

_Version 1.0 — Mars 2026_

> **Changelog v1.0 :** Création initiale — module IT Components conforme template v0.4. Implémente CRUD complet avec NFR-GOV-005 (champs socle), liaison tags F-03, onglet Relations (`_count.applications` + endpoint `GET /:id/applications`), gestion dépendances (blocage suppression si applications liées). Migration requise : ajout `description`, `comment`, `updated_at`, `UNIQUE(name)`.

---

## En-tête

| Champ | Valeur |
|---|---|
| **ID** | FS-04-BACK |
| **Titre** | IT Components — API REST Backend |
| **Priorité** | P1 |
| **Statut** | ✅ `done` |
| **Dépend de** | FS-01, **FS-06-BACK**, F-03 |
| **Spec mère** | FS-04 IT Components |
| **Spec front** | FS-04-FRONT — bloquée tant que cette spec n'est pas `done` |
| **Estimé** | 0.5 jour |
| **Version** | 1.0 |

> **Note FK entrantes :** Cette entité expose `_count.applications` et `GET /:id/applications`. Elle est référencée par `app_it_component_map.it_component_id`. FS-06-BACK est requis en dépendance BACK.

---

## 1. Objectif & Périmètre

**Ce que cette spec fait :**

Implémenter l'API REST complète pour la gestion des Composants IT (IT Components) : création, lecture, modification et suppression. L'IT Component représente une infrastructure technique (serveur, base de données, middleware, stockage) utilisée par les applications métier.

Le backend expose :
- CRUD complet conforme NFR-GOV-005 (5 champs socle + liaison tags)
- Endpoint `GET /:id/applications` listant les applications liées (pagination)
- Compteur `_count.applications` dans `ITComponentResponse`
- Support des tags dimensionnels via `EntityTag` (F-03)
- Champs métier `technology` et `type` (strings libres)

**Hors périmètre :**
- Frontend — couvert par `FS-04-FRONT`
- Inventaire automatique des composants (scan réseau, agents) — P2
- Monitoring/métriques des composants (CPU, RAM, disque) — hors périmètre ARK

**Migration BDD requise (NFR-GOV-005) :**
```sql
ALTER TABLE it_components
  ADD COLUMN description TEXT,
  ADD COLUMN comment TEXT,
  ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW(),
  ADD CONSTRAINT it_components_name_key UNIQUE (name);
```

---

> **Pattern FK entrantes Applications :** L'IT Component est référencé par `app_it_component_map.it_component_id` → `applications.id`. Implémentation complète avec `FS-06-BACK` done :
>
> | Niveau | Contenu | Dépendance |
> |---|---|---|
> | **BACK complet** | `_count.applications` réel + `GET /:id/applications` + test `DEPENDENCY_CONFLICT` avec Application réelle | `FS-06-BACK` requis |
>
> Les tests Supertest créent une Application de test (via `POST /applications` avec `itComponentIds`) pour valider le blocage de suppression.

---

## 2. Modèle BDD

### 2.1 Schéma relationnel

**Schéma BDD complet — IT Components et ses relations (F-03 + FS-06)**

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
                    │ via entity_type='it_component'
                    │ entity_id = it_components.id
                    │
┌───────────────────┴──────────────────────┐
│            it_components                 │
├──────────────────────────────────────────┤
│ id            UUID        PK             │
│ name          VARCHAR(255) NOT NULL      │
│   UNIQUE (name)                          │
│ description   TEXT        nullable       │
│ comment       TEXT        nullable       │
│ technology    VARCHAR(255) nullable       │
│ type          VARCHAR(100) nullable       │
│ created_at    TIMESTAMPTZ default now()  │
│ updated_at    TIMESTAMPTZ auto-update     │
├──────────────────────────────────────────┤
│ → applications[] (N:N via                 │
│   app_it_component_map)                  │
│ Suppression bloquée si count > 0 (RM-03) │
└──────────────────────────────────────────┘
```

**Vue des relations globales**

```
tag_values ──1:N──► entity_tags ◄── (entity_type='it_component', entity_id)
                                                          ▲
                                                          │
                                                    it_components.id
                                                          │
                                                          │
it_components ──1:N──► app_it_component_map ◄──N:1── applications

it_components:
  - applications[] via table de jonction app_it_component_map
  - entityTags[] via polymorphisme entity_type='it_component'
```

### 2.2 Modèle Prisma

```prisma
model ItComponent {
  id            String              @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  name          String              @unique @db.VarChar(255)
  description   String?             @db.Text
  comment       String?             @db.Text
  technology    String?             @db.VarChar(255)
  type          String?             @db.VarChar(100)
  createdAt     DateTime            @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt     DateTime            @updatedAt @map("updated_at") @db.Timestamptz(6)

  applications  AppItComponentMap[]
  entityTags    EntityTag[]

  @@map("it_components")
}

model Application {
  id               String              @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  name             String              @unique @db.VarChar(255)
  // ... autres champs

  itComponents     AppItComponentMap[]
  entityTags       EntityTag[]

  @@map("applications")
}

model AppItComponentMap {
  applicationId String      @map("application_id") @db.Uuid
  itComponentId String    @map("it_component_id") @db.Uuid
  application   Application @relation(fields: [applicationId], references: [id], onDelete: Cascade, onUpdate: NoAction)
  itComponent   ItComponent @relation(fields: [itComponentId], references: [id], onDelete: Cascade, onUpdate: NoAction)

  @@id([applicationId, itComponentId])
  @@map("app_it_component_map")
}

model EntityTag {
  entityType String   @map("entity_type") @db.VarChar(50)
  entityId   String   @map("entity_id") @db.Uuid
  tagValueId String   @map("tag_value_id") @db.Uuid
  taggedAt   DateTime @default(now()) @map("tagged_at") @db.Timestamptz(6)
  taggedById String?  @map("tagged_by") @db.Uuid

  tagValue TagValue @relation(fields: [tagValueId], references: [id], onDelete: Cascade)

  @@id([entityType, entityId, tagValueId])
  @@index([entityType, entityId], name: "idx_entity_tags_lookup")
  @@index([tagValueId], name: "idx_entity_tags_by_value")
  @@map("entity_tags")
}
```

> **Notes :**
> - `ItComponent` suit les 5 champs socle NFR-GOV-005 (name, description, comment, createdAt, updatedAt)
> - `technology` : string libre (ex: "PostgreSQL 16", "Apache Kafka 3.6", "Kubernetes 1.28")
> - `type` : string libre (ex: "database", "cache", "messaging", "web-server", "container-orchestration")
> - Trigger audit `trg_audit_it_components` déjà présent en base

---

## 3. Contrat API (OpenAPI)

```yaml
paths:

  /api/v1/it-components:
    get:
      summary: Liste de tous les IT Components
      tags: [IT Components]
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
          schema: { type: string, enum: [name, createdAt, type, technology], default: name }
        - name: sortOrder
          in: query
          schema: { type: string, enum: [asc, desc], default: asc }
        - name: search
          in: query
          schema: { type: string }
          description: Recherche textuelle sur le nom
        - name: type
          in: query
          schema: { type: string }
          description: Filtrer par type de composant
        - name: technology
          in: query
          schema: { type: string }
          description: Filtrer par technologie
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
                      $ref: '#/components/schemas/ITComponentListItem'
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
      summary: Créer un IT Component
      tags: [IT Components]
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateITComponentDto'
      responses:
        '201':
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ITComponentResponse'
        '400':
          description: Validation échouée
        '401':
          description: Non authentifié
        '403':
          description: Permission insuffisante
        '409':
          description: Nom d'IT Component déjà utilisé
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

  /api/v1/it-components/{id}:
    get:
      summary: Détail d'un IT Component
      tags: [IT Components]
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
                $ref: '#/components/schemas/ITComponentResponse'
        '401':
          description: Non authentifié
        '404':
          description: IT Component introuvable

    patch:
      summary: Modifier un IT Component
      tags: [IT Components]
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
              $ref: '#/components/schemas/UpdateITComponentDto'
      responses:
        '200':
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ITComponentResponse'
        '400':
          description: Validation échouée
        '401':
          description: Non authentifié
        '403':
          description: Permission insuffisante
        '404':
          description: IT Component introuvable
        '409':
          description: Nom d'IT Component déjà utilisé
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
      summary: Supprimer un IT Component
      tags: [IT Components]
      security:
        - bearerAuth: []
      parameters:
        - name: id
          in: path
          required: true
          schema: { type: string, format: uuid }
      responses:
        '204':
          description: IT Component supprimé
        '401':
          description: Non authentifié
        '403':
          description: Permission insuffisante
        '404':
          description: IT Component introuvable
        '409':
          description: IT Component utilisé par des applications
          content:
            application/json:
              schema:
                type: object
                properties:
                  statusCode: { type: integer, example: 409 }
                  code:       { type: string,  example: "DEPENDENCY_CONFLICT" }
                  message:    { type: string, example: "IT Component is used by 3 application(s)" }
                  details:
                    type: object
                    properties:
                      applicationsCount: { type: integer }
                  timestamp:  { type: string, format: date-time }
                  path:       { type: string }

  /api/v1/it-components/{id}/applications:
    get:
      summary: Liste des applications liées à un IT Component
      tags: [IT Components]
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
          description: IT Component introuvable

components:
  schemas:

    ITComponentListItem:
      type: object
      properties:
        id:          { type: string, format: uuid }
        name:        { type: string }
        technology:  { type: string, nullable: true }
        type:        { type: string, nullable: true }
        createdAt:   { type: string, format: date-time }
        _count:
          type: object
          properties:
            applications: { type: integer, example: 5 }
        tags:
          type: array
          items:
            $ref: '#/components/schemas/EntityTagResponse'

    ITComponentResponse:
      type: object
      properties:
        id:          { type: string, format: uuid }
        name:        { type: string }
        description: { type: string, nullable: true }
        comment:     { type: string, nullable: true }
        technology:  { type: string, nullable: true }
        type:        { type: string, nullable: true }
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

    CreateITComponentDto:
      type: object
      required: [name]
      properties:
        name:
          type: string
          minLength: 1
          maxLength: 255
          example: "PostgreSQL Primary"
        description:
          type: string
          nullable: true
          maxLength: 2000
        comment:
          type: string
          nullable: true
          maxLength: 2000
        technology:
          type: string
          nullable: true
          maxLength: 255
          example: "PostgreSQL 16"
        type:
          type: string
          nullable: true
          maxLength: 100
          example: "database"

    UpdateITComponentDto:
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
        technology:
          type: string
          nullable: true
          maxLength: 255
        type:
          type: string
          nullable: true
          maxLength: 100

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

- **RM-01 — Nom unique :** Deux IT Components ne peuvent pas avoir le même nom. `409` + code `"CONFLICT"` + message `"IT Component name already in use"`. Intercepter l'erreur Prisma `P2002` dans un try/catch ciblé.

- **RM-02 — Nom non vide :** `name` obligatoire, non vide, non uniquement espaces. `@IsNotEmpty()` + `@Transform(() => value.trim())` avant validation. Les espaces uniquement sont rejetés comme vide → `400`.

- **RM-03 — Suppression bloquée si IT Component utilisé :**

```typescript
async remove(id: string): Promise<void> {
  const itComponent = await this.prisma.itComponent.findUnique({
    where: { id },
    select: {
      _count: { select: { applications: true } }
    }
  });
  if (!itComponent) throw new NotFoundException('IT Component not found');

  if (itComponent._count.applications > 0) {
    throw new ConflictException({
      code: 'DEPENDENCY_CONFLICT',
      message: `IT Component is used by ${itComponent._count.applications} application(s)`,
      details: { applicationsCount: itComponent._count.applications }
    });
  }
  await this.prisma.itComponent.delete({ where: { id } });
}
```

> **Pattern FK entrantes :** Le compteur `applications` nécessite `FS-06-BACK` done pour être testé avec des données réelles.

- **RM-04 — Droits requis :** `it-components:read` sur GET. `it-components:write` sur POST/PATCH/DELETE.

- **RM-05 — Pas de soft delete :** Suppression physique après vérification RM-03.

- **RM-06 — Endpoint applications liées :** `GET /:id/applications` retourne une liste paginée d'`ApplicationListItem` (même schéma que `GET /applications`). L'IT Component doit exister → `404` si UUID inexistant.

---

## 5. Comportements Backend par Cas d'Usage

**Nominal :**
- `GET /api/v1/it-components` authentifié → `200` avec objet paginé `{ data: [], meta: {...} }`
- `GET /api/v1/it-components?search=postgres` → `200` filtré sur name (insensible à la casse)
- `GET /api/v1/it-components?type=database` → `200` filtré sur type
- `POST /api/v1/it-components` valide → `201` avec `ITComponentResponse` + audit trail créé
- `PATCH /api/v1/it-components/{id}` existant + valide → `200` avec entité mise à jour
- `DELETE /api/v1/it-components/{id}` sans applications liées → `204`
- `GET /api/v1/it-components/{id}/applications` → `200` liste paginée d'`ApplicationListItem`

**Erreurs :**
- `POST` sans `name` → `400`
- `POST` `name` uniquement espaces → `400`
- `POST` / `PATCH` nom dupliqué → `409` + `code: "CONFLICT"`
- `GET` / `PATCH` / `DELETE` UUID inexistant → `404`
- `DELETE` avec applications liées → `409` + `code: "DEPENDENCY_CONFLICT"` + compteurs dans `message`
- Toute route sans token → `401`
- Route `write` sans permission → `403`

---

## 6. Structure de Fichiers Backend

```
backend/src/it-components/
├── it-components.module.ts
├── it-components.controller.ts
├── it-components.service.ts
├── it-components.service.spec.ts      ← tests unit Jest
└── dto/
    ├── create-it-component.dto.ts
    ├── update-it-component.dto.ts
    └── query-it-components.dto.ts     ← pagination/filtres

backend/test/
└── FS-04-it-components.e2e-spec.ts   ← tests Supertest
```

---

## 7. Tests Backend

### Outil par niveau

| Niveau | Outil | Fichier cible | Délégable à OpenCode |
|---|---|---|---|
| Unit (services NestJS) | **Jest** | `src/it-components/it-components.service.spec.ts` | ✅ Oui |
| API / contrat HTTP | **Supertest** | `test/FS-04-it-components.e2e-spec.ts` | ✅ Oui |
| Sécurité / RBAC | **Supertest** | `test/FS-04-it-components.e2e-spec.ts` | ❌ **Manuel** |

> **Règle absolue :** Les tests RBAC ne sont jamais délégués à OpenCode.

### Tests Jest — Unit

- [ ] `[Jest]` `ITComponentsService.findAll()` retourne un objet paginé `{ data, meta }`
- [ ] `[Jest]` `ITComponentsService.findAll()` avec filtre `search` → recherche textuelle sur `name`
- [ ] `[Jest]` `ITComponentsService.findAll()` avec filtre `type` → filtrage sur type
- [ ] `[Jest]` `ITComponentsService.findAll()` avec filtre `technology` → filtrage sur technologie
- [ ] `[Jest]` `ITComponentsService.create()` retourne l'IT Component créé
- [ ] `[Jest]` `ITComponentsService.create()` lève `ConflictException` sur erreur Prisma `P2002`
- [ ] `[Jest]` `ITComponentsService.findOne()` retourne l'IT Component avec tags et `_count.applications`
- [ ] `[Jest]` `ITComponentsService.findOne()` lève `NotFoundException` si UUID inexistant
- [ ] `[Jest]` `ITComponentsService.getApplications()` retourne la liste paginée des apps liées
- [ ] `[Jest]` `ITComponentsService.remove()` lève `NotFoundException` si UUID inexistant
- [ ] `[Jest]` `ITComponentsService.remove()` lève `ConflictException` si des applications sont liées
- [ ] `[Jest]` `ITComponentsService.remove()` appelle `prisma.itComponent.delete()` si aucune application liée

### Tests Supertest — Contrat API

- [ ] `[Supertest]` `GET /api/v1/it-components` authentifié → `200` avec objet paginé
- [ ] `[Supertest]` `GET /api/v1/it-components` liste vide → `200` avec `{ data: [], meta: {...} }`
- [ ] `[Supertest]` `GET /api/v1/it-components?search=redis` → filtre appliqué sur name
- [ ] `[Supertest]` `GET /api/v1/it-components?type=database` → filtre appliqué sur type
- [ ] `[Supertest]` `POST /api/v1/it-components` valide → `201` avec `ITComponentResponse`
- [ ] `[Supertest]` `POST /api/v1/it-components` valide → audit_trail contient 1 ligne avec entity_type='it_components' et changed_by non NULL
- [ ] `[Supertest]` `POST /api/v1/it-components` nom dupliqué → `409` + `code: "CONFLICT"`
- [ ] `[Supertest]` `POST /api/v1/it-components` sans `name` → `400`
- [ ] `[Supertest]` `POST /api/v1/it-components` name uniquement espaces → `400`
- [ ] `[Supertest]` `GET /api/v1/it-components/{id}` existant → `200` avec `_count.applications` et `tags`
- [ ] `[Supertest]` `GET /api/v1/it-components/{id}` UUID inexistant → `404`
- [ ] `[Supertest]` `GET /api/v1/it-components/{id}/applications` → `200` liste paginée d'`ApplicationListItem`
- [ ] `[Supertest]` `GET /api/v1/it-components/{id}/applications` IT Component inexistant → `404`
- [ ] `[Supertest]` `PATCH /api/v1/it-components/{id}` changement description → `200`
- [ ] `[Supertest]` `PATCH /api/v1/it-components/{id}` nom dupliqué → `409` + `code: "CONFLICT"`
- [ ] `[Supertest]` `DELETE /api/v1/it-components/{id}` sans applications liées → `204`
- [ ] `[Supertest]` `DELETE /api/v1/it-components/{id}` avec applications liées → `409` + `code: "DEPENDENCY_CONFLICT"` + compteurs

> **FK entrantes — test `DEPENDENCY_CONFLICT` avec Applications :**
> 1. Créer un IT Component (`POST /it-components`)
> 2. Créer une Application liée (`POST /applications` avec `itComponentIds` rempli) — **requiert `FS-06-BACK` `done`**
> 3. Tenter `DELETE /it-components/{id}` → vérifier `409` + `code: "DEPENDENCY_CONFLICT"`

> **Audit trail — test obligatoire (NFR-SEC-009) :** Le trigger `fn_audit_trigger()` est actif sur toutes les tables métier. Tout `INSERT/UPDATE/DELETE` sans `SET LOCAL ark.current_user_id` positionné par le middleware génère un rollback silencieux (voir AGENTS.md §Troubleshooting). Ce test Supertest vérifie que l'audit context middleware est correctement câblé et que le trigger remplit bien le champ `changed_by`.
>
> Format du test : après un `POST /it-components` valide, requêter `audit_trail` sur `entity_type='it_components'` et `entity_id=[id_créée]` → vérifier `changed_by IS NOT NULL`.

### Tests Sécurité / RBAC — Manuel ❌

- [ ] `[Manuel]` `GET /api/v1/it-components` sans token → `401`
- [ ] `[Manuel]` `POST /api/v1/it-components` rôle sans `it-components:write` → `403`
- [ ] `[Manuel]` `PATCH /api/v1/it-components/{id}` rôle sans `it-components:write` → `403`
- [ ] `[Manuel]` `DELETE /api/v1/it-components/{id}` rôle sans `it-components:write` → `403`
- [ ] `[Manuel]` `GET /api/v1/it-components/{id}/applications` sans `it-components:read` → `403`

---

## 8. Commande OpenCode — Backend

```
Contexte projet ARK — Session Backend FS-04-BACK :

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
- Fichier test e2e : backend/test/FS-04-it-components.e2e-spec.ts
- Tests DEPENDENCY_CONFLICT avec Applications : créer une Application réelle en base (POST /applications) dans le beforeEach du test — ne pas mocker

Documentation obligatoire (NFR-GOV-001) :
- À la fin de la session, recopier le contenu YAML de la section §3 (Contrat API) de cette spec dans le fichier `docs/04-Tech/openapi.yaml`
  en remplaçant la section `paths:` correspondante
  OU en ajoutant les nouveaux paths si l'entité n'existait pas
- Ne pas générer de documentation OpenAPI/Swagger automatique — le fichier YAML central est la source de vérité

Intégration tags F-03 :
- TagsModule est @Global() — TagService injectable sans réimporter TagsModule
- getEntityTags('it_component', id) retourne TOUS les entity_tags sans filtrage
- Le join sur tag_dimensions est obligatoire pour peupler dimensionColor et depth
- NE PAS implémenter deduplicateByDepth() côté backend

Migration requise avant implémentation :
```sql
ALTER TABLE it_components
  ADD COLUMN description TEXT,
  ADD COLUMN comment TEXT,
  ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW(),
  ADD CONSTRAINT it_components_name_key UNIQUE (name);
```

Pattern de référence NestJS : module Domains (FS-02-BACK) et Providers (FS-03-BACK) — s'y conformer pour la structure et le style.
Ce module débloque la création d'Applications avec liens vers IT Components (FS-06-BACK relations).

Implémente la feature "IT Components" backend (FS-04-BACK) en respectant strictement le contrat ci-dessous.
Génère : module NestJS complet (controller, service, DTOs, module) + tests Jest unit + tests Supertest.
Ne génère PAS les tests marqués [Manuel].
Ne génère PAS de code frontend.
Ne fais aucune hypothèse non documentée. Si un point est ambigu, pose une question avant de coder.

[COLLER LE CONTENU COMPLET DE FS-04-BACK.md ICI]
```

---

## 9. Gate de Validation Backend

> À valider **avant** de passer `FS-04-FRONT` au statut `stable`.
> FS-04-FRONT reste à `draft` tant que toutes ces gates ne sont pas cochées.

| # | Gate | Vérification | Bloquant |
|---|------|--------------|----------|
| G-01 | Migration Prisma appliquée | Table `it_components` avec description, comment, updated_at, contrainte UNIQUE(name) | ✅ Oui |
| G-02 | Seed permissions | `it-components:read` et `it-components:write` en base | ✅ Oui |
| G-03 | Tests Jest passent | `npm run test -- --testPathPattern=it-components` → 0 failed | ✅ Oui |
| G-04 | Tests Supertest passent | `npm run test:e2e -- --testPathPattern=FS-04` → 0 failed | ✅ Oui |
| G-05 | Tests RBAC manuels validés | Les 5 cas [Manuel] §7 vérifiés à la main | ✅ Oui |
| G-06 | Aucune erreur TypeScript | `npm run build` → 0 error | ✅ Oui |
| G-07 | Statut mis à jour | Passer `FS-04-BACK` à `done` dans cet en-tête | ✅ Oui |
| G-08 | Revue TD backend | TD-1 à TD-6 du template vérifiés, F-999 mis à jour | ✅ Oui |
| G-09 | `_count.applications` présent | Vérifier dans `ITComponentResponse` | ✅ Oui |
| G-10 | Endpoint `GET /:id/applications` | Liste paginée des apps liées fonctionnelle | ✅ Oui |
| G-11 | Test `DEPENDENCY_CONFLICT` avec Application réelle | Créer une Application via `POST /applications` puis tenter suppression | ✅ Oui |
| G-12 | Audit trail actif | `POST /it-components` → vérifier ligne dans audit_trail (changed_by non NULL) | ✅ Oui |
| G-13 | `openapi.yaml` mis à jour | Paths `/it-components` présents dans `docs/04-Tech/openapi.yaml` | ✅ Oui |

---

## 10. Checklist de Validation Post-Session

- [ ] `POST /api/v1/it-components` retourne `201` avec `ITComponentResponse` complet
- [ ] `POST` → audit_trail.changed_by non NULL (NFR-SEC-009)
- [ ] `DELETE` avec applications liées retourne `409` + `code: "DEPENDENCY_CONFLICT"` + details
- [ ] Toutes les réponses `409` incluent le champ `code` explicite (NFR-MAINT-001)
- [ ] `name` uniquement espaces → `400`
- [ ] `GET /api/v1/it-components/:id` avec tags ancêtre + descendant → les deux présents (pas de filtrage backend)
- [ ] `GET /api/v1/it-components/:id/applications` retourne la liste paginée correcte
- [ ] `_count.applications` présent dans `ITComponentResponse`
- [ ] Pagination fonctionnelle (page, limit, meta)
- [ ] Filtres `search`, `type`, `technology` fonctionnels
- [ ] Aucun `TODO / FIXME / HACK` non tracé dans le code livré
- [ ] Aucune erreur TypeScript strict
- [ ] Conventions AGENTS.md respectées
- [ ] `docs/04-Tech/openapi.yaml` mis à jour avec les paths de cette feature (NFR-GOV-001)

---

## 11. Revue de Dette Technique

### Gates TD

| # | Vérification | Commande / Action |
|---|---|---|
| TD-1 | Aucun `TODO / FIXME / HACK` non tracé dans le code livré | `git grep -n "TODO\|FIXME\|HACK" -- '*.ts'` |
| TD-2 | Items F-999 activés par cette feature : statut mis à jour | Relire F-999 §2 |
| TD-3 | Checklist F-999 §4 : cases cochées pour les items de ce sprint | F-999 §4 |
| TD-4 | AGENTS.md : aucun pattern nouveau non documenté introduit | Relire AGENTS.md |
| TD-5 | ARK-NFR.md : NFR impactés mis à jour | NFR-MAINT-002 (politique suppression it-components), NFR-GOV-005 |
| TD-6 | Nouvelles décisions transverses → nouvel Item F-999 créé si applicable | Jugement |

### Résultat de la Revue

| Champ | Valeur |
|---|---|
| **Sprint** | Sprint 2 |
| **Date de revue** | *(à compléter)* |
| **Items F-999 fermés** | *(à compléter)* |
| **Items F-999 ouverts** | *(à compléter)* |
| **Nouveaux items F-999 créés** | *(à compléter)* |
| **NFR mis à jour** | NFR-MAINT-002 → `covered` pour it-components, NFR-GOV-005 |
| **TODOs résiduels tracés** | *(à compléter)* |
| **Statut gates TD** | *(à compléter)* |

---

## 12. Données de Seed

### Pertinence

✅ **Utile** — Les IT Components sont un référentiel sélectionnable dans le formulaire Application (future liaison via `app_it_component_map`).

### Données de démonstration

| # | name | type | technology | description |
|---|------|------|------------|-------------|
| 1 | PostgreSQL Primary | database | PostgreSQL 16 | Base de données principale ARK |
| 2 | Redis Cache | cache | Redis 7.2 | Cache applicatif et sessions |
| 3 | Kafka Cluster | messaging | Apache Kafka 3.6 | Streaming events et bus de messages |
| 4 | RabbitMQ | messaging | RabbitMQ 3.12 | Queue messages asynchrones |
| 5 | Nginx Reverse Proxy | web-server | Nginx 1.24 | Load balancer et reverse proxy |
| 6 | Kubernetes Production | container-orchestration | Kubernetes 1.28 | Orchestration containers production |
| 7 | Elasticsearch Logs | search-engine | Elasticsearch 8.11 | Indexation et recherche logs |
| 8 | MinIO Object Storage | storage | MinIO | Stockage objets S3-compatible |

### Bloc de code seed

```typescript
// Insert sample IT Components if they don't exist
const sampleItComponents = [
  { name: 'PostgreSQL Primary', type: 'database', technology: 'PostgreSQL 16', description: 'Base de données principale ARK' },
  { name: 'Redis Cache', type: 'cache', technology: 'Redis 7.2', description: 'Cache applicatif et sessions' },
  { name: 'Kafka Cluster', type: 'messaging', technology: 'Apache Kafka 3.6', description: 'Streaming events et bus de messages' },
  { name: 'RabbitMQ', type: 'messaging', technology: 'RabbitMQ 3.12', description: 'Queue messages asynchrones' },
  { name: 'Nginx Reverse Proxy', type: 'web-server', technology: 'Nginx 1.24', description: 'Load balancer et reverse proxy' },
  { name: 'Kubernetes Production', type: 'container-orchestration', technology: 'Kubernetes 1.28', description: 'Orchestration containers production' },
  { name: 'Elasticsearch Logs', type: 'search-engine', technology: 'Elasticsearch 8.11', description: 'Indexation et recherche logs' },
  { name: 'MinIO Object Storage', type: 'storage', technology: 'MinIO', description: 'Stockage objets S3-compatible' },
];

for (const item of sampleItComponents) {
  const existing = await prisma.itComponent.findUnique({ where: { name: item.name } });
  if (!existing) {
    await prisma.$executeRaw`INSERT INTO it_components (id, name, description, type, technology, created_at, updated_at) 
      VALUES (gen_random_uuid(), ${item.name}::varchar, ${item.description}::text, ${item.type}::varchar, ${item.technology}::varchar, NOW(), NOW())`;
    console.log(`✓ Created IT Component: ${item.name}`);
  }
}
console.log('Seed IT Components completed');
```

> **Rappel F-999 Item 8 :** Utiliser le tagged template `$executeRaw` — jamais `$executeRawUnsafe` avec interpolation de string.

---

_FS-04-BACK v1.0 — Projet ARK_
