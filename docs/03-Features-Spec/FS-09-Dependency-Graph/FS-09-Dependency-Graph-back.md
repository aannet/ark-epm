# FS-09-BACK — Dependency Graph — Backend

_Version 0.1 — 2026-05-03_

## En-tête

| Champ | Valeur |
|---|---|
| **ID** | FS-09-BACK |
| **Titre** | Dependency Graph — Backend |
| **Priorité** | P1 |
| **Statut** | `draft` |
| **Dépend de** | FS-01, FS-06-BACK, FS-08-BACK |
| **Spec mère** | FS-09 Dependency Graph |
| **Spec front** | FS-09-FRONT — bloquée tant que cette spec n'est pas `done` |
| **Estimé** | 1j |
| **Version** | 0.1 |

---

## 1. Objectif & Périmètre

**Ce que cette spec fait :**
Expose `GET /api/v1/graph` — endpoint de lecture seule qui agrège les données des tables existantes (applications, interfaces, domains, business_capabilities, providers, it_components, data_objects) pour produire un graphe `{nodes[], edges[]}` prêt à consommer par ReactFlow. Supporte un nœud focal (focalType + focalId), une profondeur de voisinage BFS (depth 1/2/3) et une sélection de couches à inclure (layers CSV). Aucune migration Prisma requise.

**Hors périmètre :**
- Frontend — couvert par FS-09-FRONT
- Mutations CRUD — endpoint read-only uniquement
- Filtres criticality et domain — appliqués côté client (pas de paramètre serveur)
- Expansion récursive BC enfants (US-04) — gate T-086 (WITH RECURSIVE), bloque G-10
- Layer GroupNode Domain (D12) — P2

---

## 2. Modèle BDD

### 2.1 Schéma BDD — aucune migration

Aucune table nouvelle. Tables utilisées en lecture seule :

```
applications          → nœuds Application (focal ou voisins)
interfaces            → arêtes orientées (sourceAppId → targetAppId, optionnel middlewareAppId)
domains               → label domainName sur les nœuds Application
business_capabilities → nœuds BC (layer business_capabilities) + traversal focalType=bc
app_capability_map    → join Application ↔ BC
providers             → nœuds Provider (layer providers)
app_provider_map      → join Application ↔ Provider
it_components         → nœuds IT Component (layer it_components)
app_it_component_map  → join Application ↔ IT Component
data_objects          → nœuds Data Object (layer data_objects)
app_data_object_map   → join Application ↔ Data Object
```

### 2.2 Modèle Prisma (existant — aucune modification)

```prisma
model Application {
  id               String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  name             String    @unique @db.VarChar(255)
  domainId         String?   @map("domain_id") @db.Uuid
  criticality      String?   @map("criticality") @db.VarChar(50)
  lifecycleStatus  String?   @map("lifecycle_status") @db.VarChar(50)
  domain           Domain?
  sourceInterfaces    Interface[] @relation("InterfaceSourceApp")
  targetInterfaces    Interface[] @relation("InterfaceTargetApp")
  middlewareInterfaces Interface[] @relation("InterfaceMiddlewareApp")
  capabilities     AppCapabilityMap[]
  appProviderMaps  ApplicationProviderMap[]
  itComponents     AppItComponentMap[]
  dataObjects      AppDataObjectMap[]
}

model Interface {
  id              String              @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  name            String?             @db.VarChar(255)
  sourceAppId     String              @map("source_app_id") @db.Uuid
  targetAppId     String              @map("target_app_id") @db.Uuid
  middlewareAppId String?             @map("middleware_app_id") @db.Uuid
  type            InterfaceType
  frequency       InterfaceFrequency?
  criticality     CriticalityLevel?
}

enum InterfaceType     { REST SOAP FTP SFTP DATABASE MESSAGE_QUEUE BATCH_FILE EVENT_STREAM GRAPHQL GRPC OTHER }
enum InterfaceFrequency { REALTIME NEAR_REALTIME HOURLY DAILY WEEKLY MONTHLY ON_DEMAND }
enum CriticalityLevel  { LOW MEDIUM HIGH CRITICAL }
```

> Aucun champ nouveau. Les relations Prisma et les tables de jonction sont déjà en place.

