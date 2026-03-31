# SESSION-HANDOFF.md — Sprint 3 Kick-off & Development Plan

> 🤖 **AGENT ACTIF** : [spec] | **MISSION** : Sprint 3 Ready — FS-05-BACK spec done, ready for backend implementation | **SPRINT** : FS-05-BACK ✅ stable, FS-07-BACK (pending Task 0.9)

---

## Status Summary

✅ **SPRINT 2 COMPLETE** — All 4 satellite entities delivered (FS-02, FS-03, FS-04, FS-06). Roadmap v0.14. Cypress tests live.
✅ **FS-05-BACK SPEC COMPLETE** — Data Objects backend spec v1.0 `stable` (commit `7e8730c`). Schema aligned to NFR-GOV-005, migration documented, ready for OpenCode implementation.
🔧 **Sprint 3 In Progress** — FS-05 backend implementation ready to start + FS-07 Business Capabilities (blocked by Task 0.9)
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

### Track 1: FS-05 Data Objects (SPEC COMPLETE — BACKEND IMPLEMENTATION READY)

**Dependency chain**: None. Backend implementation can start immediately.

#### Spec Status
✅ **FS-05-Data-Objects-back.md** — v1.0 `stable` (commit `7e8730c`)
- Complete OpenAPI contract (YAML §3)
- NFR-GOV-005 aligned (description, comment, updatedAt, UNIQUE name)
- Schema migration documented (idempotent SQL)
- N:N relationship with enum roles (consumer, producer, owner)
- F-03 tags integration (polymorphic entity_tags)
- Comprehensive test plan (32 tests: 10 Jest + 17 Supertest + 5 RBAC manual)
- 5 seed data objects prepared

#### Schema Decisions Made & Documented
✅ **Add `description`, `comment`, `updatedAt`** — Conform to NFR-GOV-005
✅ **Enforce UNIQUE constraint on `name`** — Consistency with other entities
✅ **Migrate legacy `tags TEXT[]` to F-03** — Use polymorphic entity_tags
✅ **Role field: enum (consumer, producer, owner)** — Strict validation
✅ **Maintain `isSourceOfTruth`** — Boolean flag for data governance (P1)
✅ **Type as string (not enum)** — Flexible, suggestions: database, dataset, file

#### Next Steps
1. ✅ **Spec writing done** — FS-05-Data-Objects-back.md v1.0 ready for implementation
2. 🔨 **Backend implementation** (session OpenCode) — Module NestJS + tests
   - Prisma migration + seed data
   - Controller, Service, DTOs (following FS-02 pattern)
   - Jest unit tests + Supertest e2e tests
   - Audit trail validation
3. ✅ **Gate G-01 to G-13** — Verify before marking BACK `done`
4. 📝 **Write FS-05-FRONT spec** — When BACK is `done` (blocks gate)
5. 🔨 **Frontend implementation** — 4 pages (List, Detail, New, Edit) ~1400 LOC

**Estimated**: 0.5j impl + 1j front = 1.5j total (from `stable` spec)

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

## Outstanding Tasks — Sprint 3 Development Plan

| Task | Owner | Effort | Blocking | Priority | Status |
|------|-------|--------|----------|----------|--------|
| **Task 0.9: WITH RECURSIVE validation** | Data | 0.5j | FS-07-BACK start | P1 | Pending |
| **FS-05-BACK implementation** | Back | 0.5j | FS-05-FRONT spec | P1 | 🟢 Ready (spec stable) |
| **Write FS-07-BACK spec** | Spec | 1j | FS-07 backend start | P1 | Pending (blocked by Task 0.9) |
| **FS-07-BACK implementation** | Back | 1.5j | FS-07-FRONT spec | P1 | Pending (after Task 0.9) |
| **FS-05-FRONT spec** | Spec | 0.5j | FS-05 frontend start | P1 | Pending (after FS-05-BACK done) |
| **FS-05-FRONT implementation** | Front | 1j | FS-05 complete | P1 | Pending (after FS-05-BACK done) |
| **F-999 Item #12b: Implement Users API** | Back | 1-2j | ApplicationForm owner dropdown | P1 | Pending |
| **F-999 Item #13: Tag dimensions hardcoded** | Back + Front | 1j | Application form field options | P1 | Pending |
| **F-999 Item #14: Batch tags endpoint** | Back | 1j | Form submission optimization | P1 | Pending |

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

## FS-05 & FS-07 — Schema Implementation Plan

### FS-05 DataObject — Schema Decisions ✅ DOCUMENTED

**Target schema** (per FS-05-BACK v1.0 §2.2):

```prisma
model DataObject {
  id              String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  name            String    @unique @db.VarChar(255)
  description     String?   @db.Text
  comment         String?   @db.Text
  type            String?   @db.VarChar(100)
  isSourceOfTruth Boolean   @default(false) @map("is_source_of_truth")
  createdAt       DateTime  @default(now()) @map("created_at") @db.Timestamptz
  updatedAt       DateTime  @updatedAt @map("updated_at") @db.Timestamptz

  appDataObjectMaps AppDataObjectMap[]
  entityTags        EntityTag[]

  @@map("data_objects")
}

model AppDataObjectMap {
  applicationId String      @map("application_id") @db.Uuid
  dataObjectId  String      @map("data_object_id") @db.Uuid
  role          String      @default("consumer") @db.VarChar(50)

  application   Application @relation(fields: [applicationId], references: [id], onDelete: Cascade)
  dataObject    DataObject  @relation(fields: [dataObjectId], references: [id], onDelete: Cascade)

  @@id([applicationId, dataObjectId])
  @@map("app_data_object_map")
}
```

