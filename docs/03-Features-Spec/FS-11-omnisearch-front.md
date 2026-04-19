# ARK — FS-11 Omnisearch — Frontend Spec

> **Changelog v0.1 :** Création — spec pour composant de recherche global Omnisearch dans TopBar (Ctrl+K), résultats groupés par type.

---

## En-tête

| Champ | Valeur |
|---|---|
| **ID** | FS-11-FRONT |
| **Titre** | Omnisearch — Frontend |
| **Priorité** | P1 |
| **Statut** | `stable` |
| **Dépend de** | **FS-11-BACK** (gate bloquante), FS-01, F-02 |
| **Spec mère** | FS-11 — Navigation & UX transverse |
| **Estimé** | 0.5j |
| **Version** | 0.1 |

> ✅ Gate levée : `FS-11-BACK` est au statut `done` (T-060, 2026-04-19). Toutes gates G-01 à G-08 cochées.

---

## 1. Objectif & Périmètre ⚠️

**Ce que cette spec fait :**

Intègre un composant de recherche global dans le `TopBar` existant, accessible via raccourci clavier `Ctrl+K` (ou `Cmd+K` sur Mac). Affiche les résultats de l'Omnisearch backend dans une popover/dialog MUI, groupés par type d'entité. Permet la navigation rapide vers n'importe quelle entité du catalogue via recherche textuelle.

**Hors périmètre :**
- Backend API — couvert par `FS-11-BACK`
- Recherche avancée avec filtres (type, domaine, criticité) — P2
- Page de résultats dédiée — P2, popover uniquement pour MVP
- Suggestions récentes / favoris — P2

---

## 2. User stories

### US-01 — Accès rapide recherche
En tant qu'utilisateur, je veux appuyer sur `Ctrl+K` (ou cliquer sur l'icône dans la topbar) pour ouvrir la barre de recherche, afin d'accéder rapidement à n'importe quelle entité du catalogue.

**Critères d'acceptation :**
- Raccourci `Ctrl+K` / `Cmd+K` fonctionne depuis n'importe quelle page
- Icône de recherche visible dans TopBar à côté du profil utilisateur
- Overlay/dialog s'affiche centrée ou en dropdown

### US-02 — Recherche temps réel
En tant qu'utilisateur, je veux taper un terme de recherche et voir les résultats apparaître en temps réel (avec debounce), afin de trouver rapidement l'entité recherchée.

**Critères d'acceptation :**
- Debounce 300ms avant déclenchement de la requête API
- Minimum 2 caractères pour lancer la recherche
- Indicateur de chargement (skeleton ou spinner) pendant la requête
- "Aucun résultat" affiché si la recherche ne retourne rien

### US-03 — Navigation clavier
En tant qu'utilisateur, je veux naviguer dans les résultats avec les flèches ↑↓ et valider avec Enter, afin de ne pas utiliser la souris.

**Critères d'acceptation :**
- Flèches ↑↓ naviguent entre les résultats (highlight visuel)
- Enter ouvre la page détail de l'entité sélectionnée
- Escape ferme la popover
- Premier résultat sélectionné par défaut

### US-04 — Groupes par type
En tant qu'utilisateur, je veux voir les résultats groupés par type d'entité (Applications, Domaines, Capacités...), afin de comprendre la nature de chaque résultat.

**Critères d'acceptation :**
- Résultats groupés par type avec sous-titre de section
- Ordre des groupes : Applications, Business Capabilities, Domains, Data Objects, IT Components, Providers, Interfaces
- Maximum 5 résultats affichés par groupe (avec "Voir plus" si >5 total)
- Nom de l'entité en gras, description tronquée en dessous

### US-05 — Navigation vers détail
En tant qu'utilisateur, je veux cliquer sur un résultat pour naviguer vers sa page détail, afin de consulter/modifier l'entité trouvée.

**Critères d'acceptation :**
- Clic ou Enter sur un résultat → navigation vers `/[type]s/:id`
- La popover se ferme automatiquement après navigation
- Le focus est réinitialisé

---

## 3. Référence Contrat API

> Le contrat API complet est défini dans **FS-11-BACK §3**. Ne pas le redéfinir ici.

Endpoint disponible après validation de FS-11-BACK :

| Méthode | Route | Résumé | Permission |
|---------|-------|--------|------------|
| `GET` | `/api/v1/search?q={term}&types[]={type}&limit={n}` | Recherche transverse | Tout utilisateur authentifié |

Codes HTTP à gérer côté frontend :

| Code | Signification | Action frontend |
|------|--------------|-----------------|
| `200` | Succès | Afficher résultats groupés |
| `400` | Requête invalide | Message inline "Minimum 2 caractères" |
| `401` | Non authentifié | Intercepteur Axios → `/login?reason=session_expired` |

---

## 4. Layout Contract

