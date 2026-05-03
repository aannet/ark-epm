# SESSION HANDOFF — Spec T-085 — FS-09 Dependency Graph

**Date** : 2026-05-03
**Agent** : spec
**Session** : f3a9c2
**Tâche** : T-085 → done

---

## Ce qui a été fait

### Interview de conception
Session d'interview exhaustive avec le user avant rédaction. Décisions verrouillées :

| Décision | Valeur |
|---|---|
| API | `GET /api/v1/graph?focalType=&focalId=&depth=&layers=` (D7) |
| Multi-focal | 6 types : application, bc, domain, provider, it_component, data_object |
| Filtering | layers/depth/focal = server ; criticality/domain = client masking |
| Permission | `applications:read` (réutilisation, pas de nouvelle permission) |
| Warning > 150 nœuds | Client-side (count `nodes.length`) |
| Autocomplete | Local simple MUI (pas FS-11) |
| Drawer | PNS-02 existant — réutiliser |
| BC recursive | Gate T-086 (WITH RECURSIVE) |
| D12 GroupNode | P2 |
| Layout P1 | Dagre fixe |
| US P2 | US-08, US-09, US-11, US-12 |
| US-01 bouton entités | Tâche future (hors T-003) |

### Fichiers créés / modifiés

| Fichier | Action | Taille |
|---|---|---|
| `FS-09-Dependency-Graph-back.md` | Créé | 19 Ko |
| `FS-09-Dependency-Graph-front.md` | Créé | 21 Ko |
| `FS-09-Dependency-Graph-userstories.md` | Mis à jour | 10 Ko |
| `FS-09-Dependency-Graph.md` | Créé (index) | 2 Ko |
| `docs/05-Project/tasks.yaml` | T-085 + T-086 ajoutés | — |

---

## Points d'attention pour l'agent back (FS-09-BACK)

1. **Multi-focal traversal** — 6 focalType distincts, logique BFS dans le service. Voir §4 (règles métier) et le tableau de traversal.

2. **Gate T-086** — `focalType=business_capability` avec expansion récursive BC enfants est bloqué. Sans T-086, retourner uniquement la BC focale + apps directes (fonctionnel partiel acceptable).

3. **Permission** — `@RequirePermissions('applications:read')` uniquement. Pas de nouvelle permission à seeder.

4. **Lecture seule** — pas de `SET LOCAL ark.current_user_id`, pas d'audit trail.

5. **middlewareAppId dans meta** — les arêtes doivent inclure `middlewareAppId` dans `meta` pour que le front puisse créer les 2 arêtes visuelles.

6. **Tests e2e** — écrire dans `e2e/tests/graph/graph.api.spec.ts` (Playwright, pas Jest e2e). Cypress est indisponible sur cet env.

## Points d'attention pour l'agent front (FS-09-FRONT)

1. **Gate bloquante** — attendre FS-09-BACK `done` (gates G-01 à G-09).

2. **PNS-02 drawer** — vérifier avant session que le composant accepte un `entityType` dynamique (pas seulement Application).

3. **ReactFlow déjà installé** — `@xyflow/react` dans `frontend/package.json` ; vérifier la version.

4. **Dagre à installer** — `@dagrejs/dagre` + `@types/dagre` à ajouter à `frontend/package.json`.

5. **Middleware → 2 arêtes visuelles** — la logique de split est côté front (pas backend) : une Interface avec `middlewareAppId` génère 2 arêtes ReactFlow.

6. **URL sync basique (P1)** — `useSearchParams` pour focalType/focalId/depth/layers. Le deep linking complet (US-12) est P2.

---

## Gates restantes pour débloquer T-003

- [ ] FS-09-BACK implémenté (`done`, G-01 à G-09 cochées)
- [ ] FS-09-FRONT passé à `stable` (après back done)
- [ ] T-086 traité (ou US-04 explicitement mis en P2 pour T-003)
