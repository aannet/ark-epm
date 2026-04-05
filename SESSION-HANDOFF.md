# SESSION-HANDOFF.md — Sprint 3 · FS-07-BACK (Business Capabilities)

> 🤖 **AGENT ACTIF** : [spec] | **MISSION** : FS-07-BACK spec v1.0 stable + rollback max depth | **SPRINT** : FS-07-BACK ✅ `stable`

---

## Status Summary

✅ **FS-07-BACK SPEC COMPLETE** — Backend specification v1.0 rédigée (1389 lignes → 1370 lignes après rollback, 13 sections). Hiérarchie récursive complète avec `level` auto-calculé, prévention circulaire, WITH RECURSIVE pour `/tree`. Statut = `stable`. Prêt pour session [back].

✅ **ROLLBACK MAX DEPTH** — Conformité avec `ARK-Product-Brief` (hiérarchie illimitée). Règle RM-08 (max 5 niveaux) supprimée, renumérotation RM-09→RM-08 à RM-12→RM-11. **17 gates** (G-01 à G-17, G-17 = openapi.yaml).

🔧 **Previous Handoff Archived** — `SESSION-HANDOFF-FS05.md` → `docs/05-Project/20260404/`

📋 **Tech Debt P1** — Items #12b (Users API), #13 (tags API), #14 (batch tags) restent ouverts — peuvent paralléliser avec FS-07-BACK implémentation.

---

## FS-07-BACK Specification Summary

### Metadata

| Field | Value |
|---|---|
| **File** | `docs/03-Features-Spec/FS-07-Business-Capabilities-back.md` |
| **Version** | 1.0 |
| **Status** | ✅ `stable` (post-rollback max depth) |
| **Template** | Backend v0.4 |
| **Depends On** | FS-01 (`done`), **FS-06-BACK** (`done`), F-03 (`done`) |
| **Created** | 5 April 2026 |
| **Est. Implementation** | 1.5j (hiérarchie récursive, 8 endpoints) |

### Specification Structure (13 sections)

| Section | Content | Status |
|---|---|---|
| **§1 Objective** | CRUD + hiérarchie + `/tree` + `/children` + `/applications` | ✅ |
| **§2 Modèle BDD** | Migration NFR-GOV-005, Prisma self-relation, entityTags | ✅ |
| **§3 OpenAPI** | 8 endpoints YAML (CRUD + tree + children + applications) | ✅ |
| **§4 Règles Métier** | 11 RM (RM-07 level auto, RM-08 circular ref, etc.) | ✅ |
| **§5 Cas d'Usage** | Nominaux + erreurs (409, 400 CIRCULAR_REFERENCE) | ✅ |
| **§6 Structure** | Module NestJS pattern standard | ✅ |
| **§7 Tests** | 20 Jest + 23 Supertest (max depth tests supprimés) | ✅ |
| **§8 OpenCode Cmd** | Inline complet avec WITH RECURSIVE SQL | ✅ |
| **§9 Gates** | **17 gates** (G-17 = openapi.yaml) | ✅ |
| **§10 Checklist** | 20 items post-session | ✅ |
| **§11 TD Review** | 6 gates + Items F-999 | ✅ |
| **§12 Seed** | Arbre hiérarchique 12 capabilities / 3 niveaux | ✅ |

### Key Features vs Other Entities

| Element | FS-03/04/05/06 | FS-07 Business Capabilities | Impact |
|---|---|---|---|
| Structure | Flat | **Hiérarchique** (`parent`/`children`) | Tree UI, recursive queries |
| Endpoint | Standard CRUD | **+ `/tree`** (WITH RECURSIVE) | Full nested tree in 1 request |
| Endpoint | Standard CRUD | **+ `/:id/children`** | Direct children pagination |
| Field | — | **`level`** auto-calculé | Depth tracking, UI indentation |
| Validation | Nom unique | **+ Circular reference check** | `400 CIRCULAR_REFERENCE` |
| Suppression | Apps liées | **+ Children check** | 2 compteurs (`applications` + `children`) |
| Seed | Flat list | **Hierarchical tree** (12 nodes, 3 levels) | Realistic test data |

