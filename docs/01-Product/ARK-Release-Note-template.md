# ARK — Release Notes

_Last updated: {YYYY-MM-DD} — v{X.Y.Z}_

> This file contains the complete release history for ARK, most recent first.
> One entry per release. Each release maps to one or more completed sprints.
> Format: add new entries at the top, above the previous release separator.

---
<!-- ============================================================ -->
<!-- RELEASE v{X.Y.Z} — {YYYY-MM-DD}                             -->
<!-- ============================================================ -->

## v{X.Y.Z} — {YYYY-MM-DD}

> {One-sentence summary of the release theme.}

### Highlights

- **{Feature}** — {business value in one line}
- **{Feature}** — {business value in one line}

> _Skip this section for patch releases (x.x.Z)._

### What's New

#### Features

| ID | Title | Priority |
|---|---|---|
| FS-XX | Feature name | P1 |

#### Bug Fixes

| Ref | Description | Area |
|---|---|---|
| #XX | Short description | backend / frontend / schema |

#### Technical Improvements

| Ref | Description | Source |
|---|---|---|
| TD-X | Technical debt item closed | F-999 |
| NFR-XX-00X | NFR status updated | ARK-NFR |

> _Skip this section if none._

### Breaking Changes

> ⚠️ _None_ — or describe migration path below.

- **{Area}** — {Description}. Migration: `{command}`

### Known Limitations

- {FS-XX} — {Description} — deferred to P2

### Migration Steps
```bash
# Skip this block if no manual steps required
docker-compose down
docker-compose pull
npx prisma migrate deploy
docker-compose up -d
```

### Specs Delivered

| Spec | Title | Status |
|---|---|---|
| F-XX | Foundation spec title | ✅ done |
| FS-XX | Feature spec title | ✅ done |

---
<!-- ============================================================ -->
<!-- RELEASE v{X.Y.Z} — {YYYY-MM-DD}                             -->
<!-- ============================================================ -->

## v{X.Y.Z} — {YYYY-MM-DD}

...

---

_ARK Release Notes — updated at each sprint closure_