> Composant `Omnisearch` à intégrer dans le `TopBar` existant (F-01).

---

### 4.1 `Omnisearch` Component

```yaml
component: Omnisearch
type: shared component (src/components/search/Omnisearch.tsx)

location:
  parent: TopBar (src/components/layout/TopBar.tsx)
  position: entre le titre/logo et le UserMenu

layout:
  trigger:
    component: IconButton
    props:
      icon: SearchIcon (MUI)
      ariaLabel: t('search.openButton')
      onClick: openDialog()
  
  shortcut:
    keys: ['Control', 'k']  # ['Meta', 'k'] sur Mac
    handler: openDialog()

dialog:
  type: MUI Dialog (maxWidth="sm", fullWidth)
  props:
    open: boolean
    onClose: closeDialog()
  
  zones:
    header:
      component: TextField (variant="outlined", fullWidth)
      props:
        placeholder: t('search.placeholder')
        value: query
        onChange: handleQueryChange (debounced)
        InputProps:
          startAdornment: SearchIcon
          endAdornment: |
            conditional: isLoading
            then: CircularProgress (size=20)
            else: null
        autoFocus: true
        aria-label: t('search.inputAriaLabel')
    
    body:
      loading_state:
        component: LoadingSkeleton
        condition: isLoading
        props:
          count: 5
          height: 48
      
      empty_state:
        component: EmptyState (compact)
        condition: !isLoading && query.length >= 2 && results.length === 0
        props:
          icon: SearchOffIcon
          title: t('search.noResults')
          description: t('search.tryDifferentTerm')
      
      min_chars_state:
        component: Typography (color="text.secondary")
        condition: !isLoading && query.length > 0 && query.length < 2
        value: t('search.minChars', { count: 2 })
      
      results_list:
        component: List (MUI)
        condition: !isLoading && results.length > 0
        structure: grouped by type
        
        group_header:
          component: ListSubheader
          content: t(`search.types.${type}`) + (count > 5 ? ` (${count})` : '')
        
        item:
          component: ListItemButton
          props:
            selected: index === selectedIndex
            onClick: navigateToResult(result)
            onMouseEnter: setSelectedIndex(index)
          content:
            primary: highlightMatch(result.name, query)
            secondary: truncate(result.description, 60)
            icon: |
              switch(result.type):
                application: AppsIcon
                domain: DomainIcon
                businessCapability: BusinessIcon
                provider: StoreIcon
                itComponent: ComputerIcon
                dataObject: StorageIcon
                interface: SwapHorizIcon
        
        more_item:
          component: ListItemButton
          condition: totalResults > 20
          content: t('search.seeAllResults', { count: totalResults })
          onClick: navigate('/search-results?q=' + encodeURIComponent(query))
    
    footer:
      component: Box (display="flex", justifyContent="space-between")
      content:
        left: Typography (variant="caption", color="text.secondary")
              value: t('search.footerKeyboardHint')
        right: |
          conditional: results.length > 0
          then: Typography (variant="caption", color="text.secondary")
                value: t('search.resultCount', { count: results.length, total: meta.total })
```

---

### 4.2 Integration dans TopBar

```yaml
file: src/components/layout/TopBar.tsx

modifications:
  imports:
    add: import { Omnisearch } from '@/components/search/Omnisearch'
  
  render:
    position: après le titre/logo, avant les icônes user/notification
    code: |
      <Box sx={{ flexGrow: 1 }} />  /* spacer */
      <Omnisearch />
      <UserMenu />
```

---

## 5. Composants à Générer

### Structure de fichiers

```
frontend/src/
├── components/
│   └── search/
│       ├── Omnisearch.tsx          # Composant principal
│       ├── OmnisearchItem.tsx      # Item de résultat individual
│       ├── useOmnisearch.ts        # Hook React Query
│       └── index.ts                # Barrel export
├── api/
│   └── search.ts                   # API client search
├── types/
│   └── search.ts                   # Types SearchResultItem, SearchMeta
└── utils/
    └── search.utils.ts             # highlightMatch, truncate, getTypeIcon
```

### Props du Composant Omnisearch

```typescript
// Omnisearch.tsx — pas de props externes, state interne
interface OmnisearchState {
  open: boolean;
  query: string;
  selectedIndex: number;
}

// Hook useOmnisearch
interface UseOmnisearchReturn {
  results: SearchResultItem[];
  meta: SearchMeta | null;
  isLoading: boolean;
  error: Error | null;
}

// Types
interface SearchResultItem {
  id: string;
  type: SearchableEntityType;
  name: string;
  description: string | null;
  score: number;
  meta?: {
    domainName?: string;
    criticality?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    lifecycleStatus?: string;
  };
}

type SearchableEntityType = 
  | 'application' 
  | 'domain' 
  | 'businessCapability' 
  | 'provider' 
  | 'itComponent' 
  | 'dataObject' 
  | 'interface';

interface SearchMeta {
  total: number;
  query: string;
  types: SearchableEntityType[];
  limit: number;
}
```

