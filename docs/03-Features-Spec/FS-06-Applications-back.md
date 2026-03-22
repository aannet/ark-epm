# ARK — Feature Spec FS-06-BACK : Applications (Backend)

_Version 1.2 — Mars 2026_

> **Changelog v1.2 :** **ÉVOLUTION MAJEURE** — Migration modèle Provider 1:N → N:N. Une application peut désormais être liée à plusieurs providers avec des rôles distincts. Suppression FK `providerId`, création table de jonction `app_provider_map`. DTOs : `providerId` → `providers: Array<{id, role}>`. Response : `provider` (single) → `providers` (array). RM-02 et RM-03 adaptés. Impact sur tous les tests backend + frontend.
> 
> **Changelog v1.1 :** Ajout des champs `description` et `comment` conformément à NFR-GOV-005 (5 champs socle obligatoires). Mise à jour des DTOs et schémas OpenAPI. **Note design :** Champ description en texte simple pour P1 (Markdown différé P2 — voir F-999 Item 11).
>
> **Changelog v1.0 :** Création initiale — module Applications, entité centrale du métier ARK. Implémente le CRUD complet avec liaisons vers domains/providers/users + support tags F-03 + gestion des dépendances entrantes (interfaces, data objects, IT components, business capabilities). Ce module est le **backbone** des modules satellites (FS-03/04/05).

---

## En-tête

| Champ | Valeur |
|---|---|
| **ID** | FS-06-BACK |
| **Titre** | Applications — API REST Backend |
| **Priorité** | P1 |
| **Statut** | `draft` |
| **Dépend de** | FS-01, F-03, **FS-02-BACK** (domains), **FS-03-BACK** (providers — N:N requirement) |
| **Spec mère** | FS-06 Applications v1.0 |
| **Spec front** | FS-06-FRONT — bloquée tant que cette spec n'est pas `done` |
| **Estimé** | 2.0 jours (+ 0.5 jour pour migration N:N) |
| **Version** | 1.2 |

---

## 1. Objectif & Périmètre

**Ce que cette spec fait :**

Implémenter l'API REST complète pour la gestion des Applications : création, lecture, modification et suppression. L'Application est l'entité centrale du système ARK, liée aux domaines, fournisseurs, responsables, capacités métier, objets de données, composants IT et interfaces.

Le backend expose :
- CRUD complet avec gestion des relations `domain_id`, `owner_id` et **N:N vers providers** (via `app_provider_map` avec rôles)
- Endpoint de vérification des dépendances (`GET /:id/dependencies`) pour la suppression
- Support des tags dimensionnels via `EntityTag` (F-03)
- Pagination, tri et filtres côté serveur (cycle de vie, tags)
- **Gestion des multiples providers avec rôles distincts** pour chaque application

**Hors périmètre :**
- Frontend — couvert par `FS-06-FRONT`
- Graph de dépendances visuel — couvert par FS-09
- Import Excel — couvert par FS-10
- Relations bidirectionnelles complexes — seule la suppression vérifie les dépendances

---

## 2. Modèle BDD

### 2.1 Modèle Relationnel

**Schéma BDD complet — Applications et ses relations**

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
└──────┬───────────────────┬───────────────┘
       │                   │
       │                   │ N
       │                   │
┌──────▼───────────────────▼─────────────┐
│              entity_tags               │
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
                    │ via entity_type='application'
                    │ entity_id = applications.id
                    │
