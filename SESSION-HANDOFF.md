# SESSION-HANDOFF.md — FS-03-FRONT Implementation

> 🤖 **AGENT ACTIF** : [front] | **MISSION** : FS-03-FRONT Providers Pages | **SPRINT** : FS-03

---

## Context

The ARK-EPM project is at a critical juncture:
- **Sprint 2 Progress:** 5 of 6 satellite entities are complete (83%)
- **Blocker:** FS-03-FRONT (Providers frontend) — 0 pages exist
- **Impact:** Blocks Sprint 2 completion, prevents tech debt resolution (F-999 Items #12, #15)

### Why This is Priority

1. **Backend is done** ✅ — API fully implemented with N:N relationships, provider roles, full CRUD
2. **Spec is written** ✅ — FS-03-Providers-front.md v1.1 is `stable` and comprehensive
3. **Pattern exists** ✅ — IT Components frontend (FS-04-FRONT) completed with PNS-02 drawer pattern; Domains frontend (FS-02-FRONT) provides reference
4. **Unblocks downstream** ✅ — Will allow commenting Provider routes back in, resolve mock-data issues in ApplicationForm

---

## Deliverables

Implement **4 React pages** following the **PNS-02 pattern** (read-only side drawer + full detail page):

| Page | Route | Status | Pattern |
|------|-------|--------|---------|
| **ProvidersListPage** | `/providers` | 🔴 Missing | PNS-02 + table + drawer |
| **ProviderDetailPage** | `/providers/:id` | 🔴 Missing | Full detail + tabs |
| **ProviderNewPage** | `/providers/new` | 🔴 Missing | Form wrapper |
| **ProviderEditPage** | `/providers/:id/edit` | 🔴 Missing | Form wrapper |

Plus supporting components:
- **ProvidersDrawer** — Read-only side drawer (400px, right anchor)
- **ProviderForm** — Shared create/edit form
- **ApplicationListInDrawer** — Paginated application list (5/page) with provider role badges
- **ApplicationListTable** — Detail page applications (20/page) with provider role badges

---

## Spec Reference

**Full spec:** `docs/03-Features-Spec/FS-03-Providers-front.md` (v1.1 — 1227 lines)

**Key sections:**
- §2 User Stories (US-01 through US-11) — Complete interaction flows
- §3 API Contract — 6 endpoints, HTTP codes, permission requirements
- §4 Layout Contract — YAML blueprints for all pages/components

**Critical dependencies:**
- FS-03-BACK v1.3 — ✅ Done (N:N relationships, provider roles)
- FS-06-BACK v1.2 — ✅ Done (Applications with N:N providers)
- F-03 (Tags) — ✅ Done (DimensionTagInput available)
- F-02 (i18n) — ✅ Done (326 keys in fr.json, includes provider keys)

---

## Implementation Checklist

### Pre-Implementation

- [ ] **Read full spec** — FS-03-Providers-front.md in full
- [ ] **Review patterns** — Examine FS-02-Domains-front and FS-04-IT-Components-front as reference implementations
- [ ] **Verify i18n** — Check `frontend/src/i18n/locales/fr.json` for `providers.*` keys (should already exist)
- [ ] **Check backend API** — Verify endpoints via `make get-token && curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/v1/providers | jq`
- [ ] **Verify routes commented out** — Confirm Provider routes are commented in `frontend/src/App.tsx` (lines ~71-77)

### Phase 1: Scaffolding & API Client (Day 1 — ~2–3 hours)

- [ ] Create `frontend/src/pages/providers/` directory structure
- [ ] Create `frontend/src/components/providers/` directory for component files
- [ ] Create `frontend/src/api/providers.ts` API client with hooks:
  - `useProviders()` — GET /providers (paginated, filtered)
  - `useProvider(id)` — GET /providers/:id
  - `useProviderApplications(id, page)` — GET /providers/:id/applications
  - `createProvider()` — POST /providers
  - `updateProvider(id, data)` — PATCH /providers/:id
  - `deleteProvider(id)` — DELETE /providers/:id
- [ ] Create `frontend/src/types/provider.ts` with TypeScript interfaces:
  - `Provider`, `ProviderResponse`, `CreateProviderDto`, `UpdateProviderDto`, `ProviderApplication`
  - **CRITICAL:** Include `providerRole` field in application list responses (N:N requirement from v1.1)

### Phase 2: List Page & Drawer (Day 1 — ~3–4 hours)

**ProvidersListPage.tsx**
- [ ] Page wrapper with auth/permission guards
- [ ] Title + subtitle via PageHeader
- [ ] Filter bar:
  - [ ] Search input (debounced, calls API)
  - [ ] Contract type filter (dynamic from API or hardcoded options)
  - [ ] Expiration filter (30/90/180 days)
- [ ] Table with columns:
  - [ ] Name (link to detail)
  - [ ] Contract Type
  - [ ] Expiry Date (with colored badges: red <30d "URGENT", orange <90d "ALERTE")
  - [ ] Tags (TagChipList with deduplication)
  - [ ] Applications count
  - [ ] Actions (⋮ menu → Edit/Delete)
- [ ] Pagination (server-side, 20 rows/page)
- [ ] Loading skeleton + empty state
- [ ] Delete confirmation dialog with DEPENDENCY_CONFLICT handling
- [ ] Success/error alerts (ArkAlert)
- [ ] Drawer integration (open/close on row click)

**ProvidersDrawer.tsx**
- [ ] 400px right-anchor drawer with backdrop
- [ ] Tabs: "Info" + "Applications"
- [ ] Info tab:
  - [ ] Name, description, contractType, expiryDate, tags (TagChipList)
  - [ ] All fields read-only
- [ ] Applications tab:
  - [ ] ApplicationListInDrawer — paginated list (5/page)
  - [ ] Columns: name, domain, owner, criticality, **providerRole** (badge)
  - [ ] Provider role colors:
    - `editor` → primary (bleu)
    - `integrator` → secondary (orange)
    - `support` → info (cyan)
    - `vendor` → warning (jaune)
    - `custom` → default (gris)
- [ ] Footer buttons:
  - [ ] "Modifier" (contained, disabled if no write permission)
  - [ ] "Voir fiche" (outlined)
- [ ] Close button (top right)

### Phase 3: Detail Page (Day 2 — ~2 hours)

**ProviderDetailPage.tsx**
- [ ] Page wrapper with auth/permission guards
- [ ] Breadcrumbs: Providers > [Name]
- [ ] Tabs: "General" + "Applications"
- [ ] General tab:
  - [ ] Name (h3), description, comment (Typography)
  - [ ] Contract Type, Expiry Date
  - [ ] Tags (TagChipList)
  - [ ] Created/Modified metadata
- [ ] Applications tab:
  - [ ] ApplicationListTable — 20 rows/page
  - [ ] Columns: name, domain, owner, criticality, **providerRole** (badge)
  - [ ] Same role colors as drawer
- [ ] Action buttons (bottom right):
  - [ ] "Modifier" (contained, disabled if no write permission)
  - [ ] "Supprimer" (outlined red)
- [ ] Loading + error states
- [ ] 404 handling if provider not found

### Phase 4: Create/Edit Pages & Form (Day 2 — ~3 hours)

**ProviderForm.tsx** (shared)
- [ ] Form fields:
  - [ ] `name` (required, unique validation → inline error on 409 CONFLICT)
  - [ ] `description` (optional, textarea)
  - [ ] `comment` (optional, textarea)
  - [ ] `contractType` (optional, text field — no dropdown, user-defined in P1)
  - [ ] `expiryDate` (optional, MUI DatePicker, format DD/MM/YYYY)
  - [ ] `tags` (optional, DimensionTagInput)
- [ ] Validation:
  - [ ] Required field markers (*)
  - [ ] Inline errors on blur/change
  - [ ] 400 validation errors → field errors
  - [ ] 409 CONFLICT → name field error
- [ ] Buttons:
  - [ ] "Enregistrer" (create or update)
  - [ ] "Annuler" (return to list or detail)
- [ ] Post-success:
  - [ ] Navigate to detail page with success alert
  - [ ] Success message: `t('providers.alert.success.created')` or `...updated`

**ProviderNewPage.tsx**
- [ ] Wrapper around ProviderForm
- [ ] Page title: `t('providers.form.newTitle')`
- [ ] Mode: `create`
- [ ] Post-submit: navigate `/providers/:newId`

**ProviderEditPage.tsx**
- [ ] Wrapper around ProviderForm
- [ ] Load provider via `useProvider(id)`
- [ ] Pre-fill form with provider data
- [ ] Page title: `t('providers.form.editTitle')`
- [ ] Mode: `update`
- [ ] Post-submit: stay on detail page with success alert

### Phase 5: Routing & Integration (Day 2 — ~1 hour)

- [ ] Uncomment Provider routes in `frontend/src/App.tsx` (lines 71–77 and imports 20–23)
- [ ] Verify routing works:
  - [ ] `/providers` → list page
  - [ ] `/providers/new` → create form
  - [ ] `/providers/:id` → detail page
  - [ ] `/providers/:id/edit` → edit form
- [ ] Test with browser hard refresh (Ctrl+F5)

### Phase 6: Cypress E2E Tests (Day 3 — ~2–3 hours)

**frontend/cypress/e2e/providers.cy.ts**
- [ ] Login flow (via `cy.loginAsReadOnly()`)
- [ ] Navigate to list page
- [ ] Verify table renders with seeded providers
- [ ] Test drawer open/close (row click)
- [ ] Test drawer navigation (Edit, View Detail buttons)
- [ ] Test detail page navigation (breadcrumb, back button)
- [ ] Test create flow (fill form, save, verify detail page)
- [ ] Test edit flow (open edit, change field, save)
- [ ] Test delete with confirmation dialog
- [ ] Test DEPENDENCY_CONFLICT message (if applicable)
- [ ] Test filter & search
- [ ] Test pagination
- [ ] Test permission guard (403 if no `providers:write`)
- [ ] ~40–50 test cases (following FS-02-Domains-front precedent)

---

## API Contract Summary

**Endpoints (all require `providers:read`; write endpoints require `providers:write`):**

| Method | Route | Params | Response |
|--------|-------|--------|----------|
| GET | `/api/v1/providers` | `page`, `limit`, `sortBy`, `sortOrder`, `search`, `contractType`, `expiryDate` | `{ data: [], meta: { page, limit, total, totalPages } }` |
| POST | `/api/v1/providers` | body: `{ name, description?, comment?, contractType?, expiryDate?, tags? }` | `{ id, name, ... }` |
| GET | `/api/v1/providers/:id` | — | `{ id, name, description, comment, contractType, expiryDate, tags, _count, createdAt, updatedAt }` |
| PATCH | `/api/v1/providers/:id` | body: same as POST | `{ id, name, ... }` |
| DELETE | `/api/v1/providers/:id` | — | `200 OK` or `409 DEPENDENCY_CONFLICT` |
| GET | `/api/v1/providers/:id/applications` | `page`, `limit` | `{ data: [{ id, name, domain, owner, criticality, providerRole? }], meta }` |

**Error codes:**
- `400` VALIDATION_ERROR → inline field errors
- `401` UNAUTHORIZED → redirect to login
- `403` FORBIDDEN → redirect to /403
- `404` NOT_FOUND → redirect to list
- `409` CONFLICT → name duplicate, inline error
- `409` DEPENDENCY_CONFLICT → delete blocked, show in dialog
- `5xx` → ArkAlert error

---

## i18n Keys Required

All keys should already exist in `frontend/src/i18n/locales/fr.json` (added in Sprint 2).
Verify existence:
```bash
grep -E 'providers\.|providerRole' frontend/src/i18n/locales/fr.json
```

Expected key groups:
- `providers.list.*` — List page labels, columns
- `providers.drawer.*` — Drawer labels, buttons
- `providers.form.*` — Form labels, validation
- `providers.alert.*` — Success/error messages
- `providers.detail.*` — Detail page labels
- `applications.list.columns.providerRole` — Role column header (v1.1)

If any missing, add them before implementation.

---

## File Structure

```
frontend/src/
├── pages/providers/
│   ├── ProvidersListPage.tsx          ← Main list with drawer
│   ├── ProviderDetailPage.tsx         ← Full detail + tabs
│   ├── ProviderNewPage.tsx            ← Wrapper for create
│   └── ProviderEditPage.tsx           ← Wrapper for edit
├── components/providers/
│   ├── ProvidersDrawer.tsx            ← Read-only side drawer
│   ├── ProviderForm.tsx               ← Shared form (create/edit)
│   ├── ApplicationListInDrawer.tsx    ← Paginated list in drawer (5/page)
│   ├── ApplicationListTable.tsx       ← List in detail page (20/page)
│   ├── ProviderRoleBadge.tsx          ← Role badge component (NEW v1.1)
│   └── index.ts                       ← Barrel export
├── api/
│   └── providers.ts                   ← API client + hooks
├── types/
│   └── provider.ts                    ← TypeScript interfaces
└── i18n/locales/
    └── fr.json                        ← i18n keys (already added)
```

---

## Key Implementation Notes

### 1. PNS-02 Pattern (Read-Only Drawer)

The drawer is **read-only** — no inline editing in drawer. Navigation to edit page for changes.
- ✅ View details in drawer
- ✅ Navigate to full detail page from drawer
- ✅ Navigate to edit page from drawer (button "Modifier")
- ❌ Edit in drawer (not in scope for v1.0)

This is consistent with FS-02-Domains-front and FS-04-IT-Components-front.

### 2. Provider Role Badges (v1.1 — NEW)

Providers can now have different roles per application (N:N relationship via `app_provider_map.provider_role`).

When displaying applications linked to a provider:
- Show badge with role: `editor`, `integrator`, `support`, `vendor`, or custom
- Use colors: primary (blue), secondary (orange), info (cyan), warning (yellow), default (gray)
- Only in **read-only** contexts (drawer tabs, detail page)
- **Editing** roles is delegated to FS-06-FRONT ApplicationForm (provider selector with role dropdown)

Use `ProviderRoleBadge.tsx` component to render consistently.

### 3. Deduplication & Empty Dimensions

Tags are displayed via `TagChipList` (from F-03).
- Apply `deduplicateByDepth()` — only deepest tags per dimension shown
- Hide dimensions with no tags
- Reference: FS-02-Domains-front §3.2 shows the pattern

### 4. Unique Name Validation

The `name` field must be unique. Backend returns `409 CONFLICT` on duplicate.
- Inline error: `t('providers.form.nameDuplicate')`
- Disable save button until name is unique (client-side debounce check optional, server validates)
- Reference: FS-02-Domains-front handles this pattern

### 5. Date Formatting & Badges

Expiry dates:
- Format: `DD MMM YYYY` in French (e.g., "31 déc. 2025")
- Badges:
  - Red "URGENT" if < 30 days
  - Orange "ALERTE" if < 90 days
  - Normal text otherwise
- Use `date-fns` for formatting, `isAfter(date, addDays(now, 30))` for comparisons

### 6. Pagination & Server-Side Sorting

- List page: 20 rows/page (server-side pagination)
- Applications in drawer: 5 rows/page (server-side pagination)
- Applications in detail: 20 rows/page (server-side pagination)
- Sorting: via `sortBy` + `sortOrder` query params to API

Reference: FS-02-Domains-front uses this pattern with PaginationQueryDto.

### 7. Permissions & RBAC

Guards:
- Page access: `providers:read` (all pages)
- Edit/Delete buttons: `providers:write` (grisé if no permission)
- Use `hasPermission()` from Zustand auth store

Reference: `frontend/src/store/auth.ts` has helper function.

### 8. Loading & Error States

- Loading: Show `LoadingSkeleton` while data fetches
- Empty: Show `EmptyState` with CTA to create
- Error 404: Navigate to list (provider not found)
- Error 409 DEPENDENCY_CONFLICT: Show in delete dialog with link to applications
- Error 5xx: Show ArkAlert at top of page
- 401/403: Handled by Axios interceptor (redirect to login or /403)

Reference: FS-02-Domains-front handles all these cases.

---

## Testing Strategy

### Manual Testing (Before Cypress)

1. **Create a provider**
   - Navigate `/providers/new`
   - Fill form (name, description, contract type, expiry date, tags)
   - Save → should redirect to detail page with success alert

2. **View list**
   - Navigate `/providers`
   - Verify seeded providers render
   - Test search, filters, sorting
   - Verify pagination

3. **Drawer interaction**
   - Click row (not name) → drawer opens
   - Verify read-only content
   - Click "Voir fiche" → navigate to detail
   - Click "Modifier" → navigate to edit
   - Click close (X) → drawer closes

4. **Detail page**
   - Navigate `/providers/:id`
   - Verify all fields display
   - Check Applications tab (should show linked applications)
   - Verify role badges display on applications

5. **Edit provider**
   - Click "Modifier" from detail or drawer
   - Change a field
   - Save → redirect to detail with success alert

6. **Delete provider**
   - Click Actions → Delete
   - If dependencies exist: show DEPENDENCY_CONFLICT message, disable confirm button
   - If no dependencies: show confirmation, delete on confirm → redirect to list with success alert

7. **Permissions**
   - Logout, login as user without `providers:write`
   - Verify "Modifier", "Supprimer", "New" buttons are disabled or hidden

### Cypress E2E Tests

40–50 automated test cases covering all user stories (US-01 through US-11).
See §6 Implementation Checklist — Phase 6.

---

## Deployment & Release Notes

Upon completion:

1. **Git commit**
   ```bash
   git add frontend/src/pages/providers/ frontend/src/components/providers/ frontend/src/api/providers.ts frontend/src/types/provider.ts frontend/cypress/e2e/providers.cy.ts frontend/src/App.tsx
   git commit -m "FS-03-FRONT: Implement Providers pages (list, detail, new, edit) with PNS-02 drawer and role badges (v1.1)"
   ```

2. **Update roadmap** — Change FS-03-FRONT status from `draft` to `done`

3. **Release notes** (v0.6.0)
   ```
   ### FS-03 Providers Frontend ✅
   - Implement ProvidersListPage (paginée, filtres, tri)
   - Implement ProvidersDrawer (read-only, PNS-02 pattern)
   - Implement ProviderDetailPage (tabs: Info, Applications)
   - Implement ProviderNewPage & ProviderEditPage (forms)
   - Add support for N:N provider roles (editor, integrator, support, vendor)
   - Add provider role badges in application lists (drawer + detail)
   - Uncomment Provider routes in App.tsx
   - Add ~50 Cypress e2e tests
   - Resolves F-999 Item #15 (commented routes)
   ```

4. **Unblock next phase**
   - Sprint 2 is complete (6/6 satellites done)
   - Tech debt Items #12, #13, #14 can now be prioritized
   - FS-05 (Data Objects) ready for implementation

---

## Reference Implementations

**Study these files for patterns:**

1. **FS-02-Domains-front** — Foundational pattern (list + drawer + detail)
   - `frontend/src/pages/domains/DomainsListPage.tsx`
   - `frontend/src/components/domains/DomainsDrawer.tsx`
   - `frontend/src/pages/domains/DomainDetailPage.tsx`
   - `frontend/cypress/e2e/domains.cy.ts`

2. **FS-04-IT-Components-front** — More complex pattern (with additional filters)
   - `frontend/src/pages/it-components/ITComponentListPage.tsx`
   - `frontend/src/components/it-components/ITComponentDrawer.tsx` (if exists)
   - `frontend/cypress/e2e/04-it-components.spec.ts`

3. **FS-06-Applications-front** — Most complex pattern (with DimensionTagInput in form)
   - `frontend/src/pages/applications/ApplicationsListPage.tsx`
   - `frontend/src/pages/applications/ApplicationEditPage.tsx`
   - `frontend/src/components/applications/ApplicationForm.tsx`

**Key utilities:**
- `frontend/src/api/client.ts` — Axios instance, interceptors
- `frontend/src/store/auth.ts` — `hasPermission()` helper
- `frontend/src/i18n/index.ts` — i18n setup
- `frontend/src/components/shared/ArkAlert.tsx` — Global alert component
- `frontend/src/components/tags/DimensionTagInput.tsx` — Tag input (F-03)
- `frontend/src/components/tags/TagChipList.tsx` — Tag display with deduplication

---

## Success Criteria

✅ **Sprint 2 Completion:**
- [ ] All 4 pages exist and route correctly
- [ ] ProvidersListPage displays seeded providers with filters & pagination
- [ ] ProvidersDrawer opens on row click, closes on close/backdrop click
- [ ] ProviderDetailPage shows all fields + applications tab
- [ ] ProviderNewPage & ProviderEditPage save correctly
- [ ] Forms validate and show inline errors
- [ ] 409 DEPENDENCY_CONFLICT handled in delete dialog
- [ ] Permissions respected (buttons disabled if no write)
- [ ] Tags display with deduplication
- [ ] Provider role badges display on applications (v1.1)
- [ ] Provider routes uncommented in App.tsx
- [ ] ~50 Cypress tests pass
- [ ] No TypeScript errors (`npm run build` succeeds in frontend)

✅ **Unblock downstream:**
- [ ] FS-03-FRONT marked `done` in roadmap
- [ ] Sprint 2 marked complete
- [ ] Tech debt Items #12, #15 can be addressed
- [ ] FS-05 ready to start

---

## Estimated Timeline

- **Phase 1 (Scaffolding):** ~3 hours
- **Phase 2 (List + Drawer):** ~4 hours
- **Phase 3 (Detail):** ~2 hours
- **Phase 4 (Forms):** ~3 hours
- **Phase 5 (Routing):** ~1 hour
- **Phase 6 (Cypress):** ~3 hours

**Total:** ~16–18 hours ≈ **2 days** (with breaks, testing, debugging)

---

## Questions & Blockers

**Known issues to check:**
- Are all Provider i18n keys in `fr.json`? (Check before starting)
- Are seeded providers in backend database? (Verify with `GET /api/v1/providers`)
- Are Provider routes commented correctly in App.tsx? (Verify lines ~71–77)
- Do ApplicationListInDrawer & ApplicationListTable components exist? (Check if need to create new or adapt from domains)

**If blocked:**
1. Verify FS-03-BACK is running (`make docker-up`, `make test-api-backend`)
2. Check browser DevTools Network tab for API errors
3. Review console for TypeScript errors (hard refresh with Ctrl+F5)
4. Verify auth token is valid (`make get-token`)

---

## Final Notes

This is **Sprint 2's final blocker**. Once complete:
- ✅ All foundational entities (Domains, Providers, IT Components, Applications) have full CRUD UI
- ✅ Sprint 2 is marked complete
- ✅ Sprint 3 can begin (Business Capabilities, Interfaces, Graph visualization)
- ✅ Tech debt can be resolved (real APIs replacing mocks)

**No changes needed to roadmap or specs** — just implementation following the stable FS-03-Providers-front v1.1 specification.

Good luck! 🚀

---

_Document created: 2026-03-28_
_Prepared by: Architecture Agent [arch]_
_For: Frontend Agent [front]_
