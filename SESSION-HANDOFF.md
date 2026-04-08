# SESSION-HANDOFF.md — Sprint 3 · FS-07-FRONT (Business Capabilities Frontend)

> 🤖 **AGENT ACTIF** : [spec] | **MISSION** : FS-07-FRONT spec v1.0 stable + T-019 amendment backend doc | **SPRINT** : FS-07-FRONT ✅ `stable`

---

## Status Summary

✅ **FS-07-FRONT SPEC COMPLETE** — Frontend specification v1.0 rédigée (1000+ lignes, 13 sections). 3 vues (liste arborescente, arbre MUI TreeView, matrix), drawer read-only PNS-02, hiérarchie récursive, agrégation client-side, breadcrumb PNS-11. Statut = `stable` après gate T-019 done. Prêt pour session [front].

✅ **AMENDMENT T-019 DOCUMENTED** — FS-07-BACK v1.1 mis à jour : ajout des champs `criticality` (LOW/MEDIUM/HIGH/CRITICAL) et `technicalFit` (ADEQUATE/PARTIAL/INADEQUATE/LEGACY) dans Prisma model, OpenAPI DTOs (Create/Update/Response/ListItem/TreeNode), migration SQL. Gate bloquante pour T-018 impl frontend.

✅ **4 TÂCHES CRÉÉES** — T-016 (spec FS-07-FRONT, in_progress), T-017 (spec Lifecycle tab P2), T-018 (impl FS-07-FRONT), T-019 (amendment backend criticality+technicalFit).

📋 **ANALYSE INCOHÉRENCES USER STORIES** — 7 incohérences identifiées et résolues (US06 reformulée → breakdown lifecycle, US09/10 → champs enum scalaires, US13 coloration matrix, US19 agrégation récursive client-side, US15/18 → P2).

---

## FS-07-FRONT Specification Summary

### Metadata

| Field | Value |
|---|---|
| **File** | `docs/03-Features-Spec/FS-07-Business-Capabilities-front.md` |
| **Version** | 1.0 |
| **Status** | ✅ `stable` (bloqué par T-019 amendment backend) |
| **Template** | Frontend v0.1 |
| **Depends On** | **FS-07-BACK** (`done`), **T-019** (amendment pending), FS-01, F-02, F-03 |
| **Created** | 8 April 2026 |
| **Est. Implementation** | 3j (3 vues + 4 pages + 8 composants) |

### Specification Structure (13 sections)

| Section | Content | Status |
|---|---|---|
| **§1 Objective** | 3 vues (liste/tree/matrix) + drawer + CRUD + hiérarchie | ✅ |
| **§2 User Stories** | US01-05, US06/07 révisées, US09, US10, US13, US16, US19 | ✅ |
| **§3 Référence API** | Pointer vers FS-07-BACK §3 + T-019 | ✅ |
| **§4 Layout Contract** | 7 blocs (List, TreeView, Matrix, Drawer, New, Detail, Edit) | ✅ |
| **§5 Composants** | 8 composants (Tree, Matrix, Drawer, Form, 2 Chips, LifecycleBreakdown, AppBreadcrumbs) | ✅ |
| **§6 Clés i18n** | Section `businessCapabilities` complète | ✅ |
| **§7 Règles métier** | RM-BC-01 à RM-BC-09 (indentation, expand/collapse, agrégation, coloration, exclusion descendants) | ✅ |
| **§8 Câblage App.tsx** | Manuel (4 routes) | ✅ |
| **§9 Gates** | T-019 amendment done requis | ✅ |
| **§10 Tests Playwright** | Délégué à T-015 (agent QA) | ✅ |
| **§11 Commande OpenCode** | Prompt complet avec patterns récursifs | ✅ |
| **§12 Checklist** | 30 items validation frontend | ✅ |
| **§13 TD Review** | Gates TD standard | ✅ |

### Key Features vs Other Frontend Modules