---

## 3. Contrat API (OpenAPI)

```yaml
paths:
  /api/v1/graph:
    get:
      summary: Dependency graph — nœuds et arêtes
      tags: [Graph]
      security:
        - bearerAuth: []
      parameters:
        - in: query
          name: focalType
          required: true
          schema:
            type: string
            enum: [application, business_capability, domain, provider, it_component, data_object]
          description: Type de l'entité focale
        - in: query
          name: focalId
          required: true
          schema:
            type: string
            format: uuid
          description: UUID de l'entité focale
        - in: query
          name: depth
          required: false
          schema:
            type: integer
            minimum: 1
            maximum: 3
            default: 1
          description: Profondeur BFS (1=voisins directs, 2=voisins des voisins, 3=3 niveaux)
        - in: query
          name: layers
          required: false
          schema:
            type: string
            default: "applications,interfaces"
          description: >
            Couches à inclure, séparées par virgule.
            Valeurs : applications, interfaces, business_capabilities, providers, it_components, data_objects.
            Défaut : applications,interfaces.
      responses:
        '200':
          description: Graphe retourné avec succès
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/GraphResponse'
        '400':
          description: Paramètres manquants ou invalides (focalType/focalId absents, depth hors [1,3])
        '401':
          description: Non authentifié
        '403':
          description: Permission insuffisante — applications:read requis
        '404':
          description: Entité focale introuvable
          content:
            application/json:
              schema:
                type: object
                properties:
                  statusCode: { type: integer, example: 404 }
                  code:       { type: string, example: "ENTITY_NOT_FOUND" }
                  message:    { type: string }
                  timestamp:  { type: string, format: date-time }
                  path:       { type: string }

components:
  schemas:
    GraphResponse:
      type: object
      required: [nodes, edges]
      properties:
        nodes:
          type: array
          items:
            $ref: '#/components/schemas/GraphNode'
        edges:
          type: array
          items:
            $ref: '#/components/schemas/GraphEdge'

    GraphNode:
      type: object
      required: [id, type, isFocal, label]
      properties:
        id:
          type: string
          format: uuid
        type:
          type: string
          enum: [application, bc, provider, it_component, data_object]
        isFocal:
          type: boolean
          description: true si ce nœud est l'entité focale
        label:
          type: string
          description: Nom de l'entité
        meta:
          type: object
          properties:
            criticality:
              type: string
              enum: [LOW, MEDIUM, HIGH, CRITICAL]
              nullable: true
            lifecycleStatus:
              type: string
              nullable: true
            domainId:
              type: string
              format: uuid
              nullable: true
            domainName:
              type: string
              nullable: true
            level:
              type: integer
              nullable: true
              description: Niveau hiérarchique — BC uniquement

    GraphEdge:
      type: object
      required: [id, sourceId, targetId]
      properties:
        id:
          type: string
          format: uuid
        sourceId:
          type: string
          format: uuid
        targetId:
          type: string
          format: uuid
        label:
          type: string
          nullable: true
          description: Nom de l'interface (peut être null)
        meta:
          type: object
          properties:
            type:
              type: string
              enum: [REST, SOAP, FTP, SFTP, DATABASE, MESSAGE_QUEUE, BATCH_FILE, EVENT_STREAM, GRAPHQL, GRPC, OTHER]
            frequency:
              type: string
              enum: [REALTIME, NEAR_REALTIME, HOURLY, DAILY, WEEKLY, MONTHLY, ON_DEMAND]
              nullable: true
            criticality:
              type: string
              enum: [LOW, MEDIUM, HIGH, CRITICAL]
              nullable: true
            middlewareAppId:
              type: string
              format: uuid
              nullable: true
              description: UUID de l'app middleware si présente (rendu côté front en 2 arêtes visuelles)
```

---

## 4. Règles Métier Backend

- **RM-01 — Lecture seule :** Endpoint GET uniquement. Pas d'audit trail, pas de `SET LOCAL ark.current_user_id`. Aucune écriture en base.

- **RM-02 — Permission :** `@RequirePermissions('applications:read')` sur le controller. Réutilise la permission existante — aucune nouvelle permission à créer ni à seeder.

