# ARK — Feature Spec F-03 : Dimension Tags Foundation

_Version 0.1 — Mars 2026_

> **Usage :** F-03 installe le moteur de tags dimensionnels d'ARK. C'est une spec de fondation : elle ne livre aucun écran utilisateur final, mais pose le `TagsModule` NestJS global, les migrations Prisma, et le composant `DimensionTagInput` réutilisé dans tous les modules CRUD suivants. **Ne pas commencer FS-02 sans F-03 terminé.**

> **Mode :** 🟡 Hybride — `TagService` (logique de path récursif, upsert ancêtres) écrit **manuellement**. Migrations Prisma et composant `DimensionTagInput` peuvent être générés via OpenCode à partir de cette spec.

---

## En-tête

| Champ | Valeur |
|---|---|
| **ID** | F-03 |
| **Titre** | Dimension Tags Foundation — moteur de tags hiérarchiques polymorphes |
| **Priorité** | P1 |
| **Statut** | `draft` |
| **Dépend de** | F-02 (i18n), FS-01 (Auth & RBAC) |
| **Estimé** | 1.5j |
| **Version** | 0.1 |
| **Mode** | 🟡 Hybride Manuel / OpenCode — voir §8 |

---

## 1. Objectif & Périmètre ⚠️

**Ce que cette feature fait :**

F-03 implémente le système de tags dimensionnels d'ARK : un mécanisme générique permettant d'attacher à n'importe quelle entité (Application, IT Component, Data Object, etc.) des valeurs structurées en arbres hiérarchiques appelés Dimensions. Les valeurs de tags suivent le pattern de nested tags d'Obsidian (`europe/france/paris`) : l'héritage est **implicite** — taguer une entité avec `europe/france/paris` la rend trouvable par n'importe quelle requête portant sur `europe/france` ou `europe`. La création de valeurs est **libre** via autocomplete : si la valeur saisie n'existe pas, elle est créée automatiquement avec ses ancêtres manquants. F-03 fournit également le composant React `DimensionTagInput` consommé par toutes les features CRUD suivantes.

**Ce qu'elle ne fait pas (hors périmètre) :**

- Pas d'écran d'administration des dimensions (renommage, fusion, réordonnancement) — c'est FS-21 (P2)
- Pas de contrainte `multi_value: false` appliquée en UI — différé P2 avec l'admin
- Pas de `entity_scope` enforced côté backend en P1 — le champ existe en base, la validation est différée P2
- Pas de migration des `tags TEXT[]` existants vers le nouveau modèle — les colonnes `tags` sur les tables P1 existantes sont retirées lors de l'implémentation de chaque FS-xx concernée
- Pas de filtres par dimension dans les listes — implémentés dans chaque FS-xx consommatrice

---

## 2. Modèle Prisma ⚠️