| Element | FS-06-FRONT (Applications) | FS-07-FRONT (Business Capabilities) | Impact |
|---|---|---|---|
| Vues multiples | Liste unique | **3 vues** (liste arborescente + tree + matrix) + toggle | ToggleButtonGroup header |
| Structure données | Flat | **Hiérarchique** (expand/collapse, indentation) | useState<Set<string>> expanded |
| Agrégation | Compteur simple | **Récursive** (`sumApplications(node)`) | Utils client-side |
| Composants spécialisés | — | **MUI TreeView** (vue arbre), **MatrixView** (tuiles imbriquées) | @mui/x-tree-view |
| Breadcrumb | Absent (P1) | **PNS-11** (3 niveaux sur Detail/New/Edit) | AppBreadcrumbs partagé |
| Chips status | Criticality | **Criticality + TechnicalFit** (2 enums) | 2 composants colorés |

---

## Architecture Decision Traced ⚠️

### Décision D-01 : Champs criticality + technicalFit = scalaires enum (vs tags F-03)

**Context:**
- User Stories US09 (criticality) et US10 (technicalFit) nécessitent des champs exploitables pour calculs de scoring
- Tags F-03 ne permettent pas les calculs de scoring métier
- Les enums permettent la validation côté backend + typage strict frontend

**Decision:**
- 2 champs enum scalaires sur `BusinessCapability` : `criticality` (LOW/MEDIUM/HIGH/CRITICAL) + `technicalFit` (ADEQUATE/PARTIAL/INADEQUATE/LEGACY)
- Nullable pour rétrocompatibilité
- Exposés dans Create/Update/Response/ListItem/TreeNode DTOs
- Amendment T-019 (agent back, 0.5j) requis avant impl frontend

**Changes Applied:**
| Element | Avant | Après |
|---|---|---|
| Prisma model | Pas de champs criticality/technicalFit | ✅ 2 enums ajoutés |
| DTOs | — | ✅ Ajoutés dans Create/Update/Response/ListItem/TreeNode |
| Migration SQL | — | ✅ CREATE TYPE + ALTER TABLE |
| Seed | 12 capabilities sans criticality/technicalFit | ✅ Alimenter les 12 capabilities |

**Impact:**
- Coloration matrix US13 basée sur `criticality`
- Chips colorés dans liste + drawer
- Gate bloquante T-019 pour T-018 (impl frontend)

---

### Décision D-02 : Vue arbre = MUI TreeView (vs ReactFlow)

**Context:**
- US04 nécessite une vue arbre avec expand/collapse
- ReactFlow déjà dans le stack (FS-09 Dependency Graph)
- Arbre hiérarchique ≠ graphe de dépendances (pas de relations cycliques, structure linéaire parent→enfants)

**Decision:**
- **MUI TreeView** (`@mui/x-tree-view`) pour la vue arbre FS-07
- ReactFlow réservé à FS-09 (graphe de dépendances avec relations multidirectionnelles)

**Rationale:**
- MUI TreeView : simple, rapide (0.5j), accessible, cohérent avec MUI v5
- ReactFlow : complexité +1j, overkill pour un arbre ordonné
- Pattern EA : arbre hiérarchique = composant arbre, graphe de flux = composant graphe

**Impact:**
- Dépendance : `@mui/x-tree-view` à installer
- Rendu récursif natif avec `<TreeItem>` nested

---

### Décision D-03 : Agrégation récursive US19 = client-side (vs endpoint backend)

**Context:**
- US19 nécessite le total d'applications cumulées par domaine L1 (nœud + descendants)
- Backend expose `_count.applicationMappings` par nœud, mais pas de somme récursive
- Vue matrix nécessite le total pour chaque tuile

**Decision:**
- Calcul **client-side** depuis la réponse `GET /tree`
- Utils `sumApplications(node)` : `_count.applicationMappings + children.reduce(sum)`

**Rationale:**
- Pas de nouvel endpoint backend nécessaire
- Calcul trivial en JS sur arbre déjà chargé (single-pass recursion)
- Performance acceptable (arbre < 100 nœuds en P1)

**Impact:**
- Pas de modification backend
- Pattern réutilisable pour futures agrégations récursives

---

