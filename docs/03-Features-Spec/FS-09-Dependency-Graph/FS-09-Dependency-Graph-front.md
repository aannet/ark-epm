# FS-09-FRONT — Dependency Graph — Frontend

_Version 0.1 — 2026-05-03_

## En-tête

| Champ | Valeur |
|---|---|
| **ID** | FS-09-FRONT |
| **Titre** | Dependency Graph — Frontend |
| **Priorité** | P1 |
| **Statut** | `draft` *(devient `stable` uniquement après que FS-09-BACK est `done`)* |
| **Dépend de** | **FS-09-BACK** (gate bloquante), FS-01, F-02 |
| **Spec mère** | FS-09 Dependency Graph |
| **Estimé** | 3j |
| **Version** | 0.1 |

> ⚠️ Cette spec reste à `draft` tant que `FS-09-BACK` n'est pas au statut `done` et que toutes ses gates (G-01 à G-09) ne sont pas cochées.

---

## 1. Objectif & Périmètre

**Ce que cette spec fait (P1) :**
Implémente la page `/graph` avec un canvas ReactFlow affichant le graphe de dépendances centré sur une entité focale (focalType + focalId). Inclut : toolbar avec toggle couches, depth slider, filtres client-side (criticité, domaine), 5 custom node components visuellement distincts par type, clic nœud via drawer PNS-02 existant, layout Dagre automatique, URL sync basique (focal/layers/depth), états vide et warning. L'autocomplete d'entrée est local (MUI Autocomplete, pas FS-11).

**Hors périmètre P1 (voir User Stories P2) :**
- Backend API — couvert par FS-09-BACK
- Navigation historique ← → (US-08) — P2
- Switch algo ELK / Force-directed (US-09) — P2
- Export Mermaid (US-11) — P2
- Deep linking complet avec gestion d'erreur focalId invalide (US-12) — P2
- Domain GroupNode conteneur (D12) — P2
- Bouton "Voir dans le graphe" sur les pages détail entités (US-01) — tâche future

---

## 2. User Stories

Voir `FS-09-Dependency-Graph-userstories.md` — section **User Stories P1** (US-01 à US-07, US-10).

Résumé des US P1 implémentées dans cette spec :
- **US-02** : Entrée via menu → canvas vide + Autocomplete local centré
- **US-03** : Canvas ReactFlow centré sur une Application avec ses interfaces
- **US-04** : Canvas centré sur une BC (partiel — gate T-086 pour expansion récursive)
- **US-05** : Toggle des couches dans la toolbar
- **US-06** : Depth slider 1/2/3 + warning > 150 nœuds
- **US-07** : Clic nœud → drawer PNS-02 (existant)
- **US-10** : Filtres criticité et domaine (client-side masking)

---

## 3. Référence Contrat API

Le contrat API complet est défini dans **FS-09-BACK §3**. Ne pas le redéfinir ici.

| Méthode | Route | Résumé | Permission |
|---------|-------|--------|------------|
| `GET` | `/api/v1/graph` | Graphe (nodes + edges) | `applications:read` |
| `GET` | `/api/v1/domains` | Liste des domaines (pour filtre domaine) | `domains:read` |
| `GET` | `/api/v1/[type]/:id` | Détail entité (déclenché au clic nœud via PNS-02) | `[type]:read` |

Codes HTTP à gérer côté frontend :

| Code | Signification | Action frontend |
|------|--------------|-----------------|
| `200` | Graphe retourné | Mise à jour ReactFlow |
| `401` | Non authentifié | Intercepteur Axios → `/login` |
| `403` | Permission insuffisante | Intercepteur Axios → `/403` |
| `404` | focalId introuvable | Afficher Alert "Entité introuvable", reset canvas |

---

## 4. Layout Contract

### 4.1 `GraphPage`

