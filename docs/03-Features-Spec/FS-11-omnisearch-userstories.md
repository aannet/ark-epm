# ARK — FS-11 Omnisearch — User Stories

> **Changelog v0.1 :** Création — user stories détaillées pour l'Omnisearch (barre persistante, dropdown live, page de résultats avec filtres et pagination).

---

## En-tête

| Champ | Valeur |
|---|---|
| **ID** | FS-11-US |
| **Titre** | Omnisearch — User Stories |
| **Priorité** | P1 |
| **Statut** | `stable` |
| **Dépend de** | FS-11-BACK, FS-11-FRONT |
| **Spec mère** | FS-11 — Navigation & UX transverse |
| **Version** | 0.1 |

---

## Vue d'ensemble

Ce document définit les 11 user stories de la feature Omnisearch, couvrant trois zones fonctionnelles :

| Zone | US | Objectif |
|---|---|---|
| **Barre de recherche (header)** | US-01, US-02 | Accès permanent et raccourci clavier |
| **Dropdown live** | US-03, US-04, US-05 | Recherche rapide et navigation directe |
| **Page /search (résultats)** | US-06 à US-11 | Exploration complète avec filtres et pagination |

---

## Zone 1 — Barre de recherche (Header)

### US-01 — Barre de recherche persistante

> En tant qu'utilisateur, je veux voir une barre de recherche en permanence dans le header, afin de pouvoir initier une recherche depuis n'importe quelle page sans action préalable.

**Critères d'acceptation :**
- [ ] La barre de recherche est visible en permanence dans le `TopBar` (entre le logo et le menu utilisateur)
- [ ] Au repos : largeur de ~300px, placeholder "Rechercher..."
- [ ] Au focus/clic : s'étend animé à ~500px (300ms ease-out)
- [ ] L'expansion ne chevauche pas les autres éléments du header (UserMenu reste visible)
- [ ] Le champ garde le focus après expansion (pas de perte de curseur)
- [ ] Responsive : sur mobile (< 768px), seule l'icône est visible, clic ouvre un Dialog pleine largeur

**UI détaillée :**
```
[Logo ARK] ─────── [SearchIcon Input "Rechercher..." (~300px)] ───→ [~500px] ─── [UserMenu]
                     ↑ hover/focus
```

---

### US-02 — Raccourci clavier Cmd+K / Ctrl+K

> En tant qu'utilisateur, je veux appuyer sur Cmd+K (Mac) ou Ctrl+K (Windows/Linux) depuis n'importe quelle page, afin de positionner immédiatement mon curseur dans la barre de recherche.

**Critères d'acceptation :**
- [ ] Le raccourci fonctionne depuis toutes les pages de l'application
- [ ] Le raccourci est indiqué dans le placeholder : "Rechercher... (⌘K)" ou "Rechercher... (Ctrl+K)" selon l'OS
- [ ] L'appui sur le raccourci : focus le champ + le sélectionne (texte surligné si présent) + s'étend au format large
- [ ] Si un Dialog/Modal est ouvert, le raccourci ne fait rien (pas de conflit)
- [ ] Le raccourci ne déclenche pas la recherche, uniquement le focus
- [ ] Un tooltip "⌘K pour rechercher" apparaît au hover de l'icône de recherche

**Mapping clavier :**
| OS | Détection | Affichage |
|---|---|---|
| macOS | `navigator.platform` contient "Mac" | ⌘K |
| Windows/Linux | autres | Ctrl+K |

---

## Zone 2 — Dropdown Live (Quick Search)

### US-03 — Résultats temps réel dans dropdown

> En tant qu'utilisateur, je veux voir apparaître des résultats en temps réel dès que je tape, afin de trouver rapidement sans attendre.

**Critères d'acceptation :**
- [ ] Le dropdown s'affiche sous la barre de recherche (MUI Popper/Popper avec `anchorEl`)
- [ ] Déclenchement après debounce de 300ms (pas de requête à chaque frappe)
- [ ] Minimum 2 caractères pour lancer la recherche API
- [ ] 1 caractère : affiche "Saisissez au moins 2 caractères" (pas de requête)
- [ ] Pendant le chargement : affiche 5 skeletons (même hauteur que les items)
- [ ] Si aucun résultat : message "Aucun résultat pour '[query]'"
- [ ] Le dropdown se ferme automatiquement si je clique en dehors ou appuie sur Escape

**Appel API :**
```
GET /api/v1/search?q={query}&types[]=application&types[]=domain&...&limit=20
```