---

## Architecture Decision Traced ⚠️

### Rollback Max Depth 5 → Illimité

**Context:**
- `ARK-Product-Brief.md` §Modélisation : "**Hiérarchie illimitée en base** — contrainte de 5 niveaux levée"
- Spec FS-07-BACK originale (v1.0 draft) : RM-08 avec `400 MAX_DEPTH_EXCEEDED`

**Decision:**
- Aligner spec sur Product Brief — hiérarchie **illimitée** (rollback RM-08)
- Garder `level` auto-calculé (utile pour UI indentation, analytics)
- Garder prévention circulaire (critique pour intégrité données)

**Changes Applied:**
| Element | Avant | Après |
|---|---|---|
| RM-08 | Max depth 5 niveaux | ❌ Supprimée |
| RM-09→12 | Circular ref, validations, tree | RM-08→11 (renumérotation) |
| Error code | `MAX_DEPTH_EXCEEDED` | ❌ Supprimée |
| Tests | 4 tests max depth | ❌ Supprimés |
| Gates | G-16 Max depth | ❌ Supprimée |
| Checklist | Item max depth | ❌ Supprimé |

**Impact:**
- Niveau 5, 6, 7+ techniquement possibles en base
- UI pourra afficher avertissement visuel (non bloquant) si profondeur > recommandée
- Pas de limite arbitraire métier en backend

---

## Documentation Updates

### Files Modified

| File | Change | Impact |
|---|---|---|
| `docs/03-Features-Spec/FS-07-Business-Capabilities-back.md` | ✨ **NEW** — Complete v1.0 spec (**1368 lines**, post-rollback) | Backend spec ready |
| `docs/01-Product/ARK-Roadmap.md` | ✏️ FS-07-BACK → `stable`, changelog v0.17 | Sprint tracking |
| `docs/03-Features-Spec/FS-07-Business-Capabilities.md` | 🗑️ **DELETED** — Empty unified placeholder | Cleanup |
| `SESSION-HANDOFF.md` (root) | 📦 **ARCHIVED** → `docs/05-Project/20260404/SESSION-HANDOFF-FS05.md` | Archive FS-05 |
| `SESSION-HANDOFF.md` (root) | ✨ **NEW** — This file | Current handoff FS-07 |

### Git Commit Suggested

```
spec: FS-07-BACK v1.0 — Business Capabilities backend (stable)

- Complete backend spec: 8 endpoints, hiérarchie récursive, WITH RECURSIVE
- level auto-calculé, circular reference prevention, 2 compteurs suppression
- 20 Jest + 23 Supertest, **17 gates**
- Rollback max depth: conforme ARK-Product-Brief (hiérarchie illimitée)
- Roadmap: FS-07-BACK stable, changelog v0.17
- Archive FS-05 handoff
- Sprint 3 ready for [back] implementation
```

---

## Session Gate — Backend FS-07-BACK ⚠️

### Pre-conditions (7 gates)

Before launching OpenCode FS-07-BACK:

- [x] **FS-01 `done`** — JWT, permissions, middleware audit ✅
- [x] **FS-06-BACK `done`** — Applications API for `DEPENDENCY_CONFLICT` tests ✅
- [x] **F-03 `done`** — TagService, `entity_tags` relation ✅
- [x] **Permissions seedées** — `business-capabilities:read` / `:write` in `seed.ts` ✅
- [x] **Module directory** — `backend/src/business-capabilities/` exists and empty ✅
- [ ] **Migration SQL executed** — Comment, UNIQUE(name), gen_random_uuid() defaults
- [ ] **Prisma schema checked** — Align model with spec §2.2 (nullable level, entityTags relation)

### Effort Before OpenCode

| Task | Owner | Time | Priority |
|---|---|---|---|
| Verify schema.prisma vs spec §2.2 | Arch/Data | 5 min | 🟡 Important |
| Run migration SQL §1 | Data | 5 min | 🟡 Important |
| Validate empty module dir | QA | 1 min | 🟢 Quick |
| **Total** | — | **< 15 min** | — |

---

## Next Steps — Immediate Actions