```yaml
page: GraphPage
route: /graph
auth_required: true
permission_required: applications:read

layout:
  shell: AppShell
  container: PageContainer
  container_props:
    maxWidth: false
    fullHeight: true          # calc(100vh)

zones:
  header:
    component: PageHeader
    props:
      title: t('graph.page.title')
      subtitle: null
      action: null

  toolbar:
    component: GraphToolbar
    position: sticky, sous header
    content:
      layer_toggles:
        - key: applications
          label: t('graph.layers.applications')
          default: ON
          disabled_when: is_focal_layer
        - key: interfaces
          label: t('graph.layers.interfaces')
          default: ON
        - key: business_capabilities
          label: t('graph.layers.business_capabilities')
          default: OFF
        - key: providers
          label: t('graph.layers.providers')
          default: OFF
        - key: it_components
          label: t('graph.layers.it_components')
          default: OFF
        - key: data_objects
          label: t('graph.layers.data_objects')
          default: OFF
      depth_slider:
        values: [1, 2, 3]
        default: 1
        label: t('graph.toolbar.depth')
      criticality_filter:
        type: multiselect
        options: [ALL, LOW, MEDIUM, HIGH, CRITICAL]
        default: ALL
        label: t('graph.toolbar.criticality')
      domain_filter:
        type: multiselect
        data_source: GET /api/v1/domains
        default: ALL
        label: t('graph.toolbar.domain')
      controls:
        - fitView: IconButton, t('graph.toolbar.fitView')
        - zoom_in / zoom_out: ReactFlow built-in

  main:
    component: ReactFlow
    height: calc(100vh - header_height - toolbar_height)
    layout_algorithm: Dagre (LR, direction left-to-right)
    layout_trigger: on new data from API
    minimap: true
    initial_state:
      condition: no focalId in URL params
      display: GraphAutocomplete centré sur canvas vide
    on_node_click: open PNS-02 drawer with entityType + entityId
    on_node_select: node selected=true (highlight border)
    node_types:
      - ApplicationNode   (application)
      - BusinessCapabilityNode (bc)
      - ProviderNode      (provider)
      - ItComponentNode   (it_component)
      - DataObjectNode    (data_object)

  drawer:
    component: PNS-02 (composant existant — réutiliser tel quel)
    trigger: onNodeClick
    data_fetch: GET /api/v1/[node.type]/:node.id (à la volée)
    width: 400px
    anchor: right
    on_close: deselect node, graphe préservé (position, zoom, filtres)
    footer:
      - button: t('common.actions.edit') — disabled si pas de permission write
      - button: t('graph.drawer.viewFull') → navigate('/[type]/:id')

  warnings_and_states:
    empty_graph:
      condition: nodes.length === 1 (focal uniquement, pas de voisins)
      component: Alert (MUI, severity=info, inline dans canvas)
      message: t('graph.emptyState.noRelations')
    too_many_nodes:
      condition: nodes.length > 150
      component: Alert (MUI, severity=warning, dismissable)
      message: t('graph.warning.tooManyNodes', { count: nodes.length })
    no_focal:
      condition: pas de focalId dans URL
      component: GraphAutocomplete centré sur canvas vide
```

---

## 5. Composants à Générer

### Structure de fichiers

```
frontend/src/
├── pages/
│   └── graph/
│       └── GraphPage.tsx                     (page principale)
├── components/
│   └── graph/
│       ├── nodes/
│       │   ├── ApplicationNode.tsx           (custom ReactFlow node)
│       │   ├── BusinessCapabilityNode.tsx    (custom ReactFlow node)
│       │   ├── ProviderNode.tsx              (custom ReactFlow node)
│       │   ├── ItComponentNode.tsx           (custom ReactFlow node)
│       │   └── DataObjectNode.tsx            (custom ReactFlow node)
│       ├── GraphToolbar.tsx                  (layer toggles + depth + filters)
│       └── GraphAutocomplete.tsx             (MUI Autocomplete local)
├── api/
│   └── graph.ts                              (useGraph(params) hook React Query)
└── types/
    └── graph.ts                              (GraphNode, GraphEdge, GraphResponse, FocalType, LayerKey)
```

### Types TypeScript