---

### US-04 — Groupes par type avec navigation

> En tant qu'utilisateur, je veux voir les résultats groupés par type d'entité avec un maximum par groupe, afin de comprendre la nature des résultats et accéder rapidement à ce qui m'intéresse.

**Critères d'acceptation :**
- [ ] Les résultats sont groupés par type avec des sous-titres de section
- [ ] Ordre des groupes : Applications → Business Capabilities → Domains → Data Objects → IT Components → Providers → Interfaces
- [ ] Maximum 5 résultats affichés par groupe dans le dropdown
- [ ] Si un groupe a >5 résultats : afficher "+ [n] de plus" en bas du groupe
- [ ] Chaque item affiche : icône du type, nom (highlight du match), description tronquée (60 car max)
- [ ] Hover sur un item : fond gris clair (MUI hover state)
- [ ] Le premier item du premier groupe est présélectionné par défaut

**Exemple de structure :**
```
┌─────────────────────────────────────────┐
│  Applications          (12 résultats)   │
│  🔵 CRM Salesforce                      │
│  🔵 CRM HubSpot                         │
│  ...                                    │
│  + 7 de plus                           │
│                                         │
│  Domaines              (3 résultats)   │
│  🟢 Finance                             │
│  ...                                    │
└─────────────────────────────────────────┘
```

---

### US-05 — Navigation vers détail ou page résultats

> En tant qu'utilisateur, je veux cliquer sur un résultat ou appuyer sur Enter pour naviguer, soit directement vers le détail d'une entité, soit vers la page de résultats complète.

**Critères d'acceptation :**
- [ ] **Clic sur un item** : navigue immédiatement vers `/{type}s/{id}`
- [ ] **Enter sans item sélectionné** (input vide ou 1-2 caractères) : navigue vers `/search?q={query}`
- [ ] **Enter avec item sélectionné** : navigue vers le détail de l'item sélectionné
- [ ] **Clic sur "+ [n] de plus"** : navigue vers `/search?q={query}&types[]={type}`
- [ ] Après navigation : le dropdown se ferme, la barre perd le focus, le champ est vidé
- [ ] Le browser history contient la navigation (bouton Retour fonctionne)

**Routes de navigation :**
| Type sélectionné | Route destination |
|---|---|
| application | `/applications/{id}` |
| domain | `/domains/{id}` |
| businessCapability | `/business-capabilities/{id}` |
| provider | `/providers/{id}` |
| itComponent | `/it-components/{id}` |
| dataObject | `/data-objects/{id}` |
| interface | `/interfaces/{id}` (placeholder si FS-08-FRONT pending) |

---

## Zone 3 — Page de Résultats (/search)

### US-06 — Page de résultats dédiée avec URL params

> En tant qu'utilisateur, je veux une page de résultats complète accessible via URL, afin de pouvoir partager ou bookmarker une recherche spécifique.

**Critères d'acceptation :**
- [ ] La page est accessible à `/search?q={query}` (pas de query = redirect vers `/` ou message)
- [ ] L'URL contient tous les paramètres actifs : `q`, `types[]`, `domainId`, `tagIds[]`, `page`, `limit`
- [ ] Modifier un filtre met à jour l'URL immédiatement (history.push, pas replace)
- [ ] L'URL est bookmarkable : rechargement de `/search?q=CRM&types[]=application` restitue la même recherche
- [ ] Le partage de l'URL fonctionne (un autre utilisateur authentifié voit les mêmes résultats)
- [ ] La page affiche : en-tête avec query, barre de filtres, liste paginée, compteur total

**Layout de la page :**
```
┌─────────────────────────────────────────────────────────────┐
│  Résultats pour "CRM" (124 trouvés)                         │
│                                                             │
│  [Filtres: Types ▼] [Domaines ▼] [Tags ▼] [Réinitialiser]  │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │  🔵 CRM Salesforce           [Application] [Modifier] │ │
│  │     Description...            Domaine: Ventes          │ │
│  ├───────────────────────────────────────────────────────┤ │
│  │  🟢 Finance (Domaine)        [Domaine]   [Modifier]   │ │
│  │     Description...                                     │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  [Préc] 1  2  3  ... 13  [Suiv]    20 / page                │
└─────────────────────────────────────────────────────────────┘
```

---

### US-07 — Filtre par type d'entité

> En tant qu'utilisateur, je veux filtrer les résultats par type d'entité, afin de ne voir que les applications ou que les domaines par exemple.

