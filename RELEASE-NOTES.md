# ARK — Release Notes

_Last updated: 2026-03-07 — v0.2.0_

---

<!-- ============================================================ -->
<!-- RELEASE v0.2.0 — 2026-03-07                             -->
<!-- ============================================================ -->

## v0.2.0 — 2026-03-07

> First frontend feature release — Domains UI complete.

### Highlights

- **Domains Frontend** — Complete CRUD UI with React, MUI, ReactFlow integration
- **Alert System** — Reusable ArkAlert component with success/error feedback

### What's New

#### Features

| ID | Title | Priority |
|---|---|---|
| FS-02-FRONT | Domains — Frontend UI | P1 |

#### Bug Fixes

| Ref | Description | Area |
|---|---|---|
| — | None for this release | — |

#### Technical Improvements

| Ref | Description | Source |
|---|---|---|
| ArkAlert-01 | ArkAlert component (MUI Snackbar + Alert wrapper) | FS-02-FRONT |
| ArkAlert-02 | Navigation state-based success alerts | FS-02-FRONT |
| ArkAlert-03 | 409 DEPENDENCY_CONFLICT handling in ConfirmDialog | FS-02-FRONT |
| UI-SORT-01 | Client-side sorting with null values last | FS-02-FRONT |

### Breaking Changes

> ⚠️ _None_

### Known Limitations

- FS-03 to FS-11 — not yet started

### Migration Steps
```bash
# No manual steps required for this release
docker-compose down
docker-compose pull
npx prisma migrate deploy
docker-compose up -d
```

### Specs Delivered

| Spec | Title | Status |
|---|---|---|
| FS-02-FRONT | Domains — Frontend UI | ✅ done |

---

<!-- ============================================================ -->
<!-- RELEASE v0.1.3 — 2026-03-07                             -->
<!-- ============================================================ -->

## v0.1.3 — 2026-03-07

> First MVP release delivering core backend API foundation.

### Highlights

- **Domains Backend API** — Complete CRUD with RBAC, validation, and referential integrity checks
- **i18n Foundation** — react-i18next ready for all frontend features

### What's New

#### Features

| ID | Title | Priority |
|---|---|---|
| FS-02-BACK | Domains — Backend API | P1 |
| F-02 | i18n Foundation | P1 |

#### Bug Fixes

| Ref | Description | Area |
|---|---|---|
| — | None for this release | — |

#### Technical Improvements

| Ref | Description | Source |
|---|---|---|
| TD-1 | HttpExceptionFilter created in src/common/filters/ | F-999 |
| TD-2 | JWT TTL 15min, redirect /login?reason=session_expired | F-999 |
| TD-3 | ThrottlerModule configured (100 req/min global, 10 req/min auth) | F-999 |
| TD-4 | PaginationQueryDto created in src/common/dto/ | F-999 |
| TD-9 | API prefix /api/v1 configured in main.ts | F-999 |
| TD-10 | RequestIdMiddleware created, header X-Request-ID on all responses | F-999 |
| SPEC-TPL-01 | Split back/front spec templates adopted | Sprint 2 |

### Breaking Changes

> ⚠️ _None_

### Known Limitations

- FS-03 to FS-11 — not yet started

### Migration Steps
```bash
# No manual steps required for this release
docker-compose down
docker-compose pull
npx prisma migrate deploy
docker-compose up -d
```

### Specs Delivered

| Spec | Title | Status |
|---|---|---|
| F-00 | Scaffolding projet — NestJS + Prisma + Docker + JWT | ✅ done |
| F-01 | Design System & UI Foundation | ✅ done |
| FS-01 | Auth & RBAC | ✅ done |
| F-02 | i18n Foundation | ✅ done |
| FS-02-BACK | Domains — Backend API | ✅ done |
| FS-02-FRONT | Domains — Frontend UI | ✅ done |
| F-999 | Technical Debt & Conventions | ✅ done (items 1-4, 9-10) |

---

_ARK Release Notes — updated at each sprint closure_