```typescript
// types/graph.ts
export type FocalType = 'application' | 'business_capability' | 'domain' | 'provider' | 'it_component' | 'data_object';
export type LayerKey = 'applications' | 'interfaces' | 'business_capabilities' | 'providers' | 'it_components' | 'data_objects';

export interface GraphNodeMeta {
  criticality?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | null;
  lifecycleStatus?: string | null;
  domainId?: string | null;
  domainName?: string | null;
  level?: number | null;
}

export interface GraphNode {
  id: string;
  type: 'application' | 'bc' | 'provider' | 'it_component' | 'data_object';
  isFocal: boolean;
  label: string;
  meta?: GraphNodeMeta;
}

export interface GraphEdgeMeta {
  type: string;        // InterfaceType
  frequency?: string | null;
  criticality?: string | null;
  middlewareAppId?: string | null;
}

export interface GraphEdge {
  id: string;
  sourceId: string;
  targetId: string;
  label?: string | null;
  meta?: GraphEdgeMeta;
}

export interface GraphResponse {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface GraphQueryParams {
  focalType: FocalType;
  focalId: string;
  depth?: number;
  layers?: LayerKey[];
}
```

### Custom Node Components — Rendu par type (D11)

| Composant | Forme | Couleur | Icône MUI | Note |
|---|---|---|---|---|
| `ApplicationNode` (focal) | Rectangle arrondi, bordure 3px | `primary.main` | `AppsIcon` | `isFocal=true` |
| `ApplicationNode` (autre) | Rectangle arrondi, bordure 1px | `primary.light` | `AppsIcon` | `isFocal=false` |
| `BusinessCapabilityNode` | Hexagone SVG (rect si implem complexe) | `secondary.main` | `CategoryIcon` | |
| `ProviderNode` | Rectangle | `warning.main` | `BusinessIcon` | |
| `ItComponentNode` | Rectangle | `info.main` | `MemoryIcon` | |
| `DataObjectNode` | Cylindre SVG (rect si implem complexe) | `success.main` | `StorageIcon` | |

> Les formes complexes (hexagone, cylindre) utilisent du SVG custom dans la node. Fallback rectangle accepté si implémentation trop lourde en session P1.

### Rendu middleware (D-interfaces)

```
Interface avec middlewareAppId non null :
  - Le backend retourne 1 arête avec middlewareAppId dans meta
  - Le frontend crée 2 arêtes visuelles ReactFlow :
      sourceId → middlewareAppId  (label: type de l'interface)
      middlewareAppId → targetId  (label: "[via middleware]")
  - middlewareApp est déjà présent comme nœud dans nodes[] (app standard)
```

### Filtres client-side (US-10)

```typescript
// Logique de masquage dans GraphPage.tsx
const visibleNodes = useMemo(() => {
  return nodes.filter(node => {
    if (node.isFocal) return true;                                    // focal jamais masqué
    if (criticalityFilter !== 'ALL' && node.meta?.criticality !== criticalityFilter) return false;
    if (domainFilter !== 'ALL' && node.meta?.domainId !== domainFilter) return false;
    return true;
  });
}, [nodes, criticalityFilter, domainFilter]);

const visibleNodeIds = new Set(visibleNodes.map(n => n.id));

const visibleEdges = useMemo(() =>
  edges.filter(e => visibleNodeIds.has(e.sourceId) && visibleNodeIds.has(e.targetId)),
  [edges, visibleNodeIds]
);
```

### URL sync basique

```typescript
// Lecture des params au mount
const [searchParams, setSearchParams] = useSearchParams();
const focalType = searchParams.get('focalType') as FocalType | null;
const focalId   = searchParams.get('focalId');
const depth     = Number(searchParams.get('depth') ?? '1');
const layers    = searchParams.get('layers')?.split(',') as LayerKey[] ?? DEFAULT_LAYERS;

// Mise à jour à chaque changement de state
useEffect(() => {
  setSearchParams({ focalType, focalId, depth: String(depth), layers: activeLayers.join(',') });
}, [focalType, focalId, depth, activeLayers]);
```

### Dagre layout

