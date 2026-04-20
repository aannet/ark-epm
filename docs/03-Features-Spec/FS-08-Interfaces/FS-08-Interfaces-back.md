# ARK — Feature Spec FS-08-BACK : Interfaces (Backend)

_Version 1.1 — Avril 2026_

> **Changelog v1.1 :** Trois ajustements de périmètre post-revue :
> 1. Suppression du champ `latency_ms` — métrique opérationnelle différée P2 (hors périmètre MVP).
> 2. `technical_contact` passe de FK `UUID → users` à champ texte libre `VARCHAR(255)` — le contact technique n'est pas nécessairement un utilisateur ARK (prestataire externe, email de support, etc.). Voir F-999 Item 24 pour la dette éventuelle.
> 3. Ajout Item 24 dans F-999 : contrôle côté Application (`_count.sourceInterfaces + _count.targetInterfaces`) avant suppression — à implémenter lors d'un amendment FS-06-BACK.
>
> **Changelog v1.0 :** Création initiale — module Interfaces conforme NFR-GOV-005. CRUD unidirectionnel Source → Cible entre deux Applications. Migration schéma (fix `id` default `gen_random_uuid()`, ajout `description`/`comment`, suppression `tags TEXT[]`, correction `updatedAt @updatedAt`, nouveaux enums `InterfaceType` et `InterfaceFrequency`, `criticality` migré de `VARCHAR(50)` vers enum `CriticalityLevel` existant). Liaison tags F-03 polymorphe via `entity_tags`. Filtres server-side (sourceAppId, targetAppId, type, criticality). Règle RM-01 : auto-liaison interdite (sourceAppId ≠ targetAppId). Suppression libre (aucune entité FK vers `interfaces`).

---

## En-tête

| Champ | Valeur |
|---|---|
| **ID** | FS-08-BACK |
| **Titre** | Interfaces — API REST Backend |
| **Priorité** | P1 |
| **Statut** | `done` |
| **Dépend de** | FS-01, **FS-06-BACK**, F-03 |
| **Spec mère** | FS-08 Interfaces — Sprint 4 |
| **Spec front** | FS-08-FRONT — bloquée tant que cette spec n'est pas `done` |
| **Estimé** | 1.0 jour |
| **Version** | 1.0 |

> **Note FK entrantes :** `interfaces` n'est référencé par aucune autre entité via FK. La suppression est donc libre (pas de `DEPENDENCY_CONFLICT`). FS-09 lira les interfaces via JOIN dans son endpoint `/graph`, sans contrainte FK.

> **Note dépendance FS-06-BACK :** `sourceAppId` et `targetAppId` sont des FK vers `applications`. La validation de leur existence (404 si inconnu) nécessite que `FS-06-BACK` soit `done`.

---

## 1. Objectif & Périmètre ⚠️

**Ce que cette spec fait :**

Implémenter l'API REST complète pour la gestion des Interfaces applicatives. Une Interface représente un flux de données **unidirectionnel** entre une Application source et une Application cible. Elle documente le type de flux, sa fréquence, sa criticité et ses métriques opérationnelles.

Le backend expose :
- CRUD complet conforme NFR-GOV-005 (ajout `description`/`comment`, fix schéma existant)
- Validation RM-01 : `sourceAppId ≠ targetAppId` (auto-liaison interdite)
- Validation FK : existence de `sourceAppId` et `targetAppId` dans `applications`
- Suppression libre : aucune dépendance entrante vers `interfaces`
- Filtres server-side : `sourceAppId`, `targetAppId`, `type`, `criticality`
- Support des tags dimensionnels via `EntityTag` (F-03)
- Enums typés : `InterfaceType`, `InterfaceFrequency`, réutilisation de `CriticalityLevel`
- Migration schéma : correction du modèle existant non conforme

**Hors périmètre :**
- Frontend — couvert par `FS-08-FRONT`
- Endpoint `/graph` agrégé applications + interfaces — couvert par `FS-09-BACK`
- Interfaces bidirectionnelles (deux enregistrements distincts si besoin)
- `latency_ms` — métrique opérationnelle différée P2 (hors périmètre MVP)
- Monitoring temps réel des métriques — P2
- Historique des versions d'interface — P2

---

## 2. Modèle BDD ⚠️

### 2.1 Schéma relationnel

**Table `interfaces` (état actuel → état cible après migration)**

```
interfaces
──────────────────────────────────────────────────────────────────
id                   UUID          PK, DEFAULT gen_random_uuid()  ← FIX @default(uuid())
name                 VARCHAR(255)  NULL                           (optionnel — interface peut être anonyme)
description          TEXT          NULL                           ← AJOUT NFR-GOV-005
comment              TEXT          NULL                           ← AJOUT NFR-GOV-005
source_app_id        UUID          NOT NULL  FK → applications(id) ON DELETE RESTRICT
target_app_id        UUID          NOT NULL  FK → applications(id) ON DELETE RESTRICT
type                 interface_type  NOT NULL                     ← MIGRATION VARCHAR(50) → ENUM
frequency            interface_frequency  NULL                   ← MIGRATION VARCHAR(50) → ENUM
criticality          criticality_level  NULL                      ← MIGRATION VARCHAR(50) → ENUM existant
technical_contact    VARCHAR(255)  NULL      (texte libre — nom, email ou alias externe) ← remplace FK users
error_rate           DECIMAL(5,2)  NULL
created_at           TIMESTAMPTZ   NOT NULL  DEFAULT now()        ← FIX nullable → NOT NULL
updated_at           TIMESTAMPTZ   NOT NULL  DEFAULT now()        ← FIX @updatedAt

SUPPRIMER : tags TEXT[]                                          ← DROP COLUMN (F-999 §2)

INDEX idx_interfaces_source ON (source_app_id)                   (existant)
INDEX idx_interfaces_target ON (target_app_id)                   (existant)
```