```prisma
model TagDimension {
  id          String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  name        String   @unique @db.VarChar(255)
  description String?
  color       String?  @db.VarChar(7)       // couleur hex UI, ex: "#1A237E"
  icon        String?  @db.VarChar(50)      // nom d'icône lucide-react
  multiValue  Boolean  @default(true) @map("multi_value")
  entityScope String[] @default([]) @map("entity_scope")
  // [] = applicable à toutes les entités
  // ['application', 'it_component'] = restreint (non enforced en P1)
  sortOrder   Int      @default(0) @map("sort_order")
  createdAt   DateTime @default(now()) @map("created_at") @db.Timestamptz

  values TagValue[]

  @@map("tag_dimensions")
}

model TagValue {
  id          String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  dimensionId String   @map("dimension_id") @db.Uuid
  path        String   @db.VarChar(500)
  // Chemin complet depuis la racine, ex: "europe/france/paris"
  // Normalisé : lowercase, trim, espaces → tirets
  // Séparateur : "/" — jamais d'espace autour
  label       String   @db.VarChar(255)
  // Label lisible du nœud FEUILLE uniquement, ex: "Paris"
  // Généré automatiquement depuis le dernier segment du path si non fourni
  parentId    String?  @map("parent_id") @db.Uuid
  // FK vers le nœud parent direct — null si racine
  // Redondant avec path mais utile pour la navigation arbre en UI
  depth       Int      @default(0) @db.SmallInt
  // 0 = racine, 1 = enfant direct, etc.
  createdAt   DateTime @default(now()) @map("created_at") @db.Timestamptz

  dimension  TagDimension @relation(fields: [dimensionId], references: [id], onDelete: Cascade)
  parent     TagValue?    @relation("TagValueHierarchy", fields: [parentId], references: [id])
  children   TagValue[]   @relation("TagValueHierarchy")
  entityTags EntityTag[]

  @@unique([dimensionId, path])
  @@index([dimensionId, path(ops: raw("text_pattern_ops"))], name: "idx_tag_values_path_prefix")
  @@map("tag_values")
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

> **Note migration :** Les colonnes `tags TEXT[]` sur `applications`, `business_capabilities`, `interfaces`, `data_objects`, `it_components`, `providers` sont conservées jusqu'à l'implémentation de chaque FS-xx. Chaque FS-xx migrate sa propre table (DROP COLUMN `tags`, câblage `EntityTag`). Ajouter en note de migration destructive dans F-999.

---

## 3. Contrat API (OpenAPI) ⚠️

```yaml
paths:

  /tag-dimensions:
    get:
      summary: Liste toutes les dimensions
      tags: [Tags]
      security:
        - bearerAuth: []
      responses:
        '200':
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/TagDimensionResponse'

    post:
      summary: Créer une dimension (Admin)
      tags: [Tags]
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateTagDimensionDto'
      responses:
        '201':
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/TagDimensionResponse'
        '409':
          description: Nom de dimension déjà utilisé

  /tag-dimensions/{id}:
    patch:
      summary: Modifier une dimension (Admin) — P1 limité à color/icon/description
      tags: [Tags]
      security:
        - bearerAuth: []
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
            format: uuid
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/UpdateTagDimensionDto'
      responses:
        '200':
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/TagDimensionResponse'
        '404':
          description: Dimension introuvable

  /tags/autocomplete:
    get:
      summary: Autocomplete de valeurs de tags pour une dimension
      description: |
        Retourne les TagValues dont le path ou le label contient la query.
        Utilisé par DimensionTagInput pour le autocomplete libre.
        Crée la valeur à la volée si `createIfMissing=true` (POST implicite).
      tags: [Tags]
      security:
        - bearerAuth: []
      parameters:
        - name: dimension
          in: query
          required: true
          schema:
            type: string
          description: Nom ou ID de la dimension
        - name: q
          in: query
          required: false
          schema:
            type: string
          description: Terme de recherche (min 1 char)
        - name: limit
          in: query
          required: false
          schema:
            type: integer
            default: 20
      responses:
        '200':
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/TagValueResponse'

  /tags/resolve:
    post:
      summary: Résoudre ou créer une valeur de tag (upsert)
      description: |
        Crée la valeur et tous ses ancêtres manquants si elle n'existe pas.
        Retourne la valeur existante si elle existe déjà.
        Appelé par le frontend lors de la validation d'un tag saisi librement.
      tags: [Tags]
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [dimensionId, path]
              properties:
                dimensionId:
                  type: string
                  format: uuid
                path:
                  type: string
                  example: "europe/france/paris"
      responses:
        '200':
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/TagValueResponse'
        '400':
          description: Path invalide (caractères interdits, trop long)

  /tags/entity/{entityType}/{entityId}:
    get:
      summary: Récupère tous les tags d'une entité
      tags: [Tags]
      security:
        - bearerAuth: []
      parameters:
        - name: entityType
          in: path
          required: true
          schema:
            type: string
            example: application
        - name: entityId
          in: path
          required: true
          schema:
            type: string
            format: uuid
      responses:
        '200':
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/EntityTagResponse'

    put:
      summary: Remplace tous les tags d'une entité pour une dimension donnée
      description: |
        Opération de remplacement complet (PUT sémantique) : supprime les tags
        existants de la dimension et pose les nouveaux. Idempotent.
        Le body contient les tag_value_ids à affecter.
      tags: [Tags]
      security:
        - bearerAuth: []
      parameters:
        - name: entityType
          in: path
          required: true
          schema:
            type: string
        - name: entityId
          in: path
          required: true
          schema:
            type: string
            format: uuid
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [dimensionId, tagValueIds]
              properties:
                dimensionId:
                  type: string
                  format: uuid
                tagValueIds:
                  type: array
                  items:
                    type: string
                    format: uuid
      responses:
        '200':
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/EntityTagResponse'