┌───────────────────┴──────────────────────┐
│               applications               │
├──────────────────────────────────────────┤
│ id               UUID        PK            │
│ name             VARCHAR(255) NOT NULL     │
│ owner_id         UUID      FK → users      │
│ domain_id        UUID      FK → domains    │
│ criticality      VARCHAR(50)               │
│   CHECK ('low','medium','high',           │
│          'mission-critical')             │
│ lifecycle_status VARCHAR(50)               │
│ created_at       TIMESTAMPTZ default now() │
│ updated_at       TIMESTAMPTZ auto-update   │
├──────────────────────────────────────────┤
│ → domain         (N:1)                     │
│ → appProviderMaps[] (N:N via               │
│   app_provider_map avec provider_role)    │
│ → owner          (N:1)                     │
│ → business_capabilities[] (N:N via         │
│   app_capability_map)                      │
│ → data_objects[] (N:N via                  │
│   app_data_object_map)                     │
│ → it_components[] (N:N via                 │
│   app_it_component_map)                    │
│ → source_interfaces[] (1:N via             │
│   interfaces.source_app_id)              │
│ → target_interfaces[] (1:N via           │
│   interfaces.target_app_id)              │
└──────────────────────────────────────────┘
```

**Vue des relations globales**

```
applications ──N:1──► domains
applications ──N:N──► providers (via app_provider_map avec rôles)
applications ──N:1──► users (owner)

applications ──N:N──► business_capabilities (via app_capability_map)
applications ──N:N──► data_objects (via app_data_object_map)
applications ──N:N──► it_components (via app_it_component_map)

applications ──1:N──► interfaces (source_app_id)
applications ──1:N──► interfaces (target_app_id)