### Pre-OpenCode (15 min total)

1. **Verify `schema.prisma` BusinessCapability model**
   - Check `level` is nullable (`Int? @db.SmallInt`)
   - Check `entityTags EntityTag[]` relation exists
   - Check `id @default(dbgenerated("gen_random_uuid()"))`
   - File: `backend/prisma/schema.prisma`

2. **Run migration SQL** (from spec §1)
   ```sql
   ALTER TABLE business_capabilities
     ADD COLUMN IF NOT EXISTS comment TEXT,
     ALTER COLUMN id SET DEFAULT gen_random_uuid(),
     ALTER COLUMN updated_at SET DEFAULT NOW();
   
   ALTER TABLE business_capabilities
     ADD CONSTRAINT IF NOT EXISTS business_capabilities_name_key UNIQUE (name);
   
   ALTER TABLE business_capabilities DROP COLUMN IF EXISTS tags;
   ```

3. **Validate directory empty**
   ```bash
   ls -la backend/src/business-capabilities/
   # Expected: empty or non-existent
   ```

4. **Commit**: `chore: FS-07-BACK pre-session — migration, schema check`

### OpenCode Session

5. **Copy-paste §8 Command OpenCode** into new session
   - Full inline prompt with SQL patterns
   - Ref spec content for `[COLLER LE CONTENU COMPLET...]`

6. **Monitor implementation**
   - WITH RECURSIVE query construction
   - Circular reference check function
   - Cascading level recalculation
   - 2 counters in `remove()`

### Validation

7. `npm run build` backend → 0 errors
8. `npm run test -- --testPathPattern=business-capabilities` → 20 Jest pass
9. `npm run test:e2e -- --testPathPattern=FS-07` → 23 Supertest pass
10. Postman: `GET /tree` returns nested structure
11. Postman: `PATCH` with circular parentId → `400 CIRCULAR_REFERENCE`

---

## Parallelizable Tasks (Sprint 3)

