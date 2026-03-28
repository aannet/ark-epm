# Frontend — Guide Op\u00e9rationnel

> Guide sp\u00e9cialis\u00e9 pour l'Agent `front` sur ARK-EPM.  
> Ce fichier compl\u00e8te le `AGENTS.md` racine \u2014 charger les deux avant toute intervention.

---

## 1. Architecture React

### Structure du projet

```
frontend/src/
\u251c\u2500\u2500 App.tsx                     # Routing principal
\u251c\u2500\u2500 main.tsx                    # Point d'entr\u00e9e Vite
\u251c\u2500\u2500 queryClient.ts              # Configuration React Query
\u251c\u2500\u2500 api/                        # Client layer API
\u2502   \u251c\u2500\u2500 client.ts               # Axios/fetch base (interceptors, auth header)
\u2502   \u251c\u2500\u2500 auth.ts                 # Endpoints auth
\u2502   \u251c\u2500\u2500 applications.ts         # Endpoints applications
\u2502   \u251c\u2500\u2500 domains.ts              # Endpoints domains
\u2502   \u2514\u2500\u2500 tags.ts                 # Endpoints tags
\u251c\u2500\u2500 components/
\u2502   \u251c\u2500\u2500 layout/                 # AppShell, Sidebar, TopBar, PageContainer
\u2502   \u251c\u2500\u2500 shared/                 # PageHeader, StatusChip, EmptyState, ConfirmDialog, etc.
\u2502   \u251c\u2500\u2500 error/                  # ErrorBoundary
\u2502   \u251c\u2500\u2500 tags/                   # DimensionTagInput, TagChipList
\u2502   \u2514\u2500\u2500 <entity>/               # Composants sp\u00e9cifiques \u00e0 une entit\u00e9 (Drawer, Form, Filters)
\u251c\u2500\u2500 pages/
\u2502   \u251c\u2500\u2500 LoginPage.tsx
\u2502   \u2514\u2500\u2500 <entity>/               # EntityListPage, EntityDetailPage, EntityEditPage, EntityNewPage
\u251c\u2500\u2500 hooks/                      # useDebounce, useTagDimensions, etc.
\u251c\u2500\u2500 store/                      # State management (auth)
\u251c\u2500\u2500 theme/                      # index.ts \u2014 source de v\u00e9rit\u00e9 MUI
\u251c\u2500\u2500 types/                      # Interfaces TypeScript par entit\u00e9
\u251c\u2500\u2500 utils/                      # Fonctions utilitaires par entit\u00e9
\u2514\u2500\u2500 i18n/
    \u251c\u2500\u2500 index.ts                # Configuration i18next
    \u2514\u2500\u2500 locales/
        \u2514\u2500\u2500 fr.json             # Traductions fran\u00e7aises (source de v\u00e9rit\u00e9)
```

### Pattern de page CRUD

| Route | Page | Description |
|-------|------|-------------|
| `/<entity>s` | `EntityListPage` | Tableau avec pagination, filtres, drawer aper\u00e7u |
| `/<entity>s/new` | `EntityNewPage` | Formulaire de cr\u00e9ation |
| `/<entity>s/:id` | `EntityDetailPage` | Vue d\u00e9taill\u00e9e (lecture seule) |
| `/<entity>s/:id/edit` | `EntityEditPage` | Formulaire d'\u00e9dition |

### Pattern composant

Ordre interne d'un composant fonctionnel :

```typescript
interface EntityFormProps {
  entity?: Entity;
  onSubmit: (data: CreateEntityDto) => void;
  isLoading?: boolean;
}

export function EntityForm({ entity, onSubmit, isLoading }: EntityFormProps) {
  // 1. Hooks (state, refs, queries)
  const { t } = useTranslation();
  const [name, setName] = useState(entity?.name ?? '');

  // 2. Handlers
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ name });
  };

  // 3. Render
  return (
    <form onSubmit={handleSubmit}>
      {/* ... */}
    </form>
  );
}
```

---

## 2. Design System MUI

### R\u00e8gles fondamentales

- **MUI v5 exclusif** \u2014 aucun Tailwind, aucun CSS-in-JS custom (styled-components, emotion brut)
- Theme source de v\u00e9rit\u00e9 : `src/theme/index.ts`
- Utiliser les composants MUI natifs (`Box`, `Stack`, `Typography`, `Button`, `TextField`, `Chip`, etc.)
- Pour le spacing, utiliser `sx={{ p: 2, mb: 3 }}` (multiples de 8px)