```typescript
// Appliquer Dagre sur les nodes/edges ReactFlow à chaque changement de données
import dagre from '@dagrejs/dagre';

function applyDagreLayout(nodes: Node[], edges: Edge[]): Node[] {
  const g = new dagre.graphlib.Graph();
  g.setGraph({ rankdir: 'LR', nodesep: 60, ranksep: 100 });
  g.setDefaultEdgeLabel(() => ({}));
  nodes.forEach(n => g.setNode(n.id, { width: 180, height: 60 }));
  edges.forEach(e => g.setEdge(e.source, e.target));
  dagre.layout(g);
  return nodes.map(n => {
    const { x, y } = g.node(n.id);
    return { ...n, position: { x: x - 90, y: y - 30 } };
  });
}
```

---

## 6. Clés i18n — Section `graph` à ajouter dans `fr.json`

> À ajouter **manuellement** dans `src/i18n/locales/fr.json` avant de lancer la session OpenCode.

```json
"graph": {
  "page": {
    "title": "Graphe de dépendances"
  },
  "autocomplete": {
    "placeholder": "Rechercher une application, un domaine, une capacité..."
  },
  "toolbar": {
    "layers": "Couches",
    "depth": "Profondeur",
    "fitView": "Ajuster la vue",
    "criticality": "Criticité",
    "domain": "Domaine",
    "all": "Tous"
  },
  "layers": {
    "applications": "Applications",
    "interfaces": "Interfaces",
    "business_capabilities": "Capacités métier",
    "providers": "Fournisseurs",
    "it_components": "Composants IT",
    "data_objects": "Données"
  },
  "emptyState": {
    "noFocal": {
      "title": "Choisissez un point de départ",
      "description": "Recherchez une application, un domaine ou une capacité métier."
    },
    "noRelations": "Aucune relation visible avec les couches actives."
  },
  "warning": {
    "tooManyNodes": "Ce graphe contient {{count}} nœuds — essayez de désactiver des couches ou de réduire la profondeur."
  },
  "drawer": {
    "viewFull": "Voir la fiche complète"
  }
}
```

---

## 7. Règles Métier Frontend

- **RM-01 — Filtres client-side uniquement :** Les filtres criticité et domaine (US-10) masquent des nœuds déjà chargés — ils ne déclenchent pas de nouvel appel API. Seuls les changements de `layers` ou `depth` déclenchent un refetch.

- **RM-02 — Nœud focal jamais masqué :** Quelle que soient les valeurs des filtres criticité et domaine, `isFocal=true` → nœud toujours visible.

- **RM-03 — Arête visible uniquement si les deux extrémités sont visibles :** Si un nœud est masqué par un filtre, toutes les arêtes qui lui sont connectées disparaissent aussi (arêtes orphelines masquées).

- **RM-04 — Layer toggle vs filtre :** Désactiver une couche via le toggle retire les nœuds de ce type ET déclenche un nouvel appel API. Les filtres criticité/domaine opèrent côté client sans appel réseau.

- **RM-05 — Warning > 150 nœuds :** Compter `nodes.length` à la réception de la réponse API (avant filtrage client-side). Afficher l'Alert warning si > 150.

- **RM-06 — Mise en surbrillance nœud sélectionné :** Quand le drawer PNS-02 est ouvert, le nœud correspondant passe à `selected: true` dans ReactFlow (bordure épaissie automatique). Fermeture du drawer → `selected: false`.

- **RM-07 — Refetch déclencheurs :** Appel API sur : changement focalType/focalId, changement depth, changement layers actifs. Pas d'appel sur : changement criticality filter, changement domain filter (client-side uniquement).

- **RM-08 — Masquage RBAC :** Le bouton "Modifier" dans le footer PNS-02 est `disabled` si l'utilisateur n'a pas la permission `[entityType]:write`.

---

## 8. Câblage App.tsx — Manuel

> À réaliser **manuellement** avant de lancer la session OpenCode.

```typescript
// App.tsx — route Graph à ajouter
import { GraphPage } from '@/pages/graph/GraphPage';

<Route path="/graph" element={<PrivateRoute />}>
  <Route index element={<GraphPage />} />
</Route>
```