**Vue des relations globales**

```
applications  1──N  interfaces  N──1  applications
               (source_app_id)        (target_app_id)

entity_tags  ──  interfaces (polymorphe F-03, entity_type = 'interfaces')
```

> **Note `technical_contact` :** champ texte libre (pas de FK vers `users`). Le contact technique peut être un prestataire externe, une adresse email de support, ou un alias non présent dans ARK. Voir F-999 Item 24 si la liaison FK est souhaitée ultérieurement.

**Nouveaux types ENUM PostgreSQL :**

```
enum interface_type {
  REST, SOAP, FTP, SFTP, DATABASE, MESSAGE_QUEUE,
  BATCH_FILE, EVENT_STREAM, GRAPHQL, GRPC, OTHER
}

enum interface_frequency {
  REALTIME, NEAR_REALTIME, HOURLY, DAILY, WEEKLY, MONTHLY, ON_DEMAND
}

-- criticality_level : déjà existant (LOW/MEDIUM/HIGH/CRITICAL)
```

### 2.2 Modèle Prisma

> Remplacer le bloc `model Interface` actuel dans `schema.prisma` par ce bloc corrigé. Ajouter les deux nouveaux enums avant le modèle.

```prisma
enum InterfaceType {
  REST
  SOAP
  FTP
  SFTP
  DATABASE
  MESSAGE_QUEUE
  BATCH_FILE
  EVENT_STREAM
  GRAPHQL
  GRPC
  OTHER

  @@map("interface_type")
}

enum InterfaceFrequency {
  REALTIME
  NEAR_REALTIME
  HOURLY
  DAILY
  WEEKLY
  MONTHLY
  ON_DEMAND

  @@map("interface_frequency")
}

model Interface {
  id               String              @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  name             String?             @db.VarChar(255)
  description      String?             @db.Text
  comment          String?             @db.Text
  sourceAppId      String              @map("source_app_id") @db.Uuid
  targetAppId      String              @map("target_app_id") @db.Uuid
  type             InterfaceType
  frequency        InterfaceFrequency? @map("frequency")
  criticality      CriticalityLevel?   @map("criticality")
  technicalContact String?             @map("technical_contact") @db.VarChar(255)
  errorRate        Decimal?            @map("error_rate") @db.Decimal(5, 2)
  createdAt        DateTime            @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt        DateTime            @updatedAt @map("updated_at") @db.Timestamptz(6)

  sourceApp        Application         @relation("InterfaceSourceApp", fields: [sourceAppId], references: [id], onDelete: NoAction, onUpdate: NoAction)
  targetApp        Application         @relation("InterfaceTargetApp", fields: [targetAppId], references: [id], onDelete: NoAction, onUpdate: NoAction)

  @@index([sourceAppId], map: "idx_interfaces_source")
  @@index([targetAppId], map: "idx_interfaces_target")
  @@map("interfaces")
}
```

> **Notes :**
> - `name` reste optionnel — une interface peut être identifiée par source+cible+type sans nom propre.
> - Pas de `@unique` sur `(sourceAppId, targetAppId, type)` — plusieurs interfaces du même type entre les mêmes apps sont valides (ex: deux flux REST de sens différents, deux batches à fréquences différentes).
> - `CriticalityLevel` enum déjà défini dans le schéma (FS-07 amendment T-019) — réutilisé tel quel.
> - `technicalContact` est un champ texte libre (`VARCHAR(255)`) — pas de FK. Aucune validation d'existence requise.
> - `onDelete: NoAction` sur `sourceApp` et `targetApp` : bloquer la suppression d'une Application liée à des interfaces au niveau DB. La contrainte applicative côté FS-06-BACK (`_count.sourceInterfaces + _count.targetInterfaces`) est tracée en F-999 Item 24 (amendment ultérieur).

**Migration SQL :**