### Composants shared disponibles

| Composant | Fichier | Usage |
|-----------|---------|-------|
| `PageHeader` | `components/shared/PageHeader.tsx` | Titre + bouton action en haut de page |
| `StatusChip` | `components/shared/StatusChip.tsx` | Chips color\u00e9s (lifecycle, criticality) |
| `EmptyState` | `components/shared/EmptyState.tsx` | Affichage quand aucune donn\u00e9e |
| `LoadingSkeleton` | `components/shared/LoadingSkeleton.tsx` | Squelettes de chargement |
| `ConfirmDialog` | `components/shared/ConfirmDialog.tsx` | Modal de confirmation (suppression) |
| `ArkAlert` | `components/shared/ArkAlert.tsx` | Alertes color\u00e9es (info, warning, error) |
| `ErrorBoundary` | `components/error/ErrorBoundary.tsx` | Catch des erreurs React |

### Layout

| Composant | Fichier | R\u00f4le |
|-----------|---------|------|
| `AppShell` | `components/layout/AppShell.tsx` | Conteneur principal (sidebar + topbar + contenu) |
| `Sidebar` | `components/layout/Sidebar.tsx` | Navigation lat\u00e9rale |
| `TopBar` | `components/layout/TopBar.tsx` | Barre sup\u00e9rieure (titre, user) |
| `PageContainer` | `components/layout/PageContainer.tsx` | Wrapper de contenu avec padding |

### Tags System

| Composant | Fichier | R\u00f4le |
|-----------|---------|------|
| `DimensionTagInput` | `components/tags/DimensionTagInput.tsx` | S\u00e9lecteur de tags par dimension (autocomplete) |
| `TagChipList` | `components/tags/TagChipList.tsx` | Affichage lecture seule des tags |

---

## 3. Internationalisation (i18n)

### Configuration

- Librairie : `i18next` + `react-i18next`
- Fichier de traduction : `src/i18n/locales/fr.json` (fran\u00e7ais uniquement)
- Langue par d\u00e9faut : FR

### Convention de cl\u00e9s

Format : `domain.page.element`

```json
{
  "applications": {
    "list": {
      "title": "Applications",
      "columns": {
        "name": "Nom",
        "domain": "Domaine",
        "criticality": "Criticit\u00e9"
      }
    },
    "detail": {
      "title": "D\u00e9tail de l'application"
    },
    "form": {
      "name": "Nom de l'application",
      "description": "Description"
    }
  },
  "common": {
    "actions": {
      "save": "Enregistrer",
      "cancel": "Annuler",
      "delete": "Supprimer"
    }
  }
}
```

### R\u00e8gles

- **Toutes** les strings visibles utilisent `t('key')` \u2014 jamais de string hardcod\u00e9e
- Les `StatusChip` et badges utilisent des labels i18n, pas des constantes
- Uniformit\u00e9 : m\u00eame cl\u00e9 entre liste / d\u00e9tail / drawer / formulaire
- Valeurs enum : v\u00e9rifier l'alignement backend \u2194 i18n

### Checklist i18n avant commit

- [ ] Tous labels visibles utilisent `t('key')`
- [ ] Chips/badges : labels via i18n
- [ ] Nouvelles cl\u00e9s ajout\u00e9es dans `fr.json`
- [ ] Pas de doublon de cl\u00e9 dans `fr.json`

### D\u00e9tection de strings hardcod\u00e9es

```bash
grep -E "label.*:.*['\"][A-Z]" frontend/src --include="*.tsx" -r
```

---

## 4. Data Fetching

### Pattern avec React Query

```typescript
// Hook de query
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getApplications, createApplication } from '@/api/applications';

// GET list
const { data, isLoading, error } = useQuery({
  queryKey: ['applications', { page, search, sortBy }],
  queryFn: () => getApplications({ page, search, sortBy }),
});

// POST / PATCH / DELETE
const queryClient = useQueryClient();
const mutation = useMutation({
  mutationFn: createApplication,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['applications'] });
  },
});
```

### API Client Layer

