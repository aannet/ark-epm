# SESSION HANDOFF — data — T-052 FS-07 lifecycleStatus (2026-04-12)

Agent : `data` | Session : `d4a1f2` | Tâche : T-052 → **done**

---

## Ce qui a été fait

### Schema Prisma

Champ ajouté sur `BusinessCapability` (`backend/prisma/schema.prisma`) :

```prisma
lifecycleStatus  String?  @map("lifecycle_status") @db.VarChar(50)
```

Placé après `technicalFit` (ligne 83). Pas d'enum — type `String?` libre (pattern identique à `Application.lifecycleStatus`).

Migration : `npx prisma db push --accept-data-loss` exécuté dans le container (`ark-epm-backend-1`).
Client Prisma régénéré automatiquement.

### DTOs NestJS

| Fichier | Champ ajouté |
|---|---|
| `dto/create-business-capability.dto.ts` | `@IsString() @IsOptional() @MaxLength(50) lifecycleStatus?: string` |
| `dto/update-business-capability.dto.ts` | `@IsString() @IsOptional() @MaxLength(50) lifecycleStatus?: string \| null` |

### Service

| Point | Modification |
|---|---|
| Interface `BusinessCapabilityTreeNode` | Ajout `lifecycleStatus: string \| null` |
| `findTree()` select | Ajout `lifecycleStatus: true` |
| `create()` data block | Ajout `lifecycleStatus: dto.lifecycleStatus ?? null` |
| `update()` data block | Ajout `...(dto.lifecycleStatus !== undefined && { lifecycleStatus: dto.lifecycleStatus ?? null })` |

> `findAll()`, `findOne()`, `getChildren()` — pas de modification nécessaire (utilisent `include`, Prisma inclut tous les scalaires automatiquement).

### Validation

- `make validate-backend` : **✅ Build TypeScript OK**
- `make test-api-backend` : **103/107** — 0 régression (3 failures = T-050 préexistants)

### Commits

```
feat(data/back): T-052 — add lifecycleStatus on BusinessCapability (schema + DTOs + service)
chore(session): clôture T-052 — lifecycleStatus BC done, gate FS-07-P2-FRONT débloquée
```

---

## Gate FS-07-P2-FRONT — État

| Gate | Statut |
|---|---|
| `lifecycleStatus` dans `GET /api/v1/business-capabilities/:id` | ✅ Disponible |
| `lifecycleStatus` dans `GET /api/v1/business-capabilities` (list) | ✅ Disponible |
| `lifecycleStatus` dans `GET /api/v1/business-capabilities/tree` | ✅ Disponible |
| `PATCH /:id { lifecycleStatus: "production" }` retourne 200 avec champ | ✅ Validé (build + tests) |
| `FS-07-P2-Lifecycle-front.md` statut `stable` | ✅ Fait (T-017) |
| Clés i18n `businessCapabilities.lifecycle.*` dans `fr.json` | ⏳ À faire par l'agent `front` (§5 de la spec) |
| Composant `LifecycleStepper` créé | ⏳ À faire par l'agent `front` |

---

## Pour l'agent `front` (T-053)

Spec complète : `docs/03-Features-Spec/P2/FS-07-P2-Lifecycle-front.md`

La commande OpenCode est disponible en **§8 de la spec** — copier-coller directement.

Points d'attention :
- `bc.lifecycleStatus` est `string | null` — les 5 valeurs attendues sont dans la spec §2
- Le composant `LifecycleStepper` est un composant **shared** (`frontend/src/components/shared/`)
- Onglet "Lifecycle" dans EditPage : entre "Relations" et "Audit" (ordre des onglets §4.3)
- Sur DetailPage : onglet en lecture seule, `editable: false`
- Clés i18n à ajouter dans `fr.json` **avant** d'implémenter les composants