**Migration SQL** (documented in FS-05-BACK §1):
```sql
ALTER TABLE data_objects
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS comment TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE data_objects
  ADD CONSTRAINT IF NOT EXISTS data_objects_name_key UNIQUE (name);
ALTER TABLE data_objects DROP COLUMN IF EXISTS tags;
```

**Decisions Rationale** (all documented in spec):
1. ✅ Add `description`, `comment`, `updatedAt` → NFR-GOV-005 compliance
2. ✅ Enforce UNIQUE on `name` → Consistency with other entities
3. ✅ Migrate `tags TEXT[]` to F-03 `entity_tags` → Single tag system
4. ✅ Role field: enum (consumer/producer/owner) → Strict validation
5. ✅ `isSourceOfTruth` maintained → Data governance marker

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

| Issue | Severity | Action | Timeline | Status |
|-------|----------|--------|----------|--------|
| FS-05 schema inconsistencies (missing description/comment/updatedAt) | ✅ Resolved | Documented in FS-05-BACK spec §1 (migration) + §2.2 (Prisma) | Before backend impl | ✅ DONE |
| FS-05 name uniqueness not enforced | ✅ Resolved | Decided: enforce UNIQUE — documented in spec | Before backend impl | ✅ DONE |
| FS-07 requires Task 0.9 | High | Complete WITH RECURSIVE R&D | Before FS-07-BACK spec | Pending |
| F-999 #12b Users API mock not implemented | High | Implement API endpoint | Sprint 3 P1 | Pending |
| F-999 #13 Tag dimensions hardcoded | High | Connect to API | Sprint 3 P1 | Pending |
| F-999 #14 Batch tags endpoint missing | Medium | Implement endpoint | Sprint 3 P1 | Pending |

---

## Build & Deployment Status

✅ **Frontend**: Builds successfully (Vite production build 980KB gzipped)
✅ **Backend**: All modules compile, no TypeScript errors
✅ **Database**: All migrations applied, 5 entities seeded (FS-02, FS-03, FS-04, FS-06, tags)
✅ **Routing**: All 4 Sprint 2 entity routes live in App.tsx
✅ **Auth**: JwtAuthGuard global, permissions seeded for all entities
✅ **Cypress Tests**: 34 Providers tests created, ready to run
✅ **FS-05-BACK Spec**: v1.0 written, 996 lines, ready for implementation

**Last successful commit**: `7e8730c` — FS-05-BACK spec v1.0 + Roadmap v0.15 update

---

## Reference Materials

### Specification Templates
- `docs/03-Features-Spec/_template_back.md` — Use for FS-07-BACK specs
- `docs/03-Features-Spec/_template_front.md` — Use for FS-05-FRONT, FS-07-FRONT specs
- Reference completed specs: `FS-02-Domains-back.md`, `FS-03-Providers-back.md`, `FS-04-IT-Components-back.md`, **`FS-05-Data-Objects-back.md`** (v1.0 stable)

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
- **Current Roadmap**: `docs/01-Product/ARK-Roadmap.md` (v0.15 — FS-05-BACK spec `stable`)
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
1. ✅ FS-05-BACK spec ready — `docs/03-Features-Spec/FS-05-Data-Objects-back.md` v1.0
2. 🔨 **Start FS-05 backend implementation** — Use §8 (Commande OpenCode) from spec
3. 📝 Write FS-05-FRONT spec when BACK is `done` (gates G-01 to G-13 must pass)
4. Proceed with Task 0.9 (WITH RECURSIVE SQL validation) in parallel to unblock FS-07-BACK
5. Check `F99-Technical-Debt.md` for P1 items (#12b, #13, #14) to parallelize

---

## Final Notes

**Sprint 2 Status**: ✅ COMPLETE — 5/5 satellite entities delivered (FS-02, FS-03, FS-04, FS-06 + FS-01). All routes live, tests passing, Roadmap v0.14.

**Sprint 3 Status**:
- ✅ **FS-05-BACK**: Spec v1.0 `stable` (commit `7e8730c`) — ready for backend implementation
- 🔧 **FS-05-FRONT**: Blocked until FS-05-BACK is `done` (gates G-01 to G-13 pass)
- ⏳ **FS-07-BACK**: Blocked by Task 0.9 (WITH RECURSIVE SQL validation) — spec writing starts after Task 0.9
- 📋 **Tech Debt P1**: Items #12b, #13, #14 should be prioritized alongside feature development

**Recommended sequence** (Sprint 3):
1. 🔨 **Implement FS-05-BACK** (0.5j) — Use spec §8 (OpenCode prompt) — gates G-01 to G-13
2. 🔄 **In parallel: Task 0.9** (0.5j) — WITH RECURSIVE SQL validation for FS-07
3. 📝 **Write FS-05-FRONT spec** (0.5j) — After FS-05-BACK `done`
4. 🔨 **Implement FS-05-FRONT** (1j) — 4 pages (List/Detail/New/Edit)
5. 📝 **Write FS-07-BACK spec** (1j) — After Task 0.9 completes
6. 🔨 **Implement FS-07-BACK + FRONT** (3j) — End of Sprint 3
7. 🔄 **Parallelize F-999 P1 items** (#12b Users API, #13 Tag dims, #14 Batch endpoint)

**Next session target**: FS-05-BACK module fully implemented, tests passing, gates validated, ready for FS-05-FRONT spec

---

_Document updated: 2026-04-01_
_Purpose: Sprint 3 development — FS-05-BACK spec delivery + backend implementation readiness_
_Branch: develop (commit 7e8730c)_
_Next session: Backend implementation (FS-05-BACK OpenCode) + Task 0.9 SQL R&D_