```sql
-- 1. Créer les nouveaux types ENUM
CREATE TYPE interface_type AS ENUM (
  'REST', 'SOAP', 'FTP', 'SFTP', 'DATABASE',
  'MESSAGE_QUEUE', 'BATCH_FILE', 'EVENT_STREAM', 'GRAPHQL', 'GRPC', 'OTHER'
);

CREATE TYPE interface_frequency AS ENUM (
  'REALTIME', 'NEAR_REALTIME', 'HOURLY', 'DAILY', 'WEEKLY', 'MONTHLY', 'ON_DEMAND'
);

-- 2. Migrer la colonne type (VARCHAR → ENUM avec cast)
ALTER TABLE interfaces
  ADD COLUMN type_new interface_type;

-- Mettre 'OTHER' comme valeur par défaut pour les données existantes non mappées
UPDATE interfaces
  SET type_new = CASE type
    WHEN 'REST'          THEN 'REST'::interface_type
    WHEN 'SOAP'          THEN 'SOAP'::interface_type
    WHEN 'FTP'           THEN 'FTP'::interface_type
    WHEN 'SFTP'          THEN 'SFTP'::interface_type
    WHEN 'DATABASE'      THEN 'DATABASE'::interface_type
    WHEN 'MESSAGE_QUEUE' THEN 'MESSAGE_QUEUE'::interface_type
    WHEN 'BATCH_FILE'    THEN 'BATCH_FILE'::interface_type
    WHEN 'EVENT_STREAM'  THEN 'EVENT_STREAM'::interface_type
    WHEN 'GRAPHQL'       THEN 'GRAPHQL'::interface_type
    WHEN 'GRPC'          THEN 'GRPC'::interface_type
    ELSE 'OTHER'::interface_type
  END;

ALTER TABLE interfaces
  DROP COLUMN type,
  ALTER COLUMN type_new SET NOT NULL,
  RENAME COLUMN type_new TO type;

-- 3. Migrer la colonne frequency (VARCHAR → ENUM, nullable)
ALTER TABLE interfaces
  ADD COLUMN frequency_new interface_frequency;

UPDATE interfaces
  SET frequency_new = CASE frequency
    WHEN 'REALTIME'      THEN 'REALTIME'::interface_frequency
    WHEN 'NEAR_REALTIME' THEN 'NEAR_REALTIME'::interface_frequency
    WHEN 'HOURLY'        THEN 'HOURLY'::interface_frequency
    WHEN 'DAILY'         THEN 'DAILY'::interface_frequency
    WHEN 'WEEKLY'        THEN 'WEEKLY'::interface_frequency
    WHEN 'MONTHLY'       THEN 'MONTHLY'::interface_frequency
    WHEN 'ON_DEMAND'     THEN 'ON_DEMAND'::interface_frequency
    ELSE NULL
  END
  WHERE frequency IS NOT NULL;

ALTER TABLE interfaces
  DROP COLUMN frequency,
  RENAME COLUMN frequency_new TO frequency;

-- 4. Migrer la colonne criticality (VARCHAR → ENUM criticality_level existant)
ALTER TABLE interfaces
  ADD COLUMN criticality_new criticality_level;

UPDATE interfaces
  SET criticality_new = CASE criticality
    WHEN 'LOW'      THEN 'LOW'::criticality_level
    WHEN 'MEDIUM'   THEN 'MEDIUM'::criticality_level
    WHEN 'HIGH'     THEN 'HIGH'::criticality_level
    WHEN 'CRITICAL' THEN 'CRITICAL'::criticality_level
    ELSE NULL
  END
  WHERE criticality IS NOT NULL;

ALTER TABLE interfaces
  DROP COLUMN criticality,
  RENAME COLUMN criticality_new TO criticality;

-- 5. Ajouter les champs socle manquants (NFR-GOV-005)
ALTER TABLE interfaces
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS comment TEXT;

-- 6. Migrer technical_contact_id (UUID FK → texte libre VARCHAR)
--    Conserver la valeur en tant que chaîne si migration de données existantes nécessaire
ALTER TABLE interfaces
  DROP CONSTRAINT IF EXISTS interfaces_technical_contact_id_fkey;

ALTER TABLE interfaces
  ADD COLUMN technical_contact VARCHAR(255);

-- Optionnel : récupérer l'email de l'utilisateur lié avant de supprimer la colonne FK
-- UPDATE interfaces i SET technical_contact = u.email
--   FROM users u WHERE u.id = i.technical_contact_id;

ALTER TABLE interfaces
  DROP COLUMN IF EXISTS technical_contact_id;

-- 7. Supprimer latency_ms (différé P2)
ALTER TABLE interfaces DROP COLUMN IF EXISTS latency_ms;

-- 8. Corriger le DEFAULT sur id (gen_random_uuid() au lieu de uuid())
ALTER TABLE interfaces
  ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- 9. Corriger created_at (NOT NULL + DEFAULT)
ALTER TABLE interfaces
  ALTER COLUMN created_at SET NOT NULL,
  ALTER COLUMN created_at SET DEFAULT now();

-- 10. Corriger updated_at (NOT NULL + DEFAULT — @updatedAt géré par Prisma)
ALTER TABLE interfaces
  ALTER COLUMN updated_at SET NOT NULL,
  ALTER COLUMN updated_at SET DEFAULT now();

-- 11. Supprimer la colonne legacy tags TEXT[]
ALTER TABLE interfaces DROP COLUMN IF EXISTS tags;
```

---

## 3. Contrat API (OpenAPI) ⚠️