**Not blocked by FS-07-BACK:**
- **FS-05-FRONT** (Data Objects) — if amendments A+B not yet done
- **FS-07-FRONT** spec — can be drafted while BACK implements
- **Task 0.9** (WITH RECURSIVE SQL) — R&D documented in spec §8
- **Tech Debt P1** — Users API (#12b), tags API (#13), batch tags (#14)

**Recommended Sprint 3 Timeline:**
```
Dim 5 Apr  : FS-07-BACK spec stable ✅   ← today, completed
Lun 6 Apr  : FS-07-BACK pre-conditions (< 15 min) + OpenCode session
Mar 7 Apr  : FS-07-BACK implementation (1.5j) + FS-07-FRONT spec parallel
```

---

## Build Validation Checklist

### Pre-OpenCode FS-07-BACK

- [ ] `schema.prisma` model matches spec §2.2
- [ ] Migration SQL executed (comment, UNIQUE name, drop tags)
- [ ] `business-capabilities/` directory empty
- [ ] `npm run build` backend → 0 errors

### Post-OpenCode FS-07-BACK

- [ ] `POST /api/v1/business-capabilities` racine → `201` avec `level: 0`
- [ ] `POST /api/v1/business-capabilities` avec parent → `201` avec `level` auto
- [ ] `POST /api/v1/business-capabilities` → audit_trail changed_by non NULL
- [ ] `PATCH` reparenting → `200` avec nouveau `level` et cascade descendants
- [ ] `PATCH` reparenting circulaire → `400 CIRCULAR_REFERENCE`
- [ ] `DELETE` avec enfants → `409 DEPENDENCY_CONFLICT` + childrenCount
- [ ] `DELETE` avec applications → `409 DEPENDENCY_CONFLICT` + applicationsCount
- [ ] `GET /tree` → structure arborescente complète (nested children)
- [ ] `GET /:id/children` → enfants directs paginés
- [ ] `GET /:id/applications` → applications liées paginées
- [ ] `_count.applicationMappings` et `_count.children` présents
- [ ] Nom unique global → `409 CONFLICT`
- [ ] `domainId` validation → `404` si inexistant
- [ ] `parentId` validation → `404` si inexistant
- [ ] **17 gates** G-01 à G-17 cochées (post-rollback: G-17 = openapi.yaml)
- [ ] `openapi.yaml` mis à jour avec paths `/business-capabilities`
- [ ] Aucun `TODO / FIXME / HACK` non tracé
- [ ] Aucune erreur TypeScript strict

---

## Reference Materials

### Specifications

| File | Status | Version | Purpose |
|---|---|---|---|
| **FS-07-Business-Capabilities-back.md** | `stable` | 1.0 | Backend contract + gates (current) |
| **FS-06-Applications-back.md** | `done` | 1.x | Reference N:N relations + tests |
| **FS-05-Data-Objects-back.md** | `done` | 1.0 | Pattern N:N + role field |
| **FS-03-Providers-back.md** | `done` | 1.3 | Pattern CRUD + pagination |

### Code Locations

| Module | Files | Role |
|---|---|---|
| Backend | `backend/src/business-capabilities/` | **EMPTY — ready for implementation** |
| Prisma | `backend/prisma/schema.prisma` | Model to verify against spec §2.2 |
| Test e2e | `backend/test/FS-07-business-capabilities.e2e-spec.ts` | To be created |
| Seed | `backend/prisma/seed.ts` | Add hierarchical tree data §12 |

### Critical SQL Patterns (from spec §8)

**Circular Reference Check:**
```typescript
async isDescendant(ancestorId: string, descendantId: string): Promise<boolean> {
  if (ancestorId === descendantId) return true;
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
```

**Cascading Level Recalculation:**
```typescript
async recalculateLevelsRecursively(rootId: string): Promise<void> {
  const root = await this.prisma.businessCapability.findUnique({
    where: { id: rootId }, select: { level: true }
  });
  if (!root) return;
  await this.prisma.$executeRaw`
    WITH RECURSIVE descendants AS (
      SELECT id, parent_id, ${root.level} + 1 as new_level 
      FROM business_capabilities WHERE parent_id = ${rootId}::uuid
      UNION ALL
      SELECT c.id, c.parent_id, d.new_level + 1
      FROM business_capabilities c
      INNER JOIN descendants d ON c.parent_id = d.id
    )
    UPDATE business_capabilities bc SET level = d.new_level
    FROM descendants d WHERE bc.id = d.id
  `;
}
```

---

## Summary

| Item | Deliverable |
|---|---|
| **FS-07-BACK** | ✅ Specification v1.0 stable (**1368 lines**, post-rollback) |
| **Rollback** | ✅ Max depth supprimée, conforme Product Brief |
| **Hiérarchie** | ✅ Recursive self-relation, level auto, circular check, WITH RECURSIVE |
| **Pre-conditions** | 🔄 Schema check + migration (< 15 min) |
| **Next OpenCode** | ⏳ Ready after schema verification |
| **Est. implementation** | 1.5j (8 endpoints, recursive logic) |

**Overall: FS-07-BACK ready for backend implementation after < 15 min prep.**

---

## Decision Log

| # | Decision | Context | Rationale |
|---|---|---|---|
| D-01 | Rollback max depth | Product Brief says "illimitée" | Alignement documentation, pas de contrainte arbitraire |
| D-02 | Conserver `level` | Utile UI + analytics | Auto-calculé, nullable en DB, pas exposé en DTO create/update |
| D-03 | Renumber RM-09→RM-12 | Suppression RM-08 | Conséquence D-01, maintien ordre logique |
| D-04 | Supprimer G-17 | Max depth supprimé | **18 gates → 17 gates** (G-17 devient audit trail, ancien G-18 devient G-17) |
| D-05 | Hiérarchie illimitée | Standard EA | Meilleure flexibilité, avertissement UI possible P2 |

---

_Document created: 2026-04-05_
_Purpose: Sprint 3 FS-07-BACK spec completion + handoff to [back]_
_Branch: develop_
_Status: Spec **v1.0 stable**, **17 gates**, rollback applied, pre-conditions pending_
_Next session: Schema check + migration (< 15 min), then OpenCode FS-07-BACK_