tag_values ──1:N──► entity_tags ◄── (entity_type='application', entity_id)
```

### 2.2 Modèle Prisma

```prisma
model Application {
  id               String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  name             String   @db.VarChar(255)
  description      String?  @db.Text
  comment          String?  @db.Text
  ownerId          String?  @map("owner_id") @db.Uuid
  domainId         String?  @map("domain_id") @db.Uuid
  criticality      String?  @db.VarChar(50)
  lifecycleStatus  String?  @map("lifecycle_status") @db.VarChar(50)
  createdAt        DateTime @default(now()) @map("created_at") @db.Timestamptz
  updatedAt        DateTime @updatedAt @map("updated_at") @db.Timestamptz

  // Relations
  domain            Domain?    @relation(fields: [domainId], references: [id])
  appProviderMaps   ApplicationProviderMap[]
  owner             User?      @relation("ApplicationOwner", fields: [ownerId], references: [id])
  
  // Relations entrantes (dépendances)
  capabilities      AppCapabilityMap[]
  dataObjects       AppDataObjectMap[]
  itComponents      AppItComponentMap[]
  sourceInterfaces  Interface[] @relation("SourceApp")
  targetInterfaces  Interface[] @relation("TargetApp")
  
  // Tags polymorphes
  entityTags        EntityTag[]

  @@map("applications")
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

model AppCapabilityMap {
  applicationId String @map("application_id") @db.Uuid
  capabilityId  String @map("capability_id") @db.Uuid

  application   Application        @relation(fields: [applicationId], references: [id], onDelete: Cascade)
  capability    BusinessCapability @relation(fields: [capabilityId], references: [id], onDelete: Cascade)

  @@id([applicationId, capabilityId])
  @@map("app_capability_map")
}

model AppDataObjectMap {
  applicationId String @map("application_id") @db.Uuid
  dataObjectId  String @map("data_object_id") @db.Uuid
  role          String @default("consumer") @db.VarChar(50)

  application   Application @relation(fields: [applicationId], references: [id], onDelete: Cascade)
  dataObject    DataObject  @relation(fields: [dataObjectId], references: [id], onDelete: Cascade)

  @@id([applicationId, dataObjectId])
  @@map("app_data_object_map")
}

model AppItComponentMap {
  applicationId String @map("application_id") @db.Uuid
  itComponentId String @map("it_component_id") @db.Uuid

  application   Application @relation(fields: [applicationId], references: [id], onDelete: Cascade)
  itComponent   ItComponent @relation(fields: [itComponentId], references: [id], onDelete: Cascade)

  @@id([applicationId, itComponentId])
  @@map("app_it_component_map")
}

model Interface {
  id                String  @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  name              String? @db.VarChar(255)
  sourceAppId       String  @map("source_app_id") @db.Uuid
  targetAppId       String  @map("target_app_id") @db.Uuid
  type              String  @db.VarChar(50)
  frequency         String? @db.VarChar(50)
  criticality       String? @db.VarChar(50)
  technicalContactId String? @map("technical_contact_id") @db.Uuid
  latencyMs         Int?    @map("latency_ms")
  errorRate         Decimal? @db.Decimal(5, 2)
  createdAt         DateTime @default(now()) @map("created_at") @db.Timestamptz
  updatedAt         DateTime @updatedAt @map("updated_at") @db.Timestamptz

  sourceApp       Application @relation("SourceApp", fields: [sourceAppId], references: [id])
  targetApp       Application @relation("TargetApp", fields: [targetAppId], references: [id])
  technicalContact User?      @relation(fields: [technicalContactId], references: [id])

  @@map("interfaces")
}
```

---

## 3. Contrat API (OpenAPI)

```yaml
paths:

  /api/v1/applications:
    get:
      summary: Liste paginée des applications
      tags: [Applications]
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
          schema: { type: string, enum: [name, createdAt, domain, provider], default: name }
        - name: sortOrder
          in: query
          schema: { type: string, enum: [asc, desc], default: asc }
        - name: lifecycleStatus
          in: query
          schema: { type: string }
        - name: tagValueIds
          in: query
          schema: { type: array, items: { type: string, format: uuid } }
          description: Filtrer par IDs de tag_values (AND entre les dimensions, OR dans une dimension)
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

    post:
      summary: Créer une application
      tags: [Applications]
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateApplicationDto'
      responses:
        '201':
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ApplicationResponse'
        '400':
          description: Validation échouée
        '401':
          description: Non authentifié
        '403':
          description: Permission insuffisante
        '404':
          description: Domaine, Provider ou Owner introuvable
        '409':
          description: Conflit
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

  /api/v1/applications/{id}:
    get:
      summary: Détail d'une application
      tags: [Applications]
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
                $ref: '#/components/schemas/ApplicationResponse'
        '401':
          description: Non authentifié
        '404':
          description: Application introuvable

    patch:
      summary: Modifier une application
      tags: [Applications]
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
              $ref: '#/components/schemas/UpdateApplicationDto'
      responses:
        '200':
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ApplicationResponse'
        '400':
          description: Validation échouée
        '401':
          description: Non authentifié
        '403':
          description: Permission insuffisante
        '404':
          description: Application, Domaine, Provider ou Owner introuvable
        '409':
          description: Conflit
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
      summary: Supprimer une application
      tags: [Applications]
      security:
        - bearerAuth: []
      parameters:
        - name: id
          in: path
          required: true
          schema: { type: string, format: uuid }
      responses:
        '204':
          description: Application supprimée
        '401':
          description: Non authentifié
        '403':
          description: Permission insuffisante
        '404':
          description: Application introuvable
        '409':
          description: Application utilisée par des entités liées
          content:
            application/json:
              schema:
                type: object
                properties:
                  statusCode: { type: integer, example: 409 }
                  code:       { type: string,  example: "DEPENDENCY_CONFLICT" }
                  message:    { type: string }
                  details:
                    type: object
                    properties:
                      capabilitiesCount: { type: integer }
                      dataObjectsCount: { type: integer }
                      itComponentsCount: { type: integer }
                      sourceInterfacesCount: { type: integer }
                      targetInterfacesCount: { type: integer }

  /api/v1/applications/{id}/dependencies:
    get:
      summary: Vérifier les dépendances d'une application (pour suppression)
      tags: [Applications]
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
                type: object
                properties:
                  hasDependencies: { type: boolean }
                  counts:
                    type: object
                    properties:
                      capabilities: { type: integer }
                      dataObjects: { type: integer }
                      itComponents: { type: integer }
                      sourceInterfaces: { type: integer }
                      targetInterfaces: { type: integer }
        '401':
          description: Non authentifié
        '404':
          description: Application introuvable

components:
  schemas:

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
        providers:
          type: array
          description: Liste des providers associés avec leurs rôles
          items:
            type: object
            properties:
              id: { type: string, format: uuid }
              name: { type: string }
              role: { type: string, nullable: true, example: "editor" }
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
        tags:
          type: array
          items:
            $ref: '#/components/schemas/EntityTagResponse'

    ApplicationResponse:
      type: object
      properties:
        id: { type: string, format: uuid }
        name: { type: string }
        description: { type: string, nullable: true }
        comment: { type: string, nullable: true }
        domain:
          type: object
          nullable: true
          properties:
            id: { type: string, format: uuid }
            name: { type: string }
        providers:
          type: array
          description: Liste des providers associés avec leurs rôles
          items:
            type: object
            properties:
              id: { type: string, format: uuid }
              name: { type: string }
              role: { type: string, nullable: true, example: "editor" }
        owner:
          type: object
          nullable: true
          properties:
            id: { type: string, format: uuid }
            firstName: { type: string }
            lastName: { type: string }
            email: { type: string }
        criticality: { type: string, nullable: true, enum: [low, medium, high, mission-critical] }
        lifecycleStatus: { type: string, nullable: true }
        createdAt: { type: string, format: date-time }
        updatedAt: { type: string, format: date-time }
        tags:
          type: array
          items:
            $ref: '#/components/schemas/EntityTagResponse'

    CreateApplicationDto:
      type: object
      required: [name]
      properties:
        name:
          type: string
          minLength: 1
          maxLength: 255
        description:
          type: string
          nullable: true
        comment:
          type: string
          nullable: true
        domainId:
          type: string
          format: uuid
          nullable: true
        providers:
          type: array
          nullable: true
          description: Liste des providers avec leurs rôles respectifs
          items:
            type: object
            required: [id]
            properties:
              id:
                type: string
                format: uuid
              role:
                type: string
                nullable: true
                example: "editor"
        ownerId:
          type: string
          format: uuid
          nullable: true
        criticality:
          type: string
          nullable: true
          enum: [low, medium, high, mission-critical]
        lifecycleStatus:
          type: string
          nullable: true

    UpdateApplicationDto:
      type: object
      properties:
        name:
          type: string
          minLength: 1
          maxLength: 255
        description:
          type: string
          nullable: true
        comment:
          type: string
          nullable: true
        domainId:
          type: string
          format: uuid
          nullable: true
        providers:
          type: array
          nullable: true
          description: Liste des providers avec leurs rôles respectifs (remplace la liste précédente)
          items:
            type: object
            required: [id]
            properties:
              id:
                type: string
                format: uuid
              role:
                type: string
                nullable: true
                example: "integrator"
        ownerId:
          type: string
          format: uuid
          nullable: true
        criticality:
          type: string
          nullable: true
          enum: [low, medium, high, mission-critical]
        lifecycleStatus:
          type: string
          nullable: true

    EntityTagResponse:
      type: object
      properties:
        entityType: { type: string }
        entityId: { type: string, format: uuid }
        tagValue:
          type: object
          properties:
            id: { type: string, format: uuid }
            dimensionId: { type: string, format: uuid }
            dimensionName: { type: string }
            dimensionColor: { type: string, nullable: true }
            path: { type: string }
            label: { type: string }
            depth: { type: integer }
            parentId: { type: string, format: uuid, nullable: true }
        taggedAt: { type: string, format: date-time }
```

---

## 4. Règles Métier Backend

- **RM-01 — Nom obligatoire et unique :** `name` obligatoire, non vide, non uniquement espaces. Deux applications ne peuvent pas avoir le même nom. `409` + code `"CONFLICT"` + message `"Application name already in use"`. Intercepter l'erreur Prisma `P2002` dans un try/catch ciblé.

- **RM-02 — Validation des FK :** `domainId`, `ownerId` optionnels mais s'ils sont fournis, doivent exister en base. `404` si inexistant. Pour `providers[]`, chaque `id` dans l'array doit exister en base. `404` si au moins un provider inexistant.

- **RM-03 — Suppression bloquée si entités liées :**

```typescript
async remove(id: string): Promise<void> {
  const app = await this.prisma.application.findUnique({
    where: { id },
    select: {
      _count: {
        select: {
          appProviderMaps: true,  // N:N providers
          capabilities: true,
          dataObjects: true,
          itComponents: true,
          sourceInterfaces: true,
          targetInterfaces: true
        }
      }
    }
  });
  if (!app) throw new NotFoundException('Application not found');

  const total = app._count.appProviderMaps + app._count.capabilities + 
                app._count.dataObjects + app._count.itComponents + 
                app._count.sourceInterfaces + app._count.targetInterfaces;
  
  if (total > 0) {
    throw new ConflictException({
      code: 'DEPENDENCY_CONFLICT',
      message: `Application has dependencies`,
      details: {
        providersCount: app._count.appProviderMaps,
        capabilitiesCount: app._count.capabilities,
        dataObjectsCount: app._count.dataObjects,
        itComponentsCount: app._count.itComponents,
        sourceInterfacesCount: app._count.sourceInterfaces,
        targetInterfacesCount: app._count.targetInterfaces
      }
    });
  }
  await this.prisma.application.delete({ where: { id } });
}
```

- **RM-04 — Endpoint de vérification des dépendances :** `GET /:id/dependencies` retourne un objet avec `hasDependencies: boolean` et `counts` détaillés. Utilisé par le frontend pour afficher/masquer le bouton de suppression et formater le message d'erreur.

- **RM-05 — Filtres combinés :** Les filtres `lifecycleStatus` et `tagValueIds` peuvent être combinés. Filtrage par tags : AND entre différentes dimensions, OR dans la même dimension.

- **RM-06 — Droits requis :** `applications:read` sur GET. `applications:write` sur POST/PATCH/DELETE.

- **RM-07 — Pas de soft delete :** Suppression physique après vérification RM-03.

- **RM-08 — Rôles providers optionnels :** Le champ `role` dans chaque relation `Application-Provider` est optionnel (nullable). Valeurs courantes : `'editor'`, `'integrator'`, `'support'`, `'vendor'`, `'custom'`. Pas d'énumération stricte — permet des valeurs métier libres.

---

## 5. Structure de Fichiers Backend

```
backend/src/applications/
├── applications.module.ts
├── applications.controller.ts
├── applications.service.ts
├── applications.service.spec.ts      ← tests unit Jest
└── dto/
    ├── create-application.dto.ts
    ├── update-application.dto.ts
    └── query-applications.dto.ts     ← pagination/filtres

backend/test/
└── FS-06-applications.e2e-spec.ts    ← tests Supertest
```

---

## 5.1 Integration with Tags (F-03)

Les Applications supportent le système de tags dimensionnels via la relation polymorphe `EntityTag`.

**Endpoints impliqués :**

- **GET /api/v1/applications** — Retourne le tableau `tags` pour chaque application (chargé via join)
- **GET /api/v1/applications/:id** — Retourne l'application avec le tableau `tags`
- **PUT /tags/entity/application/:id** — Endpoint F-03 pour mettre à jour les tags

**Principe de responsabilité :**

> Le backend retourne **l'intégralité** des `entity_tags` d'une application, sans filtrage ni déduplication. La déduplication par profondeur (F-03 RM-11) est une règle d'affichage **côté frontend** appliquée par `TagChipList`.

---

## 6. Tests Backend

### Tests Jest — Unit

- [ ] `[Jest]` `ApplicationsService.findAll()` retourne un objet paginé `{ data, meta }`
- [ ] `[Jest]` `ApplicationsService.findAll()` avec filtres lifecycleStatus et tagValueIds
- [ ] `[Jest]` `ApplicationsService.create()` retourne l'application créée avec relations + providers N:N
- [ ] `[Jest]` `ApplicationsService.create()` avec `providers: [{id, role}]` crée les entrées `app_provider_map`
- [ ] `[Jest]` `ApplicationsService.create()` lève `NotFoundException` si un provider inexistant
- [ ] `[Jest]` `ApplicationsService.create()` lève `ConflictException` sur erreur Prisma `P2002`
- [ ] `[Jest]` `ApplicationsService.create()` lève `NotFoundException` si domainId inexistant
- [ ] `[Jest]` `ApplicationsService.findOne()` retourne l'application avec `providers[]` peuplé
- [ ] `[Jest]` `ApplicationsService.findOne()` retourne l'application avec tags
- [ ] `[Jest]` `ApplicationsService.findOne()` lève `NotFoundException` si UUID inexistant
- [ ] `[Jest]` `ApplicationsService.update()` avec `providers[]` met à jour les mappings N:N (remplacement complet)
- [ ] `[Jest]` `ApplicationsService.getDependencies()` inclut `appProviderMaps` dans les compteurs
- [ ] `[Jest]` `ApplicationsService.remove()` lève `NotFoundException` si UUID inexistant
- [ ] `[Jest]` `ApplicationsService.remove()` lève `ConflictException` si des providers sont liés via `appProviderMaps`
- [ ] `[Jest]` `ApplicationsService.remove()` lève `ConflictException` si des interfaces sont liées
- [ ] `[Jest]` `ApplicationsService.remove()` lève `ConflictException` si des data objects sont liés
- [ ] `[Jest]` `ApplicationsService.remove()` appelle `prisma.application.delete()` si aucune entité liée

### Tests Supertest — Contrat API

- [ ] `[Supertest]` `GET /api/v1/applications` authentifié → `200` avec objet paginé + `providers[]` peuplé
- [ ] `[Supertest]` `GET /api/v1/applications` liste vide → `200` avec `{ data: [], meta: {...} }`
- [ ] `[Supertest]` `GET /api/v1/applications?page=1&limit=10` → pagination correcte
- [ ] `[Supertest]` `GET /api/v1/applications?lifecycleStatus=production` → filtre appliqué
- [ ] `[Supertest]` `POST /api/v1/applications` nom valide + domainId → `201` avec `ApplicationResponse`
- [ ] `[Supertest]` `POST /api/v1/applications` avec `providers: [{id, role: 'editor'}, {id, role: 'integrator'}]` → `201` avec providers peuplés
- [ ] `[Supertest]` `POST /api/v1/applications` avec provider inexistant dans `providers[]` → `404`
- [ ] `[Supertest]` `POST /api/v1/applications` nom dupliqué → `409` + `code: "CONFLICT"`
- [ ] `[Supertest]` `POST /api/v1/applications` sans `name` → `400`
- [ ] `[Supertest]` `POST /api/v1/applications` name uniquement espaces → `400`
- [ ] `[Supertest]` `POST /api/v1/applications` domainId inexistant → `404`
- [ ] `[Supertest]` `GET /api/v1/applications/{id}` existant → `200` avec domain/providers[]/owner peuplés
- [ ] `[Supertest]` `GET /api/v1/applications/{id}` UUID inexistant → `404`
- [ ] `[Supertest]` `GET /api/v1/applications/{id}/dependencies` → `200` avec `hasDependencies` et `counts` (inclus `providersCount`)
- [ ] `[Supertest]` `PATCH /api/v1/applications/{id}` changement `providers[]` → `200` et mappings N:N remplacés
- [ ] `[Supertest]` `PATCH /api/v1/applications/{id}` vider `providers[]` → `200` et mappings supprimés
- [ ] `[Supertest]` `PATCH /api/v1/applications/{id}` nom dupliqué → `409` + `code: "CONFLICT"`
- [ ] `[Supertest]` `DELETE /api/v1/applications/{id}` sans entités liées → `204`
- [ ] `[Supertest]` `DELETE /api/v1/applications/{id}` avec providers liés → `409` + `code: "DEPENDENCY_CONFLICT"` + `providersCount`
- [ ] `[Supertest]` `DELETE /api/v1/applications/{id}` avec interfaces liées → `409` + compteurs
- [ ] `[Supertest]` `DELETE /api/v1/applications/{id}` avec data objects liés → `409` + compteurs
- [ ] `[Supertest]` `DELETE /api/v1/applications/{id}` avec IT components liés → `409` + compteurs

### Tests Sécurité / RBAC — Manuel ❌

- [ ] `[Manuel]` `GET /api/v1/applications` sans token → `401`
- [ ] `[Manuel]` `POST /api/v1/applications` avec rôle sans `applications:write` → `403`
- [ ] `[Manuel]` `PATCH /api/v1/applications/{id}` avec rôle sans `applications:write` → `403`
- [ ] `[Manuel]` `DELETE /api/v1/applications/{id}` avec rôle sans `applications:write` → `403`

---

## 7. Contraintes Techniques

- **Audit context :** Toute écriture en base passe par `await prisma.$executeRaw`SET LOCAL ark.current_user_id = ${userId}`` — convention F-00 RM-02.
- **Gestion erreur P2002 :** try/catch ciblé → `ConflictException({ code: 'CONFLICT', message: '...' })`. Ne pas laisser remonter l'erreur Prisma brute.
- **Pattern suppression :** Vérifier `_count` avant `delete` (RM-03).
- **Permissions :** `@RequirePermission('applications:read')` sur GET, `@RequirePermission('applications:write')` sur POST/PATCH/DELETE.
- **Validation DTO :** `@IsString()`, `@IsNotEmpty()`, `@IsOptional()`, `@IsUUID()`, `@IsEnum()` sur criticality.
- **TagValueResponse :** Le join sur `tag_dimensions` est obligatoire pour peupler `dimensionColor` et `depth`.
- **Pas de filtrage backend par depth :** Ne jamais implémenter de logique `deduplicateByDepth` côté NestJS.
- **Mock Prisma dans les tests unit :** `jest.mock()` — ne pas dépendre d'une base réelle.
- **Requêtes raw :** Si usage de `$queryRaw` / `$executeRaw`, tagged template obligatoire.

---

## 8. Commande OpenCode — Backend

```
Contexte projet ARK — Session Backend FS-06-BACK :

Stack : NestJS strict mode + Prisma ORM + PostgreSQL 16 + TypeScript strict
Structure modules : src/<domaine>/<domaine>.module.ts / .controller.ts / .service.ts / dto/

Conventions obligatoires :
- Toute écriture en base : await prisma.$executeRaw`SET LOCAL ark.current_user_id = ${userId}`
- PrismaModule est global (APP_MODULE) — ne jamais le réimporter dans un module feature
- JwtAuthGuard est global — décorer avec @Public() les seules routes publiques
- @RequirePermission() disponible — utiliser pour chaque handler controller
- Format d'erreur standard : { statusCode, code, message, timestamp, path }
  → ConflictException({ code: 'CONFLICT', message: '...' }) pour P2002
  → ConflictException({ code: 'DEPENDENCY_CONFLICT', message: '...', details: {...} }) pour suppression bloquée
- Vérification _count Prisma AVANT toute suppression — pattern RM-03 de cette spec
- P2002 intercepté dans un try/catch ciblé → ConflictException
- Requêtes raw : tagged template backtick uniquement
- Tests unit : jest.mock() sur PrismaService
- Fichier test e2e : backend/test/FS-06-applications.e2e-spec.ts

Intégration tags F-03 :
- TagsModule est @Global() — TagService injectable sans réimporter TagsModule
- getEntityTags('application', id) retourne TOUS les entity_tags sans filtrage
- Le join sur tag_dimensions est obligatoire pour peupler dimensionColor et depth dans TagValueResponse
- NE PAS implémenter deduplicateByDepth() côté backend

Dépendances à implémenter :
- Module Applications dépend de Domain et Provider (FK dans schema)
- Utiliser include/select Prisma pour peupler domain/provider/owner dans les réponses

Pattern de référence NestJS : module Domains (FS-02-BACK) — s'y conformer pour la structure et le style.

Implémente la feature "Applications" backend (FS-06-BACK) en respectant strictement le contrat ci-dessous.
Génère : module NestJS complet (controller, service, DTOs, module) + tests Jest unit + tests Supertest.
Ne génère PAS les tests marqués [Manuel].
Ne génère PAS de code frontend.
Ne fais aucune hypothèse non documentée. Si un point est ambigu, pose une question avant de coder.

[COLLER LE CONTENU COMPLET DE FS-06-BACK.md ICI]
```

---

## 9. Gate de Validation Backend

| # | Gate | Vérification | Bloquant |
|---|------|--------------|----------|
| G-01 | Migration Prisma appliquée | `\dt applications` en base → table présente | ✅ Oui |
| G-02 | Seed permissions | `applications:read` et `applications:write` en base | ✅ Oui |
| G-03 | Tests Jest passent | `npm run test -- --testPathPattern=applications` → 0 failed | ✅ Oui |
| G-04 | Tests Supertest passent | `npm run test:e2e -- --testPathPattern=FS-06` → 0 failed | ✅ Oui |
| G-05 | Tests RBAC manuels validés | Les 4 cas [Manuel] §6 vérifiés à la main | ✅ Oui |
| G-06 | Aucune erreur TypeScript | `npm run build` → 0 error | ✅ Oui |
| G-07 | Statut mis à jour | Passer `FS-06-BACK` à `done` dans cet en-tête | ✅ Oui |
| G-08 | Revue TD backend | TD-1 à TD-6 du template vérifiés, F-999 mis à jour | ✅ Oui |
| G-09 | TagValueResponse complet | `depth` et `dimensionColor` présents dans la réponse `GET /:id` | ✅ Oui |
| G-10 | Endpoint dependencies | `GET /:id/dependencies` retourne les compteurs corrects | ✅ Oui |

---

## 10. Checklist de Validation Post-Session

- [ ] `POST /api/v1/applications` retourne `201` avec `ApplicationResponse` complet
- [ ] `DELETE` avec entités liées retourne `409` + `code: "DEPENDENCY_CONFLICT"` + details
- [ ] Toutes les réponses `409` incluent le champ `code` explicite (NFR-MAINT-001)
- [ ] `name` uniquement espaces → `400`
- [ ] `GET /api/v1/applications/:id` avec tags ancêtre + descendant → les deux présents (pas de filtrage backend)
- [ ] `GET /api/v1/applications/:id/dependencies` retourne les compteurs exacts
- [ ] Pagination fonctionnelle (page, limit, meta)
- [ ] Filtres lifecycleStatus et tagValueIds fonctionnels
- [ ] Aucun `TODO / FIXME / HACK` non tracé dans le code livré
- [ ] Aucune erreur TypeScript strict
- [ ] Conventions AGENTS.md respectées

---

## 11. Revue de Dette Technique

### Gates TD

| # | Vérification | Commande / Action |
|---|---|---|
| TD-1 | Aucun `TODO / FIXME / HACK` non tracé | `git grep -n "TODO\|FIXME\|HACK" -- '*.ts'` |
| TD-2 | Items F-999 activés : statut mis à jour | Relire F-999 §2 |
| TD-3 | Checklist F-999 §4 : cases cochées | F-999 §4 |
| TD-4 | AGENTS.md : aucun pattern nouveau non documenté | Relire AGENTS.md |
| TD-5 | ARK-NFR.md : NFR impactés mis à jour | ARK-NFR.md |
| TD-6 | Nouvelles décisions transverses → nouvel Item F-999 | Jugement |

### Résultat de la Revue

| Champ | Valeur |
|---|---|
| **Sprint** | Sprint 2 |
| **Date de revue** | *(à compléter)* |
| **Items F-999 fermés** | *(à compléter)* |
| **Items F-999 ouverts** | *(à compléter)* |
| **Nouveaux items F-999 créés** | *(à compléter)* |
| **NFR mis à jour** | *(à compléter)* |
| **TODOs résiduels tracés** | *(à compléter)* |
| **Statut gates TD** | *(à compléter)* |

---

_FS-06-BACK v1.2 — ARK_