```yaml
paths:

  /api/v1/interfaces:
    get:
      summary: Liste des interfaces (filtrée)
      tags: [Interfaces]
      security:
        - bearerAuth: []
      parameters:
        - name: sourceAppId
          in: query
          schema: { type: string, format: uuid }
          description: Filtrer par application source
        - name: targetAppId
          in: query
          schema: { type: string, format: uuid }
          description: Filtrer par application cible
        - name: type
          in: query
          schema:
            type: string
            enum: [REST, SOAP, FTP, SFTP, DATABASE, MESSAGE_QUEUE, BATCH_FILE, EVENT_STREAM, GRAPHQL, GRPC, OTHER]
        - name: criticality
          in: query
          schema:
            type: string
            enum: [LOW, MEDIUM, HIGH, CRITICAL]
      responses:
        '200':
          description: OK
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/InterfaceListItem'
        '401':
          description: Non authentifié

    post:
      summary: Créer une interface
      tags: [Interfaces]
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateInterfaceDto'
      responses:
        '201':
          description: Créée
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/InterfaceResponse'
        '400':
          description: Validation échouée
        '401':
          description: Non authentifié
        '403':
          description: Permission insuffisante
        '404':
          description: Application source ou cible introuvable
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
        '422':
          description: Auto-liaison interdite (sourceAppId == targetAppId)
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'

  /api/v1/interfaces/{id}:
    get:
      summary: Détail d'une interface
      tags: [Interfaces]
      security:
        - bearerAuth: []
      parameters:
        - name: id
          in: path
          required: true
          schema: { type: string, format: uuid }
      responses:
        '200':
          description: OK
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/InterfaceResponse'
        '401':
          description: Non authentifié
        '404':
          description: Interface introuvable

    patch:
      summary: Modifier une interface
      tags: [Interfaces]
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
              $ref: '#/components/schemas/UpdateInterfaceDto'
      responses:
        '200':
          description: OK
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/InterfaceResponse'
        '400':
          description: Validation échouée
        '401':
          description: Non authentifié
        '403':
          description: Permission insuffisante
        '404':
          description: Interface ou Application introuvable
        '422':
          description: Auto-liaison interdite

    delete:
      summary: Supprimer une interface
      tags: [Interfaces]
      security:
        - bearerAuth: []
      parameters:
        - name: id
          in: path
          required: true
          schema: { type: string, format: uuid }
      responses:
        '204':
          description: Supprimée
        '401':
          description: Non authentifié
        '403':
          description: Permission insuffisante
        '404':
          description: Interface introuvable

components:
  schemas:

    InterfaceResponse:
      type: object
      properties:
        id:                  { type: string, format: uuid }
        name:                { type: string, nullable: true }
        description:         { type: string, nullable: true }
        comment:             { type: string, nullable: true }
        sourceAppId:         { type: string, format: uuid }
        sourceApp:
          type: object
          properties:
            id:   { type: string, format: uuid }
            name: { type: string }
        targetAppId:         { type: string, format: uuid }
        targetApp:
          type: object
          properties:
            id:   { type: string, format: uuid }
            name: { type: string }
        type:
          type: string
          enum: [REST, SOAP, FTP, SFTP, DATABASE, MESSAGE_QUEUE, BATCH_FILE, EVENT_STREAM, GRAPHQL, GRPC, OTHER]
        frequency:
          type: string
          nullable: true
          enum: [REALTIME, NEAR_REALTIME, HOURLY, DAILY, WEEKLY, MONTHLY, ON_DEMAND, null]
        criticality:
          type: string
          nullable: true
          enum: [LOW, MEDIUM, HIGH, CRITICAL, null]
        technicalContact:    { type: string, nullable: true, description: "Nom, email ou alias libre du contact technique" }
        errorRate:           { type: number, format: decimal, nullable: true }
        tags:
          type: array
          items:
            type: object
            properties:
              path:  { type: string }
              label: { type: string }
        createdAt:  { type: string, format: date-time }
        updatedAt:  { type: string, format: date-time }

    InterfaceListItem:
      type: object
      description: Version allégée pour la liste (sans technicalContact, sans tags)
      properties:
        id:           { type: string, format: uuid }
        name:         { type: string, nullable: true }
        sourceApp:
          type: object
          properties:
            id:   { type: string, format: uuid }
            name: { type: string }
        targetApp:
          type: object
          properties:
            id:   { type: string, format: uuid }
            name: { type: string }
        type:
          type: string
          enum: [REST, SOAP, FTP, SFTP, DATABASE, MESSAGE_QUEUE, BATCH_FILE, EVENT_STREAM, GRAPHQL, GRPC, OTHER]
        frequency:    { type: string, nullable: true }
        criticality:  { type: string, nullable: true }
        errorRate:    { type: number, nullable: true }
        createdAt:    { type: string, format: date-time }
        updatedAt:    { type: string, format: date-time }

    CreateInterfaceDto:
      type: object
      required: [sourceAppId, targetAppId, type]
      properties:
        name:               { type: string, maxLength: 255, nullable: true }
        description:        { type: string, nullable: true }
        comment:            { type: string, nullable: true }
        sourceAppId:        { type: string, format: uuid }
        targetAppId:        { type: string, format: uuid }
        type:
          type: string
          enum: [REST, SOAP, FTP, SFTP, DATABASE, MESSAGE_QUEUE, BATCH_FILE, EVENT_STREAM, GRAPHQL, GRPC, OTHER]
        frequency:
          type: string
          nullable: true
          enum: [REALTIME, NEAR_REALTIME, HOURLY, DAILY, WEEKLY, MONTHLY, ON_DEMAND]
        criticality:
          type: string
          nullable: true
          enum: [LOW, MEDIUM, HIGH, CRITICAL]
        technicalContact:   { type: string, maxLength: 255, nullable: true, description: "Nom, email ou alias libre du contact technique" }
        errorRate:          { type: number, minimum: 0, maximum: 100, nullable: true }
        tagPaths:
          type: array
          items: { type: string }
          description: Chemins de tags F-03 (ex "Geography/France")

    UpdateInterfaceDto:
      type: object
      description: Tous les champs sont optionnels (PATCH partiel)
      properties:
        name:               { type: string, maxLength: 255, nullable: true }
        description:        { type: string, nullable: true }
        comment:            { type: string, nullable: true }
        sourceAppId:        { type: string, format: uuid }
        targetAppId:        { type: string, format: uuid }
        type:
          type: string
          enum: [REST, SOAP, FTP, SFTP, DATABASE, MESSAGE_QUEUE, BATCH_FILE, EVENT_STREAM, GRAPHQL, GRPC, OTHER]
        frequency:
          type: string
          nullable: true
          enum: [REALTIME, NEAR_REALTIME, HOURLY, DAILY, WEEKLY, MONTHLY, ON_DEMAND]
        criticality:
          type: string
          nullable: true
          enum: [LOW, MEDIUM, HIGH, CRITICAL]
        technicalContact:   { type: string, maxLength: 255, nullable: true, description: "Nom, email ou alias libre du contact technique" }
        errorRate:          { type: number, minimum: 0, maximum: 100, nullable: true }
        tagPaths:
          type: array
          items: { type: string }

    ErrorResponse:
      type: object
      properties:
        statusCode: { type: integer }
        code:       { type: string }
        message:    { type: string }
        timestamp:  { type: string, format: date-time }
        path:       { type: string }
```

