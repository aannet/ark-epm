# SESSION HANDOFF — back — T-087 — FS-09-BACK

_Date : 2026-05-03 — Agent : back — Session : fs09bk_

---

## Ce qui a été fait

Module `backend/src/graph/` créé de zéro. Endpoint `GET /api/v1/graph` opérationnel.

### Fichiers créés

| Fichier | Rôle |
|---|---|
| `backend/src/graph/dto/query-graph.dto.ts` | Enums `FocalType`/`GraphLayer` + `QueryGraphDto` (validation + CSV transform) |
| `backend/src/graph/dto/graph-response.dto.ts` | Interfaces TypeScript `GraphNode`, `GraphEdge`, `GraphResponse` |
| `backend/src/graph/graph.service.ts` | Moteur BFS : `buildRootNodes` × 6 focalTypes, `bfsExpand` depth 1-3, `fetchLayerNodes`, `fetchEdges` |
| `backend/src/graph/graph.controller.ts` | `GET /graph` + `@RequirePermissions('applications:read')` |
| `backend/src/graph/graph.module.ts` | Module NestJS minimal |
| `e2e/tests/graph/graph.api.spec.ts` | 8 tests Playwright |

### Fichiers modifiés

| Fichier | Modification |
|---|---|
| `backend/src/app.module.ts` | `GraphModule` enregistré dans imports[] |
| `docs/04-Tech/openapi.yaml` | Path `/graph` + schemas `GraphResponse`, `GraphNode`, `GraphEdge` |
| `docs/05-Project/tasks.yaml` | T-087 créée et clôturée |

### Commit

```
feat(graph): T-087 — FS-09 Dependency Graph backend (GET /api/v1/graph)
```

---

## API Contract (pour l'agent front)

```
GET /api/v1/graph?focalType=<FocalType>&focalId=<UUID>&depth=[1-3]&layers=<CSV>
Authorization: Bearer <token>
Permission: applications:read
```

**focalType** : `application | business_capability | domain | provider | it_component | data_object`

**layers** (défaut `applications,interfaces`) : `applications | interfaces | business_capabilities | providers | it_components | data_objects`

**Réponse 200** :
```json
{
  "nodes": [
    {
      "id": "uuid",
      "type": "application | bc | provider | it_component | data_object",
      "isFocal": true,
      "label": "Nom de l'entité",
      "meta": {
        "criticality": "LOW | MEDIUM | HIGH | CRITICAL | null",
        "lifecycleStatus": "string | null",
        "domainId": "uuid | null",
        "domainName": "string | null",
        "level": 1
      }
    }
  ],
  "edges": [
    {
      "id": "uuid",
      "sourceId": "uuid",
      "targetId": "uuid",
      "label": "Nom interface | null",
      "meta": {
        "type": "REST | SOAP | ...",
        "frequency": "REALTIME | ... | null",
        "criticality": "LOW | ... | null",
        "middlewareAppId": "uuid | null"
      }
    }
  ]
}
```

**Codes d'erreur** :
- 400 : paramètres invalides
- 401 : token manquant
- 403 : permission insuffisante
- 404 : focalId introuvable — body `{ "code": "ENTITY_NOT_FOUND" }`

---

## Points d'attention pour l'agent front (T-003)

### middlewareAppId → 2 arêtes visuelles
Quand `edge.meta.middlewareAppId` est non-null, le frontend doit créer **2 arêtes ReactFlow** :
- `sourceId → middlewareAppId` (label: type d'interface)
- `middlewareAppId → targetId` (label: "[via middleware]")
Le `middlewareApp` est déjà présent dans `nodes[]` comme nœud `application` standard.

### focalType=domain
La gate ne retourne **pas** de nœud focal de type "domain" — `type: 'domain'` n'existe pas dans GraphNode. Les nœuds racines sont directement les apps du domaine.

### layers vs filtres client
- **layer toggle** (toolbar) → déclenche un re-fetch API
- **filtres criticité/domaine** → masquage client-side UNIQUEMENT, pas de re-fetch

### Gate G-10 (BC récursif)
`focalType=business_capability` fonctionne mais retourne uniquement les apps directement liées à la BC focale. L'expansion récursive des BCs enfants est bloquée sur T-086.

---

## Gates validées

| Gate | Statut |
|---|---|
| G-01 Module répond | ✅ |
| G-02 focalType=application → 200 | ✅ |
| G-03 focalType=provider → apps liées | ✅ |
| G-04 depth=2 → voisins niveau 2 | ✅ |
| G-05 layers=business_capabilities → nœuds BC | ✅ |
| G-06 401/404 | ✅ |
| G-07 8/8 tests e2e Playwright | ✅ |
| G-08 Zéro erreur TypeScript | ✅ |
| G-09 openapi.yaml mis à jour | ✅ |
| G-10 BC recursive expansion | ⚠️ T-086 open |