Tous les appels passent par `src/api/client.ts` qui g\u00e8re :
- Base URL (`/api/v1/`)
- Header `Authorization: Bearer <token>`
- Intercepteur de renouvellement de token
- Gestion des erreurs HTTP globales

### Gestion des \u00e9tats

Chaque composant qui fetch des donn\u00e9es **doit** g\u00e9rer 3 \u00e9tats :

```typescript
if (isLoading) return <LoadingSkeleton />;
if (error) return <ArkAlert severity="error" message={t('common.error.load')} />;
if (!data?.data?.length) return <EmptyState title={t('common.emptyState.title')} />;
```

---

## 5. Patterns CRUD Frontend

### Page Liste

```
\u250c\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510
\u2502  PageHeader: titre + bouton "+ Ajouter"  \u2502
\u251c\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2524
\u2502  Filtres (search, status, etc.)          \u2502
\u251c\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2524
\u2502  Table MUI                               \u2502
\u2502  \u250c\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u252c\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u252c\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u252c\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510 \u2502
\u2502  \u2502 Nom (lien) \u2502 Col 2  \u2502 Status \u2502 Actions\u2502 \u2502
\u2502  \u251c\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u253c\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u253c\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u253c\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2524 \u2502
\u2502  \u2502 App A      \u2502 ...    \u2502 Chip   \u2502 \u270f\ufe0f \ud83d\uddd1\ufe0f   \u2502 \u2502
\u2502  \u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2534\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2534\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2534\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518 \u2502
\u2502  Pagination                               \u2502
\u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518
```

**Zones de clic du tableau :**
- **Nom** = navigation directe vers la page d\u00e9tail (lien `<a>`)
- **Corps de la ligne** = ouvre le drawer aper\u00e7u
- **Actions** = ic\u00f4nes \u00e9dition / suppression

### Drawer (aper\u00e7u rapide)

- **Toujours clarifier** : readonly avec lien vers d\u00e9tail, ou \u00e9ditable inline
- Position : `anchor="right"`, largeur `400px`
- Contenu : r\u00e9sum\u00e9 de l'entit\u00e9, lien "Voir d\u00e9tail" en haut

### Formulaire (cr\u00e9ation / \u00e9dition)

- Composant unique `EntityForm` utilis\u00e9 par `NewPage` et `EditPage`
- Props : `entity?` (undefined pour cr\u00e9ation), `onSubmit`, `isLoading`
- Validation c\u00f4t\u00e9 client avant soumission
- Boutons : "Enregistrer" (primary) + "Annuler" (secondary)

---

## 6. Anti-Patterns UI

> Erreurs pass\u00e9es \u00e0 ne pas r\u00e9p\u00e9ter. Consulter avant toute intervention UI.

1. **Drawer PNS-02** : ne jamais impl\u00e9menter un drawer sans clarifier readonly vs \u00e9ditable
2. **Styling MUI** : toujours v\u00e9rifier `backgroundColor`, `color`, `z-index` apr\u00e8s cr\u00e9ation composant
3. **Chips** : toujours utiliser des labels i18n, jamais des constantes en dur
4. **Cache navigateur** : apr\u00e8s tout changement CSS/React, mentionner "V\u00e9rifiez (Ctrl+F5)"
5. **Cache TS Server** : erreurs d'import fant\u00f4mes \u2192 `Ctrl+Shift+P` \u2192 "TypeScript: Restart TS Server"

---

## 7. Commandes

```bash
# D\u00e9veloppement
cd frontend && npm run dev    # Hot reload (port 5173)

# Build
cd frontend && npm run build

# Preview build
cd frontend && npm run preview

# Hard refresh navigateur (syst\u00e9matique apr\u00e8s CSS/React)
Ctrl + F5                     # Windows/Linux
Cmd + Shift + R               # Mac

# Restart TS Server (si erreurs d'import inexplicables)
Ctrl + Shift + P \u2192 "TypeScript: Restart TS Server"
```

---

## 8. R\u00e9f\u00e9rences

| Document | Contenu |
|----------|---------|
| `docs/03-Features-Spec/F01-Design-System.md` | Design System complet |
| `docs/03-Features-Spec/F02-i18n.md` | Convention i18n |
| `src/theme/index.ts` | Source de v\u00e9rit\u00e9 couleurs/tokens MUI |
| `src/i18n/locales/fr.json` | Toutes les traductions |