---

## 4. Règles Métier Backend ⚠️

- **RM-01 — Auto-liaison interdite :** `sourceAppId` ne peut pas être égal à `targetAppId`. Si violation → `422` + `code: "SELF_REFERENCE"`.

```typescript
if (dto.sourceAppId === dto.targetAppId) {
  throw new UnprocessableEntityException({
    code: 'SELF_REFERENCE',
    message: 'sourceAppId and targetAppId must be different'
  });
}
```

- **RM-02 — Validation FK Applications :** Vérifier que `sourceAppId` et `targetAppId` existent dans `applications`. Si l'un est inconnu → `404` + `code: "APPLICATION_NOT_FOUND"`.

```typescript
const [source, target] = await Promise.all([
  this.prisma.application.findUnique({ where: { id: dto.sourceAppId } }),
  this.prisma.application.findUnique({ where: { id: dto.targetAppId } }),
]);
if (!source) throw new NotFoundException({ code: 'APPLICATION_NOT_FOUND', message: `Source application ${dto.sourceAppId} not found` });
if (!target) throw new NotFoundException({ code: 'APPLICATION_NOT_FOUND', message: `Target application ${dto.targetAppId} not found` });
```

- **RM-03 — Pas de contrainte d'unicité sur (source, target, type) :** Plusieurs interfaces de même type entre les mêmes applications sont valides (cas : double flux REST synchrone + asynchrone).

- **RM-04 — Suppression libre :** Aucune entité ne référence `interfaces` via FK. La suppression physique est directe sans vérification de dépendances.

```typescript
async remove(id: string): Promise<void> {
  const iface = await this.prisma.interface.findUnique({ where: { id } });
  if (!iface) throw new NotFoundException({ code: 'INTERFACE_NOT_FOUND', message: `Interface ${id} not found` });
  await this.prisma.interface.delete({ where: { id } });
}
```

- **RM-05 — Droits requis :** `interfaces:read` sur GET. `interfaces:write` sur POST/PATCH/DELETE.

- **RM-06 — Pas de soft delete :** Suppression physique uniquement.

- **RM-07 — Tags F-03 :** `tagPaths` déclenche `TagService.resolveOrCreate()` puis synchronisation de `entity_tags` (entity_type = `'interfaces'`). Si `tagPaths` absent ou `[]` dans PATCH → pas de modification des tags (passage de `undefined` vs `[]` documenté dans §5).

- **RM-08 — Audit context :** `SET LOCAL ark.current_user_id` positionné avant tout write (middleware global). Test obligatoire §7.

- **RM-09 — `technicalContact` libre :** Champ texte sans validation d'existence. Aucune requête en base requise. Accepter toute chaîne ≤ 255 caractères (nom, email, alias).

---

## 5. Comportements Backend par Cas d'Usage

**Nominal :**
- `GET /api/v1/interfaces` authentifié → `200` avec tableau (vide = `[]`)
- `GET /api/v1/interfaces?sourceAppId=<uuid>` → `200` avec interfaces filtrées
- `GET /api/v1/interfaces?type=REST&criticality=HIGH` → `200` avec interfaces filtrées (filtres cumulables)
- `POST /api/v1/interfaces` valide → `201` avec `InterfaceResponse` complet
- `GET /api/v1/interfaces/{id}` existant → `200` avec détail + sourceApp + targetApp + tags
- `PATCH /api/v1/interfaces/{id}` champs partiels → `200` avec entité mise à jour
- `DELETE /api/v1/interfaces/{id}` → `204`

**Erreurs :**
- `POST` sans `sourceAppId` ou `targetAppId` ou `type` → `400`
- `POST` avec `sourceAppId == targetAppId` → `422` + `code: "SELF_REFERENCE"`
- `POST` avec `sourceAppId` inconnu → `404` + `code: "APPLICATION_NOT_FOUND"`
- `POST` avec `targetAppId` inconnu → `404` + `code: "APPLICATION_NOT_FOUND"`
- `GET`/`PATCH`/`DELETE` UUID inexistant → `404` + `code: "INTERFACE_NOT_FOUND"`
- `PATCH` avec `sourceAppId == targetAppId` → `422` + `code: "SELF_REFERENCE"`
- `PATCH` avec `tagPaths: []` → tags inchangés (PATCH partiel : `undefined` ne touche pas les tags, `[]` non plus — pour effacer les tags, passer `tagPaths: null` si supporté, sinon omis)
- Toute route sans token → `401`
- Route `write` sans permission `interfaces:write` → `403`

