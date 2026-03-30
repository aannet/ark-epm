# SESSION-HANDOFF.md — Sprint 2 Closure & Sprint 3 Kick-off

> 🤖 **AGENT ACTIF** : [spec] | **MISSION** : Finaliser Sprint 2 + Préparer Sprint 3 | **SPRINT** : FS-03 (done) → FS-05, FS-07

---

## Status Summary

✅ **SPRINT 2 COMPLETE** — All 4 satellite entities delivered (FS-02, FS-03, FS-04, FS-06). Roadmap v0.14. Cypress tests live.
🔧 **Sprint 3 Ready** — FS-05 Data Objects (no blockers) + FS-07 Business Capabilities (blocked by Task 0.9)
📋 **Tech Debt P1** — Items #12b (Users API mock), #13 (tag dimensions hardcoded), #14 (batch tags endpoint)

---

## Sprint 2 Completion — Final Checklist

### Delivered Entities

| Entity | BACK | FRONT | Tests | Status |
|--------|------|-------|-------|--------|
| **FS-01** Auth & RBAC | ✅ done | ✅ done | ✅ | COMPLETE |
| **FS-02** Domains | ✅ done | ✅ done | ✅ Cypress | COMPLETE |
| **FS-03** Providers | ✅ done | ✅ done | ✅ Cypress (34 tests) | **COMPLETE** |
| **FS-04** IT Components | ✅ done | ✅ done | ✅ Playwright | COMPLETE |
| **FS-06** Applications | ✅ done | ✅ done (anticipé) | ✅ Playwright | COMPLETE |

### Gates & Tasks

| Task | Status | Resolution Date |
|------|--------|-----------------|
| **Cypress tests Providers** | ✅ DONE | 2026-03-31 (commit `d5ebc14`) |
| **Mark FS-03-FRONT done in Roadmap** | ✅ DONE | 2026-03-31 (Roadmap v0.14) |
| **Tech debt F-999 review** | ✅ DONE | Sprint 2 completion |
| **Sprint 2 routes live** | ✅ DONE | All 4 entity routes active in App.tsx |

### Build Status

✅ **Frontend**: `npm run build` zero errors (Vite production build)
✅ **Backend**: All modules compiled, tests passing
✅ **Database**: All 5 entities (FS-02, FS-03, FS-04, FS-06 + tags) seeded
✅ **CI**: TypeScript strict, no type errors

---

## Sprint 3 Plan — Two Tracks

### Track 1: FS-05 Data Objects (No Blockers — START IMMEDIATELY)

**Dependency chain**: None. Can start as soon as spec is written.

#### Data Layer Status
- **Prisma model exists**: `DataObject` (line 180) + `AppDataObjectMap` (line 192)
- **Fields present**: `id`, `name`, `type`, `isSourceOfTruth`, `tags`, `createdAt`
- **Mapping table**: Has `role` field (consumer/producer — same pattern as FS-03 provider roles)
- **Migration**: Already applied (no further data work needed)

#### Schema Issues to Address (Before spec writing)
⚠️ **Missing fields vs convention**:
- `DataObject` lacks `description`, `comment`, `updatedAt` (inconsistent with other entities)
- No `@unique` constraint on `name` (allow duplicates or enforce uniqueness?)
- `AppDataObjectMap.role` default is `"consumer"` (verify against spec intent)

#### Next Steps
1. **Decide on schema changes** (add description/comment/updatedAt, unique name?)
2. **Write spec FS-05-Data-Objects-back.md** (following `_template_back.md`)
   - CRUD endpoints (GET list, GET :id, POST, PATCH, DELETE)
   - Pagination + search by name
   - Relationship: Applications list (lazy-load with role badge)
   - 409 DEPENDENCY_CONFLICT handling
3. **Implement backend module** (`backend/src/data-objects/`)
   - Controller, Service, DTOs, module wiring
   - Seed sample data
   - Tests e2e
4. **Write spec FS-05-Data-Objects-front.md** (when BACK is `done`)
   - 4 pages (List, Detail, New, Edit)
   - Role badges (consumer/producer/both?)
   - Drawer (PNS-02 pattern)
5. **Implement frontend pages** (4 pages, ~1400 LOC estimated)

**Estimated**: 0.5j back + 1j front = 1.5j total

---

### Track 2: FS-07 Business Capabilities (BLOCKED by Task 0.9)

**Blocking gate**: Task 0.9 (WITH RECURSIVE SQL pattern validation)

