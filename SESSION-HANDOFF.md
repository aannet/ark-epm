# SESSION HANDOFF — Sprint S4/S5 — ARK-EPM

_Dernière mise à jour : 2026-05-06 — Agent spec (T-102)_

---

## État du sprint S4 — Tâches done

| ID | Tâche | Agent | Date |
|---|---|---|---|
| T-075 | Frontend moderniser pages NEW/EDIT Applications | front | 2026-04-29 |
| T-076 | Frontend moderniser pages NEW/EDIT autres entités | front | 2026-04-29 |
| T-081 | Back — no-control-regex tags.service.ts | back | 2026-04-29 |
| T-083 | Back — DELETE /applications/:id 500 | back | 2026-05-02 |
| T-084 | Data — schema.sql + diagramme Mermaid | data | 2026-05-02 |
| T-012 | Back — API Users isActive (owner selector) | back | 2026-05-03 |
| T-085 | Spec — FS-09 Dependency Graph (back + front) | spec | 2026-05-03 |
| T-087 | Back — FS-09 Dependency Graph impl (graph/) | back | 2026-05-03 |
| T-098 | Arch — eslint-plugin-sonarjs MegaLinter | arch | 2026-05-04 |
| T-099 | Back — Fix injections ZAP Data Objects + DTOs | back | 2026-05-04 |
| T-101 | Back — Harmoniser validation injection tous DTOs | back | 2026-05-05 |
| T-102 | Spec — FS-12 Dashboard (back + front) | spec | 2026-05-06 |

---

## Tâches open prioritaires (S4 résiduel + S5)

| ID | Tâche | Agent | Priorité |
|---|---|---|---|
| T-079 | Back — @RequirePermissions tags write | back | **high** |
| T-103 | Back — FS-12 Dashboard backend (UserDomainScope + HomeModule) | back | **high** |
| T-105 | Front — FS-12 Dashboard (home page + US-HOME-09) | front | **high** |
| T-050 | QA — 3 tests API en échec | qa | medium |
| T-069 | QA — Déporter rapports Playwright | qa | medium |
| T-078 | QA — Tests Playwright /users /roles /permissions | qa | medium |
| T-104 | QA-back — Tests API FS-12 Dashboard | qa | medium |
| T-106 | QA-front — Tests e2e FS-12 Dashboard | qa | medium |
| T-077 | Frontend — Icônes officielles entités | front | medium |
| T-051 | Arch — Interfaces manuelles (décision) | arch | medium |
| T-074 | Spec — Réévaluer gestion des tags | spec | medium |
| T-086 | Back — Gate FS-09 US-04 BC WITH RECURSIVE | back | medium |
| T-100 | Arch — Audit global architecture + tech debt | arch | medium |
| T-062 | Back — Omnisearch filtres avancés P2 | back | low |

---

## Tâches bloquées

| ID | Tâche | Raison | Prérequis |
|---|---|---|---|
| T-003 | Front — FS-09 Dependency Graph impl | Gate impl | FS-09-BACK done ✅, FS-09-FRONT stable ✅ |
| T-104 | QA-back FS-12 | Gate impl | T-103 |
| T-105 | Front FS-12 | Gate spec+back | T-102 ✅, T-103 |
| T-106 | QA-front FS-12 | Gate impl | T-105 |

---

## Contexte FS-12 Dashboard (nouveau — S5)

Specs rédigées le 2026-05-06 (T-102) :
- `docs/03-Features-Spec/FS-12-Dashboard/FS-12-dashboard-back.md` — **draft**
- `docs/03-Features-Spec/FS-12-Dashboard/FS-12-dashboard-front.md` — **draft**

Endpoint BFF : `GET /api/v1/home/summary` (Promise.allSettled, toujours 200)
Nouveau modèle Prisma : `UserDomainScope` (N:N User↔Domain, table de présence pure)
Conventions : 0 domaine assigné = portée globale (implicite)
⚠️ Frontend : store in-memory (`store/auth.ts`), PAS React Context
Permission : `applications:read` (réutilisation)
Module backend à créer : `backend/src/home/`

Handoff détaillé : `docs/05-Project/20260506/SESSION-HANDOFF-spec-t102.md`

---

## Contexte FS-09 Dependency Graph

Specs : `docs/03-Features-Spec/FS-09-Dependency-Graph/` (back + front) — **draft**
Backend implémenté (T-087) — gates G-01..G-09 validées
T-003 (front ReactFlow) débloquée — peut démarrer
Gate résiduelle : T-086 (BC WITH RECURSIVE) — US-04 partiel acceptable P1

---

## Priorité absolue non résolue

**T-079 — Vulnérabilité sécurité tags** : tout user authentifié (y compris read-only) peut créer/écraser des tags. Fix : `@RequirePermissions('tags:write')` sur 3 méthodes dans `backend/src/tags/tags.controller.ts`. Priorité high.