components:
  schemas:

    TagDimensionResponse:
      type: object
      properties:
        id:
          type: string
          format: uuid
        name:
          type: string
        description:
          type: string
          nullable: true
        color:
          type: string
          nullable: true
        icon:
          type: string
          nullable: true
        multiValue:
          type: boolean
        entityScope:
          type: array
          items:
            type: string
        sortOrder:
          type: integer
        createdAt:
          type: string
          format: date-time

    CreateTagDimensionDto:
      type: object
      required: [name]
      properties:
        name:
          type: string
          maxLength: 255
          example: "Geography"
        description:
          type: string
          nullable: true
        color:
          type: string
          pattern: '^#[0-9A-Fa-f]{6}$'
          nullable: true
        icon:
          type: string
          maxLength: 50
          nullable: true
        multiValue:
          type: boolean
          default: true
        entityScope:
          type: array
          items:
            type: string
          default: []

    UpdateTagDimensionDto:
      type: object
      properties:
        description:
          type: string
          nullable: true
        color:
          type: string
          pattern: '^#[0-9A-Fa-f]{6}$'
          nullable: true
        icon:
          type: string
          maxLength: 50
          nullable: true
        # name et entityScope non modifiables en P1 — réservés FS-21

    TagValueResponse:
      type: object
      properties:
        id:
          type: string
          format: uuid
        dimensionId:
          type: string
          format: uuid
        dimensionName:
          type: string
        path:
          type: string
          example: "europe/france/paris"
        label:
          type: string
          example: "Paris"
        depth:
          type: integer
        parentId:
          type: string
          format: uuid
          nullable: true

    EntityTagResponse:
      type: object
      properties:
        entityType:
          type: string
        entityId:
          type: string
          format: uuid
        tagValue:
          $ref: '#/components/schemas/TagValueResponse'
        taggedAt:
          type: string
          format: date-time
```

---

## 4. Règles Métier Critiques ⚠️

- **RM-01 — Normalisation du path :** Avant tout upsert ou lookup, le path est normalisé : `toLowerCase().trim()`, espaces internes remplacés par `-`, caractères interdits (`/` sauf séparateur, `\`, `"`, `'`, espaces de début/fin de segment) rejetés avec `400 BAD_REQUEST`. Chaque segment est trimé individuellement. Ex : `"Europe / France / Paris"` → `"europe/france/paris"`.

- **RM-02 — Création récursive des ancêtres :** Lors de l'upsert d'un path `a/b/c`, les nœuds `a` et `a/b` doivent exister avant `a/b/c`. Le `TagService.resolveOrCreate(dimensionId, path)` crée les ancêtres manquants dans l'ordre racine → feuille, via des upserts séquentiels. Chaque ancêtre a son propre `label` = dernier segment de son path.

- **RM-03 — Héritage implicite (lecture seulement) :** L'héritage n'est pas matérialisé en base. On ne stocke que la feuille dans `entity_tags`. La couverture d'un nœud parent se calcule à la requête via `WHERE tv.path LIKE :prefix || '%'`. Le `TagService` expose `getAncestorPaths(path): string[]` pour les cas où les ancêtres sont nécessaires.

- **RM-04 — PUT sémantique sur les tags d'entité :** `PUT /tags/entity/:type/:id` remplace **tous** les tags de la dimension indiquée pour cette entité — pas un merge. Si `tagValueIds = []`, tous les tags de la dimension sont supprimés. Les tags des autres dimensions sont inchangés.

- **RM-05 — Unicité dimension par nom :** Deux dimensions ne peuvent pas avoir le même `name` (case-insensitive à la création — la normalisation se fait en `name.trim()`). `409 CONFLICT` si doublon.

- **RM-06 — `TagsModule` global :** `TagsModule` est déclaré `@Global()` et exporte `TagService`. Tous les modules CRUD qui ont besoin de sauvegarder des tags importent `TagsModule` ou injectent `TagService` directement. Ne pas reimporter `PrismaModule`.

