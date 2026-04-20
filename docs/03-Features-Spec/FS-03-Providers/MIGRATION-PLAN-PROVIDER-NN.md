# Migration Plan: Provider 1:N → N:N with Roles

**Date:** Mars 2026
**Status:** Specs Updated ✅
**Next Step:** Backend Implementation

---

## Executive Summary

The ARK-EPM system has evolved to support **multiple providers per application** with distinct roles (editor, integrator, support, etc.). This document outlines:

1. ✅ **Spec Changes (COMPLETED)**
   - FS-03-BACK updated to v1.3 (Provider changes)
   - FS-06-BACK updated to v1.2 (Application changes)
   
2. 📋 **Implementation Roadmap**
   - Database migration steps
   - Backend code changes
   - Frontend adaptations
   - Test requirements

3. 📊 **Impact Analysis**
   - 20+ files affected
   - 161 insertions, 75 deletions in specs
   - Zero breaking changes if implemented correctly

---

## 1. Spec Changes Summary

### FS-03-BACK (Providers) — Version 1.3

**Key Changes:**
- **Model:** Relation changed from 1:N to N:N via `app_provider_map` junction table
- **Prisma:** New `ApplicationProviderMap` model added
- **Rule RM-03:** Updated to check `_count.appProviderMaps` instead of `_count.applications`
- **New Rule RM-08:** Documents optional provider role field in N:N relationship

**Table Change:**
```sql
-- OLD: providers.applications[] via FK applications.provider_id
-- NEW: providers.appProviderMaps[] via junction table with role field
```

### FS-06-BACK (Applications) — Version 1.2

**Key Changes:**
- **Model:** Removed FK `providerId`, added `appProviderMaps` N:N relation
- **DTOs:** 
  - `providerId?: string` → `providers?: Array<{id, role}>`
  - Both Create and Update DTOs changed
- **Response Schema:**
  - `provider?: {...}` → `providers: Array<{id, name, role}>`
  - Both `ApplicationListItem` and `ApplicationResponse` updated
- **Rules:**
  - RM-02 adapted for validating each provider in array
  - RM-03 includes `appProviderMaps` in dependency check
  - New RM-08: Optional role field documentation

**Tests Updated:**
- 15+ new test cases for N:N scenarios
- Tests verify role assignment, multiple providers, cascading deletes

---

## 2. Database Migration

### SQL Commands

```sql
-- Step 1: Create junction table
CREATE TABLE app_provider_map (
  application_id UUID NOT NULL,
  provider_id UUID NOT NULL,
  provider_role VARCHAR(50),
  added_at TIMESTAMPTZ DEFAULT NOW(),
  
  PRIMARY KEY (application_id, provider_id),
  FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE,
  FOREIGN KEY (provider_id) REFERENCES providers(id) ON DELETE CASCADE
);

-- Step 2: Migrate existing data
INSERT INTO app_provider_map (application_id, provider_id, added_at)
SELECT id, provider_id, NOW()
FROM applications
WHERE provider_id IS NOT NULL;

-- Step 3: Remove old FK
ALTER TABLE applications DROP COLUMN provider_id;

-- Step 4: Create index for performance
CREATE INDEX idx_app_provider_map_app ON app_provider_map(application_id);
CREATE INDEX idx_app_provider_map_prov ON app_provider_map(provider_id);
```

### Prisma Migration

1. Update `schema.prisma` with new models (already in updated spec)
2. Run `npx prisma migrate dev --name add_app_provider_n_n`
3. Verify schema matches spec

---

## 3. Backend Implementation Checklist

### Files to Modify

#### Core Services
- [ ] `backend/src/applications/applications.service.ts`
  - Update `create()` to handle `providers[]`
  - Update `update()` to replace provider mappings
  - Update `remove()` to check `appProviderMaps`
  - Update `findOne()` to populate providers with roles
  - Add helper method: `setApplicationProviders(appId, providers[])`