### Décision D-04 : US06 reformulée = breakdown lifecycle (vs statut BC)

**Context:**
- US06 originale ambiguë : "légende de statuts standardisée"
- Clarification utilisateur : afficher le nombre d'applications liées selon leur `lifecycleStatus` (Active, Sunset, etc.)
- Pas un statut sur la BC, mais une distribution des apps liées

**Decision:**
- Section "Empreinte applicative" dans le drawer
- Total d'apps (`_count.applicationMappings`)
- Breakdown par `lifecycleStatus` : Active: X, Sunset: Y, etc.
- Données chargées depuis `GET /:id/applications` (pagination gérée frontend)
- Composant `AppLifecycleBreakdown` pour affichage

**Rationale:**
- Pas de champ statut sur BusinessCapability
- Réponse aux besoins métier US06/07 sans modification backend
- Pattern réutilisable pour autres entités

**Impact:**
- Composant générique `AppLifecycleBreakdown` (réutilisable FS-08, FS-09)
- Chargement on-demand dans drawer

---

### Décision D-05 : Breadcrumb PNS-11 = composant partagé AppBreadcrumbs

**Context:**
- PNS-11 introduit le breadcrumb systématique sur Detail/New/Edit (3 niveaux)
- FS-07 est la première feature à l'implémenter
- Pattern répété sur 3 pages → risque de duplication

**Decision:**
- Créer composant partagé `AppBreadcrumbs` dans `@/components/shared/`
- Props : `items: Array<{ label: string; onClick?: () => void }>`
- Dernier item sans onClick = non cliquable (page courante)
- Réutilisable par tous les modules P1 et P2

**Rationale:**
- Élimination duplication inline
- Cohérence visuelle garantie (spacing, colors, séparateurs)
- Pattern PNS-11 standardisé pour futures features

**Impact:**
- Premier composant PNS-11 créé dans cette session
- Documentation dans §5 de FS-07-FRONT

---

## Documentation Updates

### Files Modified

| File | Change | Impact |
|---|---|---|
| `docs/03-Features-Spec/FS-07-Business-Capabilities-front.md` | ✨ **NEW** — Spec frontend v1.0 complète (**1000+ lines**) | Frontend spec ready |
| `docs/03-Features-Spec/FS-07-Business-Capabilities-back.md` | ✏️ v1.0 → v1.1, changelog T-019, §2.2 + §3 enums ajoutés | Amendment documented |
| `docs/05-Project/tasks.yaml` | ✨ **NEW** — T-016, T-017, T-018, T-019 | Sprint 3 tracking |
| `SESSION-HANDOFF.md` (root) | ✨ **NEW** — This file | Current handoff FS-07-FRONT |

### Git Commit Suggested

```
spec: FS-07-FRONT v1.0 + T-019 amendment backend

- FS-07-FRONT spec complète : 3 vues (liste/tree/matrix), drawer PNS-02, hiérarchie récursive
- 8 composants (Tree, Matrix, Drawer, Form, CriticalityChip, TechnicalFitChip, LifecycleBreakdown, AppBreadcrumbs)
- PNS-11 breadcrumb : premier composant partagé AppBreadcrumbs
- Amendment T-019 : champs criticality + technicalFit dans FS-07-BACK v1.1
- US06/09/10/13/19 résolues (analyse incohérences → décisions architecture)
- tasks.yaml : T-016 (spec, in_progress), T-017 (lifecycle P2), T-018 (impl), T-019 (amendment)
- Sprint 3 ready for [back] T-019 puis [front] T-018
```

---

## Session Gate — T-019 Amendment Backend ⚠️

### Pre-conditions (avant T-018 impl frontend)

