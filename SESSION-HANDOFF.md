# SESSION HANDOFF — Sprint S4 — ARK-EPM

_Dernière mise à jour : 2026-05-03 — Agent spec (T-085)_

---

## État du sprint S4

### Tâches done ce sprint

| ID | Tâche | Agent | Date |
|---|---|---|---|
| T-075 | Frontend moderniser pages NEW/EDIT Applications | front | 2026-04-29 |
| T-076 | Frontend moderniser pages NEW/EDIT autres entités | front | 2026-04-29 |
| T-081 | Back — no-control-regex tags.service.ts | back | 2026-04-29 |
| T-083 | Back — DELETE /applications/:id 500 | back | 2026-05-02 |
| T-084 | Data — schema.sql + diagramme Mermaid | data | 2026-05-02 |
| T-012 | Back — API Users isActive (owner selector) | back | 2026-05-03 |
| T-085 | Spec — FS-09 Dependency Graph (back + front) | spec | 2026-05-03 |

### Tâches open prioritaires

| ID | Tâche | Agent | Priorité |
|---|---|---|---|
| T-079 | Back — @RequirePermissions tags write | back | **high** |
| T-050 | QA — 3 tests API en échec | qa | medium |
| T-069 | QA — Déporter rapports Playwright | qa | medium |
| T-078 | QA — Tests Playwright /users /roles /permissions | qa | medium |
| T-077 | Frontend — Icônes officielles entités | front | medium |
| T-051 | Arch — Interfaces manuelles (décision) | arch | medium |
| T-074 | Spec — Réévaluer gestion des tags | spec | medium |
| T-062 | Back — Omnisearch filtres avancés P2 | back | low |
| T-086 | Back — Gate FS-09 US-04 BC WITH RECURSIVE | back | medium |

### Tâches bloquées

| ID | Tâche | Raison | Prérequis |
|---|---|---|---|
| T-003 | Front — FS-09 Dependency Graph impl | Gate impl | FS-09-BACK done, FS-09-FRONT stable |

---

## Contexte FS-09 Dependency Graph (nouveau)

Specs rédigées le 2026-05-03 (T-085) :
- `docs/03-Features-Spec/FS-09-Dependency-Graph/FS-09-Dependency-Graph-back.md` — **draft**
- `docs/03-Features-Spec/FS-09-Dependency-Graph/FS-09-Dependency-Graph-front.md` — **draft**

Endpoint : `GET /api/v1/graph?focalType=&focalId=&depth=&layers=`
Permission : `applications:read` (réutilisation)
Module backend à créer : `backend/src/graph/`
Gate US-04 : T-086 (WITH RECURSIVE BC)

Handoff détaillé : `docs/05-Project/20260503/SESSION-HANDOFF-spec-t085.md`

---

## Priorité absolue non résolue

**T-079 — Vulnérabilité sécurité tags** : tout user authentifié (y compris read-only) peut créer/écraser des tags. Fix : `@RequirePermissions('tags:write')` sur 3 méthodes dans `backend/src/tags/tags.controller.ts`. Priorité high.