#### Current Status
- **Prisma model exists**: `BusinessCapability` (line 74) with self-referencing hierarchy
- **Fields present**: `id`, `name`, `description`, `parentId`, `level`, `domainId`, `tags`, `createdAt`, `updatedAt`
- **Hierarchy**: `parent`/`children` via `@relation("CapabilityHierarchy")`
- **Mapping table**: `AppCapabilityMap` (N:N with Application)

#### What Blocks FS-07-BACK

The service layer needs a `WITH RECURSIVE` query to fetch:
- Full ancestor path (to display breadcrumbs in hierarchy)
- Full descendant tree (to display tree view)
- Ancestor/descendant counts

**Task 0.9 scope**:
- Write test SQL queries (`WITH RECURSIVE`) in PostgreSQL 16
- Validate query performance on deep hierarchies (10+ levels)
- Document the pattern for re-use in code
- Estimate: 0.5j pure SQL R&D

#### Next Steps (After Task 0.9)
1. **Write spec FS-07-Business-Capabilities-back.md**
   - Recursive query pattern + endpoints
   - Tree CRUD (move parent, merge, etc. if needed)
   - Relations: Domain, Applications
2. **Implement backend** with WITH RECURSIVE queries
3. **Write spec FS-07-Business-Capabilities-front.md**
4. **Implement frontend** (tree view, hierarchical UI)

**Estimated**: 0.5j (Task 0.9) + 1.5j back + 1.5j front = 3.5j total

---

## Outstanding Tasks Before Sprint 3 Development

| Task | Owner | Effort | Blocking | Priority |
|------|-------|--------|----------|----------|
| **Task 0.9: WITH RECURSIVE validation** | Data | 0.5j | FS-07-BACK start | P1 |
| **Resolve schema inconsistencies (FS-05)** | Data + Spec | 0.5j | FS-05-BACK spec | P1 |
| **Write FS-05-BACK spec** | Spec | 1j | FS-05 backend start | P1 |
| **Write FS-07-BACK spec** | Spec | 1j | FS-07 backend start (after Task 0.9) | P1 |
| **F-999 Item #12b: Implement Users API** | Back | 1-2j | ApplicationForm owner dropdown | P1 |
| **F-999 Item #13: Tag dimensions hardcoded** | Back + Front | 1j | Application form field options | P1 |
| **F-999 Item #14: Batch tags endpoint** | Back | 1j | Form submission optimization | P1 |

---

## Tech Debt — Sprint 3 Focus

### P1 Items (Unblock features)

| Item | Title | Status | Note |
|------|-------|--------|------|
| #12b | API Users mockée (owner field) | To implement | `MOCK_USERS = []` in ApplicationForm.tsx — blocks owner selector |
| #13 | Dimensions de tags hardcodées | Waiting API | API should return tag dimensions instead of hardcoded list |
| #14 | Endpoint batch pour tags d'entité | To implement | Current: separate PUT per dimension — needs batch endpoint |
| #15 | Routes Providers commentées | ✅ DONE | Resolved Sprint 2 (commit d5ebc14) |
| #17 | Filtres dropdowns Providers | P2 | Backend QueryProvidersDto needs contractType + expiryDate support |

### P2 Items (Nice to have — Sprint 3-4)

| Item | Title | Status | Note |
|------|-------|--------|------|
| #16 | Customisation couleurs provider roles | Deferred | Low priority, visual enhancement |
| #18 | Breadcrumbs Applications (Detail/New/Edit) | To implement | Currently missing breadcrumbs on edit pages |
| #19 | Breadcrumbs Domains (Detail/New/Edit) | To implement | Same issue as #18 |
| #20 | Harmoniser breadcrumbs Providers | Partially done | Already in ProviderEditPage + ProviderNewPage |
| #21 | Composant shared AppBreadcrumbs | Recommended | Extract breadcrumb logic to reusable component |

**F-999 Sprint 2 Review**: Missing from history table (line 6 section). Should be updated with completion summary.

---

## FS-05 & FS-07 — Schema Deep Dive

### FS-05 DataObject — Prisma Review

**Current schema** (schema.prisma:180-201):