---

## 6. Clés i18n — Section `search` à ajouter dans `fr.json` ⚠️

> À ajouter **manuellement** dans `src/i18n/locales/fr.json` avant de lancer la session OpenCode.

```json
{
  "search": {
    "openButton": "Ouvrir la recherche (Ctrl+K)",
    "placeholder": "Rechercher une application, un domaine, une capacité...",
    "inputAriaLabel": "Champ de recherche",
    "minChars": "Saisissez au moins {{count}} caractères",
    "noResults": "Aucun résultat trouvé",
    "tryDifferentTerm": "Essayez un terme de recherche différent",
    "seeAllResults": "Voir les {{count}} résultats",
    "resultCount": "{{count}} affichés sur {{total}}",
    "footerKeyboardHint": "↑↓ pour naviguer · Enter pour ouvrir · Esc pour fermer",
    "types": {
      "application": "Applications",
      "domain": "Domaines",
      "businessCapability": "Capacités métier",
      "provider": "Fournisseurs",
      "itComponent": "Composants IT",
      "dataObject": "Objets de données",
      "interface": "Interfaces"
    }
  }
}
```

---

## 7. Règles Métier Frontend ⚠️

- **RM-06 — Debounce de la recherche :**
  ```typescript
  const debouncedSearch = useMemo(
    () => debounce((q: string) => {
      if (q.length >= 2) searchQuery(q);
    }, 300),
    []
  );
  ```