---

## 6. Structure de Fichiers Backend

```
backend/src/interfaces/
├── interfaces.module.ts
├── interfaces.controller.ts
├── interfaces.service.ts
├── interfaces.service.spec.ts      ← tests unit Jest
└── dto/
    ├── create-interface.dto.ts
    ├── update-interface.dto.ts
    └── query-interface.dto.ts

backend/test/
└── FS-08-interfaces.e2e-spec.ts    ← tests Supertest
```

---

## 7. Tests Backend ⚠️

### Outil par niveau

| Niveau | Outil | Fichier cible | Délégable à OpenCode |
|---|---|---|---|
| Unit (services NestJS) | **Jest** | `src/interfaces/interfaces.service.spec.ts` | ✅ Oui |
| API / contrat HTTP | **Supertest** | `test/FS-08-interfaces.e2e-spec.ts` | ✅ Oui |
| Sécurité / RBAC | **Supertest** | `test/FS-08-interfaces.e2e-spec.ts` | ❌ Manuel |

### Tests Jest — Unit

- [ ] `[Jest]` `InterfacesService.findAll()` retourne un tableau
- [ ] `[Jest]` `InterfacesService.findAll({ sourceAppId })` filtre par sourceAppId
- [ ] `[Jest]` `InterfacesService.findAll({ type: 'REST' })` filtre par type
- [ ] `[Jest]` `InterfacesService.create()` retourne l'interface créée
- [ ] `[Jest]` `InterfacesService.create()` lève `UnprocessableEntityException` si sourceAppId == targetAppId
- [ ] `[Jest]` `InterfacesService.create()` lève `NotFoundException` si sourceApp inexistante
- [ ] `[Jest]` `InterfacesService.create()` lève `NotFoundException` si targetApp inexistante
- [ ] `[Jest]` `InterfacesService.findOne()` retourne l'interface avec sourceApp, targetApp, tags
- [ ] `[Jest]` `InterfacesService.findOne()` lève `NotFoundException` si UUID inexistant
- [ ] `[Jest]` `InterfacesService.update()` retourne l'interface mise à jour
- [ ] `[Jest]` `InterfacesService.update()` lève `UnprocessableEntityException` si sourceAppId == targetAppId
- [ ] `[Jest]` `InterfacesService.remove()` lève `NotFoundException` si UUID inexistant
- [ ] `[Jest]` `InterfacesService.remove()` appelle `prisma.interface.delete()` si interface existe

### Tests Supertest — Contrat API

> Le `beforeEach` doit créer deux Applications distinctes en base via `POST /applications` pour alimenter `sourceAppId` et `targetAppId`.

- [ ] `[Supertest]` `GET /api/v1/interfaces` authentifié → `200` avec tableau
- [ ] `[Supertest]` `GET /api/v1/interfaces` liste vide → `200` avec `[]`
- [ ] `[Supertest]` `GET /api/v1/interfaces?sourceAppId=<uuid>` → `200` avec interfaces filtrées
- [ ] `[Supertest]` `GET /api/v1/interfaces?type=REST` → `200` avec filtrage par type
- [ ] `[Supertest]` `POST /api/v1/interfaces` payload valide → `201` avec `InterfaceResponse`
- [ ] `[Supertest]` `POST /api/v1/interfaces` valide → audit_trail contient 1 ligne avec `entity_type='interfaces'` et `changed_by` non NULL
- [ ] `[Supertest]` `POST /api/v1/interfaces` sans `sourceAppId` → `400`
- [ ] `[Supertest]` `POST /api/v1/interfaces` sans `targetAppId` → `400`
- [ ] `[Supertest]` `POST /api/v1/interfaces` sans `type` → `400`
- [ ] `[Supertest]` `POST /api/v1/interfaces` sourceAppId == targetAppId → `422` + `code: "SELF_REFERENCE"`
- [ ] `[Supertest]` `POST /api/v1/interfaces` sourceAppId inconnu → `404` + `code: "APPLICATION_NOT_FOUND"`
- [ ] `[Supertest]` `POST /api/v1/interfaces` targetAppId inconnu → `404` + `code: "APPLICATION_NOT_FOUND"`
- [ ] `[Supertest]` `GET /api/v1/interfaces/{id}` existant → `200` avec sourceApp + targetApp
- [ ] `[Supertest]` `GET /api/v1/interfaces/{id}` inexistant → `404`
- [ ] `[Supertest]` `PATCH /api/v1/interfaces/{id}` champs partiels valides → `200`
- [ ] `[Supertest]` `PATCH /api/v1/interfaces/{id}` sourceAppId == targetAppId → `422` + `code: "SELF_REFERENCE"`
- [ ] `[Supertest]` `DELETE /api/v1/interfaces/{id}` existant → `204`
- [ ] `[Supertest]` `DELETE /api/v1/interfaces/{id}` inexistant → `404`