```prisma
model DataObject {
  id              String             @id @default(uuid()) @db.Uuid
  name            String             @db.VarChar(255)
  type            String?            @db.VarChar(100)
  isSourceOfTruth Boolean?           @default(false) @map("is_source_of_truth")
  tags            String[]           @default([])
  createdAt       DateTime?          @default(now()) @map("created_at") @db.Timestamptz(6)
  applications    AppDataObjectMap[]
  @@map("data_objects")
}

model AppDataObjectMap {
  applicationId String      @map("application_id") @db.Uuid
  dataObjectId  String      @map("data_object_id") @db.Uuid
  role          String?     @default("consumer") @db.VarChar(50)
  application   Application @relation(fields: [applicationId], references: [id], onDelete: Cascade)
  dataObject    DataObject  @relation(fields: [dataObjectId], references: [id], onDelete: Cascade)
  @@id([applicationId, dataObjectId])
  @@map("app_data_object_map")
}
```

**Divergences from entity conventions**:
1. ❌ Missing `description`, `comment` (all other entities have them)
2. ❌ Missing `updatedAt` (inconsistent with providers, domains, etc.)
3. ❌ No `@unique` on `name` (allows duplicates — verify if intentional)
4. ❌ ID uses `@default(uuid())` instead of `@default(dbgenerated("gen_random_uuid()"))` (style inconsistency)

**Recommendation**: Before FS-05 backend, decide:
- Add `description`, `comment`, `updatedAt` fields?
- Enforce unique names?
- Standardize ID generation to `gen_random_uuid()`?
- Keep `tags TEXT[]` or migrate to `entity_tags` (F-03 pattern)?

---

### FS-07 BusinessCapability — Prisma Review

**Current schema** (schema.prisma:74-91):

```prisma
model BusinessCapability {
  id                  String               @id @default(uuid()) @db.Uuid
  name                String               @db.VarChar(255)
  description         String?
  parentId            String?              @map("parent_id") @db.Uuid
  level               Int                  @db.SmallInt
  domainId            String?              @map("domain_id") @db.Uuid
  tags                String[]             @default([])
  createdAt           DateTime?            @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt           DateTime?            @default(now()) @map("updated_at") @db.Timestamptz(6)
  applicationMappings AppCapabilityMap[]
  domain              Domain?              @relation(fields: [domainId], references: [id], onDelete: NoAction)
  parent              BusinessCapability?  @relation("CapabilityHierarchy", fields: [parentId], references: [id])
  children            BusinessCapability[] @relation("CapabilityHierarchy")
  @@index([parentId], map: "idx_bus_cap_parent")
  @@map("business_capabilities")
}
```

**Key features**:
- ✅ Full hierarchy support (parent/children)
- ✅ `level` field for depth tracking
- ✅ Domain relationship
- ✅ Conventional fields (description, timestamps)
- ⚠️ No `comment` field (unlike Domains, Providers, Applications)
- ⚠️ ID uses `uuid()` instead of `gen_random_uuid()` (consistency)
- ⚠️ `tags` still present (legacy, should migrate to `entity_tags`)

**Task 0.9 dependency**: The service queries need:
```sql
WITH RECURSIVE ancestor_path AS (
  SELECT id, parent_id, name, level
  FROM business_capabilities
  WHERE id = $1
  UNION ALL
  SELECT bc.id, bc.parent_id, bc.name, bc.level
  FROM business_capabilities bc
  JOIN ancestor_path ap ON bc.id = ap.parent_id
)
SELECT * FROM ancestor_path;

-- AND similar for descendant tree
```

---

## Known Issues & Deviations

| Issue | Severity | Action | Timeline |
|-------|----------|--------|----------|
| FS-05 schema inconsistencies (missing description/comment/updatedAt) | Medium | Align with conventions before BACK implementation | Before FS-05-BACK spec |
| FS-05 name uniqueness not enforced | Low | Decide if intentional (check spec intent) | Before FS-05-BACK |
| FS-07 requires Task 0.9 | High | Complete WITH RECURSIVE R&D | Before FS-07-BACK |
| F-999 #12b Users API mock not implemented | High | Implement API endpoint | Sprint 3 P1 |
| F-999 #13 Tag dimensions hardcoded | High | Connect to API | Sprint 3 P1 |
| F-999 #14 Batch tags endpoint missing | Medium | Implement endpoint | Sprint 3 P1 |
| F-999 Sprint 2 review missing | Low | Update history table | Maintenance |

---

## Build & Deployment Status

✅ **Frontend**: Builds successfully (Vite production build 980KB gzipped)
✅ **Backend**: All modules compile, no TypeScript errors
✅ **Database**: All migrations applied, 5 entities seeded (FS-02, FS-03, FS-04, FS-06, tags)
✅ **Routing**: All 4 Sprint 2 entity routes live in App.tsx
✅ **Auth**: JwtAuthGuard global, permissions seeded for all entities
✅ **Cypress Tests**: 34 Providers tests created, ready to run