**Critères d'acceptation :**
- [ ] Filtre affiché comme un multi-select ou des chips togglables
- [ ] Types disponibles : les 7 entités EA (même liste que le dropdown)
- [ ] Par défaut : tous les types sont sélectionnés (pas de filtre actif)
- [ ] Désélectionner tous les types : message "Sélectionnez au moins un type"
- [ ] La sélection met à jour l'URL (`types[]=app&types[]=domain`)
- [ ] Les résultats se rafraîchissent automatiquement après changement de filtre
- [ ] Le compteur total est recalculé après filtrage

**UI :**
- Chips MUI avec icônes : `[🔵 Applications 12] [🟢 Domaines 3] [🟡 Capacités 5] ...`
- Click sur chip : toggle actif/inactif (variant filled/outline)

---

### US-08 — Filtre par domaine

> En tant qu'utilisateur, je veux filtrer les résultats par domaine métier, afin de restreindre la recherche à mon périmètre.

**Critères d'acceptation :**
- [ ] Filtre affiché comme un select multi-select ou un autocomplete
- [ ] Liste des domaines : tous les domaines existants en base (pas seulement ceux des résultats)
- [ ] Par défaut : aucun domaine sélectionné (filtre inactif)
- [ ] Sélection multiple possible (OR logique : domaine A OU domaine B)
- [ ] L'URL contient `domainIds[]={id1}&domainIds[]={id2}`
- [ ] Si un type sans domaine (ex: Provider sans FK domain) est sélectionné, le filtre domaine n'affecte pas ce type

**Edge case :**
- Un Data Object n'a pas de FK domain directe → le filtre domaine ne l'affiche pas (même si lié à une app de ce domaine)

---

### US-09 — Filtre par tags (dimensions et valeurs)

> En tant qu'utilisateur, je veux filtrer les résultats par tags, d'abord en choisissant une dimension puis une ou plusieurs valeurs, afin d'affiner par critères métiers.

**Critères d'acceptation :**
- [ ] Sélection en deux étapes : dimension → valeurs
- [ ] Dimensions disponibles : toutes les dimensions de tags existantes (Geography, Brand, LegalEntity...)
- [ ] Par dimension : afficher les valeurs comme des checkboxes multi-select
- [ ] OR logique entre valeurs d'une même dimension (Tag A OU Tag B)
- [ ] AND logique entre dimensions différentes (Dimension1:TagA ET Dimension2:TagB)
- [ ] L'URL contient `tagIds[]={id1}&tagIds[]={id2}` (pas de hiérarchie dimension dans l'URL, juste les IDs)
- [ ] Les valeurs sans résultat sont grisées (disabled) mais visibles

**UI :**
```
[Tags ▼]
└── Geography
    │   ☐ Europe
    │   ☑ France        ← sélectionné
    │   ☐ Germany
    └── LegalEntity
        │   ☑ Entity A  ← sélectionné
        │   ☐ Entity B
```

---

### US-10 — Pagination avec navigation

> En tant qu'utilisateur, je veux naviguer dans les résultats par pages, afin d'explorer au-delà des 20 premiers résultats.

**Critères d'acceptation :**
- [ ] Pagination MUI standard avec : First, Préc, [pages], Suiv, Last
- [ ] Taille de page par défaut : 20
- [ ] Taille de page configurable : 20 / 50 / 100 (select dans le footer)
- [ ] L'URL contient toujours `page={n}` et `limit={n}`
- [ ] Changement de page : scroll vers le haut de la liste (smooth scroll)
- [ ] Page 1 : bouton Préc disabled
- [ ] Dernière page : bouton Suiv disabled
- [ ] Si < limit résultats total : pagination masquée (1 page suffit)

**Comportement avec filtres :**
- Appliquer un filtre réduit le nombre total de pages → reset à page 1 automatiquement
- Changer la taille de page conserve la position approximative (ex: page 2 limit 20 → page 1 limit 40)

---

### US-11 — Réinitialisation des filtres à nouvelle recherche

> En tant qu'utilisateur, quand je modifie ma requête de recherche depuis la page de résultats, je veux que les filtres actifs soient réinitialisés, afin de repartir d'une recherche fraîche et éviter les résultats vides par incompatibilité.