- **RM-07 — Highlight du terme recherché :**
  ```typescript
  // search.utils.ts
  export function highlightMatch(text: string, query: string): React.ReactNode {
    if (!query) return text;
    const regex = new RegExp(`(${escapeRegExp(query)})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, i) => 
      regex.test(part) ? 
        <mark key={i} style={{ backgroundColor: 'yellow', fontWeight: 'bold' }}>{part}</mark> : 
        part
    );
  }
  ```

- **RM-08 — Mapping type → route :**
  ```typescript
  const typeToRoute: Record<SearchableEntityType, string> = {
    application: '/applications',
    domain: '/domains',
    businessCapability: '/business-capabilities',
    provider: '/providers',
    itComponent: '/it-components',
    dataObject: '/data-objects',
    interface: '/interfaces',  // placeholder tant que FS-08-FRONT en draft
  };
  
  function navigateToResult(result: SearchResultItem): void {
    const baseRoute = typeToRoute[result.type];
    navigate(`${baseRoute}/${result.id}`);
  }
  ```

- **RM-09 — Navigation clavier :**
  ```typescript
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!open) return;
      
      switch(e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(i => Math.min(i + 1, results.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(i => Math.max(i - 1, 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (results[selectedIndex]) {
            navigateToResult(results[selectedIndex]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          closeDialog();
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, results, selectedIndex]);
  ```

- **RM-10 — Mac/Windows detection :**
  ```typescript
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const shortcutKey = isMac ? '⌘K' : 'Ctrl+K';
  ```

---

## 8. Session Gate — Frontend ⚠️

> Prérequis à valider **avant** de lancer la session OpenCode et de passer cette spec à `stable`.

- [ ] **FS-11-BACK au statut `done`** — gates G-01 à G-08 toutes cochées
- [ ] **API testée manuellement** — `GET /api/v1/search?q=CRM` retourne des résultats
- [ ] **F-02 au statut `done`** — `useTranslation()` disponible
- [ ] **Clés `search.*` ajoutées dans `fr.json`** (§5 de cette spec)
- [ ] **`TopBar` existe et peut accueillir le composant** (F-01)
- [ ] **FS-11-FRONT passée au statut `stable`** avant de lancer OpenCode

---

## 9. Tests — E2E Playwright ⚠️

> Remplacer Cypress par Playwright (convention projet mise à jour).

### Parcours nominaux

- [ ] `[Playwright]` Raccourci `Ctrl+K` ouvre la popover de recherche
- [ ] `[Playwright]` Clic sur l'icône recherche dans TopBar ouvre la popover
- [ ] `[Playwright]` Saisir "CRM" affiche des résultats après debounce
- [ ] `[Playwright]` Résultats sont groupés par type avec sous-titres
- [ ] `[Playwright]` Clic sur un résultat navigue vers la page détail
- [ ] `[Playwright]` Flèche ↓ sélectionne le résultat suivant
- [ ] `[Playwright]` Touche Enter ouvre le résultat sélectionné
- [ ] `[Playwright]` Touche Escape ferme la popover
- [ ] `[Playwright]` Recherche sans résultats affiche "Aucun résultat"
- [ ] `[Playwright]` Moins de 2 caractères affiche le message "Minimum 2 caractères"

### Parcours d'erreur

- [ ] `[Playwright]` Token expiré pendant la recherche → redirect vers `/login`

---

## 10. Commande OpenCode — Frontend ⚠️

```
Contexte projet ARK — Session Frontend FS-11-FRONT :

Stack : React 18 + Vite + TypeScript strict + MUI v5 + react-i18next + React Query
Règles MUI obligatoires :
- MUI v5 UNIQUEMENT — pas de Tailwind, pas de styled-components
- Styling : sx prop uniquement — jamais de styled()
- Inputs : variant="outlined" systématiquement sur tous les TextField
- Pas de MUI X DataGrid

i18n :
- Toute string visible via t('clé') — JAMAIS de string en dur dans les composants
- Hook : const { t } = useTranslation()
- Fichier source : src/i18n/locales/fr.json — clés search.* déjà présentes

RBAC frontend :
- Omnisearch accessible à tout utilisateur authentifié (pas de permission spécifique)
- JwtAuthGuard global déjà actif

Composants F-01 OBLIGATOIRES — ne jamais réinventer :
  import { EmptyState, LoadingSkeleton } from '@/components/shared'
  import { TopBar } from '@/components/layout'

React Query :
- useQuery pour la recherche avec debounce
- cacheTime: 0 (pas de cache, recherche temps réel)

JWT : token en mémoire uniquement — jamais sessionStorage / localStorage
Routing : react-router-dom v6, navigate() depuis useNavigate()
Pattern de référence frontend : module Domains (FS-02-FRONT) — s'y conformer.

Respecte impérativement le Layout Contract §3 de cette spec :
- Composant F-01 exact par zone
- Clé i18n exacte par label
- Navigation clavier (↑↓ Enter Escape) implémentée

Implémente la feature "Omnisearch" frontend (FS-11-FRONT).
Génère : Omnisearch.tsx, OmnisearchItem.tsx, useOmnisearch.ts, search.ts (API), types/search.ts, search.utils.ts, tests Playwright.
Ne génère PAS le câblage App.tsx — TopBar déjà existant.
Ne génère PAS les tests marqués [Manuel].
Ne fais aucune hypothèse non documentée. Si un point est ambigu, pose une question avant de coder.

[COLLER LE CONTENU COMPLET DE FS-11-FRONT.md ICI]
[COLLER LE CONTENU DE FS-11-BACK §3 (Contrat API OpenAPI) ICI]
```

---

## 11. Checklist de Validation Frontend

> À compléter après génération OpenCode, avant de passer FS-11-FRONT à `done`.

- [ ] `Ctrl+K` ouvre la popover depuis n'importe quelle page
- [ ] Icône recherche visible dans TopBar
- [ ] Debounce 300ms respecté (vérifier avec console.log)
- [ ] Minimum 2 caractères avant requête
- [ ] Résultats groupés par type avec sous-titres
- [ ] Highlight du terme recherché dans les noms
- [ ] Navigation ↑↓ fonctionne avec highlight visuel
- [ ] Enter navigue vers la page détail
- [ ] Escape ferme la popover
- [ ] Clic sur résultat navigue vers détail
- [ ] "Aucun résultat" affiché si vide
- [ ] Aucune string en dur dans les composants
- [ ] Aucune erreur TypeScript strict
- [ ] Tests Playwright nominaux passent

---

## 12. Revue de Dette Technique *(gate de fin de sprint — obligatoire)* ⚠️

### Gates TD

| # | Vérification | Commande / Action |
|---|---|---|
| TD-1 | Aucun `TODO / FIXME / HACK` non tracé dans le code livré | `git grep -n "TODO\|FIXME\|HACK" -- '*.tsx'` |
| TD-2 | Items F-999 activés par cette feature : statut mis à jour | Relire F-999 §2 |
| TD-3 | Checklist F-999 §4 : cases cochées pour les items de ce sprint | F-999 §4 |
| TD-4 | AGENTS.md : aucun pattern nouveau non documenté introduit | Relire AGENTS.md |
| TD-5 | ARK-NFR.md : NFR impactés mis à jour | ARK-NFR.md |
| TD-6 | Nouvelles décisions transverses → nouvel Item F-999 créé si applicable | Jugement |

### Résultat de la Revue

| Champ | Valeur |
|---|---|
| **Sprint** | S4 |
| **Date de revue** | *(à compléter)* |
| **Items F-999 fermés** | — |
| **Items F-999 ouverts** | — |
| **Nouveaux items F-999 créés** | — |
| **NFR mis à jour** | — |
| **TODOs résiduels tracés** | — |
| **Statut gates TD** | *(à cocher)* |

---

_ARK — FS-11-FRONT v0.1 — 2026-04-19_