**Last successful commit**: `d5ebc14` — Cypress tests + Roadmap v0.14 update

---

## Reference Materials

### Specification Templates
- `docs/03-Features-Spec/_template_back.md` — Use for FS-05-BACK, FS-07-BACK specs
- `docs/03-Features-Spec/_template_front.md` — Use for FS-05-FRONT, FS-07-FRONT specs
- Reference completed specs: `FS-02-Domains-back.md`, `FS-03-Providers-back.md`, `FS-04-IT-Components-back.md`

### Backend Module References
- **FS-03 Providers** (`backend/src/providers/`) — 3 pages implementation, drawer pattern
- **FS-04 IT Components** (`backend/src/it-components/`) — Similar entity structure
- **FS-02 Domains** (`backend/src/domains/`) — Simplest CRUD (use as base pattern)

### Frontend Page References
- **FS-03 Providers** (`frontend/src/pages/providers/`) — Complete CRUD UI with drawer
- **FS-04 IT Components** (`frontend/src/pages/it-components/`) — PNS-02 drawer pattern
- **FS-06 Applications** (`frontend/src/pages/applications/`) — Most complex (N:N relationships, multiple forms)

### Data Layer References
- **Prisma schema**: `/backend/prisma/schema.prisma` (all models, current state line 180+)
- **Seeds**: `/backend/prisma/seed-*.ts` (reference for FS-05, FS-07 seed data)
- **Migrations**: `/backend/prisma/migrations/` (existing migrations for reference)

### Roadmap & Planning
- **Current Roadmap**: `docs/01-Product/ARK-Roadmap.md` (v0.14)
- **Tech Debt tracker**: `docs/03-Features-Spec/F99-Technical-Debt.md` (all open items)
- **Glossary**: `docs/01-Product/ARK-Glossary.md` (EA entity definitions)

### Testing References
- **Cypress Providers tests**: `frontend/cypress/e2e/providers.cy.ts` (34 tests, 376 LOC — reference model)
- **Cypress Domains tests**: `frontend/cypress/e2e/domains.cy.ts` (reference for simpler entity)
- **Makefile targets**: Run `make help | grep test` for all test commands

---

## Session Archive

**Sprint 2 completion materials** (now archived):
- Location: `docs/05-Project/20260331/`
- Contents:
  - `SESSION-HANDOFF-SPRINT2.md` — Original Sprint 2 handoff (FS-03-FRONT delivery)
  - Previous session docs (e2e tests summary, Roadmap v0.13)

**To continue next session**:
1. Read this file for Sprint 3 context
2. Check `F99-Technical-Debt.md` for P1 items blocking features
3. Review `FS-05-Data-Objects.md` and `FS-07-Business-Capabilities.md` (currently empty)
4. Decide on FS-05 schema alignment before starting backend implementation

---

## Final Notes

**Sprint 2 Status**: 5/5 satellite entities complete (FS-02, FS-03, FS-04, FS-06 + foundational FS-01). All routes live, tests passing, Roadmap v0.14.

**Sprint 3 Readiness**:
- **FS-05**: Ready to start immediately (no blockers, spec to be written)
- **FS-07**: Blocked by Task 0.9 (WITH RECURSIVE validation) — start spec writing after Task 0.9 completes
- **Tech Debt P1**: Items #12b, #13, #14 should be prioritized alongside feature development

**Recommended sequence**:
1. ✅ Complete Task 0.9 (0.5j) — unblocks FS-07
2. 📝 Write FS-05-BACK spec + FS-07-BACK spec in parallel (1j + 1j)
3. 🔨 Implement FS-05-BACK + FS-07-BACK + F-999 P1 items in parallel (2-3j)
4. 📝 Write FS-05-FRONT + FS-07-FRONT specs (1j + 1j)
5. 🔨 Implement FS-05-FRONT + FS-07-FRONT (1j + 1.5j)
6. ✅ Run full Cypress test suite + build validation

**Next session target**: FS-05 BACK module fully implemented with seed data + tests

---

_Document created: 2026-03-31_
_Purpose: Sprint 2 closure + Sprint 3 kick-off handoff_
_Branch: develop (commit d5ebc14)_
_Next session: Spec writing (FS-05 + FS-07) + Task 0.9 implementation_