- [ ] `backend/src/providers/providers.service.ts`
  - Update `remove()` to check `_count.appProviderMaps`

#### DTOs
- [ ] Create: `backend/src/applications/dto/provider-mapping.dto.ts`
  ```typescript
  export class ProviderMappingDto {
    @IsUUID() id: string;
    @IsOptional() @IsString() role?: string;
  }
  ```

- [ ] Modify: `backend/src/applications/dto/create-application.dto.ts`
  - Remove `providerId`
  - Add `@IsOptional() @IsArray() @ArrayMinSize(0) providers?: ProviderMappingDto[]`

- [ ] Modify: `backend/src/applications/dto/update-application.dto.ts`
  - Same changes as CreateApplicationDto

- [ ] Modify: `backend/src/applications/dto/application-response.dto.ts`
  - Change `provider?: {id, name}` to `providers: Array<{id, name, role}>`

#### Controllers
- [ ] `backend/src/applications/applications.controller.ts`
  - Ensure OpenAPI documentation reflects new providers structure

#### Tests - Backend

**Unit Tests (`**/applications.service.spec.ts`):**
- [ ] Test `create()` with `providers: [{id, role}]`
- [ ] Test `create()` validates each provider exists
- [ ] Test `update()` replaces provider mappings
- [ ] Test `findOne()` populates `providers[]`
- [ ] Test `remove()` checks `appProviderMaps` count

**E2E Tests (`backend/test/FS-06-applications.e2e-spec.ts`):**
- [ ] `POST /applications` with multiple providers
- [ ] `PATCH /applications/{id}` changes providers
- [ ] `DELETE` fails if providers linked
- [ ] Response includes `providers[]` with roles

---

## 4. Frontend Implementation Checklist

### Types & Hooks
- [ ] Update `src/types/application.ts`
  - Change `provider?: Provider` to `providers: ProviderWithRole[]`
  - Define `ProviderWithRole { id, name, role? }`

- [ ] Update `src/hooks/useApplication.ts`
  - Adapt to handle `providers[]`

- [ ] Update `src/hooks/useApplications.ts`
  - Adapt to handle `providers[]` in list

#### Components
- [ ] **ApplicationForm.tsx**
  - Change single-select to multi-select for providers
  - Add role field for each provider
  - Test: Add/remove provider, set roles

- [ ] **ApplicationListPage.tsx**
  - Display providers as chips/tags
  - Show roles if available

- [ ] **ApplicationDetailPage.tsx**
  - Display providers array
  - Show edit link to form

- [ ] **ProviderSelect.tsx** (new or updated)
  - Multi-select with role input
  - Shows provider name + role badges

#### Tests - Frontend
- [ ] ApplicationForm: Multi-select providers
- [ ] ApplicationForm: Set roles for each
- [ ] ApplicationDetailPage: Display providers
- [ ] API integration: Verify providers[] in request/response

---

## 5. Seeding Strategy

### Current Status
- 8 providers already seeded in `backend/prisma/seed.ts` ✅
- No application-provider mappings in seed yet ⚠️

### Options
**Option A (Recommended for P1):** Keep seed as-is
- Applications created without providers
- Users can manually assign in UI
- Fast, minimal risk

**Option B (Better UX):** Add example mappings
- After seeding applications, create 3-4 example mappings
- Shows N:N feature in action
- Minimal performance cost

**Suggested Implementation (Option B):**
```typescript
// Add to seed.ts after applications created
const exampleMappings = [
  { appName: 'Salesforce Integration', providerName: 'Salesforce', role: 'editor' },
  { appName: 'Salesforce Integration', providerName: 'Atlassian', role: 'integrator' },
  { appName: 'Data Warehouse', providerName: 'Snowflake', role: 'editor' },
];
// Create entries in app_provider_map
```

---

## 6. Migration Validation Gates

Add these gates to FS-03-BACK and FS-06-BACK:

### G-15: Database Schema
- [ ] Table `app_provider_map` exists with correct columns
- [ ] Indexes created on (application_id, provider_id)
- [ ] Existing provider_id data migrated
- [ ] Foreign keys have CASCADE delete

### G-16: Backend Models
- [ ] `ApplicationProviderMap` model in Prisma schema
- [ ] `Provider.appProviderMaps` relation defined
- [ ] `Application.appProviderMaps` relation defined
- [ ] Removed `Application.providerId` FK

### G-17: DTO Contracts
- [ ] CreateApplicationDto uses `providers[]`
- [ ] UpdateApplicationDto uses `providers[]`
- [ ] ApplicationResponse uses `providers[]` with roles
- [ ] ProviderMappingDto defined and exported

### G-18: Service Logic
- [ ] `ApplicationsService.create()` creates appProviderMaps
- [ ] `ApplicationsService.update()` replaces provider mappings
- [ ] `ApplicationsService.remove()` checks appProviderMaps count
- [ ] `ProvidersService.remove()` checks appProviderMaps count
- [ ] Endpoint responses include providers with roles

### G-19: Tests Pass
- [ ] Backend unit tests: `npm run test -- ApplicationsService`
- [ ] Backend E2E tests: `npm run test:e2e -- FS-06`
- [ ] Provider deletion tests include N:N check

### G-20: Frontend Compatibility
- [ ] ApplicationForm accepts and submits `providers[]`
- [ ] ApplicationDetailPage displays `providers[]`
- [ ] All role values display correctly
- [ ] No console errors related to provider changes

---

## 7. Risk Assessment

### Low Risk
✅ Database: Clear migration path, no data loss
✅ Specs: Comprehensive documentation updated
✅ Tests: Already defined in updated specs

### Medium Risk
⚠️ Frontend: Form refactoring (single → multi-select)
⚠️ API: Response structure change requires frontend update

### Mitigation
- **API Versioning:** Consider `/api/v2/applications` during transition
- **Frontend Testing:** Comprehensive component tests for multi-select
- **Rollback Plan:** Keep v1 queries available if needed

---

## 8. Implementation Timeline

```
Phase 1: Database & Models (1 day)
├─ Create migration
├─ Update Prisma schema
└─ Run migrations in dev/staging

Phase 2: Backend Services (2 days)
├─ Update service logic
├─ Create ProviderMappingDto
├─ Update all DTOs
└─ Write unit & E2E tests

Phase 3: Frontend (1.5 days)
├─ Update type definitions
├─ Update hooks/queries
├─ Refactor ApplicationForm
└─ Update detail/list pages

Phase 4: Validation & Testing (1 day)
├─ E2E testing
├─ Manual QA
└─ Validation against gates

Total: ~5.5 days
```

---

## 9. Success Criteria

- ✅ All database migrations applied cleanly
- ✅ All tests pass (unit + E2E + frontend)
- ✅ Applications can link to multiple providers
- ✅ Each provider link can have a role
- ✅ Deleting provider blocks if linked via appProviderMap
- ✅ Frontend form accepts and manages multiple providers
- ✅ No breaking changes for existing applications with single provider
- ✅ Documentation updated in openapi.yaml

---

## 10. Known Unknowns

- [ ] Should roles be validated against an enum or free text? → **Decision: Free text (RM-08)**
- [ ] Should provider role be editable in ApplicationDetailPage? → **Needs design decision**
- [ ] API versioning needed during transition? → **Likely not needed (v1.2)**
- [ ] Should deleting last provider cascade? → **No, just removes mapping**

---

## References

- **FS-03-BACK v1.3:** Provider backend spec (N:N model definition)
- **FS-06-BACK v1.2:** Application backend spec (N:N consumption)
- **AGENTS.md:** Coding conventions and patterns
- **ARK-NFR.md:** Non-functional requirements

---

_Migration Plan v1.0 — ARK-EPM_