**Critères d'acceptation :**
- [ ] Depuis la page `/search`, modifier le champ de recherche et appuyer Enter réinitialise TOUS les filtres
- [ ] Seul le nouveau `q` est conservé dans l'URL (pas de `types`, `domainIds`, `tagIds`)
- [ ] La page affiche les résultats pour la nouvelle query sans filtre
- [ ] Le compteur total reflète tous les types (non filtré)
- [ ] Le bouton "Réinitialiser les filtres" dans la barre de filtres a le même effet (conserve `q`, retire les filtres)
- [ ] Exception : si l'utilisateur arrive sur `/search` via un lien partagé (URL complète), les filtres de l'URL sont appliqués (pas de reset automatique)

**Scénario :**
1. Je cherche "CRM", filtre sur type=Applications → 12 résultats
2. Je change la recherche pour "Salesforce" (Enter)
3. → Résultats pour "Salesforce" sur tous les types (pas de filtre type actif)
4. → 45 résultats (Applications, Providers, Data Objects...)

---

## Matrice de traçabilité

| US | Backend impact | Frontend impact | Test E2E |
|---|---|---|---|
| US-01 | — | TopBar modification | [Playwright] Visibilité barre |
| US-02 | — | Keyboard handler global | [Playwright] Cmd+K focus |
| US-03 | Endpoint `/search` existant | Dropdown component, debounce | [Playwright] Résultats temps réel |
| US-04 | — | Grouping logic, highlight | [Playwright] Groupes par type |
| US-05 | — | Router navigation | [Playwright] Navigation détail/page |
| US-06 | Query params parsing | SearchResultsPage, URL sync | [Playwright] URL bookmarkable |
| US-07 | Param `types[]` | Chips filter | [Playwright] Filtrage type |
| US-08 | Param `domainIds[]` | Domain filter | [Playwright] Filtrage domaine |
| US-09 | Param `tagIds[]`, JOIN tags | Tag dimension filter | [Playwright] Filtrage tags |
| US-10 | Pagination `skip/take` | Pagination MUI, URL sync | [Playwright] Navigation pages |
| US-11 | — | Reset logic on new search | [Playwright] Reset filtres |

---

## Amendements aux specs techniques

Ce document invalide ou précise les éléments suivants des specs techniques existantes :

### Amendement A — FS-11-BACK (spec backend)

| Élément | Spec v0.1 | Amendement v0.2 (ce doc) |
|---|---|---|
| Hors-périmètre "filtres, facets — P2" | ❌ Exclu | ✅ Inclus (US-07, US-08, US-09) |
| Params API | `q`, `types[]`, `limit` | `q`, `types[]`, `domainIds[]`, `tagIds[]`, `page`, `limit`, `sortBy`, `sortOrder` |
| Pagination | Limit simple (top N) | Offset-based (`skip`, `take`) |
| Réponse | Liste plate max 20 | Meta `total`, `totalPages`, `currentPage` |

**Nouveau contrat API (extrait) :**
```yaml
/api/v1/search:
  parameters:
    - name: q
      required: true
    - name: types[]
      required: false
    - name: domainIds[]
      required: false
    - name: tagIds[]
      required: false
    - name: page
      default: 1
    - name: limit
      default: 20
      max: 100
```

### Amendement B — FS-11-FRONT (spec frontend)

| Élément | Spec v0.1 | Amendement v0.2 (ce doc) |
|---|---|---|
| Composant | Dialog qui s'ouvre sur Cmd+K | Champ persistent dans TopBar + dropdown |
| Page résultats | "P2" (hors périmètre MVP) | **P1** — `SearchResultsPage` à créer |
| UX Cmd+K | Ouvre le Dialog | Focus le champ (champ toujours visible) |
| Navigation | Dropdown uniquement | Dropdown + page dédiée |

---

## Dépendances et blocages

| Dépendance | Statut | Impact |
|---|---|---|
| FS-08-FRONT (Interfaces) | `draft` | US-05 : navigation vers `/interfaces/{id}` affichera un placeholder ou redirect |
| F-03 (Dimension Tags) | `done` ✅ | US-09 : filtres par tags prêts à implémenter |
| FS-06-FRONT (Applications) | `done` ✅ | US-05 : navigation vers applications fonctionnelle |

---

## Glossaire

| Terme | Définition dans ce contexte |
|---|---|
| **Dropdown live** | Popper MUI sous la barre de recherche affichant les top résultats temps réel |
| **Page /search** | Route `/search?q=...` avec liste paginée complète et filtres |
| **Filtre facette** | Filtre par catégorie (type, domaine, tag) affiché comme chips/checkboxes |
| **Bookmarkable** | URL contenant tous les paramètres, permettant de sauvegarder/partager la recherche |

---

_ARK — FS-11-US v0.1 — 2026-04-19_
