# ARK — Feature Spec F-03 : Dimension Tags Foundation

_Version 0.5 — Mars 2026_

> **Changelog v0.5 :**
> - §6 `TagChipList` (vue liste) — **label** : le chip affiche maintenant le **path complet** (`niveau1/niveau2/niveau3`) au lieu du seul label court
> - §6 `TagChipList` — **suppression du Tooltip** : le path étant visible directement sur le chip, le tooltip devient redondant
> - §6 `TagChipList` — **badge "+N"** : remplacé par un chip gris cliquable `+ {{count}}` qui ouvre le drawer
> - §6 `TagChipList` (drawer) — affiche uniquement les **tags dédupliqués** avec leur path complet
> - §6 `TagChipList` — ajout de styles `textOverflow: 'ellipsis'` pour gérer les chemins longs
> - §7 Tests — mise à jour des assertions : label devient path, suppression tooltip, clic sur chip gris

> **Changelog v0.4 :**
> - §4 RM-11 — Déduplication par profondeur en lecture : par dimension, seul le tag le plus profond est affiché si un ancêtre et un descendant coexistent sur la même entité
> - §6 `TagChipList` — ajout fonction `deduplicateByDepth()` + règle appliquée avant rendu dans les deux modes (liste et drawer)
> - §6 `DimensionTagInput` — déduplication explicitement **non appliquée** en mode édition (l'utilisateur voit la réalité des données)
> - §7 Tests Jest (utilitaire) + Cypress (rendu dédupliqué) ajoutés

> **Changelog v0.3 :**
> - §6 Ajout composant `TagChipList` — rendu lecture seule pour vue liste (N chips + badge "+X") et Side Drawer
> - §6 Règles d'affichage : dimensions sans tags masquées, tooltip path complet sur chaque chip
> - §7 Tests Cypress enrichis : TagChipList (débordement, tooltip, drawer)
> - §8 Contraintes techniques : ajout règles TagChipList

> **Changelog v0.2 :**
> - §6 `DimensionTagInput` entièrement réécrit — rendu MUI Chip, comportements de validation détaillés (Entrée, Virgule, Tab, Blur, Escape, Backspace), option freeSolo "Créer X", états visuels exhaustifs
> - §7 Tests Cypress enrichis (comportements clavier, états visuels)
> - §8 Contraintes techniques : ajout règles MUI Chip/sx

> **Usage :** F-03 installe le moteur de tags dimensionnels d'ARK. C'est une spec de fondation : elle ne livre aucun écran utilisateur final, mais pose le `TagsModule` NestJS global, les migrations Prisma, et le composant `DimensionTagInput` réutilisé dans tous les modules CRUD suivants. **Ne pas commencer FS-02 sans F-03 terminé.**

> **Mode :** 🟡 Hybride — `TagService` (logique de path récursif, upsert ancêtres) écrit **manuellement**. Migrations Prisma et composant `DimensionTagInput` peuvent être générés via OpenCode à partir de cette spec.

---

## En-tête

| Champ         | Valeur                                                               |
| ------------- | -------------------------------------------------------------------- |
| **ID**        | F-03                                                                 |
| **Titre**     | Dimension Tags Foundation — moteur de tags hiérarchiques polymorphes |
| **Priorité**  | P1                                                                   |
| **Statut**    | `draft`                                                              |
| **Dépend de** | F-02 (i18n), FS-01 (Auth & RBAC)                                     |
| **Estimé**    | 1.5j                                                                 |
| **Version**   | 0.5                                                                  |
| **Mode**      | 🟡 Hybride Manuel / OpenCode — voir §8                              |

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


### 2.1 Schéma relationnel

```
┌─────────────────────────────────────────┐
│              tag_dimensions             │
├─────────────────────────────────────────┤
│ id           UUID        PK             │
│ name         VARCHAR(255) UNIQUE        │  ← case-insensitive à la création (RM-05)
│ description  TEXT        nullable       │
│ color        VARCHAR(7)  nullable       │  ← hex ex: "#2196F3"
│ icon         VARCHAR(50) nullable       │  ← nom icône lucide-react
│ multi_value  BOOLEAN     default true   │  ← non enforced en P1
│ entity_scope TEXT[]      default []     │  ← [] = toutes entités (non enforced P1)
│ sort_order   INT         default 0      │
│ created_at   TIMESTAMPTZ default now()  │
└──────────────────┬──────────────────────┘
                   │ 1
                   │
                   │ N
┌──────────────────▼──────────────────────┐
│               tag_values                │
├─────────────────────────────────────────┤
│ id            UUID       PK             │
│ dimension_id  UUID       FK → tag_dim.  │  ← CASCADE DELETE
│ path          VARCHAR(500)              │  ← "europe/france/paris" normalisé lowercase
│ label         VARCHAR(255)              │  ← "Paris" casse originale préservée
│ parent_id     UUID       FK → self null │  ← null si nœud racine
│ depth         SMALLINT   default 0      │  ← 0=racine, 1=enfant, etc.
│ created_at    TIMESTAMPTZ default now() │
├─────────────────────────────────────────┤
│ UNIQUE (dimension_id, path)             │
│ INDEX (dimension_id, path text_pattern) │  ← text_pattern_ops — LIKE prefix queries
└──────┬──────────────────┬───────────────┘
       │ self-ref 1:N     │ N
       │ parent/children  │
       └──────────────────┘
                   │ N
                   │
┌──────────────────▼──────────────────────┐
│               entity_tags               │
├─────────────────────────────────────────┤
│ entity_type   VARCHAR(50)               │  ← 'application' | 'it_component' | ...
│ entity_id     UUID                      │  ← ID de l'entité cible (pas de FK typée)
│ tag_value_id  UUID       FK → tag_values│  ← CASCADE DELETE
│ tagged_at     TIMESTAMPTZ default now() │
│ tagged_by     UUID       nullable       │  ← user_id, pas de FK contrainte P1
├─────────────────────────────────────────┤
│ PK (entity_type, entity_id, tag_value_id)│
│ INDEX (entity_type, entity_id)          │  ← lecture des tags d'une entité
│ INDEX (tag_value_id)                    │  ← lookup inverse : qui a ce tag ?
└─────────────────────────────────────────┘
```

```
tag_dimensions  ──1:N──  tag_values  ──1:N──  entity_tags

                              │

                         self-ref 1:N
                         (parent_id)

```

### 2.2 Modèle Prisma ⚠️

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
  // Préservé depuis l'input utilisateur (casse originale)
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
        Ne déclenche pas de requête si q.length < 2 (géré côté frontend).
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
                label:
                  type: string
                  description: Label avec casse originale (optionnel). Si absent, auto-généré depuis le dernier segment.
                  example: "Paris"
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
        dimensionColor:
          type: string
          nullable: true
          example: "#2196F3"
          description: Couleur hex de la dimension — incluse pour permettre le rendu coloré sans appel supplémentaire (TagChipList)
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

    # Note : TagValueResponse expose dimensionName — ajouter dimensionColor
    # pour permettre à TagChipList de colorer les chips sans appel supplémentaire
```

---

## 4. Règles Métier Critiques ⚠️

- **RM-01 — Normalisation du path :** Avant tout upsert ou lookup, le path est normalisé : `toLowerCase().trim()`, espaces internes remplacés par `-`, caractères interdits (`/` sauf séparateur, `\`, `"`, `'`, espaces de début/fin de segment) rejetés avec `400 BAD_REQUEST`. Chaque segment est trimé individuellement. Ex : `"Europe / France / Paris"` → `"europe/france/paris"`. Le `label` est cependant préservé avec sa casse originale pour l'affichage.
- **RM-02 — Création récursive des ancêtres :** Lors de l'upsert d'un path `a/b/c`, les nœuds `a` et `a/b` doivent exister avant `a/b/c`. Le `TagService.resolveOrCreate(dimensionId, path)` crée les ancêtres manquants dans l'ordre racine → feuille, via des upserts séquentiels. Chaque ancêtre a son propre `label` préservé depuis l'input utilisateur.
- **RM-03 — Héritage implicite (lecture seulement) :** L'héritage n'est pas matérialisé en base. On ne stocke que la feuille dans `entity_tags`. La couverture d'un nœud parent se calcule à la requête via `WHERE tv.path LIKE :prefix || '/%'`. Le `TagService` expose `getAncestorPaths(path): string[]` pour les cas où les ancêtres sont nécessaires.
- **RM-04 — PUT sémantique sur les tags d'entité :** `PUT /tags/entity/:type/:id` remplace **tous** les tags de la dimension indiquée pour cette entité — pas un merge. Si `tagValueIds = []`, tous les tags de la dimension sont supprimés. Les tags des autres dimensions sont inchangés.
- **RM-05 — Unicité dimension par nom :** Deux dimensions ne peuvent pas avoir le même `name` (case-insensitive à la création — la normalisation se fait en `name.trim()`). `409 CONFLICT` si doublon.
- **RM-06 — `TagsModule` global :** `TagsModule` est déclaré `@Global()` et exporte `TagService`. Tous les modules CRUD qui ont besoin de sauvegarder des tags importent `TagsModule` ou injectent `TagService` directement. Ne pas reimporter `PrismaModule`.
- **RM-07 — Seed des dimensions de base :** À l'issue de F-03, le seed Prisma contient les 3 dimensions initiales : `Geography` (color: `#2196F3`, icon: `public`), `Brand` (color: `#9C27B0`, icon: `label`), `LegalEntity` (color: `#FF9800`, icon: `account_balance`). Ces dimensions sont vides de valeurs — les valeurs sont créées à la volée par les utilisateurs.
- **RM-08 — Tags non bloquants à la suppression d'entité :** La suppression d'une entité (Application, etc.) déclenche un `DELETE FROM entity_tags WHERE entity_type = X AND entity_id = Y` en cascade. Les `TagValue` elles-mêmes ne sont pas supprimées — elles peuvent être orphelines. Le nettoyage des orphelins est une opération d'administration P2 (FS-21).
- **RM-09 — Logging des opérations tag :** TagService loggue les opérations critiques : création de dimension, résolution/création de tag, mise à jour des tags d'entité. Format : `{ method, userId, dimensionId, tagValueId, result }`. Logger : `private readonly logger = new Logger(TagService.name);`
- **RM-10 — Dimensions sans tags masquées en lecture :** Dans `TagChipList` (vue liste et Side Drawer), seules les dimensions ayant au moins un tag renseigné sur l'entité courante sont affichées. Le filtrage est côté frontend sur les données reçues — aucune logique backend dédiée.
- **RM-11 — Déduplication par profondeur en lecture :** Dans `TagChipList`, pour chaque dimension, si une entité possède à la fois un tag ancêtre et un tag descendant (ex : `europe/france` **et** `europe/france/paris`), seul le descendant le plus profond est affiché. La déduplication est **purement cosmétique** — `entity_tags` conserve tous les tags posés explicitement. Elle s'applique dans les deux contextes de `TagChipList` (liste et drawer). Elle n'est **pas appliquée** dans `DimensionTagInput` (mode édition) : l'utilisateur voit et gère la réalité des données.

> **Note (P2) :** En cas d'échec de création d'entité après que des tags ont été créés via `POST /tags/resolve`, les valeurs de tags créées peuvent devenir orphelines. Le cleanup sera géré dans FS-21.

> **Améliorations futures P2 :**
> - La contrainte `multiValue: false` n'est pas enforced côté backend en P1. FS-21 devra ajouter cette validation.
> - Le rate limiting sur les endpoints de tags sera implémenté dans FS-21 ou une tâche P2 dédiée.

---

## 5. Comportement attendu par cas d'usage

**Nominal — autocomplete et création à volée :**

> **Note performance :** L'autocomplete ne déclenche pas de requête si `q.length < 2`. Debounce 300ms côté frontend (voir §6). Limite par défaut : 20 résultats.

- Quand l'utilisateur sélectionne une valeur existante → `PUT /tags/entity/application/:id` est appelé avec le tagValueId
- Quand l'utilisateur tape `"europe/france/marseille"` et appuie Entrée → `POST /tags/resolve` est appelé → crée `europe`, `europe/france` (si manquants) et `europe/france/marseille` → retourne le TagValue feuille → `PUT /tags/entity/...` est appelé
- Quand l'utilisateur tape `"marseille"` (sans préfixe) dans la dimension Geography → path normalisé = `"marseille"`, label préservé = `"Marseille"`, depth = 0, pas d'ancêtre → valeur créée à la racine de la dimension

**Nominal — lecture avec héritage implicite :**

- Quand une requête filtre `Geography` = `"europe/france"` → retourne toutes les entités taggées avec un path commençant par `"europe/france"`
- Quand on récupère les tags d'une entité → retourne uniquement les feuilles stockées, pas les ancêtres déduits

**Erreurs :**

- Path avec caractère interdit (ex: `"france<paris>"`) → `400 BAD_REQUEST` + code `INVALID_TAG_PATH`
- Path vide ou uniquement slashes → `400 BAD_REQUEST` + code `INVALID_TAG_PATH`
- Dimension inexistante dans l'autocomplete → `404 NOT_FOUND`
- `PUT /tags/entity/...` avec un `tagValueId` appartenant à une autre dimension → `400 BAD_REQUEST` + code `TAG_DIMENSION_MISMATCH`

---

## 6. Composants Frontend ⚠️

### `DimensionTagInput`

Composant MUI Autocomplete + Chip réutilisable, consommé par tous les formulaires CRUD des entités P1.

#### Interface TypeScript

```typescript
interface DimensionTagInputProps {
  dimensionId: string           // UUID de la dimension
  dimensionName: string         // Affiché en label du champ
  dimensionColor: string        // Couleur hex de la dimension, ex: "#2196F3"
  entityType: string            // 'application' | 'it_component' | ...
  entityId?: string             // undefined en mode création (tags sauvegardés après POST entité)
  value: TagValueResponse[]     // tags actuellement sélectionnés
  onChange: (tags: TagValueResponse[]) => void
  disabled?: boolean
  multiple?: boolean            // default: true (respecte multiValue de la dimension)
}
```

#### Structure visuelle

```
┌─────────────────────────────────────────────────────────┐
│  🌍 Geography                                           │  ← label MUI (dimensionName)
├─────────────────────────────────────────────────────────┤
│  [Paris ×] [Lyon ×]  [saisie libre____________]  [⟳]  │  ← Chips + input inline + loader
└─────────────────────────────────────────────────────────┘
                     ↓ dropdown (dès q ≥ 2 chars)
              ┌──────────────────────────────────┐
              │  Paris                           │  ← label court
              │  europe/france/paris             │  ← path complet en caption
              │  Lyon                            │
              │  europe/france/lyon              │
              │  ➕ Créer "marseille"            │  ← option __isNew__ (freeSolo)
              └──────────────────────────────────┘
```

#### Implémentation MUI v5

```tsx
import { alpha } from '@mui/material/styles';
import Autocomplete, { createFilterOptions } from '@mui/material/Autocomplete';
import Chip from '@mui/material/Chip';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import AddIcon from '@mui/icons-material/Add';

// Type augmenté pour l'option freeSolo "Créer X"
type TagOption = TagValueResponse & { __isNew__?: boolean };

// filterOptions : injecte l'option "Créer X" si aucun match exact sur le path normalisé
const filter = createFilterOptions<TagOption>();

<Autocomplete<TagOption, true, false, true>
  multiple
  freeSolo
  options={suggestions}                    // TagOption[] depuis GET /tags/autocomplete
  value={selectedTags}                     // TagValueResponse[]
  inputValue={inputValue}                  // contrôlé
  loading={isLoading}
  disabled={disabled}
  onInputChange={(_e, newValue, reason) => {
    if (reason === 'input') {
      setInputValue(newValue);
      // debounce 300ms → appel GET /tags/autocomplete si newValue.length >= 2
    }
    if (reason === 'reset') setInputValue('');
  }}
  onChange={(_e, newValue, reason) => {
    // newValue est TagOption[] | string[] (freeSolo)
    handleChange(newValue, reason);
  }}
  getOptionLabel={(opt) =>
    typeof opt === 'string' ? opt : opt.label
  }
  isOptionEqualToValue={(opt, val) => opt.id === val.id}
  filterOptions={(options, params) => {
    const filtered = filter(options, params);
    const inputTrimmed = params.inputValue.trim();
    const normalizedInput = normalizePath(inputTrimmed);
    const hasExactMatch = options.some(o => o.path === normalizedInput);
    // Injecter "Créer X" si : input non vide + aucun match exact
    if (inputTrimmed.length >= 1 && !hasExactMatch) {
      filtered.push({
        __isNew__: true,
        id: '__new__',
        dimensionId,
        dimensionName,
        path: normalizedInput,
        label: inputTrimmed,   // casse originale préservée pour le label
        depth: 0,
        parentId: null,
      } as TagOption);
    }
    return filtered;
  }}
  renderTags={(value, getTagProps) =>
    value.map((tag, index) => (
      <Tooltip
        key={tag.id}
        title={t('tags.tooltip.fullPath', { path: tag.path })}
        placement="top"
        arrow
      >
        <Chip
          label={tag.label}
          {...getTagProps({ index })}
          size="small"
          sx={{
            bgcolor: alpha(dimensionColor, 0.12),
            color: dimensionColor,
            border: `1px solid ${alpha(dimensionColor, 0.3)}`,
            fontWeight: 500,
            height: 24,
            '& .MuiChip-label': { px: 1 },
            '& .MuiChip-deleteIcon': {
              color: alpha(dimensionColor, 0.5),
              fontSize: 14,
              '&:hover': { color: dimensionColor },
            },
          }}
        />
      </Tooltip>
    ))
  }
  renderInput={(params) => (
    <TextField
      {...params}
      variant="outlined"
      size="small"
      label={dimensionName}
      placeholder={selectedTags.length === 0 ? t('tags.autocomplete.placeholder') : ''}
      onKeyDown={(e) => {
        // Virgule → valide le tag en cours (même comportement qu'Entrée)
        if (e.key === ',') {
          e.preventDefault();
          validateAndAddCurrentInput();
        }
        // Escape → vide l'input sans créer de tag
        if (e.key === 'Escape') {
          e.stopPropagation();
          setInputValue('');
        }
        // Backspace sur input vide → supprime le dernier chip (comportement MUI natif)
        // Tab → géré nativement par Autocomplete freeSolo
      }}
      InputProps={{
        ...params.InputProps,
        endAdornment: (
          <>
            {isLoading && <CircularProgress size={16} sx={{ mr: 1 }} />}
            {params.InputProps.endAdornment}
          </>
        ),
      }}
    />
  )}
  renderOption={(props, option) => (
    <li {...props} key={option.__isNew__ ? '__new__' : option.id}>
      {option.__isNew__ ? (
        // Option "Créer X" — toujours en bas de liste
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AddIcon fontSize="small" sx={{ color: 'text.secondary' }} />
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {t('tags.autocomplete.createOption', { value: option.label })}
          </Typography>
        </Box>
      ) : (
        // Option existante — label + path en caption
        <Box sx={{ display: 'flex', flexDirection: 'column', py: 0.25 }}>
          <Typography variant="body2">{option.label}</Typography>
          {option.depth > 0 && (
            <Typography variant="caption" sx={{ color: 'text.secondary', lineHeight: 1.2 }}>
              {option.path}
            </Typography>
          )}
        </Box>
      )}
    </li>
  )}
  noOptionsText={
    inputValue.length < 2
      ? t('tags.autocomplete.typeToSearch')
      : t('tags.autocomplete.noOptions')
  }
  loadingText={t('tags.autocomplete.loading')}
  sx={{ width: '100%' }}
/>
```

#### Flux de validation d'un tag libre

```
User tape "marseille" + presse Entrée (ou Virgule, ou Tab, ou blur)
       │
       ▼
normalizePath("marseille") → "marseille"
label extrait : "marseille" → capitalize → "Marseille" (casse préservée depuis input)
       │
       ▼
POST /tags/resolve { dimensionId, path: "marseille", label: "Marseille" }
       │
  ┌────┴────┐
  │ 200 OK  │ → TagValueResponse { id, path: "marseille", label: "Marseille", ... }
  └────┬────┘
       │
Ajout dans selectedTags → re-render chip "Marseille"
       │
PUT /tags/entity/:entityType/:entityId { dimensionId, tagValueIds: [...existants, newId] }
  (mode édition uniquement — différé en mode création jusqu'au POST de l'entité parente)
```

#### Tableau des comportements de validation

| Geste utilisateur | Action attendue |
|---|---|
| **Entrée** sur une suggestion existante | Ajoute le tag existant · ferme dropdown |
| **Entrée** sur "Créer X" (option __isNew__) | `POST /tags/resolve` → chip créé |
| **Entrée** sur input libre (aucun dropdown visible) | `POST /tags/resolve` → chip créé |
| **Virgule** (`,`) | Identique à Entrée — valide et remet input à vide |
| **Tab** | Identique à Entrée (comportement natif freeSolo MUI) |
| **Blur** avec valeur non vide | Identique à Entrée |
| **Escape** | Vide l'input · ferme dropdown · **aucun tag créé** |
| **Backspace** sur input vide | Supprime le dernier chip (natif MUI Autocomplete) |
| **Clic ×** sur un chip | Supprime ce tag · `PUT /tags/entity/...` mis à jour |

#### États visuels

```
── Repos (tags présents, champ inactif) ──────────────────────────────────
  [Paris ×] [Lyon ×]                     champ grisé, placeholder caché

── Focus (click dans le champ) ───────────────────────────────────────────
  [Paris ×] [Lyon ×] [|_____________]    curseur actif, placeholder visible

── Chargement autocomplete ───────────────────────────────────────────────
  [Paris ×] [Lyon ×] [franc|_______] ⟳  CircularProgress size=16 dans endAdornment

── Résultats dropdown ────────────────────────────────────────────────────
  [Paris ×] [Lyon ×] [franc|_______]
  ┌────────────────────────────────┐
  │ france                        │
  │ europe/france                 │  ← caption grisé si depth > 0
  │ Bordeaux                      │
  │ europe/france/bordeaux        │
  │ ➕ Créer "france-test"        │  ← option __isNew__ si input sans match exact
  └────────────────────────────────┘

── Erreur de création ────────────────────────────────────────────────────
  [Paris ×] [Lyon ×]
  ⚠ Erreur lors de la sauvegarde du tag   ← helper text rouge sous le champ

── Path invalide (400) ───────────────────────────────────────────────────
  [Paris ×] [Lyon ×]
  ⚠ Valeur de tag invalide                ← helper text rouge sous le champ

── Disabled (lecture seule) ──────────────────────────────────────────────
  [Paris] [Lyon]                          chips sans ×, champ grisé non cliquable
```

#### Gestion de l'état local (mode création vs édition)

```typescript
// Mode création (entityId absent) :
// - selectedTags stockés dans state local
// - PUT /tags/entity/... appelé APRÈS le POST de l'entité parente (dans le handler onSubmit du formulaire hôte)
// - Le formulaire hôte passe entityId après création pour déclencher la sauvegarde

// Mode édition (entityId présent) :
// - Chaque onChange déclenche immédiatement PUT /tags/entity/...
// - Pas de bouton Save séparé pour les tags
// - En cas d'erreur PUT → afficher helper text + rollback visuel du state local
```

---

### `TagChipList`

Composant de rendu **lecture seule** des tags d'une entité. Utilisé dans deux contextes :
- **Vue liste (tableau)** : colonne "Tags" — N premiers chips avec path complet + badge "+X" cliquable si débordement
- **Side Drawer** : section tags — tous les chips affichés (dédupliqués), édition réservée à la Full Page

#### Interface TypeScript

```typescript
interface TagChipListProps {
  tags: TagValueResponse[]     // tags de l'entité (toutes dimensions confondues)
  maxVisible?: number          // nb max de chips avant badge "+X" — default: 3 (liste), undefined (drawer)
  deduplicate?: boolean        // default: true — applique deduplicateByDepth()
  showMoreButton?: boolean     // default: true (liste), false (drawer) — affiche le chip "+X"
  size?: 'small' | 'medium'   // default: 'small'
}
```

#### Règle d'affichage — dimensions sans tags masquées

> **Décision RM-10 :** Seules les dimensions ayant au moins un tag renseigné sur l'entité sont affichées. Une dimension vide n'occupe pas d'espace dans la liste ni dans le drawer. Ce filtrage est côté frontend, sur les `tags` reçus — aucun endpoint dédié.

#### Affichage du path complet sur les chips

Conformément à l'US utilisateur, chaque chip affiche le **chemin complet** (`tag.path`) au lieu du seul label. Exemple :
- Avant : chip `[Paris]` avec tooltip "europe/france/paris"
- Après : chip `[europe/france/paris]` directement visible

Les chemins longs sont tronqués avec `...` via `textOverflow: 'ellipsis'`.

#### Comportement — vue liste (maxVisible défini)

```
Entité avec 5 tags dédupliqués : [europe/france/paris] [brand/acme] [legal/sas] [tech/cloud] [status/active]
maxVisible = 3

Rendu :
  [europe/france/paris] [brand/acme] [legal/sas]  + 2
                                                      ↑
                                               Chip gris cliquable
                                               ouvre le drawer
```

```tsx
// Logique de débordement — APRÈS déduplication
const processedTags = deduplicate ? deduplicateByDepth(tags) : tags;
const visible = processedTags.slice(0, maxVisible);
const hiddenCount = processedTags.length - maxVisible;

// Badge "+X" — chip gris cliquable
{hiddenCount > 0 && showMoreButton && (
  <Chip
    label={t('tags.showAllChip', { count: hiddenCount })}  // "+ 2"
    size={size}
    onClick={handleOpenDrawer}
    sx={{
      backgroundColor: '#9e9e9e',
      color: '#fff',
      cursor: 'pointer',
      fontSize: size === 'small' ? '0.75rem' : '0.875rem',
      '&:hover': {
        backgroundColor: '#757575',
      },
    }}
  />
)}
```

#### Comportement — Side Drawer (maxVisible absent)

Tous les tags **dédupliqués** sont affichés, regroupés par dimension. Chaque groupe affiche le nom de la dimension en label.

```
┌─────────────────────────────────────────┐
│  Tags                              [X]  │
│                                         │
│  🌍 GEOGRAPHY                           │  ← nom dimension (Typography subtitle2)
│  [europe/france/paris]                  │  ← chip avec path complet
│                                         │
│  🏷 BRAND                               │
│  [brand/acme-corp]                      │
│                                         │
│  _(LegalEntity vide → non affiché)_     │
└─────────────────────────────────────────┘
```

```tsx
// Tags dédupliqués avant affichage
const processedTags = deduplicateByDepth(tags);
const groupedByDimension = groupByDimension(processedTags);

// Rendu par groupe
Object.values(groupedByDimension).map(group => (
  <Box key={group.name} sx={{ mb: 3 }}>
    <Typography
      variant="subtitle2"
      sx={{
        color: 'text.secondary',
        textTransform: 'uppercase',
        fontSize: '0.75rem',
        fontWeight: 600,
        mb: 1,
      }}
    >
      {group.name}
    </Typography>
    <List dense disablePadding>
      {group.tags.map(tag => (
        <ListItem key={tag.id} disablePadding sx={{ py: 0.5 }}>
          <Chip
            label={tag.path}  // ← path complet, pas label
            size="small"
            sx={{
              backgroundColor: tag.dimensionColor || '#757575',
              color: '#fff',
              maxWidth: '100%',
              '& .MuiChip-label': {
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              },
            }}
          />
        </ListItem>
      ))}
    </List>
  </Box>
))
```

#### Déduplication par profondeur (RM-11)

Avant tout rendu, `TagChipList` applique `deduplicateByDepth()` sur les tags. Seul le tag le plus profond par dimension est conservé.

```typescript
// src/components/tags/DimensionTagInput.utils.ts

/**
 * Pour un tableau de tags, conserve uniquement le tag avec la profondeur maximale
 * par dimension. Ex : [europe, europe/france, europe/france/paris, lyon]
 *   → [europe/france/paris, lyon] (Paris depth=2 > France depth=1 > Europe depth=0)
 */
export function deduplicateByDepth(tags: TagValueResponse[]): TagValueResponse[] {
  if (!tags || tags.length === 0) {
    return [];
  }

  const dimensionMap = new Map<string, TagValueResponse>();

  for (const tag of tags) {
    const existing = dimensionMap.get(tag.dimensionId);
    
    if (!existing || tag.depth > existing.depth) {
      dimensionMap.set(tag.dimensionId, tag);
    }
  }

  return Array.from(dimensionMap.values());
}
```

Cette fonction est appelée **avant** tout calcul de débordement (`maxVisible`) — l'indicateur "+N" reflète le nombre de tags **après déduplication**.

#### Résumé des deux contextes

| Contexte | `maxVisible` | `deduplicate` | Chip affiche | Édition inline |
|---|---|---|---|---|
| **Colonne liste** | 3 (défaut) | true | `tag.path` (tronqué si long) | ❌ Non |
| **Side Drawer** | undefined | true | `tag.path` complet | ❌ Non — Full Page uniquement |

#### Structure de fichiers

```
frontend/src/
└── components/
    └── tags/
        ├── DimensionTagInput.tsx
        ├── DimensionTagInput.types.ts
        ├── DimensionTagInput.utils.ts    // + deduplicateByDepth(), groupByDimension()
        ├── TagChipList.tsx                 // lecture seule — liste + drawer
        └── index.ts
```

#### Clés i18n à ajouter dans `fr.json`

```json
"tags": {
  "autocomplete": {
    "placeholder": "Ajouter un tag...",
    "typeToSearch": "Tapez au moins 2 caractères",
    "noOptions": "Aucun résultat",
    "createOption": "Créer \"{{value}}\"",
    "loading": "Chargement..."
  },
  "tooltip": {
    "fullPath": "Chemin complet : {{path}}"  // conservé pour DimensionTagInput
  },
  "drawer": {
    "title": "Tous les tags"
  },
  "showAllChip": "+ {{count}}",  // nouveau : badge "+ 2"
  "errors": {
    "invalidPath": "Valeur de tag invalide",
    "saveFailed": "Erreur lors de la sauvegarde du tag"
  }
}
```

---

## 7. Tests ⚠️

### Outil par niveau

| Niveau             | Outil                | Fichier cible                   | Délégable à OpenCode                |
| ------------------ | -------------------- | ------------------------------- | ----------------------------------- |
| Unit (TagService)  | **Jest**             | `src/tags/tags.service.spec.ts` | ⚠️ Partiel — logique path manuelle |
| API / contrat HTTP | **Jest + Supertest** | `test/tags.e2e-spec.ts`         | ✅ Oui                              |
| Sécurité / RBAC    | **Jest + Supertest** | `test/tags.e2e-spec.ts`         | ❌ **Manuel**                       |
| E2E browser (UI)   | **Cypress**          | `cypress/e2e/tags.cy.ts`        | ✅ Oui (nominaux)                   |

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
- [ ] `[Jest]` `resolveOrCreate('geography', 'europe/france/paris', 'Paris')` → crée avec label 'Paris' (casse préservée)
- [ ] `[Jest]` `resolveOrCreate('geography', 'europe', 'Europe')` → label 'Europe' préservé

### Tests Jest — Unit (deduplicateByDepth)

- [ ] `[Jest]` `deduplicateByDepth([europe, europe/france, europe/france/paris, lyon])` → `[europe/france/paris, lyon]`
- [ ] `[Jest]` `deduplicateByDepth([europe/france, europe/france/paris])` → `[europe/france/paris]`
- [ ] `[Jest]` `deduplicateByDepth([europe/france/paris])` → `[europe/france/paris]` (seul élément, inchangé)
- [ ] `[Jest]` `deduplicateByDepth([europe, lyon])` → `[europe, lyon]` (aucun ancêtre/descendant — inchangé)
- [ ] `[Jest]` `deduplicateByDepth([])` → `[]`
- [ ] `[Jest]` `deduplicateByDepth([europe/france, europe/france2])` → `[europe/france, europe/france2]` (pas de relation ancêtre — inchangé, `startsWith('europe/france/')` ne matche pas `europe/france2`)

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

**Rendu des chips :**
- [ ] `[Cypress]` Saisie d'une valeur existante + sélection → chip affiché avec label court (casse originale)
- [ ] `[Cypress]` Chip affiché avec couleur de fond issue de `dimensionColor` (alpha 12%)
- [ ] `[Cypress]` Survol chip → Tooltip MUI affiche le path complet
- [ ] `[Cypress]` Clic × sur chip → chip retiré, PUT /tags/entity/... appelé

**Création freeSolo :**
- [ ] `[Cypress]` Saisie d'une valeur inexistante + Entrée → `POST /tags/resolve` appelé → chip créé
- [ ] `[Cypress]` Saisie d'une valeur inexistante + Virgule → même résultat qu'Entrée
- [ ] `[Cypress]` Saisie d'une valeur inexistante + Tab → même résultat qu'Entrée
- [ ] `[Cypress]` Option "Créer X" apparaît dans le dropdown si aucun match exact
- [ ] `[Cypress]` Clic sur "Créer X" → chip créé

**Comportements clavier :**
- [ ] `[Cypress]` Escape sur input avec texte en cours → input vidé, aucun tag créé, dropdown fermé
- [ ] `[Cypress]` Backspace sur input vide → dernier chip supprimé
- [ ] `[Cypress]` Path invalide (ex: `france<>`) → helper text rouge affiché, aucun chip créé

**Autocomplete :**
- [ ] `[Cypress]` Saisie < 2 chars → aucun appel réseau, message "Tapez au moins 2 caractères"
- [ ] `[Cypress]` Saisie ≥ 2 chars → appel GET /tags/autocomplete avec debounce 300ms
- [ ] `[Cypress]` Pendant chargement → CircularProgress visible dans le champ

**Mode création (entityId absent) :**
- [ ] `[Cypress]` Tags sélectionnés sans entityId → stockés en state local, pas de PUT immédiat
- [ ] `[Cypress]` Après submit du formulaire hôte → PUT /tags/entity/... appelé avec les tags accumulés

**Disabled :**
- [ ] `[Cypress]` `disabled=true` → chips sans icône ×, input non interactif

**TagChipList — vue liste (maxVisible=3) :**
- [ ] `[Cypress]` Entité avec ≤ 3 tags dédupliqués → tous les chips affichés avec leur path, pas de badge "+X"
- [ ] `[Cypress]` Entité avec 5 tags dédupliqués → 3 chips (path complet) + badge "+ 2" affiché
- [ ] `[Cypress]` Clic sur badge "+ 2" → ouvre le drawer avec tous les tags dédupliqués
- [ ] `[Cypress]` Path long tronqué avec "..." dans le chip (style ellipsis appliqué)
- [ ] `[Cypress]` Entité sans tag → cellule vide (aucun chip, aucun badge)
- [ ] `[Cypress]` Chips non cliquables (cursor: default) — aucune navigation au clic
- [ ] `[Cypress]` Pas de tooltip sur les chips (path déjà visible)

**TagChipList — Side Drawer :**
- [ ] `[Cypress]` Section "Tags" absente si entité sans tag renseigné
- [ ] `[Cypress]` Section "Tags" visible si ≥ 1 tag renseigné
- [ ] `[Cypress]` Dimension sans tags après déduplication → non affichée
- [ ] `[Cypress]` Regroupement visible : nom dimension en subtitle2 uppercase
- [ ] `[Cypress]` Chips affichent le path complet (pas seulement le label)
- [ ] `[Cypress]` Chips sans icône × (lecture seule)
- [ ] `[Cypress]` Pas de tooltip sur les chips du drawer

**TagChipList — déduplication RM-11 :**
- [ ] `[Cypress]` Entité avec `europe/france` (depth=1) et `europe/france/paris` (depth=2) → seul chip "europe/france/paris" affiché dans liste et drawer
- [ ] `[Cypress]` Badge "+N" calculé après déduplication (ex: 8 tags bruts, 5 après déduplication, maxVisible=3 → affiche "+ 2")
- [ ] `[Cypress]` Entité avec `europe/france/paris` seul → chip "europe/france/paris" affiché
- [ ] `[Cypress]` Entité avec `europe` (depth=0) et `lyon` (depth=0, autre dimension) → deux chips affichés
- [ ] `[Cypress]` `DimensionTagInput` (Full Page) avec `europe/france` et `europe/france/paris` → les **deux** chips affichés (déduplication non appliquée en mode édition)

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
- **MUI v5 exclusivement** — `sx` prop uniquement, pas de `styled-components`, pas de CSS modules
- **`Chip` MUI** pour tous les tags sélectionnés — couleur via `tag.dimensionColor` directement (backgroundColor plein, pas alpha)
- **`Tooltip` MUI** wrappant chaque `Chip` — path complet au survol **uniquement pour DimensionTagInput**
- **`TagChipList`** — chips avec `cursor: 'default'`, sans `onDelete`, sans `onClick`, **sans Tooltip** — lecture seule stricte avec path visible directement
- **`TagChipList`** — appliquer `deduplicateByDepth()` avant calcul du débordement ; **ne pas** l'appliquer dans `DimensionTagInput`
- **`deduplicateByDepth()`** — dans `DimensionTagInput.utils.ts` ; algorithme : conserve le tag avec `depth` maximal par `dimensionId`
- **`TagChipList` liste** — `maxVisible` default 3, badge "+X" via `Chip` gris cliquable (`backgroundColor: '#9e9e9e'`) qui ouvre le drawer
- **`TagChipList` drawer** — regroupement par `dimensionId`, nom dimension en `Typography variant="subtitle2"` uppercase, chips avec `textOverflow: 'ellipsis'`
- **`TagValueResponse`** doit inclure `dimensionColor` — le backend le peuple depuis `tag_dimensions.color` au moment du join. Sans ce champ, `TagChipList` ne peut pas colorer les chips sans appel supplémentaire.
- **`Autocomplete` MUI v5** avec `multiple`, `freeSolo`, `filterOptions` pour l'option `__isNew__`
- **`CircularProgress`** size=16 dans `endAdornment` pendant le chargement autocomplete — pas de spinner externe
- Debounce 300ms sur les appels autocomplete — utiliser `useMemo` + `useCallback`, pas de librairie externe
- Clé `__isNew__` dans les options freeSolo pour distinguer "Créer X" des valeurs existantes
- L'option "Créer X" n'apparaît que si : input non vide + aucun match exact sur le path normalisé
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

**Structure de fichiers frontend cible :**

```
frontend/src/
└── components/
    └── tags/
        ├── DimensionTagInput.tsx          // édition — Autocomplete + Chips
        ├── DimensionTagInput.types.ts     // TagOption, DimensionTagInputProps
        ├── DimensionTagInput.utils.ts     // normalizePath front, validateAndAddCurrentInput
        ├── TagChipList.tsx                // lecture seule — liste + drawer
        └── index.ts                       // export { DimensionTagInput, TagChipList }
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
- MUI Chip avec alpha(color, 0.12) pour fond coloré — import alpha depuis @mui/material/styles
- MUI Autocomplete avec multiple + freeSolo + filterOptions(__isNew__) — voir spec §6
- MUI Tooltip wrappant chaque Chip — path complet en title
- CircularProgress size=16 dans endAdornment pendant loading autocomplete
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
4. Composant `DimensionTagInput` (spec §6) — respecter EXACTEMENT le tableau des comportements clavier et les états visuels
5. Composant `TagChipList` (spec §6) — deux modes : liste (maxVisible=3, chip "+X" gris cliquable ouvrant drawer, path complet sur chips) et drawer (regroupement par dimension avec tags dédupliqués, nom dimension en subtitle2 uppercase)
6. `TagValueResponse` doit inclure `dimensionColor` — à peupler via join sur `tag_dimensions` dans le service
7. Tests Supertest nominaux (§7) — NE PAS générer les tests [Manuel]

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
- [ ] Clés `tags.*` ajoutées dans `fr.json` (incluant `typeToSearch`)
- [ ] `DimensionTagInput` exporté depuis `src/components/tags/index.ts`
- [ ] `TagChipList` exporté depuis `src/components/tags/index.ts`
- [ ] `TagValueResponse` inclut `dimensionColor` — vérifier que le backend peuple le champ depuis le join `tag_dimensions`
- [ ] Vérifier que `alpha` est importé depuis `@mui/material/styles` (MUI v5) et non depuis `@mui/system`
- [ ] Spec relue — aucune règle implicite non documentée

---

## 11. Revue de dette technique *(gate de fin de sprint — obligatoire)* ⚠️

> À remplir après implémentation, avant de clore le sprint.

### Gates TD

| #    | Vérification                                                                    | Commande / Action                                      |
| ---- | ------------------------------------------------------------------------------- | ------------------------------------------------------ |
| TD-1 | Aucun `TODO / FIXME / HACK` non tracé                                           | `git grep -n "TODO\|FIXME\|HACK"` → relire chaque occurrence |
| TD-2 | Items F-999 activés par F-03 mis à jour                                         | Relire F-999 §2 — ajouter Item migration `tags TEXT[]` |
| TD-3 | Checklist F-999 §4 cases cochées                                                | F-999 §4                                               |
| TD-4 | AGENTS.md — pattern `TagService` (resolveOrCreate, DimensionTagInput) documenté | Relire AGENTS.md                                       |
| TD-5 | ARK-NFR.md — aucun NFR impacté par F-03 (pas de breaking change)                | Vérifier NFR-MAINT-004 (migrations)                    |
| TD-6 | Note de migration destructive (`DROP COLUMN tags`) ajoutée en F-999             | Créer nouvel item F-999                                |

### Résultat de la revue

| Champ                          | Valeur                                             |
| ------------------------------ | -------------------------------------------------- |
| **Sprint**                     | *(à remplir)*                                      |
| **Date de revue**              | *(à remplir)*                                      |
| **Items F-999 fermés**         | *(à remplir)*                                      |
| **Items F-999 ouverts**        | *(à remplir)*                                      |
| **Nouveaux items F-999 créés** | *(ex : Item XX — migration tags TEXT[] par FS-xx)* |
| **NFR mis à jour**             | *(à remplir)*                                      |
| **TODOs résiduels tracés**     | *(à remplir)*                                      |
| **Statut gates TD**            | *(à remplir)*                                      |

---

_Feature Spec F-03 v0.2 — Projet ARK — Document de travail, à valider avant démarrage_

> **Probabilité que ce modèle tienne jusqu'en production sans migration majeure : ~80%.** Principal risque résiduel : la décision P2 sur le renommage de path (cascade vs alias) peut forcer une modification de schéma si elle n'est pas anticipée. Documenter en F-999 dès maintenant.
---
