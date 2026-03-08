# ARK — Feature Spec FS-21 : Tag Dimensions Administration

_Version 0.2 — Mars 2026_

> **Changelog v0.2 :** Ajout décision bloquante sur le choix de librairie drag-and-drop (§8, §10) — gate obligatoire avant génération OpenCode. Deux options documentées avec leurs implications architecturales.

> **Usage :** FS-21 est la feature d'administration P2 du moteur de tags posé par F-03. Elle livre l'écran de gouvernance des dimensions et de leurs valeurs : renommage, fusion, réordonnancement, suppression des orphelins. **Ne peut être implémentée qu'après F-03 `done` et au moins une FS-xx consommatrice de tags en production** (données réelles nécessaires pour valider les opérations de fusion).

---

## En-tête

| Champ | Valeur |
|---|---|
| **ID** | FS-21 |
| **Titre** | Tag Dimensions Administration — gouvernance P2 des dimensions et valeurs |
| **Priorité** | P2 |
| **Statut** | `draft` |
| **Dépend de** | F-03, FS-01, F-02, FS-06 (au moins une entité consommatrice de tags en prod) |
| **Estimé** | 2.5j |
| **Version** | 0.2 |

---

## 1. Objectif & Périmètre ⚠️

**Ce que cette feature fait :**

