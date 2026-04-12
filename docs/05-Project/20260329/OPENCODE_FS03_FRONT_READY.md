# 🚀 OpenCode Session Ready — FS-03-Providers-front

**Status:** ✅ READY TO LAUNCH  
**Date:** Mars 2026  
**Estimé:** 0.5 day

---

## ✅ Session Checklist

### Pre-Implementation (All Done ✅)

- [x] **FS-03-Providers-front.md created** (v1.0, stable, 1,106 lines)
  - [x] All sections complete (§1–§12)
  - [x] Layout Contract (YAML) for 4 pages
  - [x] 55+ i18n keys defined
  - [x] 12 business rules
  - [x] 16 Cypress test cases
  - [x] 15 validation gates
  - [x] OpenCode command (§10)

- [x] **i18n keys added** to `frontend/src/i18n/locales/fr.json`
  - [x] providers.list.*
  - [x] providers.drawer.*
  - [x] providers.detail.*
  - [x] providers.form.*
  - [x] providers.alert.*

- [x] **Routes wired** in `frontend/src/App.tsx`
  - [x] /providers → ProvidersListPage
  - [x] /providers/new → ProviderNewPage
  - [x] /providers/:id → ProviderDetailPage
  - [x] /providers/:id/edit → ProviderEditPage

- [x] **Backend ready** (FS-03-BACK v1.2)
  - [x] API endpoints implemented
  - [x] Gates G-01 to G-14 validated
  - [x] Error codes tested (409, 400)
  - [x] Tag integration (F-03) ready

- [x] **Reference patterns available**
  - [x] FS-02-Domains-front v1.6
  - [x] F-01 Design System
  - [x] F-03 Tags Foundation
  - [x] AGENTS.md conventions

---

## 🎯 What Will Be Generated

### Pages (4 files)
```
frontend/src/pages/providers/
├── ProvidersListPage.tsx       (table, filters, drawer, sorting)
├── ProviderDetailPage.tsx      (details, tabs, action buttons)
├── ProviderFormPage.tsx        (create/edit form)
├── ProviderNewPage.tsx         (route adapter)
├── ProviderEditPage.tsx        (route adapter)
└── useProvidersStore.ts        (local state)
```

### Components (4 files)
```
frontend/src/components/providers/
├── ProvidersDrawer.tsx         (PNS-02 side drawer, 400px)
├── ProviderForm.tsx            (reusable form)
├── ApplicationListInDrawer.tsx (mini table, 5/page)
└── ApplicationListTable.tsx    (full table, 20/page)
```

### Services & Utils (3 files)
```
frontend/src/services/api/
└── providers.api.ts            (useQuery/useMutation)

frontend/src/utils/
└── providers.utils.ts          (helpers)

e2e/tests/
└── 03-providers.spec.ts        (16 Cypress tests)
```

---

## 📋 How to Launch OpenCode

1. Open `docs/03-Features-Spec/FS-03-Providers-front.md`
2. Jump to section **§10 "Commande OpenCode — Frontend"**
3. Copy the entire command block (including spec content below it)
4. Paste into OpenCode
5. Wait for generation (~5–10 minutes)

That's it! OpenCode will generate all 12 files with:
- Full implementation following spec
- Cypress tests
- Type-safe TypeScript
- Proper i18n integration
- PNS-02 pattern implemented correctly

---

## 🎯 Key Implementation Patterns

### PNS-02 (Side Drawer + Detail)
```
List Page:
  Row click → Drawer (read-only, 400px)
  Name click → Detail Page

Drawer:
  Tabs: Info + Applications
  Footer: Edit (left) + View detail (right)
  Close: button + ESC + backdrop

Detail Page:
  Full info + tabs
  Actions: Edit + Delete
```

### Error Handling
```
409 CONFLICT → inline error on name field
409 DEPENDENCY_CONFLICT → ConfirmDialog + disabled button + app link
400 → inline validation errors
5xx → ArkAlert error message
```

### Tags Integration (F-03)
```
Read mode (list, drawer, detail):
  - Use TagChipList
  - Apply deduplicateByDepth()

Edit mode (form):
  - Use DimensionTagInput
  - No deduplication
```

### Dates
```
Display: locale FR (ex: "31 déc. 2025")
Input: DatePicker DD/MM/YYYY
Badges: URGENT <30j (red), ALERTE <90j (orange)
```

---

## ✨ Success Criteria (Post-Implementation)

- [ ] ProvidersListPage: table + filters + drawer trigger + dropdown actions
- [ ] ProvidersDrawer: read-only + tabs + footer buttons + close
- [ ] ProviderDetailPage: full details + tabs + action buttons
- [ ] ProviderFormPage: validation + DimensionTagInput + DatePicker
- [ ] Error 409 CONFLICT: inline error on name
- [ ] Error 409 DEPENDENCY_CONFLICT: ConfirmDialog + disabled + link
- [ ] Navigation: correct post-CRUD routes + snackbars
- [ ] ArkAlert: all feedback via alert system (no console.log)
- [ ] Tags: read=deduplicate, edit=no deduplicate
- [ ] Dates: locale FR with badges
- [ ] Permissions: buttons disabled without write
- [ ] Cypress: 16 tests passing
- [ ] TypeScript: strict mode, no errors
- [ ] AGENTS.md: conventions respected

---

## 📊 Effort & Files

| Component | Est. Time | LOC |
|-----------|-----------|-----|
| ProvidersListPage | 2-3h | ~500 |
| ProviderDetailPage | 1.5-2h | ~400 |
| ProviderFormPage | 1.5-2h | ~400 |
| ProvidersDrawer | 2h | ~500 |
| ProviderForm | 1.5h | ~400 |
| ApplicationListTable | 1h | ~250 |
| providers.api.ts | 1h | ~300 |
| providers.utils.ts | 30m | ~150 |
| Cypress tests | 2h | ~800 |
| **TOTAL** | **~0.5 day** | **~3,700** |

---

## 📚 Reference Materials

**Main Spec:**
- FS-03-Providers-front.md (v1.0, stable)

**API Contract:**
- FS-03-Providers-back.md §3 (v1.2)

**Pattern Reference:**
- FS-02-Domains-front.md v1.6

**Design & Tags:**
- F01-Design-System.md
- F03-Dimension-Tag-Foundation.md
- F02-i18n.md

**Conventions:**
- AGENTS.md

---

## 🚀 Next Steps After OpenCode

1. Review generated code
2. Run: `npm run build` (type checking)
3. Run: `npm run test:e2e -- --testNamePattern=providers`
4. Validate 15 gates (FS-03-FRONT §9)
5. Hard refresh browser (Ctrl+F5)
6. Commit: `git commit -m "implement(frontend): FS-03-Providers (PNS-02, filters, forms)"`

---

## 📞 Questions?

Check:
- FS-03-Providers-front.md §4 (Layout Contract)
- FS-03-Providers-back.md §3 (API Contract)
- AGENTS.md (Code Conventions)
- FS-02-Domains-front.md (Reference Implementation)

---

**Status:** 🟢 READY  
**Command Location:** `FS-03-Providers-front.md §10`  
**Estimated Launch:** Immediate

Let's go! 🎉