- **RM-07 — Seed des dimensions de base :** À l'issue de F-03, le seed Prisma contient les 3 dimensions initiales : `Geography` (color: `#2196F3`, icon: `public`), `Brand` (color: `#9C27B0`, icon: `label`), `LegalEntity` (color: `#FF9800`, icon: `account_balance`). Ces dimensions sont vides de valeurs — les valeurs sont créées à la volée par les utilisateurs.

- **RM-08 — Tags non bloquants à la suppression d'entité :** La suppression d'une entité (Application, etc.) déclenche un `DELETE FROM entity_tags WHERE entity_type = X AND entity_id = Y` en cascade (ON DELETE CASCADE sur la FK implicite, ou géré applicativement). Les `TagValue` elles-mêmes ne sont pas supprimées — elles peuvent être orphelines. Le nettoyage des orphelins est une opération d'administration P2 (FS-21).

---

## 5. Comportement attendu par cas d'usage

**Nominal — autocomplete et création à la volée :**
- Quand l'utilisateur tape `"paris"` dans le champ Geography d'une Application → l'autocomplete retourne les TagValues dont le path ou label contient `"paris"` (ILIKE)
- Quand l'utilisateur sélectionne une valeur existante → `PUT /tags/entity/application/:id` est appelé avec le tagValueId
- Quand l'utilisateur tape `"europe/france/marseille"` et appuie Entrée → `POST /tags/resolve` est appelé → crée `europe`, `europe/france` (si manquants) et `europe/france/marseille` → retourne le TagValue feuille → `PUT /tags/entity/...` est appelé
- Quand l'utilisateur tape `"marseille"` (sans préfixe) dans la dimension Geography → path normalisé = `"marseille"`, depth = 0, pas d'ancêtre → valeur créée à la racine de la dimension

**Nominal — lecture avec héritage implicite :**
- Quand une requête filtre `Geography` = `"europe/france"` → retourne toutes les entités taggées avec un path commençant par `"europe/france"` (Paris, Lyon, Marseille, etc.)
- Quand on récupère les tags d'une entité → retourne uniquement les feuilles stockées, pas les ancêtres déduits

**Erreurs :**
- Path avec caractère interdit (ex: `"france<paris>"`) → `400 BAD_REQUEST` + code `INVALID_TAG_PATH`
- Path vide ou uniquement slashes → `400 BAD_REQUEST` + code `INVALID_TAG_PATH`
- Dimension inexistante dans l'autocomplete → `404 NOT_FOUND`
- `PUT /tags/entity/...` avec un `tagValueId` appartenant à une autre dimension que `dimensionId` → `400 BAD_REQUEST` + code `TAG_DIMENSION_MISMATCH`

---

## 6. Composants Frontend

### `DimensionTagInput`

Composant MUI autocomplete réutilisable, consommé par tous les formulaires CRUD des entités P1.

```typescript
interface DimensionTagInputProps {
  dimensionId: string         // UUID de la dimension
  dimensionName: string       // Affiché en label du champ
  entityType: string          // 'application' | 'it_component' | ...
  entityId?: string           // undefined en mode création (tags sauvegardés après POST entité)
  value: TagValueResponse[]   // tags actuellement sélectionnés
  onChange: (tags: TagValueResponse[]) => void
  disabled?: boolean
  multiple?: boolean          // default: true (respecte multiValue de la dimension)
  color?: string              // couleur de la dimension pour les chips
}
```

**Comportement :**
- Champ `Autocomplete` MUI avec `freeSolo` — l'utilisateur peut saisir n'importe quelle valeur
- Appelle `GET /tags/autocomplete?dimension=:id&q=:input` à chaque keystroke (debounce 300ms)
- Si la valeur saisie n'existe pas dans les suggestions et que l'utilisateur valide (Entrée ou blur) → appelle `POST /tags/resolve` pour créer la valeur → ajoute aux tags sélectionnés
- Les tags sélectionnés s'affichent comme MUI `Chip` avec la couleur de la dimension
- Le path complet est affiché en tooltip au survol du chip (ex: `"europe/france/paris"`) ; le label court (`"Paris"`) est affiché dans le chip
- En mode création d'entité (`entityId` absent) : les tags sont stockés dans le state local et sauvegardés via `PUT /tags/entity/...` après le `POST` de création de l'entité parente
- En mode édition : chaque modification déclenche immédiatement `PUT /tags/entity/...` (pas de bouton Save séparé pour les tags)