> **Audit trail (NFR-SEC-009) :** Après `POST /api/v1/interfaces`, requêter `audit_trail` sur `entity_type='interfaces'` et `entity_id=<id_créée>` → vérifier `changed_by IS NOT NULL`.

### Tests Sécurité / RBAC — Manuel ❌

- [ ] `[Manuel]` `GET /api/v1/interfaces` sans token → `401`
- [ ] `[Manuel]` `POST /api/v1/interfaces` rôle sans `interfaces:write` → `403`
- [ ] `[Manuel]` `PATCH /api/v1/interfaces/{id}` rôle sans `interfaces:write` → `403`
- [ ] `[Manuel]` `DELETE /api/v1/interfaces/{id}` rôle sans `interfaces:write` → `403`

---

## 8. Commande OpenCode — Backend ⚠️

```
Contexte projet ARK — Session Backend FS-08-BACK :

Stack : NestJS strict mode + Prisma ORM + PostgreSQL 16 + TypeScript strict
Structure modules : src/<domaine>/<domaine>.module.ts / .controller.ts / .service.ts / dto/

Conventions obligatoires :
- Toute écriture en base : await prisma.$executeRaw`SET LOCAL ark.current_user_id = ${userId}`
- PrismaModule est global (APP_MODULE) — ne jamais le réimporter dans un module feature
- JwtAuthGuard est global — décorer avec @Public() les seules routes publiques
- @RequirePermission() disponible — utiliser sur chaque handler controller
- Format d'erreur standard : { statusCode, code, message, timestamp, path }
  → UnprocessableEntityException({ code: 'SELF_REFERENCE', message: '...' }) pour auto-liaison
  → NotFoundException({ code: 'APPLICATION_NOT_FOUND', message: '...' }) pour app inconnue
  → NotFoundException({ code: 'INTERFACE_NOT_FOUND', message: '...' }) pour interface inconnue
- Vérification RM-01 (sourceAppId ≠ targetAppId) AVANT toute écriture en base
- Vérification FK Applications (RM-02) AVANT tout create/update
- Requêtes raw : tagged template backtick uniquement — jamais Prisma.raw() avec interpolation
- Tests unit : jest.mock() sur PrismaService — pas de base réelle
- Fichier test e2e : backend/test/FS-08-interfaces.e2e-spec.ts
- Le beforeEach Supertest doit créer deux Applications distinctes en base via POST /applications

Documentation obligatoire (NFR-GOV-001) :
- À la fin de la session, recopier le contenu YAML de la section §3 (Contrat API) dans docs/04-Tech/openapi.yaml

Pattern de référence NestJS : module Domains (FS-02-BACK) — s'y conformer pour la structure et le style.

Implémente la feature "Interfaces" backend (FS-08-BACK) en respectant strictement le contrat ci-dessous.
Génère : module NestJS complet (controller, service, DTOs, module) + tests Jest unit + tests Supertest.
Ne génère PAS les tests marqués [Manuel].
Ne génère PAS de code frontend.
Ne fais aucune hypothèse non documentée. Si un point est ambigu, pose une question avant de coder.

[COLLER LE CONTENU COMPLET DE FS-08-Interfaces-back.md ICI]
```

---

## 9. Gate de Validation Backend ⚠️

| # | Gate | Vérification | Bloquant |
|---|------|--------------|----------|
| G-01 | Migration Prisma appliquée | Table `interfaces` avec nouveaux types enum + colonnes `description`/`comment` + sans `tags[]` | ✅ Oui |
| G-02 | Seed permissions | `interfaces:read` et `interfaces:write` en base | ✅ Oui |
| G-03 | Tests Jest passent | `npm run test -- --testPathPattern=interfaces` → 0 failed | ✅ Oui |
| G-04 | Tests Supertest passent | `npm run test:e2e -- --testPathPattern=FS-08` → 0 failed | ✅ Oui |
| G-05 | Tests RBAC manuels validés | Les cas [Manuel] §7 vérifiés à la main | ✅ Oui |
| G-06 | Aucune erreur TypeScript | `npm run build` → 0 error | ✅ Oui |
| G-07 | Statut mis à jour | Passer `FS-08-BACK` à `done` dans cet en-tête | ✅ Oui |
| G-08 | Revue TD backend | TD-1 à TD-6 vérifiés, F-999 mis à jour | ✅ Oui |
| G-09 | RM-01 validé en base | `POST` avec sourceAppId == targetAppId → `422` confirmé Postman | ✅ Oui |
| G-10 | Audit trail actif | `POST /interfaces` → vérifier ligne dans `audit_trail` (changed_by non NULL) | ✅ Oui |
| G-11 | `openapi.yaml` mis à jour | Paths `/interfaces` présents dans `docs/04-Tech/openapi.yaml` (recopiés de §3) | ✅ Oui |

---

## 10. Checklist de Validation Post-Session

- [ ] `POST` retourne `201` avec réponse complète conforme au schéma
- [ ] `POST` → audit_trail.changed_by non NULL (NFR-SEC-009)
- [ ] `POST` sourceAppId == targetAppId → `422` + `code: "SELF_REFERENCE"`
- [ ] `POST` avec sourceAppId ou targetAppId inconnu → `404` + `code: "APPLICATION_NOT_FOUND"`
- [ ] `GET /{id}` inclut `sourceApp` et `targetApp` (id + name)
- [ ] `GET` avec filtres `sourceAppId`/`targetAppId`/`type`/`criticality` fonctionne
- [ ] Toutes les réponses d'erreur incluent le champ `code` explicite (NFR-MAINT-001)
- [ ] Aucun `TODO / FIXME / HACK` non tracé
- [ ] Aucune erreur TypeScript strict
- [ ] Conventions `$executeRaw`, structure modules, mock Prisma respectées
- [ ] `docs/04-Tech/openapi.yaml` mis à jour avec les paths de cette feature (NFR-GOV-001)