- **RM-03 — Réponse vide valide :** Si le focal n'a aucune relation avec les layers actifs, retourner `{ nodes: [<nœud focal>], edges: [] }`. Le nœud focal est toujours inclus même sans voisins.

- **RM-04 — focalId non trouvé :** Si l'entité du `focalType` avec `focalId` n'existe pas → `404 NotFoundException({ code: 'ENTITY_NOT_FOUND', message: '[focalType] not found: [focalId]' })`.

- **RM-05 — Traversal BFS :** depth=1 = voisins directs via interfaces. depth=2/3 = BFS itératif : à chaque niveau, récupérer les interfaces des apps déjà dans le scope, ajouter les nouvelles apps. Utiliser un `Set<string>` de `visitedIds` pour éviter les cycles.

- **RM-06 — Layer `interfaces` transverse :** La couche `interfaces` retourne les arêtes Interface entre TOUS les nœuds visibles, toutes layers confondues. Si deux nœuds (quelle que soit leur layer) ont une Interface entre eux, l'arête est incluse dès que la couche `interfaces` est active.

- **RM-07 — focalType=business_capability (partiel sans T-086) :** Retourner la BC focale + les apps directement liées via `app_capability_map`. L'expansion récursive des BC enfants (L2/L3) est bloquée en attente de T-086 (WITH RECURSIVE).

### Traversal par focalType

| focalType | Nœuds racine | Expansion depth |
|---|---|---|
| `application` | App focale | BFS via interfaces (sourceAppId / targetAppId) |
| `business_capability` | BC focale + apps via app_capability_map | Partiel sans T-086 |
| `domain` | Toutes les apps avec domainId = focalId | BFS via interfaces |
| `provider` | Apps via app_provider_map où providerId = focalId | BFS via interfaces |
| `it_component` | Apps via app_it_component_map où itComponentId = focalId | BFS via interfaces |
| `data_object` | Apps via app_data_object_map où dataObjectId = focalId | BFS via interfaces |

### Layers — ce que le backend inclut selon les layers actifs

| Layer | Nœuds ajoutés |
|---|---|
| `applications` | Nœuds Application dans le scope BFS (toujours présent dans le défaut) |
| `interfaces` | Arêtes Interface entre tous les nœuds visibles |
| `business_capabilities` | Nœuds BC liés aux apps du scope via app_capability_map |
| `providers` | Nœuds Provider liés aux apps du scope via app_provider_map |
| `it_components` | Nœuds IT Component liés aux apps du scope via app_it_component_map |
| `data_objects` | Nœuds Data Object liés aux apps du scope via app_data_object_map |

---

## 5. Comportements Backend par Cas d'Usage

**Nominal :**
- `GET /api/v1/graph?focalType=application&focalId=<uuid>&depth=1` → `200` avec nœud focal + voisins directs + arêtes
- `GET /api/v1/graph?focalType=application&focalId=<uuid>&depth=2` → `200` avec 2 niveaux BFS
- `GET /api/v1/graph?focalType=application&focalId=<uuid>&layers=applications,interfaces,providers` → `200` avec nœuds Provider supplémentaires
- `GET /api/v1/graph?focalType=provider&focalId=<uuid>` → `200` apps liées via app_provider_map
- `GET /api/v1/graph?focalType=application&focalId=<uuid app sans interfaces>` → `200` avec `{nodes: [focal], edges: []}`

**Erreurs :**
- `GET /api/v1/graph?focalType=application&focalId=<inexistant>` → `404` + `code: "ENTITY_NOT_FOUND"`
- `GET /api/v1/graph` sans `focalType` ou `focalId` → `400`
- `GET /api/v1/graph?depth=5` → `400` (depth > 3)
- Sans token → `401`
- Avec token sans `applications:read` → `403`

---

## 6. Structure de Fichiers Backend

```
backend/src/graph/
├── graph.module.ts
├── graph.controller.ts          (GET /graph, @RequirePermissions('applications:read'))
├── graph.service.ts             (getGraph(dto: GraphQueryDto): Promise<GraphResponseDto>)
└── dto/
    ├── graph-query.dto.ts       (focalType, focalId, depth?, layers?)
    └── graph-response.dto.ts    (GraphNodeDto, GraphEdgeDto, GraphResponseDto)
```