**Structure de fichiers :**
```
frontend/src/
└── components/
    └── tags/
        ├── DimensionTagInput.tsx
        ├── DimensionTagInput.types.ts
        └── index.ts
```

**Clés i18n à ajouter dans `fr.json` :**
```json
"tags": {
  "autocomplete": {
    "placeholder": "Rechercher ou créer...",
    "noOptions": "Aucun résultat",
    "createOption": "Créer \"{{value}}\"",
    "loading": "Chargement..."
  },
  "tooltip": {
    "fullPath": "Chemin complet : {{path}}"
  },
  "errors": {
    "invalidPath": "Valeur de tag invalide",
    "saveFailed": "Erreur lors de la sauvegarde du tag"
  }
}
```

---

## 7. Tests ⚠️

### Outil par niveau

| Niveau | Outil | Fichier cible | Délégable à OpenCode |
|---|---|---|---|
| Unit (TagService) | **Jest** | `src/tags/tags.service.spec.ts` | ⚠️ Partiel — logique path manuelle |
| API / contrat HTTP | **Jest + Supertest** | `test/tags.e2e-spec.ts` | ✅ Oui |
| Sécurité / RBAC | **Jest + Supertest** | `test/tags.e2e-spec.ts` | ❌ **Manuel** |
| E2E browser (UI) | **Cypress** | `cypress/e2e/tags.cy.ts` | ✅ Oui (nominaux) |

### Tests Jest — Unit (TagService)