- [x] **FS-07-BACK v1.0 `done`** — CRUD + hiérarchie + /tree ✅
- [ ] **T-019 amendment backend `done`** — criticality + technicalFit dans API
- [ ] **Migration SQL executed** — CREATE TYPE CriticalityLevel + TechnicalFitLevel, ALTER TABLE
- [ ] **Prisma model updated** — enums + 2 champs ajoutés dans BusinessCapability
- [ ] **DTOs updated** — Create/Update/Response/ListItem/TreeNode exposent criticality + technicalFit
- [ ] **Seed updated** — 12 capabilities existantes alimentées avec criticality + technicalFit
- [ ] **Tests Jest/Supertest** — validation enum values
- [ ] **GET /business-capabilities** retourne `criticality` + `technicalFit` manuellement testé
- [ ] **GET /business-capabilities/tree** retourne les 2 champs par nœud

### Effort T-019

| Task | Owner | Time | Priority |
|---|---|---|---|
| Migration SQL (CREATE TYPE + ALTER TABLE) | back | 10 min | 🟡 Important |
| Prisma model (2 enums + 2 champs) | back | 10 min | 🟡 Important |
| DTOs (5 schemas OpenAPI) | back | 20 min | 🟡 Important |
| Seed (12 capabilities) | back | 15 min | 🟡 Important |
| Tests Jest + Supertest | back | 30 min | 🟢 Nice to have |
| **Total** | — | **~1.5h** | — |

---

## Next Steps — Immediate Actions

### Séquence Sprint 3 (ajustée)

```
Phase 0 — Amendment T-019 (agent back, ~0.5j)
    ↓ gate levée
Phase 1 — Impl FS-07-FRONT (T-018, agent front, ~3j)  ← session courante SPEC done
    ↓
Phase 2 — Tests UI Playwright (T-015, agent qa)
```

**Actions immédiate (hors plan mode) :**

1. **Commit spec** : `git add docs/03-Features-Spec/FS-07* docs/05-Project/tasks.yaml SESSION-HANDOFF.md`
2. **Passer T-016 à `done`** dans tasks.yaml
3. **Lancer T-019 (agent back)** : amendment criticality + technicalFit
4. **Après T-019 done** → passer FS-07-FRONT à `stable` → lancer T-018 (agent front)

---

## Parallelizable Tasks (Sprint 3)

**Not blocked by T-019:**
- **T-015** tests UI → bloqué par T-018 done (impl frontend)
- **T-017** spec Lifecycle tab → P2 (Sprint 4)

**Recommended Sprint 3 Timeline:**
```
Lun 8 Apr  : FS-07-FRONT spec stable ✅   ← today, completed
Lun 8 Apr  : T-019 amendment backend (~1.5h)
Mar 9 Apr  : T-018 impl FS-07-FRONT (3j)
Jeu 11 Apr : T-015 tests UI Playwright (agent qa)
```

---

## Build Validation Checklist

### Pre-T-019 Amendment

- [x] FS-07-FRONT spec rédigée (13 sections)
- [x] tasks.yaml mis à jour (4 tâches)
- [x] FS-07-BACK v1.1 documenté (changelog + §2.2 + §3)

### Post-T-019 Amendment

- [ ] Migration SQL exécutée (CREATE TYPE + ALTER TABLE)
- [ ] Prisma model généré (`npx prisma generate`)
- [ ] `POST /api/v1/business-capabilities` avec `criticality: "HIGH"` → `201` avec champ retourné
- [ ] `GET /api/v1/business-capabilities/tree` → chaque nœud a `criticality` + `technicalFit`
- [ ] Seed 12 capabilities → toutes ont `criticality` + `technicalFit` non-null
- [ ] Tests Jest passent (validation enum values)
- [ ] `npm run build` backend → 0 errors

### Post-T-018 Impl Frontend

- [ ] 3 vues (liste/tree/matrix) fonctionnent avec toggle
- [ ] Drawer s'ouvre au clic sur ligne
- [ ] Breadcrumb PNS-11 sur Detail/New/Edit pages
- [ ] CriticalityChip + TechnicalFitChip affichent couleurs correctes
- [ ] Agrégation récursive fonctionne (matrix affiche total apps)
- [ ] Expand/collapse fonctionne dans liste arborescente
- [ ] Sélecteur parent exclut descendants (RM-BC-05)
- [ ] Erreur `400 CIRCULAR_REFERENCE` affichée inline
- [ ] Erreur `409 DEPENDENCY_CONFLICT` affiche compteurs enfants + apps