> La route est protégée par `PrivateRoute` (token requis). La vérification de `applications:read` se fait dans `GraphPage` via `hasPermission()`.

---

## 9. Session Gate — Frontend

> Prérequis à valider **avant** de lancer la session OpenCode.

- [ ] **FS-09-BACK au statut `done`** — gates G-01 à G-09 toutes cochées
- [ ] **`GET /api/v1/graph` testé manuellement** — réponse `{nodes, edges}` validée
- [ ] **F-02 au statut `done`** — `useTranslation()` disponible
- [ ] **Clés `graph.*` ajoutées dans `fr.json`** (§6 de cette spec)
- [ ] **`hasPermission()` exporté depuis `@/store/auth`** (FS-01)
- [ ] **Câblage `App.tsx` réalisé manuellement** (§8 de cette spec)
- [ ] **`@dagrejs/dagre` ajouté à `frontend/package.json`** (+ `@types/dagre`)
- [ ] **PNS-02 drawer accepte un `entityType` dynamique** — vérifier l'interface du composant
- [ ] **ReactFlow déjà installé** (`@xyflow/react` dans `frontend/package.json`) — vérifier
- [ ] **Layout Contract §4 relu** — un seul bloc GraphPage, aucune zone manquante

---

## 10. Tests — Playwright API

> Cypress est indisponible sur cet environnement (T-009). Les tests e2e UI seront écrits en Playwright.

### Tests fonctionnels (à écrire en session QA séparée)

- [ ] `[Playwright]` `/graph` sans params → canvas vide + Autocomplete visible
- [ ] `[Playwright]` `/graph?focalType=application&focalId=<valid>` → nœuds et arêtes affichés
- [ ] `[Playwright]` Clic sur un nœud → drawer PNS-02 s'ouvre avec les données de l'entité
- [ ] `[Playwright]` Fermeture drawer → nœud désélectionné, graphe préservé
- [ ] `[Playwright]` Toggle layer OFF → nœuds du type masqués
- [ ] `[Playwright]` Toggle layer ON → appel API déclenché, nœuds ajoutés
- [ ] `[Playwright]` Depth slider 2 → appel API avec depth=2
- [ ] `[Playwright]` Filtre criticité → nœuds non conformes masqués (sans appel API)
- [ ] `[Playwright]` App sans interfaces → Alert "Aucune relation visible"
- [ ] `[Playwright]` > 150 nœuds → Alert warning affiché

### Tests Sécurité — Manuel ❌

- [ ] `[Manuel]` `/graph` sans token → redirect `/login`
- [ ] `[Manuel]` `/graph` sans `applications:read` → redirect `/403`

---

## 11. Commande OpenCode — Frontend

```
Contexte projet ARK — Session Frontend FS-09-FRONT :

Stack : React 18 + Vite + TypeScript strict + MUI v9 + react-i18next + @xyflow/react + @dagrejs/dagre
Règles MUI obligatoires :
- MUI v9 UNIQUEMENT — pas de Tailwind, pas de styled-components
- Styling : sx prop uniquement — jamais de styled()
- Inputs : variant="outlined" systématiquement sur tous les TextField

i18n :
- Toute string visible via t('clé') — JAMAIS de string en dur dans les composants
- Hook : const { t } = useTranslation()
- Fichier source : src/i18n/locales/fr.json — clés graph.* déjà présentes

RBAC frontend :
- hasPermission() importé depuis @/store/auth
- Vérifier avant TOUT rendu d'action d'écriture
- Drawer PNS-02 : bouton "Modifier" disabled si pas de permission write

Composants F-01 OBLIGATOIRES — ne jamais réinventer :
  import { PageHeader, EmptyState, LoadingSkeleton } from '@/components/shared'
  import { AppShell, PageContainer } from '@/components/layout'
  Drawer : PNS-02 existant — réutiliser, ne pas recréer

ReactFlow :
- Utiliser @xyflow/react (déjà installé)
- Layout Dagre via @dagrejs/dagre (à installer si absent)
- Custom node types : nodeTypes prop sur ReactFlow
- Sélection nœud : gérer via selected prop sur les nodes

JWT : token en mémoire uniquement — jamais sessionStorage / localStorage
Routing : react-router-dom v6, useSearchParams() pour URL sync
Câblage App.tsx : déjà réalisé manuellement — ne pas générer

Page unique : GraphPage uniquement (pas de liste, pas de CRUD).
Architecture : GraphPage → useGraph() hook React Query → GET /api/v1/graph
Filtres criticité/domaine : client-side sur le payload reçu (pas de refetch).
Filtres layers/depth : déclenchent un refetch.

Implémente la feature "Dependency Graph" frontend (FS-09-FRONT).
Génère : GraphPage, 5 custom node components, GraphToolbar, GraphAutocomplete, useGraph hook, types/graph.ts.
Ne génère PAS le câblage App.tsx — déjà fait manuellement.
Ne génère PAS les tests marqués [Manuel].
Ne génère PAS de tests Playwright (session QA séparée).
Ne fais aucune hypothèse non documentée. Si un point est ambigu, pose une question avant de coder.

[COLLER LE CONTENU COMPLET DE FS-09-FRONT.md ICI]
[COLLER LE CONTENU DE FS-09-BACK §3 (Contrat API OpenAPI) ICI]
```