FS-21 livre l'écran d'administration (`/admin/tags`) permettant à un Admin de gouverner le référentiel de tags créé librement par les utilisateurs depuis F-03. Les opérations couvertes sont : renommer une valeur de tag (avec propagation sur tous les paths descendants), fusionner deux valeurs synonymes (réaffecte les `entity_tags`), réordonner les dimensions dans la sidebar, supprimer les valeurs orphelines (sans entité associée), et créer/modifier/supprimer des dimensions. Une décision de modélisation clé est tranchée dans cette spec : le renommage utilise la stratégie **cascade sur le path** (pas d'alias) avec une protection contre les ambiguïtés de segment.

**Ce qu'elle ne fait pas (hors périmètre) :**

- Pas de gestion des droits par dimension (P3)
- Pas d'import/export CSV des valeurs de tags
- Pas de versionnement ou historique de renommage (les audit_trail triggers couvrent la traçabilité bas niveau)
- Pas de validation `entity_scope` en UI — le champ est éditables mais sans enforcement backend (différé P3)
- Pas de suggestions automatiques de fusion (détection de doublons par similarité) — opération manuelle uniquement

---

## 2. Modèle Prisma ⚠️

> FS-21 n'ajoute pas de nouvelles tables. Elle consomme et modifie les tables de F-03.
> Une colonne `sort_order` est ajoutée sur `tag_values` pour le réordonnancement des nœuds frères.

```prisma
// Modification de TagValue — ajout sort_order
model TagValue {
  id          String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  dimensionId String   @map("dimension_id") @db.Uuid
  path        String   @db.VarChar(500)
  label       String   @db.VarChar(255)
  parentId    String?  @map("parent_id") @db.Uuid
  depth       Int      @default(0) @db.SmallInt
  sortOrder   Int      @default(0) @map("sort_order")  // ← NOUVEAU — ordre parmi les frères
  createdAt   DateTime @default(now()) @map("created_at") @db.Timestamptz

  dimension  TagDimension @relation(fields: [dimensionId], references: [id], onDelete: Cascade)
  parent     TagValue?    @relation("TagValueHierarchy", fields: [parentId], references: [id])
  children   TagValue[]   @relation("TagValueHierarchy")
  entityTags EntityTag[]

  @@unique([dimensionId, path])
  @@index([dimensionId, path(ops: raw("text_pattern_ops"))], name: "idx_tag_values_path_prefix")
  @@map("tag_values")
}

// TagDimension — sortOrder déjà présent en F-03, pas de modification
```

> **Migration :** `ALTER TABLE tag_values ADD COLUMN sort_order INTEGER NOT NULL DEFAULT 0;` — non destructive.

---

## 3. Contrat API (OpenAPI) ⚠️

```yaml
paths:

  # --- DIMENSIONS ---

  /tag-dimensions:
    # GET et POST déjà définis en F-03 — inchangés

  /tag-dimensions/{id}:
    patch:
      summary: Modifier une dimension (Admin) — étendu P2
      description: |
        P2 étend le PATCH F-03 : name et entityScope sont maintenant modifiables.
        Le renommage de dimension ne propage pas sur les paths (le name est indépendant des paths).
      tags: [TagAdmin]
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
              $ref: '#/components/schemas/UpdateTagDimensionFullDto'
      responses:
        '200':
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/TagDimensionResponse'
        '409':
          description: Nom de dimension déjà utilisé

    delete:
      summary: Supprimer une dimension (Admin)
      description: |
        Bloqué si des entity_tags existent pour des valeurs de cette dimension.
        Supprime en cascade les tag_values orphelines (sans entity_tags).
      tags: [TagAdmin]
      security:
        - bearerAuth: []
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
            format: uuid
      responses:
        '204':
          description: Dimension supprimée
        '409':
          description: Dimension utilisée par des entités — suppression bloquée

  /tag-dimensions/reorder:
    patch:
      summary: Réordonner les dimensions (Admin)
      tags: [TagAdmin]
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [orderedIds]
              properties:
                orderedIds:
                  type: array
                  items:
                    type: string
                    format: uuid
                  description: IDs des dimensions dans le nouvel ordre souhaité
      responses:
        '200':
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/TagDimensionResponse'

  # --- VALEURS DE TAGS ---

  /tag-values/{id}:
    patch:
      summary: Renommer une valeur de tag (Admin)
      description: |
        Renomme le segment FEUILLE d'un path.
        Propage le changement sur tous les paths descendants.
        Stratégie : remplacement de segment exact dans le path — protégé contre les ambiguïtés.
        Ex: renommer "france" → "fr" sur path "europe/france" renomme aussi
        "europe/france/paris" → "europe/fr/paris" MAIS ne touche pas
        un hypothétique "south-france/bordeaux" (segment exact, pas substring).
      tags: [TagAdmin]
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
              type: object
              required: [newSegment]
              properties:
                newSegment:
                  type: string
                  maxLength: 255
                  description: Nouveau nom du segment feuille (normalisé comme un path)
                  example: "fr"
      responses:
        '200':
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/TagValueRenameResultResponse'
        '409':
          description: Le nouveau path résultant existe déjà dans la dimension

    delete:
      summary: Supprimer une valeur de tag (Admin)
      description: |
        Bloqué si des entity_tags référencent cette valeur OU ses descendants.
        Supprime en cascade les descendants orphelins (sans entity_tags) si force=true.
      tags: [TagAdmin]
      security:
        - bearerAuth: []
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
            format: uuid
        - name: force
          in: query
          required: false
          schema:
            type: boolean
            default: false
          description: Si true, supprime les descendants orphelins. Bloqué si des descendants ont des entity_tags.
      responses:
        '204':
          description: Valeur supprimée
        '409':
          description: Valeur utilisée par des entités — suppression bloquée

  /tag-values/merge:
    post:
      summary: Fusionner deux valeurs de tags (Admin)
      description: |
        Fusionne source → target : tous les entity_tags pointant vers source
        sont redirigés vers target. La valeur source est ensuite supprimée.
        Les deux valeurs doivent appartenir à la même dimension.
        Les doublons entity_tags (même entité déjà taggée avec target) sont ignorés silencieusement.
      tags: [TagAdmin]
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [sourceId, targetId]
              properties:
                sourceId:
                  type: string
                  format: uuid
                  description: TagValue à supprimer après migration
                targetId:
                  type: string
                  format: uuid
                  description: TagValue qui absorbe les entity_tags
      responses:
        '200':
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/MergeResultResponse'
        '400':
          description: Les deux valeurs n'appartiennent pas à la même dimension
        '404':
          description: Source ou target introuvable

  /tag-values/reorder:
    patch:
      summary: Réordonner les valeurs frères d'un même parent (Admin)
      tags: [TagAdmin]
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [dimensionId, parentId, orderedIds]
              properties:
                dimensionId:
                  type: string
                  format: uuid
                parentId:
                  type: string
                  format: uuid
                  nullable: true
                  description: null pour les nœuds racine
                orderedIds:
                  type: array
                  items:
                    type: string
                    format: uuid
      responses:
        '200':
          description: Ordre mis à jour

  /tag-values/orphans:
    get:
      summary: Liste les valeurs orphelines (sans entity_tags) (Admin)
      tags: [TagAdmin]
      security:
        - bearerAuth: []
      parameters:
        - name: dimensionId
          in: query
          required: false
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
                  $ref: '#/components/schemas/TagValueResponse'

    delete:
      summary: Supprimer toutes les valeurs orphelines (Admin)
      description: Supprime en masse les tag_values sans aucun entity_tag. Irréversible.
      tags: [TagAdmin]
      security:
        - bearerAuth: []
      parameters:
        - name: dimensionId
          in: query
          required: false
          schema:
            type: string
            format: uuid
          description: Si absent, supprime les orphelins de toutes les dimensions
      responses:
        '200':
          content:
            application/json:
              schema:
                type: object
                properties:
                  deletedCount:
                    type: integer

components:
  schemas:

    UpdateTagDimensionFullDto:
      type: object
      properties:
        name:
          type: string
          maxLength: 255
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
        entityScope:
          type: array
          items:
            type: string

    TagValueRenameResultResponse:
      type: object
      properties:
        renamedValue:
          $ref: '#/components/schemas/TagValueResponse'
        affectedDescendantsCount:
          type: integer
          description: Nombre de nœuds descendants dont le path a été mis à jour

    MergeResultResponse:
      type: object
      properties:
        targetValue:
          $ref: '#/components/schemas/TagValueResponse'
        migratedEntityTagsCount:
          type: integer
        deletedSourcePath:
          type: string
```

---

## 4. Règles Métier Critiques ⚠️

- **RM-01 — Renommage par segment exact :** Le renommage d'un `TagValue` modifie uniquement le dernier segment de son `path`. La propagation sur les descendants utilise un remplacement de segment exact : `WHERE path LIKE :oldPath || '/%'` puis `REPLACE(path, :oldPath || '/', :newPath || '/')`. Cela garantit que seuls les descendants directs sont affectés. Jamais de `REPLACE` sur une substring partielle du segment.

- **RM-02 — Vérification de collision avant renommage :** Avant d'exécuter la propagation, vérifier qu'aucun `TagValue` avec le `newPath` résultant n'existe déjà dans la dimension. Si collision → `409 CONFLICT` + code `TAG_PATH_COLLISION` + message listant les paths en conflit. L'opération est atomique (transaction) : soit tout passe, soit rien.

- **RM-03 — Fusion atomique en transaction :** La fusion source → target s'exécute dans une transaction Prisma :
  1. `UPDATE entity_tags SET tag_value_id = :targetId WHERE tag_value_id = :sourceId`
  2. Ignorer les violations de PK (doublons) — `ON CONFLICT DO NOTHING`
  3. `DELETE FROM tag_values WHERE id = :sourceId` (cascade sur les entity_tags restants)
  Si la transaction échoue, rollback complet.

- **RM-04 — Suppression bloquée si descendants utilisés :** La suppression d'un `TagValue` est bloquée si lui-même **ou** l'un de ses descendants a des `entity_tags`. Avec `force=true`, seuls les descendants **orphelins** (sans entity_tags) sont supprimés — les utilisés restent. Si après suppression des orphelins il reste des descendants utilisés, le nœud parent ne peut toujours pas être supprimé.

- **RM-05 — Suppression dimension bloquée si utilisée :** Même pattern que RM-04 — vérifier `entity_tags` via `JOIN tag_values WHERE dimension_id = :id`. Retourner le count dans le message `DEPENDENCY_CONFLICT`.

- **RM-06 — Réordonnancement de dimensions :** Le `PATCH /tag-dimensions/reorder` met à jour le `sort_order` de toutes les dimensions dans une transaction. Les IDs non présents dans `orderedIds` conservent leur `sort_order` actuel (pas de réinitialisation totale).

- **RM-07 — Droits :** Toutes les routes de FS-21 requièrent la permission `tags:admin`. Cette permission est distincte de `tags:write` (utilisée par les CRUD entités) et réservée au rôle Admin. Ajouter `tags:admin` dans le seed FS-01.

- **RM-08 — Audit trail :** Les opérations de renommage, fusion et suppression en masse sont tracées dans `audit_trail` avec `entity_type = 'tag_value'` et `old_value` / `new_value` en JSONB. Le middleware `ark.current_user_id` couvre le trigger automatique — pas de log manuel nécessaire.

---

## 5. Comportement attendu par cas d'usage

**Renommage :**
- Quand l'Admin renomme `TagValue` `europe/france` → segment `fr` → le path devient `europe/fr`, et `europe/france/paris` devient `europe/fr/paris`, `europe/france/lyon` devient `europe/fr/lyon`
- Quand le nouveau path cible existe déjà → `409 TAG_PATH_COLLISION` avec la liste des paths en conflit
- Quand il n'y a pas de descendants → seul le nœud lui-même est renommé, `affectedDescendantsCount = 0`

**Fusion :**
- Quand l'Admin fusionne `TagValue` `"paris"` (source) → `"europe/france/paris"` (target) → tous les entity_tags pointant vers `"paris"` sont reroutés vers `"europe/france/paris"`, `"paris"` est supprimé, `migratedEntityTagsCount = N`
- Quand une entité est déjà taggée avec les deux valeurs → le doublon est ignoré silencieusement (idempotent)
- Quand source et target n'ont pas la même `dimensionId` → `400 TAG_DIMENSION_MISMATCH`

**Orphelins :**
- Quand l'Admin lance `DELETE /tag-values/orphans` sans filtre → toutes les valeurs sans entity_tags sont supprimées, retourne `{ deletedCount: N }`
- Quand une valeur est orpheline mais a des descendants non-orphelins → elle n'est pas supprimée (un ancêtre ne peut être supprimé que si toute sa branche est orpheline)

**Erreurs :**
- Toute route sans token → `401`
- Toute route avec rôle non-Admin → `403`

---

## 6. Composants Frontend

### Route et accès

Route : `/admin/tags` — accessible via le menu Administration (Sidebar), section existante `/admin/*`.

Accès restreint : `PrivateRoute permission="tags:admin"`.

### Structure de l'écran

L'écran est organisé en deux panneaux :

**Panneau gauche — liste des Dimensions** (300px, fixe)
- Liste des dimensions dans leur `sort_order`, drag-and-drop pour réordonner (MUI `List` + `@dnd-kit/core`)
- Chip coloré avec icône par dimension
- Bouton "+ Nouvelle dimension" en bas de liste
- Sélection d'une dimension → charge son arbre dans le panneau droit
- Actions inline sur chaque dimension : ✏️ Renommer, 🗑️ Supprimer (avec ConfirmDialog)

**Panneau droit — arbre des valeurs de la dimension sélectionnée**
- Arbre hiérarchique (`TreeView` MUI ou composant custom) affichant les `TagValue` dans leur `sort_order`
- Drag-and-drop pour réordonner les nœuds frères (pas de déplacement inter-niveau en P2)
- Chaque nœud affiche : `label`, path complet en gris, badge count d'`entity_tags`
- Actions inline sur chaque nœud :
  - ✏️ Renommer le segment (modal inline)
  - 🔀 Fusionner avec… (ouvre un sélecteur de TagValue dans la même dimension)
  - 🗑️ Supprimer (bloqué si entity_tags > 0, avec message explicite)
- Bouton "Nettoyer les orphelins" en bas du panneau (avec ConfirmDialog affichant le count)
- Compteur global d'orphelins affiché en badge sur le bouton

### Composants à créer

```
frontend/src/
└── pages/
    └── admin/
        └── tags/
            ├── TagAdminPage.tsx            // layout deux panneaux
            ├── DimensionList.tsx           // panneau gauche
            ├── DimensionForm.tsx           // modal création/édition dimension
            ├── TagValueTree.tsx            // panneau droit — arbre récursif
            ├── TagValueRenameModal.tsx     // modal renommage segment
            ├── TagValueMergeModal.tsx      // modal fusion avec sélecteur
            └── index.ts
```

**Clés i18n à ajouter dans `fr.json` :**
```json
"tagAdmin": {
  "title": "Administration des tags",
  "dimensions": {
    "title": "Dimensions",
    "add": "Nouvelle dimension",
    "edit": "Modifier la dimension",
    "delete": "Supprimer la dimension",
    "deleteConfirm": "Supprimer la dimension \"{{name}}\" ?",
    "deleteBlocked": "Cette dimension est utilisée par {{count}} entité(s)",
    "reorderHint": "Glisser pour réordonner"
  },
  "values": {
    "rename": "Renommer",
    "renameLabel": "Nouveau nom du segment",
    "renameCollision": "Ce chemin existe déjà : {{paths}}",
    "merge": "Fusionner avec…",
    "mergeConfirm": "Fusionner \"{{source}}\" dans \"{{target}}\" ? Cette opération est irréversible.",
    "mergeSuccess": "{{count}} entité(s) migrée(s) vers \"{{target}}\"",
    "delete": "Supprimer",
    "deleteBlocked": "Utilisé par {{count}} entité(s) — suppression impossible",
    "entityCount": "{{count}} entité(s)",
    "noValues": "Aucune valeur dans cette dimension"
  },
  "orphans": {
    "cleanButton": "Nettoyer les orphelins ({{count}})",
    "cleanConfirm": "Supprimer {{count}} valeur(s) orpheline(s) ? Cette opération est irréversible.",
    "cleanSuccess": "{{count}} valeur(s) supprimée(s)"
  }
}
```

---

## 7. Tests ⚠️

### Outil par niveau

| Niveau | Outil | Fichier cible | Délégable à OpenCode |
|---|---|---|---|
| Unit (TagAdminService) | **Jest** | `src/tags/tag-admin.service.spec.ts` | ⚠️ Partiel — logique renommage manuelle |
| API / contrat HTTP | **Jest + Supertest** | `test/tag-admin.e2e-spec.ts` | ✅ Oui |
| Sécurité / RBAC | **Jest + Supertest** | `test/tag-admin.e2e-spec.ts` | ❌ **Manuel** |
| E2E browser (UI) | **Cypress** | `cypress/e2e/tag-admin.cy.ts` | ✅ Oui (nominaux) |

### Tests Jest — Unit (TagAdminService)

- [ ] `[Jest]` Renommage — `buildRenameQuery('europe/france', 'fr')` → query affecte `europe/france/paris` mais pas `south-france/bordeaux`
- [ ] `[Jest]` Renommage — détection de collision avant update → retourne les paths en conflit
- [ ] `[Jest]` Fusion — migration atomique : entity_tags reroutés, source supprimée, doublons ignorés
- [ ] `[Jest]` Fusion — dimensions différentes → throw `TAG_DIMENSION_MISMATCH`
- [ ] `[Jest]` Suppression — nœud avec entity_tags → throw `DEPENDENCY_CONFLICT`
- [ ] `[Jest]` Suppression — nœud orphelin + descendants orphelins avec `force=true` → suppression OK
- [ ] `[Jest]` Suppression — nœud orphelin + descendant utilisé avec `force=true` → descendant conservé, nœud non supprimé
- [ ] `[Jest]` Orphelins — `getOrphans(dimensionId)` → retourne uniquement les valeurs sans entity_tags (y compris ancêtres de feuilles utilisées)

### Tests Jest + Supertest — Contrat API

- [ ] `[Supertest]` `PATCH /tag-dimensions/reorder` → 200, sort_order mis à jour
- [ ] `[Supertest]` `PATCH /tag-values/:id` renommage sans collision → 200, `affectedDescendantsCount` correct
- [ ] `[Supertest]` `PATCH /tag-values/:id` renommage avec collision → 409 `TAG_PATH_COLLISION`
- [ ] `[Supertest]` `POST /tag-values/merge` même dimension → 200, `migratedEntityTagsCount` correct
- [ ] `[Supertest]` `POST /tag-values/merge` dimensions différentes → 400 `TAG_DIMENSION_MISMATCH`
- [ ] `[Supertest]` `DELETE /tag-values/:id` valeur utilisée → 409 `DEPENDENCY_CONFLICT`
- [ ] `[Supertest]` `DELETE /tag-values/:id?force=true` orphelins → 204
- [ ] `[Supertest]` `GET /tag-values/orphans` → 200, liste correcte
- [ ] `[Supertest]` `DELETE /tag-values/orphans` → 200, `deletedCount` correct
- [ ] `[Supertest]` `DELETE /tag-dimensions/:id` dimension utilisée → 409 `DEPENDENCY_CONFLICT`

### Tests Sécurité / RBAC — Manuel ❌

- [ ] `[Manuel]` Toutes les routes FS-21 avec rôle non-Admin → 403
- [ ] `[Manuel]` Toutes les routes FS-21 sans token → 401
- [ ] `[Manuel]` `POST /tag-values/merge` — vérifier que les entity_tags de l'entité source n'apparaissent pas en doublon après fusion
- [ ] `[Manuel]` Renommage — vérifier que l'audit_trail trace old_value et new_value corrects

### Tests Cypress — E2E Browser

- [ ] `[Cypress]` Navigation `/admin/tags` → affiche liste des dimensions dans l'ordre `sort_order`
- [ ] `[Cypress]` Créer une dimension → apparaît dans la liste avec couleur et icône
- [ ] `[Cypress]` Sélectionner une dimension → arbre des valeurs s'affiche dans le panneau droit
- [ ] `[Cypress]` Renommer un segment sans collision → label mis à jour, descendants propagés
- [ ] `[Cypress]` Renommer avec collision → message d'erreur `TAG_PATH_COLLISION` affiché
- [ ] `[Cypress]` Fusionner deux valeurs → confirmation affichée, `migratedEntityTagsCount` dans le toast
- [ ] `[Cypress]` Cliquer "Nettoyer les orphelins" → ConfirmDialog avec count, confirmation → toast succès
- [ ] `[Cypress]` Supprimer une valeur utilisée → bouton désactivé avec tooltip `"Utilisé par N entité(s)"`
- [ ] `[Cypress]` Supprimer une dimension utilisée → 409 affiché en ConfirmDialog

---

## 8. Contraintes Techniques

- **`TagAdminService`** doit être un service séparé de `TagService` (F-03) — import dans le même `TagsModule`, mais logique d'admin isolée pour ne pas alourdir le service consommé par tous les modules CRUD
- **Renommage en transaction Prisma :** utiliser `prisma.$transaction([...])` ou `prisma.$transaction(async (tx) => {...})` — le remplacement de paths descendants doit être atomique
- **Drag-and-drop — décision bloquante ⚠️ :** Deux options, non tranchées à ce stade. **Ne pas lancer OpenCode sans avoir choisi.**

  | | Option A — `@dnd-kit` | Option B — MUI X |
  |---|---|---|
  | **Licence** | MIT, open source | Payant au-delà de 1 dev (Pro/Premium) |
  | **Bundle** | ~10 KB, tree-shakeable | Inclus dans MUI X si déjà installé |
  | **Intégration MUI** | Manuelle — wrapper à écrire autour des `List`/`Tree` MUI | Native — `<DndContext>` intégré dans les composants MUI X |
  | **Complexité** | Moyenne — API bas niveau, flexible | Faible — composants prêts à l'emploi |
  | **Précédent ARK** | Aucun — nouvelle dépendance | MUI X déjà identifié comme décision architecturale pendante (ARK-NFR) |
  | **Risque** | Faible — largement adopté, stable | Introduction de MUI X = engagement payant sur tout le projet |

  **Recommandation :** Option A (`@dnd-kit`) si MUI X n'est pas déjà décidé pour d'autres features (ex: DataGrid avancé). Option B seulement si MUI X est retenu globalement — ne pas l'introduire uniquement pour le drag-and-drop de FS-21.

  **Action requise avant implémentation :** Trancher la décision MUI X globale (voir ARK-NFR), puis mettre à jour cette contrainte et la commande OpenCode §9 en conséquence.
- **Pattern NestJS :** Suivre `TagsModule` (F-03) comme référence
- **Toute écriture en base :** passe par `$executeRaw SET LOCAL ark.current_user_id`
- **Permission `tags:admin` :** à ajouter dans le seed `prisma/seed.ts` (FS-01)
- **Route `/admin/tags` :** câblage dans `App.tsx` avec `PrivateRoute permission="tags:admin"` — à faire manuellement
- **Structure de fichiers backend cible :**
```
src/tags/
├── tags.module.ts                  // exporte TagService ET TagAdminService
├── tags.controller.ts              // routes F-03
├── tag-admin.controller.ts         // routes FS-21
├── tags.service.ts                 // F-03 — inchangé
├── tag-admin.service.ts            // FS-21 — renommage, fusion, orphelins
├── tag-admin.service.spec.ts
└── dto/
    ├── ...                         // F-03 DTOs inchangés
    ├── rename-tag-value.dto.ts
    ├── merge-tag-values.dto.ts
    └── reorder-tag-values.dto.ts
test/
└── tag-admin.e2e-spec.ts
```

---

## 9. Commande OpenCode

```
Contexte projet ARK :
- Stack : NestJS strict + Prisma + PostgreSQL 16 + React 18 + TypeScript strict + MUI v5
- Toute écriture en base : await prisma.$executeRaw`SET LOCAL ark.current_user_id = ${userId}`
- Structure modules : src/tags/ — TagsModule déjà existant (F-03)
- PrismaModule global — ne pas réimporter
- JwtAuthGuard global
- Pattern de référence : TagsModule (F-03), DomainsModule (FS-02)
- MUI v5 — sx prop uniquement, pas de styled-components
- i18n : toutes les strings via t('key') — clés tagAdmin.* à ajouter dans fr.json
- Permission requise : tags:admin sur toutes les routes de cette feature

Conventions F-999 :
- Format erreur : { statusCode, code, message, timestamp, path }
- Suppressions bloquées : 409 DEPENDENCY_CONFLICT avec count
- Requêtes raw : tagged template Prisma uniquement

⚠️ TagAdminService.renameTagValue() doit être écrit MANUELLEMENT — la logique de
propagation de path par segment exact est critique et ne doit pas être générée.
⚠️ TagAdminService.mergeTagValues() doit être écrit MANUELLEMENT — transaction atomique critique.

Implémente la feature "Tag Dimensions Administration" (FS-21) — parties délégables :
1. Migration Prisma — ajout sort_order sur tag_values
2. TagAdminController + DTOs
3. TagAdminService scaffolding (méthodes vides pour renameTagValue et mergeTagValues)
4. TagAdminPage, DimensionList, DimensionForm, TagValueTree (sans drag-and-drop)
5. TagValueRenameModal, TagValueMergeModal
6. Tests Supertest nominaux (§7) — NE PAS générer les tests [Manuel]

Ne fais aucune hypothèse non documentée. Si un point est ambigu, pose une question avant de coder.

[COLLER LE CONTENU COMPLET DE CETTE SPEC ICI]
```

---

## 10. Checklist de Validation Avant Génération

- [ ] F-03 `done` — `TagsModule`, `TagService`, tables en base, seed dimensions OK
- [ ] Au moins une FS-xx consommatrice de tags `done` — données réelles pour tester la fusion
- [ ] Permission `tags:admin` ajoutée dans le seed et dans la table `permissions`
- [ ] `TagAdminService.renameTagValue()` écrit et testé manuellement (RM-01, RM-02)
- [ ] `TagAdminService.mergeTagValues()` écrit et testé manuellement (RM-03)
- [ ] Migration `sort_order` appliquée sur `tag_values`
- [ ] **🚧 DÉCISION BLOQUANTE — Drag-and-drop :** choix tranché entre `@dnd-kit` (MIT) et MUI X (payant) — voir §8. Mettre à jour la commande OpenCode §9 avec le package retenu avant génération.
- [ ] Clés `tagAdmin.*` ajoutées dans `fr.json`
- [ ] Route `/admin/tags` câblée dans `App.tsx` avec `PrivateRoute permission="tags:admin"`
- [ ] Spec relue — aucune règle implicite non documentée

---

## 11. Revue de dette technique *(gate de fin de sprint — obligatoire)* ⚠️

### Gates TD

| # | Vérification | Commande / Action |
|---|---|---|
| TD-1 | Aucun `TODO / FIXME / HACK` non tracé | `git grep -n "TODO\|FIXME\|HACK" -- '*.ts' '*.tsx'` |
| TD-2 | Items F-999 activés par FS-21 mis à jour | Relire F-999 §2 — fermer l'item migration `tags TEXT[]` si toutes les FS-xx sont done |
| TD-3 | Checklist F-999 §4 cases cochées | F-999 §4 |
| TD-4 | AGENTS.md — pattern `TagAdminService` documenté (renommage/fusion = manuel toujours) | Relire AGENTS.md |
| TD-5 | ARK-NFR.md — NFR impactés mis à jour | NFR-MAINT-002 (politique suppression étendue aux tag_values) |
| TD-6 | Décision `sort_order` sur `tag_values` tracée en F-999 | Créer/fermer item si applicable |

### Résultat de la revue

| Champ | Valeur |
|---|---|
| **Sprint** | *(à remplir)* |
| **Date de revue** | *(à remplir)* |
| **Items F-999 fermés** | *(à remplir)* |
| **Items F-999 ouverts** | *(à remplir)* |
| **Nouveaux items F-999 créés** | *(à remplir)* |
| **NFR mis à jour** | *(à remplir)* |
| **TODOs résiduels tracés** | *(à remplir)* |
| **Statut gates TD** | *(à remplir)* |

---

_Feature Spec FS-21 v0.1 — Projet ARK — Document de travail, à valider avant démarrage_

> **Probabilité que cette spec soit stable sans itération : ~70%.** Les risques résiduels sont : (1) le choix de librairie drag-and-drop non tranché, (2) le comportement exact de la suppression `force=true` sur des arbres partiellement utilisés peut nécessiter un affinage UX après les premiers tests utilisateurs.