---

## 7. Tests Backend

### Outil par niveau

| Niveau | Outil | Fichier cible |
|---|---|---|
| Unit (service) | **Jest** | `src/graph/graph.service.spec.ts` |
| API / contrat HTTP | **Supertest** (Playwright) | `e2e/tests/graph/graph.api.spec.ts` |
| Sécurité / RBAC | **Manuel** | — |

### Tests Jest — Unit

- [ ] `[Jest]` `GraphService.getGraph()` focalType=application, depth=1 → nœud focal (isFocal=true) + voisins directs
- [ ] `[Jest]` `GraphService.getGraph()` focalType=application, depth=2 → apps niveau 2 incluses
- [ ] `[Jest]` `GraphService.getGraph()` focalType=provider → apps via app_provider_map
- [ ] `[Jest]` `GraphService.getGraph()` focalType=it_component → apps via app_it_component_map
- [ ] `[Jest]` `GraphService.getGraph()` focalType=data_object → apps via app_data_object_map
- [ ] `[Jest]` `GraphService.getGraph()` focalType=domain → toutes apps du domaine
- [ ] `[Jest]` `GraphService.getGraph()` focalId inexistant → NotFoundException code ENTITY_NOT_FOUND
- [ ] `[Jest]` `GraphService.getGraph()` layer=business_capabilities → nœuds BC inclus
- [ ] `[Jest]` `GraphService.getGraph()` app sans interfaces → `{nodes:[focal], edges:[]}`
- [ ] `[Jest]` `GraphService.getGraph()` interface avec middlewareAppId → arête retournée avec middlewareAppId dans meta

### Tests Supertest — Contrat API

- [ ] `[Supertest]` `GET /api/v1/graph?focalType=application&focalId=<valid>` → `200` `{nodes, edges}`
- [ ] `[Supertest]` Nœud focal a `isFocal: true`, les voisins ont `isFocal: false`
- [ ] `[Supertest]` `GET /api/v1/graph?focalType=application&focalId=<valid>&depth=2` → nœuds niveau 2 présents
- [ ] `[Supertest]` `GET /api/v1/graph?focalType=application&focalId=<valid>&layers=applications,interfaces,providers` → nœuds Provider présents
- [ ] `[Supertest]` `GET /api/v1/graph?focalType=application&focalId=<inexistant>` → `404` + `code: "ENTITY_NOT_FOUND"`
- [ ] `[Supertest]` `GET /api/v1/graph` sans focalType → `400`
- [ ] `[Supertest]` `GET /api/v1/graph?focalType=provider&focalId=<valid>` → `200` apps liées présentes
- [ ] `[Supertest]` App sans interface → `{nodes:[focal], edges:[]}`

### Tests Sécurité / RBAC — Manuel ❌

- [ ] `[Manuel]` `GET /api/v1/graph` sans token → `401`
- [ ] `[Manuel]` `GET /api/v1/graph` avec token sans `applications:read` → `403`

---

## 8. Commande OpenCode — Backend

```
Contexte projet ARK — Session Backend FS-09-BACK :

Stack : NestJS strict mode + Prisma ORM + PostgreSQL 16 + TypeScript strict
Structure modules : src/<domaine>/<domaine>.module.ts / .controller.ts / .service.ts / dto/

Conventions obligatoires :
- PrismaModule est global (APP_MODULE) — ne jamais le réimporter dans un module feature
- JwtAuthGuard est global — décorer avec @Public() les seules routes publiques
- @RequirePermissions('applications:read') sur le controller graph
- Format d'erreur standard : { statusCode, code, message, timestamp, path }
  → NotFoundException({ code: 'ENTITY_NOT_FOUND', message: '...' }) si focalId non trouvé
- Endpoint READ-ONLY : pas de SET LOCAL ark.current_user_id, pas d'audit trail
- Requêtes raw : tagged template backtick uniquement — jamais Prisma.raw() avec interpolation
- Tests unit : jest.mock() sur PrismaService — pas de base réelle
- Fichier test e2e : e2e/tests/graph/graph.api.spec.ts (Playwright)

Documentation obligatoire (NFR-GOV-001) :
- À la fin de la session, ajouter le path /graph dans docs/04-Tech/openapi.yaml

Pattern de référence NestJS : module Domains (FS-02-BACK) — s'y conformer pour la structure.

Implémente la feature "Dependency Graph" backend (FS-09-BACK) en respectant strictement le contrat ci-dessous.
Génère : module NestJS complet (controller, service, DTOs, module) + tests Jest unit + tests Supertest.
Ne génère PAS les tests marqués [Manuel].
Ne génère PAS de code frontend.
Ne fais aucune hypothèse non documentée. Si un point est ambigu, pose une question avant de coder.

[COLLER LE CONTENU COMPLET DE FS-09-BACK.md ICI]
```