---

## Reference Materials

### Specifications

| File | Status | Version | Purpose |
|---|---|---|---|
| **FS-07-Business-Capabilities-front.md** | `stable` | 1.0 | Frontend contract + gates (current) |
| **FS-07-Business-Capabilities-back.md** | `done` (v1.0), pending (v1.1) | 1.1 | Backend contract + amendment T-019 |
| **FS-06-Applications-front.md** | `done` | 1.2 | Pattern drawers complexes + filtres |
| **02-Navigation-Patterns.md** | — | 0.4 | PNS-11 breadcrumb |

### Code Locations

| Module | Files | Role |
|---|---|---|
| Frontend | `frontend/src/pages/business-capabilities/` | **TO CREATE — 4 pages** |
| Frontend | `frontend/src/components/business-capabilities/` | **TO CREATE — 7 composants** |
| Frontend | `frontend/src/components/shared/AppBreadcrumbs.tsx` | **TO CREATE — composant PNS-11** |
| Backend | `backend/src/business-capabilities/` | **EXISTS — amendment T-019 requis** |
| Prisma | `backend/prisma/schema.prisma` | **TO UPDATE — 2 enums + 2 champs** |

### Critical Patterns Frontend (from spec §7)

**Indentation par niveau (RM-BC-01):**
```typescript
<Box sx={{ paddingLeft: `${row.level * 24}px` }}>
  {row.name}
</Box>
```

**Agrégation récursive (RM-BC-03):**
```typescript
export function sumApplications(node: BusinessCapabilityTreeNode): number {
  return (
    node._count.applicationMappings +
    node.children.reduce((acc, child) => acc + sumApplications(child), 0)
  );
}
```

**Coloration matrix (RM-BC-04):**
```typescript
function getCriticalityColor(criticality: CriticalityLevel | null, theme: Theme): string {
  switch (criticality) {
    case 'LOW': return theme.palette.success.light;
    case 'MEDIUM': return theme.palette.warning.light;
    case 'HIGH': return theme.palette.error.light;
    case 'CRITICAL': return theme.palette.error.dark;
    default: return theme.palette.grey[300];
  }
}
```

---

## Summary

| Item | Deliverable |
|---|---|
| **FS-07-FRONT** | ✅ Specification v1.0 stable (**1000+ lines**) |
| **T-019 amendment** | ✅ Documented in FS-07-BACK v1.1 (pending impl) |
| **Incohérences US** | ✅ 7 incohérences identifiées et résolues |
| **Décisions architecture** | ✅ 5 décisions tracées (D-01 à D-05) |
| **Tasks créées** | ✅ T-016/T-017/T-018/T-019 |
| **Next action** | ⏳ T-019 amendment backend (0.5j, agent back) |
| **Est. T-018 impl** | 3j (3 vues + 8 composants + utils) |

**Overall: FS-07-FRONT ready for implementation after T-019 amendment done.**

---

## Decision Log

| # | Decision | Context | Rationale |
|---|---|---|---|
| D-01 | criticality + technicalFit = enum scalaires | US09/10 + scoring métier requis | Tags F-03 ne permettent pas les calculs |
| D-02 | Vue arbre = MUI TreeView | US04 + stack ReactFlow existant | Arbre ≠ graphe, TreeView plus simple |
| D-03 | Agrégation récursive client-side | US19 + perf acceptable | Pas de nouvel endpoint backend |
| D-04 | US06 = breakdown lifecycle apps | Clarification ambiguïté | Pas de statut sur BC |
| D-05 | AppBreadcrumbs composant partagé | PNS-11 + réutilisabilité | Élimination duplication |

---

_Document created: 2026-04-08_
_Purpose: Sprint 3 FS-07-FRONT spec completion + handoff to [back] T-019 puis [front] T-018_
_Branch: develop_
_Status: Spec **v1.0 stable**, **T-019 amendment documented**, gate levée après T-019 done_
_Next session: T-019 amendment backend (0.5j), then T-018 impl frontend (3j)_