---

## 11. Revue de Dette Technique *(gate de fin de sprint — obligatoire)* ⚠️

### Gates TD

| # | Vérification | Commande / Action |
|---|---|---|
| TD-1 | Aucun `TODO / FIXME / HACK` non tracé dans le code livré | `git grep -n "TODO\|FIXME\|HACK" -- '*.ts'` |
| TD-2 | Items F-999 activés par cette feature : statut mis à jour | Relire F-999 §2 — vérifier Item tags migration `interfaces` |
| TD-3 | Checklist F-999 §4 : cases cochées pour les items de ce sprint | F-999 §4 |
| TD-4 | AGENTS.md : aucun pattern nouveau non documenté introduit | Relire AGENTS.md |
| TD-5 | ARK-NFR.md : NFR impactés mis à jour (`missing` → `covered` / `partial`) | ARK-NFR.md |
| TD-6 | Nouvelles décisions transverses → nouvel Item F-999 créé si applicable | Jugement |

### Résultat de la Revue

| Champ | Valeur |
|---|---|
| **Sprint** | Sprint 4 |
| **Date de revue** | *(à renseigner après session)* |
| **Items F-999 fermés** | *(à renseigner)* |
| **Items F-999 ouverts** | *(à renseigner)* |
| **Nouveaux items F-999 créés** | *(à renseigner)* |
| **NFR mis à jour** | *(à renseigner)* |
| **TODOs résiduels tracés** | *(à renseigner)* |
| **Statut gates TD** | *(à renseigner)* |

---

## 12. Données de Seed ⚠️

### Pertinence

⚠️ **Optionnel** — Les interfaces sont des flux inter-applicatifs créés par les architectes en production. Quelques données de démonstration améliorent le rendu du graphe de dépendances (FS-09) lors de la recette.

> **Pré-requis seed :** Les applications seedées dans `seed.ts` (FS-06) doivent exister avant ce seed. À insérer **après** le seed Applications.

### Données de démonstration

| # | name | sourceApp | targetApp | type | frequency | criticality |
|---|------|-----------|-----------|------|-----------|-------------|
| 1 | "CRM → ERP commandes" | SAP ERP (ou premier app seedé) | Salesforce (ou second) | `DATABASE` | `DAILY` | `HIGH` |
| 2 | "Portail → API Gateway" | App portail | App API interne | `REST` | `REALTIME` | `CRITICAL` |
| 3 | "ERP → BI extract" | SAP ERP | Tableau / BI app | `BATCH_FILE` | `DAILY` | `MEDIUM` |

> **Note :** Adapter les noms d'applications aux apps réellement seedées dans `seed.ts` FS-06. Les IDs sont récupérés dynamiquement par `findUnique({ where: { name: '...' } })`.

### Bloc de code seed

```typescript
// Insert sample interfaces if seed apps exist
async function seedInterfaces(prisma: PrismaClient) {
  // Récupérer les apps seedées par nom
  const apps = await prisma.application.findMany({
    select: { id: true, name: true },
    take: 5,
  });

  if (apps.length < 2) {
    console.log('⚠ Skipping interfaces seed — fewer than 2 applications found');
    return;
  }

  const sampleInterfaces = [
    {
      name: 'Flux principal A→B',
      sourceAppId: apps[0].id,
      targetAppId: apps[1].id,
      type: 'REST' as const,
      frequency: 'REALTIME' as const,
      criticality: 'HIGH' as const,
    },
    {
      name: 'Batch quotidien B→C',
      sourceAppId: apps[1].id,
      targetAppId: apps.length > 2 ? apps[2].id : apps[0].id,
      type: 'BATCH_FILE' as const,
      frequency: 'DAILY' as const,
      criticality: 'MEDIUM' as const,
    },
  ];

  for (const iface of sampleInterfaces) {
    const existing = await prisma.interface.findFirst({
      where: {
        sourceAppId: iface.sourceAppId,
        targetAppId: iface.targetAppId,
        type: iface.type,
        name: iface.name,
      },
    });
    if (!existing) {
      await prisma.$executeRaw`
        INSERT INTO interfaces (id, name, source_app_id, target_app_id, type, frequency, criticality, created_at, updated_at)
        VALUES (
          gen_random_uuid(),
          ${iface.name}::varchar,
          ${iface.sourceAppId}::uuid,
          ${iface.targetAppId}::uuid,
          ${iface.type}::interface_type,
          ${iface.frequency}::interface_frequency,
          ${iface.criticality}::criticality_level,
          now(),
          now()
        )`;
      console.log(`✓ Created interface: ${iface.name}`);
    }
  }
  console.log('Seed interfaces completed');
}
```

> **Rappel F-999 Item 8 :** Utiliser le tagged template `$executeRaw` — jamais `$executeRawUnsafe` avec interpolation de string.

---

_FS-08-BACK v1.0 — Projet ARK — Sprint 4_