---

## 9. Gates de Validation Backend

| # | Gate | Vérification | Bloquant |
|---|------|--------------|----------|
| G-01 | Module `backend/src/graph/` créé et enregistré dans AppModule | Module accessible, endpoint répond | ✅ Oui |
| G-02 | `GET /api/v1/graph?focalType=application` → `200` | Response conforme à GraphResponse | ✅ Oui |
| G-03 | focalType=provider → apps liées retournées | Test Supertest passé | ✅ Oui |
| G-04 | depth=2 → voisins niveau 2 présents | Test Supertest passé | ✅ Oui |
| G-05 | layer=business_capabilities → nœuds BC inclus | Test Supertest passé | ✅ Oui |
| G-06 | 401 sans token, 403 sans permission, 404 focalId invalide | Tests manuels RBAC validés | ✅ Oui |
| G-07 | Tests Jest passent | 0 failed | ✅ Oui |
| G-08 | Aucune erreur TypeScript | `npm run build` → 0 error | ✅ Oui |
| G-09 | `docs/04-Tech/openapi.yaml` mis à jour | Path `/graph` présent | ✅ Oui |
| **G-10** | **focalType=bc expansion récursive BC enfants** | **Bloqué — gate T-086 (WITH RECURSIVE)** | ⚠️ Bloqué |

---

## 10. Checklist Post-Session

- [ ] `GET /api/v1/graph` → `200` `{nodes, edges}` conformes au schéma
- [ ] `isFocal: true` sur le nœud focal uniquement
- [ ] focalType=provider, it_component, data_object, domain fonctionnels
- [ ] focalId inexistant → `404` + `code: "ENTITY_NOT_FOUND"`
- [ ] Layer `business_capabilities` → nœuds BC inclus (hors expansion récursive)
- [ ] `middlewareAppId` présent dans `meta` quand applicable
- [ ] Aucun `TODO / FIXME / HACK` non tracé
- [ ] Aucune erreur TypeScript strict
- [ ] `docs/04-Tech/openapi.yaml` mis à jour avec path `/graph`

---

## 11. Revue de Dette Technique

### Gates TD

| # | Vérification | Commande / Action |
|---|---|---|
| TD-1 | Aucun `TODO / FIXME / HACK` non tracé | `git grep -n "TODO\|FIXME\|HACK" -- '*.ts'` |
| TD-2 | Items F-999 activés par cette feature | Relire F-999 §2 |
| TD-3 | Checklist F-999 §4 : cases cochées | F-999 §4 |
| TD-4 | AGENTS.md : aucun pattern nouveau non documenté | Relire AGENTS.md |
| TD-5 | ARK-NFR.md : NFR impactés mis à jour | ARK-NFR.md |
| TD-6 | Nouvelles décisions transverses → Item F-999 si applicable | Jugement |

### Résultat de la Revue

| Champ | Valeur |
|---|---|
| **Sprint** | S4 |
| **Date de revue** | *(à renseigner post-impl)* |
| **Items F-999 fermés** | *(à renseigner)* |
| **Items F-999 ouverts** | *(à renseigner)* |
| **NFR mis à jour** | *(à renseigner)* |
| **Statut gates TD** | *(à renseigner)* |

---

## 12. Données de Seed

❌ **Inutile** — endpoint lecture seule, utilise les données apps/interfaces/providers/etc. existantes en base.

---

_FS-09-BACK v0.1 — draft — 2026-05-03_