---

## 12. Checklist de Validation Frontend

- [ ] `/graph` sans params → canvas vide + GraphAutocomplete centré
- [ ] `/graph?focalType=application&focalId=<id>` → graphe chargé, layout Dagre appliqué
- [ ] 5 custom node types rendus avec couleurs distinctes
- [ ] Nœud focal avec bordure épaisse `primary.main`
- [ ] Toolbar complète : layer toggles, depth slider, criticality multiselect, domain multiselect, fitView
- [ ] Layer toggle → refetch API avec layers mis à jour
- [ ] Depth slider → refetch API avec depth mis à jour
- [ ] Filtre criticité → masquage client-side sans refetch
- [ ] Filtre domaine → masquage client-side sans refetch
- [ ] Nœud focal jamais masqué par les filtres
- [ ] Clic nœud → drawer PNS-02 avec données chargées à la volée
- [ ] Nœud cliqué `selected=true` pendant que le drawer est ouvert
- [ ] Fermeture drawer → nœud désélectionné, graphe préservé
- [ ] App sans interfaces → Alert "Aucune relation visible"
- [ ] > 150 nœuds → Alert warning avec count
- [ ] Interface avec middlewareAppId → 2 arêtes visuelles
- [ ] URL sync : focalType, focalId, depth, layers dans searchParams
- [ ] `PageHeader` utilisé sur GraphPage
- [ ] Aucune string en dur dans les composants
- [ ] Aucune erreur TypeScript strict
- [ ] `@dagrejs/dagre` installé et layout fonctionnel

---

## 13. Revue de Dette Technique

### Gates TD

| # | Vérification | Commande / Action |
|---|---|---|
| TD-1 | Aucun `TODO / FIXME / HACK` non tracé | `git grep -n "TODO\|FIXME\|HACK" -- '*.tsx'` |
| TD-2 | Items F-999 activés par cette feature | Relire F-999 §2 |
| TD-3 | Checklist F-999 §4 : cases cochées | F-999 §4 |
| TD-4 | AGENTS.md : aucun pattern nouveau non documenté | Relire AGENTS.md |
| TD-5 | ARK-NFR.md : NFR impactés mis à jour | ARK-NFR.md |
| TD-6 | Nouvelles décisions transverses → Item F-999 si applicable | Jugement |

### Résultat de la Revue

| Champ | Valeur |
|---|---|
| **Sprint** | S4 |
| **Date de revue** | *(à renseigner post-impl)* |
| **Items F-999 fermés** | *(à renseigner)* |
| **Items F-999 ouverts** | *(à renseigner)* |
| **NFR mis à jour** | *(à renseigner)* |
| **Statut gates TD** | *(à renseigner)* |

---

_FS-09-FRONT v0.1 — draft — 2026-05-03_