- [ ] `[Jest]` `normalizePath('Europe / France / Paris')` → `'europe/france/paris'`
- [ ] `[Jest]` `normalizePath('France<Paris>')` → throw `INVALID_TAG_PATH`
- [ ] `[Jest]` `normalizePath('')` → throw `INVALID_TAG_PATH`
- [ ] `[Jest]` `normalizePath('////')` → throw `INVALID_TAG_PATH`
- [ ] `[Jest]` `getAncestorPaths('a/b/c')` → `['a', 'a/b']`
- [ ] `[Jest]` `getAncestorPaths('a')` → `[]` (racine, pas d'ancêtre)
- [ ] `[Jest]` `resolveOrCreate` — path existant → retourne l'existant sans créer
- [ ] `[Jest]` `resolveOrCreate` — path nouveau avec ancêtres manquants → crée 3 nœuds dans l'ordre
- [ ] `[Jest]` `resolveOrCreate` — ancêtres partiellement existants → crée uniquement les manquants
- [ ] `[Jest]` `labelFromPath('europe/france/paris')` → `'Paris'`
- [ ] `[Jest]` `labelFromPath('europe')` → `'Europe'` (capitalisé pour affichage)

### Tests Jest + Supertest — Contrat API

- [ ] `[Supertest]` `GET /tag-dimensions` → 200, liste les dimensions seedées
- [ ] `[Supertest]` `POST /tag-dimensions` (Admin) → 201, dimension créée
- [ ] `[Supertest]` `POST /tag-dimensions` nom dupliqué → 409 code `CONFLICT`
- [ ] `[Supertest]` `GET /tags/autocomplete?dimension=Geography&q=fra` → 200, retourne valeurs matchantes
- [ ] `[Supertest]` `GET /tags/autocomplete?dimension=Geography&q=` → 200, retourne jusqu'à 20 valeurs
- [ ] `[Supertest]` `POST /tags/resolve` path nouveau → 200, valeur + ancêtres créés
- [ ] `[Supertest]` `POST /tags/resolve` path existant → 200, valeur retournée sans duplication
- [ ] `[Supertest]` `POST /tags/resolve` path invalide → 400 code `INVALID_TAG_PATH`
- [ ] `[Supertest]` `PUT /tags/entity/application/:id` → 200, tags remplacés pour la dimension
- [ ] `[Supertest]` `PUT /tags/entity/application/:id` tagValueIds=[] → 200, tous les tags de la dimension supprimés
- [ ] `[Supertest]` `PUT /tags/entity/application/:id` tagValueId d'une autre dimension → 400 code `TAG_DIMENSION_MISMATCH`
- [ ] `[Supertest]` `GET /tags/entity/application/:id` → 200, retourne les tags de l'entité

### Tests Sécurité / RBAC — Manuel ❌

- [ ] `[Manuel]` `POST /tag-dimensions` avec rôle non-Admin → 403
- [ ] `[Manuel]` `PATCH /tag-dimensions/:id` avec rôle non-Admin → 403
- [ ] `[Manuel]` `GET /tags/autocomplete` sans token → 401
- [ ] `[Manuel]` `PUT /tags/entity/:type/:id` sans token → 401

### Tests Cypress — E2E Browser

> F-03 ne livre pas d'écran dédié. Les tests Cypress sont sur `DimensionTagInput` intégré dans un formulaire hôte — à compléter dans les specs FS-xx consommatrices (FS-06 Applications en premier).

- [ ] `[Cypress]` `DimensionTagInput` — saisie d'une valeur existante → chip affiché avec label court
- [ ] `[Cypress]` `DimensionTagInput` — saisie d'une valeur inexistante + Entrée → chip créé avec label
- [ ] `[Cypress]` `DimensionTagInput` — survol chip → tooltip affiche path complet
- [ ] `[Cypress]` `DimensionTagInput` — suppression chip → tag retiré de la liste

---

## 8. Contraintes Techniques

**Périmètre manuel (ne pas déléguer à OpenCode) :**
- `TagService.resolveOrCreate()` — logique de création récursive des ancêtres, sensible à l'ordre d'insertion et aux race conditions
- `TagService.normalizePath()` — règles de normalisation, caractères interdits
- `TagService.getAncestorPaths()` — logique de décomposition de path

**Périmètre OpenCode (générable) :**
- Migration Prisma + `schema.sql` correspondant
- `TagsController` — CRUD dimensions + endpoints autocomplete/resolve/entity
- `TagsModule` wiring NestJS
- DTOs + validations class-validator
- Composant `DimensionTagInput` frontend (à partir de la spec §6)
- Tests Supertest nominaux

**Conventions à respecter :**
- `TagsModule` déclaré `@Global()` dans `tags.module.ts`, exporte `TagService`
- Pattern NestJS : suivre `DomainsModule` (FS-02) comme référence de structure
- Toute écriture en base passe par `$executeRaw SET LOCAL ark.current_user_id`
- Index `text_pattern_ops` sur `tag_values.path` — obligatoire pour les LIKE prefix, à inclure dans la migration Prisma via `@@index` avec `ops: raw("text_pattern_ops")`
- `DimensionTagInput` utilise `sx` prop exclusivement — pas de styled-components, pas de CSS modules
- Debounce 300ms sur les appels autocomplete — utiliser `useMemo` + `useCallback`, pas de librairie externe
- Toutes les strings visibles via `t('tags.*')` — clés ajoutées dans `fr.json` en même temps que les composants (F-02 RM-03)

**Structure de fichiers backend cible :**
```
src/tags/
├── tags.module.ts           // @Global(), exports: [TagService]
├── tags.controller.ts
├── tags.service.ts          // ⚠️ Manuel — resolveOrCreate, normalizePath, getAncestorPaths
├── tags.service.spec.ts
└── dto/
    ├── create-tag-dimension.dto.ts
    ├── update-tag-dimension.dto.ts
    ├── resolve-tag.dto.ts
    └── put-entity-tags.dto.ts
test/
└── tags.e2e-spec.ts
```

---

## 9. Commande OpenCode

> Utiliser uniquement pour les parties délégables (controller, DTOs, module wiring, migrations, DimensionTagInput). Le `TagService` est écrit manuellement **avant** de lancer OpenCode.

```
Contexte projet ARK :
- Stack : NestJS strict + Prisma + PostgreSQL 16 + React 18 + TypeScript strict + MUI v5
- Toute écriture en base : await prisma.$executeRaw`SET LOCAL ark.current_user_id = ${userId}`
- Structure modules : src/<domaine>/<domaine>.module.ts / .service.ts / .controller.ts
- PrismaModule global — ne pas réimporter
- JwtAuthGuard global — @Public() uniquement sur routes explicitement publiques
- Pattern de référence : module Domains (FS-02)
- MUI v5 — sx prop uniquement, pas de styled-components, variant="outlined" sur les inputs
- i18n : toutes les strings via t('key') — fichier src/i18n/locales/fr.json
- TagService (resolveOrCreate, normalizePath, getAncestorPaths) déjà écrit manuellement — NE PAS régénérer

Conventions F-999 :
- Format erreur : { statusCode, code, message, timestamp, path }
- Pagination : PaginationQueryDto sur toutes les routes de liste
- Requêtes raw : tagged template Prisma uniquement (jamais Prisma.raw() avec interpolation)

Implémente la feature "Dimension Tags Foundation" (F-03) — parties délégables uniquement :
1. Migration Prisma (tag_dimensions, tag_values, entity_tags) + index text_pattern_ops
2. TagsController + DTOs + TagsModule wiring (TagService déjà présent)
3. Seed des 3 dimensions de base (Geography, Brand, LegalEntity)
4. Composant DimensionTagInput (spec §6)
5. Tests Supertest nominaux (§7) — NE PAS générer les tests [Manuel]

Ne fais aucune hypothèse non documentée. Si un point est ambigu, pose une question avant de coder.

[COLLER LE CONTENU COMPLET DE CETTE SPEC ICI]
```

---

## 10. Checklist de Validation Avant Génération

- [ ] FS-01 `done` — `JwtAuthGuard`, `@RequirePermission()`, seed permissions disponibles
- [ ] F-02 `done` — `t()` disponible, `fr.json` existant
- [ ] `TagService` méthodes manuelles écrites et testées unitairement : `normalizePath`, `resolveOrCreate`, `getAncestorPaths`, `labelFromPath`
- [ ] Migration Prisma appliquée — tables `tag_dimensions`, `tag_values`, `entity_tags` présentes en base
- [ ] Index `text_pattern_ops` présent (vérifier via `\d tag_values` dans psql)
- [ ] Seed des 3 dimensions exécuté — `SELECT * FROM tag_dimensions` retourne 3 lignes
- [ ] `TagsModule` importé dans `AppModule`
- [ ] Clés `tags.*` ajoutées dans `fr.json`
- [ ] `DimensionTagInput` exporté depuis `src/components/tags/index.ts`
- [ ] Spec relue — aucune règle implicite non documentée

---

## 11. Revue de dette technique *(gate de fin de sprint — obligatoire)* ⚠️

> À remplir après implémentation, avant de clore le sprint.

### Gates TD

| # | Vérification | Commande / Action |
|---|---|---|
| TD-1 | Aucun `TODO / FIXME / HACK` non tracé | `git grep -n "TODO\|FIXME\|HACK" -- '*.ts' '*.tsx'` |
| TD-2 | Items F-999 activés par F-03 mis à jour | Relire F-999 §2 — ajouter Item migration `tags TEXT[]` |
| TD-3 | Checklist F-999 §4 cases cochées | F-999 §4 |
| TD-4 | AGENTS.md — pattern `TagService` (resolveOrCreate, DimensionTagInput) documenté | Relire AGENTS.md |
| TD-5 | ARK-NFR.md — aucun NFR impacté par F-03 (pas de breaking change) | Vérifier NFR-MAINT-004 (migrations) |
| TD-6 | Note de migration destructive (`DROP COLUMN tags`) ajoutée en F-999 | Créer nouvel item F-999 |

### Résultat de la revue

| Champ | Valeur |
|---|---|
| **Sprint** | *(à remplir)* |
| **Date de revue** | *(à remplir)* |
| **Items F-999 fermés** | *(à remplir)* |
| **Items F-999 ouverts** | *(à remplir)* |
| **Nouveaux items F-999 créés** | *(ex : Item XX — migration tags TEXT[] par FS-xx)* |
| **NFR mis à jour** | *(à remplir)* |
| **TODOs résiduels tracés** | *(à remplir)* |
| **Statut gates TD** | *(à remplir)* |

---

_Feature Spec F-03 v0.1 — Projet ARK — Document de travail, à valider avant démarrage_

> **Probabilité que ce modèle tienne jusqu'en production sans migration majeure : ~80%.** Principal risque résiduel : la décision P2 sur le renommage de path (cascade vs alias) peut forcer une modification de schéma si elle n'est pas anticipée. Documenter en F-999 dès maintenant.