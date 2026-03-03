# ARK — Feature Spec F-01 : Design System & UI Foundation

_Version 0.2 — Février 2026_

> **Changelog v0.2 :** Ajout de `NotFoundPage` (route catch-all `*`) et `ErrorBoundary` (wrapper global). Gates G-11/G-12/G-13 ajoutés. Ordre d'exécution mis à jour. Checklist complétée.

> **Usage :** Ce document est la spec du socle graphique du projet ARK. Il est réalisé **entièrement manuellement** — aucune génération OpenCode. Il succède à F-00 et précède FS-01 (Auth). Sans lui, chaque Feature-Spec frontend réinvente les tokens, les composants de layout et les conventions visuelles — au risque d'incohérences cumulatives impossibles à corriger après coup.

> **Sources :** `ARK - Design charte express v0.1`, `ARK - UI Kit v0.1`, `AGENTS.md § Design System`

---

## En-tête

| Champ | Valeur |
|---|---|
| **ID** | F-01 |
| **Titre** | Design System & UI Foundation — Theme MUI, Layout Shell, composants partagés |
| **Priorité** | P1 |
| **Statut** | `draft` |
| **Dépend de** | F-00 |
| **Estimé** | 1 jour |
| **Version** | 0.1 |
| **Mode** | 🟡 Manuel — **ne pas déléguer à OpenCode** |

---

## 1. Objectif & Périmètre ⚠️

**Ce que cette feature fait :**

F-01 installe la couche visuelle commune du frontend ARK. À l'issue de cette phase, le theme MUI est configuré et actif, le Layout Shell (Sidebar + zone content) est fonctionnel avec des liens de navigation vides, les polices sont chargées, et un jeu de composants partagés réutilisables est disponible pour toutes les Feature-Specs suivantes.

Analogie : F-00 a coulé les fondations et monté la charpente. F-01 pose le bardage extérieur, les cloisons communes et les prises électriques. Chaque pièce (feature) viendra ensuite se brancher dessus sans réinventer l'installation.

**Ce qu'elle ne fait pas (hors périmètre) :**

- Aucun écran métier — pas de page Domains, Applications, etc.
- Pas d'écran Login — c'est FS-01 qui le produit (mais il utilisera `LoginLayout` défini ici)
- Pas de routing authentifié / `PrivateRoute` — c'est FS-01
- Pas de connexion API — aucun appel réseau dans F-01
- Pas de React Flow — le composant graphe est dans FS-09

---

## 2. Structure des fichiers cible ⚠️

À l'issue de F-01, l'arborescence frontend est augmentée comme suit :

```
frontend/src/
├── theme/
│   └── index.ts                  ← Theme MUI (tokens, overrides) — source de vérité
│
├── components/
│   └── layout/
│       ├── AppShell.tsx           ← Wrapper racine : Sidebar + zone content
│       ├── Sidebar.tsx            ← Navigation verticale fixe (fond #1A237E)
│       ├── TopBar.tsx             ← Barre supérieure (titre page + actions contextuelles)
│       └── PageContainer.tsx     ← Wrapper de contenu avec padding standard (24px)
│
├── components/
│   └── shared/
│       ├── StatusChip.tsx         ← Badge coloré (criticality, lifecycle, isActive)
│       ├── ConfirmDialog.tsx      ← Dialog de confirmation réutilisable (suppressions)
│       ├── EmptyState.tsx         ← Empty state standard (icône + message + CTA)
│       ├── PageHeader.tsx         ← Titre de page + bouton d'action principal
│       └── LoadingSkeleton.tsx    ← Skeleton standard pour les listes/tableaux
│
├── pages/
│   ├── NotFoundPage.tsx          ← Page 404 — route catch-all `*`
│   └── DesignSystemPage.tsx      ← Page de démo composants (dev only, route `/design`)
│
├── components/
│   └── error/
│       └── ErrorBoundary.tsx     ← React ErrorBoundary global (erreurs runtime JS)
│
└── assets/
    └── logo.svg                  ← Logo ARK (placeholder si absent)
```

> Ces composants sont les **briques de base** injectées dans chaque Feature-Spec. OpenCode les utilisera comme référence — ne pas les modifier sans mettre à jour AGENTS.md.

---

## 3. Contrat des composants partagés ⚠️

### 3.1 `AppShell`

Wrapper racine de l'application. Encapsule `Sidebar` + zone de contenu principale.

```typescript
// Pas de props — composant racine, consomme le router
export default function AppShell(): JSX.Element

// Structure DOM attendue :
// <Box sx={{ display: 'flex', height: '100vh' }}>
//   <Sidebar />
//   <Box component="main" sx={{ flex: 1, overflow: 'auto', bgcolor: 'background.default' }}>
//     <TopBar />
//     <Outlet />   ← React Router v6
//   </Box>
// </Box>
```

### 3.2 `Sidebar`

Navigation verticale fixe. Fond `primary.main` (#1A237E).

```typescript
interface NavItem {
  label: string;
  icon: React.ReactNode;   // Icône MUI
  path: string;            // Route React Router
}

// Items de navigation P1 (dans l'ordre d'affichage) :
const navItems: NavItem[] = [
  { label: 'Applications',          icon: <AppsIcon />,        path: '/applications' },
  { label: 'Capacités métier',      icon: <AccountTreeIcon />, path: '/business-capabilities' },
  { label: 'Interfaces',            icon: <AltRouteIcon />,    path: '/interfaces' },
  { label: 'Objets de données',     icon: <StorageIcon />,     path: '/data-objects' },
  { label: 'Composants IT',         icon: <DnsIcon />,         path: '/it-components' },
  { label: 'Fournisseurs',          icon: <BusinessIcon />,    path: '/providers' },
  { label: 'Domaines',              icon: <FolderIcon />,      path: '/domains' },
];

// Règles visuelles :
// - Item inactif : texte blanc 85% opacité, pas d'icône colorée
// - Item actif   : texte blanc 100%, icône secondary.main (#007FFF), fond alpha(#007FFF, 0.12)
// - Largeur fixe : 240px
// - Logo ARK en haut (lien vers '/')
// - Nom utilisateur + avatar en bas (données statiques en F-01, connecté en FS-01)
// - Bouton "Se déconnecter" en bas — handler injecté via prop (branché en FS-01)

interface SidebarProps {
  onLogout?: () => void; // injecté par AppShell en FS-01, absent (no-op) en F-01
}

// Bas de sidebar :
// - Nom utilisateur + avatar (données statiques en F-01, connecté en FS-01)
// - Bouton "Se déconnecter" — handler injecté via prop ou context (branché en FS-01)
```

### 3.3 `TopBar`

Barre supérieure de la zone content. Affiche le titre de la page courante.

```typescript
interface TopBarProps {
  title?: string;  // Si absent, déduit du pathname React Router
}
// Fond background.paper (#FFFFFF), bordure bottom 1px divider (#E2E8F0)
// Hauteur : 56px
```

### 3.4 `PageContainer`

Wrapper de contenu avec padding standard.

```typescript
interface PageContainerProps {
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl'; // défaut : 'xl'
}
// padding: 24px (spacing 3) — conforme UI Kit §1
```

### 3.5 `PageHeader`

Titre de section + bouton d'action principal. Utilisé en haut de chaque page liste.

```typescript
interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
  };
}
// Bouton action : variant="contained" (primaire)
// Typographie titre : variant="h2" du theme
```

### 3.6 `ConfirmDialog`

Dialog de confirmation MUI réutilisable. Utilisé avant toute suppression.

```typescript
interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;           // Supporte le JSX pour les messages riches (ex: compteurs)
  confirmLabel?: string;     // défaut : "Supprimer"
  cancelLabel?: string;      // défaut : "Annuler"
  onConfirm: () => void;
  onCancel: () => void;
  severity?: 'error' | 'warning'; // défaut : 'error' — bouton confirm en color="error"
  isLoading?: boolean;       // désactive les boutons pendant l'opération
}
```

### 3.7 `StatusChip`

Badge coloré pour les valeurs d'énumération métier.

```typescript
type CriticalityValue = 'low' | 'medium' | 'high' | 'mission-critical';
type LifecycleValue   = 'active' | 'deprecated' | 'planned' | 'retired';
type ActiveValue      = boolean;

interface StatusChipProps {
  type: 'criticality' | 'lifecycle' | 'active';
  value: CriticalityValue | LifecycleValue | ActiveValue;
}

// Mapping couleurs :
// criticality.low             → success (#16A34A)
// criticality.medium          → warning (#D97706)
// criticality.high            → error (#DC2626)
// criticality.mission-critical→ error (#DC2626) + bold
// lifecycle.active            → success
// lifecycle.deprecated        → warning
// lifecycle.planned           → info (#0369A1)
// lifecycle.retired           → default (gris)
// active.true                 → success
// active.false                → default (gris)
```

### 3.8 `EmptyState`

État vide standard pour les listes sans données.

```typescript
interface EmptyStateProps {
  icon?: React.ReactNode;   // défaut : <InboxIcon /> gris
  title: string;            // ex: "Aucun domaine créé"
  description?: string;     // ex: "Commencez par créer votre premier domaine."
  action?: {
    label: string;
    onClick: () => void;
  };
}
// Centré verticalement, icône grise, texte secondary
```

### 3.9 `LoadingSkeleton`

Skeleton standard pour les listes et tableaux en cours de chargement.

```typescript
interface LoadingSkeletonProps {
  rows?: number;    // défaut : 5
  columns?: number; // défaut : 4
}
// Utilise MUI Skeleton variant="rectangular" animation="wave"
// Conforme UI Kit §6 : toujours Skeleton, jamais de spinner central
```

### 3.10 `NotFoundPage`

Page 404 affichée sur la route catch-all `*`. Indépendante du Layout Shell — accessible même si `AppShell` ne charge pas.

```typescript
// Pas de props — composant autonome
export default function NotFoundPage(): JSX.Element

// Comportement :
// - Affiche le code "404" en grand (typographie h1, color primary.main)
// - Message : "Page introuvable"
// - Description : "La page que vous recherchez n'existe pas ou a été déplacée."
// - Bouton "Retour à l'accueil" → navigate('/') via useNavigate()
// - Centré verticalement dans le viewport (height: 100vh)
// - Fond background.default (#F8FAFC) — pas de Sidebar

// Route à déclarer en dernier dans App.tsx :
// <Route path="*" element={<NotFoundPage />} />
```

### 3.11 `ErrorBoundary`

Composant React class qui capture les erreurs JavaScript runtime non gérées. Wrapping global autour de `<AppShell>`.

```typescript
interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode; // UI custom optionnelle — défaut : ErrorFallback interne
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

// ErrorFallback interne (affiché si hasError = true) :
// - Message : "Une erreur inattendue s'est produite"
// - Détail : error.message en <code> (JetBrains Mono) — affiché uniquement en NODE_ENV=development
// - Bouton "Recharger la page" → window.location.reload()
// - Bouton "Retour à l'accueil" → window.location.href = '/'
// - Centré verticalement, fond background.default

// Usage dans main.tsx :
// <ErrorBoundary>
//   <ThemeProvider theme={theme}>
//     <CssBaseline />
//     <App />
//   </ThemeProvider>
// </ErrorBoundary>
```

> ⚠️ `ErrorBoundary` est un **class component** — React n'expose pas encore d'équivalent hook pour `componentDidCatch`. Ne pas tenter de le convertir en fonction.

> Note : `ErrorBoundary` capture les erreurs de rendu React (composants qui crashent). Il ne capture **pas** les erreurs dans les event handlers ni les erreurs asynchrones (fetch, setTimeout) — celles-ci sont gérées par les try/catch dans les services et les intercepteurs Axios.

---

## 4. Règles de Mise en Œuvre Critiques ⚠️

### RM-01 : `theme/index.ts` est importé une seule fois dans `main.tsx`

```typescript
// frontend/src/main.tsx
import { ThemeProvider, CssBaseline } from '@mui/material';
import { theme } from '@/theme';
import { ErrorBoundary } from '@/components/error/ErrorBoundary';

root.render(
  <ErrorBoundary>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  </ErrorBoundary>
);
```

> Ne jamais redéfinir les tokens couleur en dur dans les composants (`sx={{ color: '#1A237E' }}`). Toujours utiliser les tokens du theme (`sx={{ color: 'primary.main' }}`).

### RM-02 : Alias `@/` configuré dans `vite.config.ts`

```typescript
// frontend/vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
});
```

```json
// frontend/tsconfig.json — paths correspondants
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": { "@/*": ["src/*"] }
  }
}
```

### RM-03 : Polices chargées dans `index.html` (pas en CSS)

```html
<!-- frontend/index.html — dans <head> -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&family=JetBrains+Mono:wght@400&display=swap" rel="stylesheet">
```

> Charger dans `index.html` garantit que les polices sont disponibles avant le premier rendu React — évite le FOUT (Flash Of Unstyled Text).

### RM-04 : `Sidebar` utilise `useLocation()` pour l'item actif

```typescript
import { useLocation, NavLink } from 'react-router-dom';
const { pathname } = useLocation();
const isActive = (path: string) => pathname.startsWith(path);
```

> Ne pas utiliser `NavLink` avec le style inline MUI — gérer l'état actif manuellement pour contrôler précisément le rendu (icône colorée + fond alpha).

### RM-05 : Tailwind CSS est interdit

Aucune classe Tailwind dans ce projet. MUI + `sx` prop est le seul système de styling autorisé. Tout `className="..."` contenant des utilitaires Tailwind doit être refusé en code review.

### RM-06 : Composants partagés exportés depuis un barrel

```typescript
// frontend/src/components/shared/index.ts
export { default as StatusChip }     from './StatusChip';
export { default as ConfirmDialog }  from './ConfirmDialog';
export { default as EmptyState }     from './EmptyState';
export { default as PageHeader }     from './PageHeader';
export { default as LoadingSkeleton} from './LoadingSkeleton';

// frontend/src/components/layout/index.ts
export { default as AppShell }       from './AppShell';
export { default as Sidebar }        from './Sidebar';
export { default as TopBar }         from './TopBar';
export { default as PageContainer }  from './PageContainer';
```

### RM-07 : Route catch-all `*` déclarée en dernier dans `App.tsx`

```typescript
// frontend/src/App.tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AppShell from '@/components/layout/AppShell';
import NotFoundPage from '@/pages/NotFoundPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Routes authentifiées — dans AppShell */}
        <Route path="/" element={<AppShell />}>
          <Route index element={<Navigate to="/applications" replace />} />
          <Route path="applications/*" element={<div />} />   {/* placeholder FS-06 */}
          <Route path="domains/*" element={<div />} />         {/* placeholder FS-02 */}
          {/* ... autres routes métier */}
        </Route>

        {/* Routes hors AppShell */}
        <Route path="/login" element={<div />} />              {/* placeholder FS-01 */}
        <Route path="/design" element={<div />} />             {/* dev only */}

        {/* Catch-all — TOUJOURS EN DERNIER */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
```

> La route `*` doit être la **dernière déclarée** — React Router évalue les routes dans l'ordre.

---

F-01 est terminé quand **tous** ces points sont verts :

| # | Validation | Action |
|---|---|---|
| G-01 | `npm run dev` démarre sans erreur TypeScript | `cd frontend && npm run dev` |
| G-02 | Theme actif — fond de page `#F8FAFC` visible dans le navigateur | Inspecter `<body>` background |
| G-03 | Police Inter chargée — vérifier dans l'onglet Network (fonts.googleapis.com) | DevTools → Network → Font |
| G-04 | Police JetBrains Mono chargée | Idem |
| G-05 | `AppShell` affiché — Sidebar indigo à gauche, zone content claire à droite | Visual check |
| G-06 | Items de navigation présents dans la Sidebar (liens vides) | Visual check |
| G-07 | Item actif de la Sidebar correctement mis en évidence (`secondary.main`) | Naviguer vers `/domains` |
| G-08 | `ConfirmDialog` affiché correctement — page de démo ou Storybook (optionnel) | Visual check |
| G-09 | `StatusChip` rendu avec les bonnes couleurs pour chaque valeur | Visual check |
| G-10 | Aucune erreur TypeScript (`npm run build` passe) | `npm run build` |

| G-11 | `NotFoundPage` affichée sur une route inexistante (`/foo-bar`) | Naviguer vers `/foo-bar` |
| G-12 | Bouton "Retour à l'accueil" de `NotFoundPage` redirige vers `/` | Click + vérifier URL |
| G-13 | `ErrorBoundary` capture une erreur simulée — fallback affiché sans crash navigateur | Ajouter `throw new Error('test')` temporairement dans un composant enfant |

Pour valider visuellement tous les composants partagés sans attendre FS-01+, créer une page temporaire accessible à `/design` (route non protégée en dev, supprimée avant la release MVP) :

```typescript
// frontend/src/pages/DesignSystemPage.tsx
// Afficher : tous les variants de Button, StatusChip, ConfirmDialog, EmptyState,
// LoadingSkeleton, PageHeader — avec les vraies valeurs métier ARK
// + Section "Pages d'erreur" : lien vers /foo-bar (404) + bouton qui throw une erreur (ErrorBoundary)
```

> Cette page est l'équivalent d'un Storybook léger sans dépendance supplémentaire. Elle permet de valider le rendu de chaque composant avant de les intégrer dans les vraies pages.

---

## 7. Tests Attendus

Pas de tests automatisés à ce stade — F-01 est une fondation visuelle. Les validations sont manuelles (Gate §5).

**Vérification manuelle du theme :**
- Inspecter un `Button variant="contained"` : couleur doit être `#1A237E`, radius `6px`, pas de box-shadow
- Inspecter un `Paper` : `elevation={0}`, bordure `1px solid #E2E8F0`, radius `4px`
- Inspecter un `TableHead` : fond `#F1F5F9`, texte uppercase, pas de zebra-striping sur les lignes

---

## 8. Contraintes Techniques

- **MUI v5 exclusivement** — pas de Tailwind, pas de styled-components, pas de CSS modules
- **`sx` prop pour tous les styles custom** — jamais de fichiers `.css` pour les composants React
- **Tokens via theme uniquement** — `color: 'primary.main'`, jamais `color: '#1A237E'`
- **React Router v6** — `<Outlet />` dans `AppShell`, `useLocation()` dans `Sidebar`
- **TypeScript strict** — toutes les props typées explicitement, pas de `any`
- **`elevation={0}`** sur tous les Paper/Card — style flat sans exception

---

## 9. Ordre d'Exécution Recommandé

| # | Action |
|---|---|
| 1 | Créer `frontend/src/theme/index.ts` (fichier généré — voir livrable) |
| 2 | Configurer l'alias `@/` dans `vite.config.ts` + `tsconfig.json` |
| 3 | Ajouter les polices Inter + JetBrains Mono dans `index.html` |
| 4 | Wrapper `main.tsx` avec `ThemeProvider` + `CssBaseline` |
| 5 | Implémenter `AppShell` + `Sidebar` + `TopBar` + `PageContainer` |
| 6 | Implémenter les composants partagés (`StatusChip`, `ConfirmDialog`, `EmptyState`, `PageHeader`, `LoadingSkeleton`) |
| 7 | Créer les barrels `components/shared/index.ts` + `components/layout/index.ts` |
| 8 | Implémenter `NotFoundPage` + déclarer la route catch-all `*` dans `App.tsx` |
| 9 | Implémenter `ErrorBoundary` + wrapper `main.tsx` |
| 10 | Créer la page `/design` (optionnel — validation visuelle) |
| 11 | Valider les 13 points du Gate §5 |

---

## 10. Checklist de Validation F-01

- [ ] `src/theme/index.ts` créé — tokens alignés avec `ARK - Design charte express v0.1`
- [ ] Alias `@/` fonctionnel — imports `@/theme`, `@/components/shared` résolus
- [ ] Polices Inter + JetBrains Mono chargées (Network tab)
- [ ] `ThemeProvider` + `CssBaseline` dans `main.tsx`
- [ ] `AppShell` : Sidebar indigo 240px + zone content fond clair
- [ ] `Sidebar` : item actif en `secondary.main`, inactifs en blanc 85%
- [ ] `ConfirmDialog` : bouton Confirmer en `color="error"`, bouton Annuler en `variant="outlined"`
- [ ] `StatusChip` : toutes les valeurs de criticality/lifecycle/active testées visuellement
- [ ] `EmptyState` : icône grise + message centré + bouton CTA
- [ ] `LoadingSkeleton` : animation wave, jamais de spinner
- [ ] Barrels exportés — `import { StatusChip } from '@/components/shared'` fonctionne
- [ ] `NotFoundPage` : affichée sur `*`, bouton retour accueil fonctionnel, pas de Sidebar
- [ ] `ErrorBoundary` : wrapping `main.tsx`, fallback affiché sur erreur simulée, message technique masqué hors dev
- [ ] Route catch-all `*` déclarée en dernier dans `App.tsx`
- [ ] `npm run build` passe sans erreur TypeScript
- [ ] Aucune couleur en dur dans les composants — uniquement les tokens theme
- [ ] Aucune classe Tailwind dans le codebase

---

## 11. Commande OpenCode

> F-01 est réalisé **manuellement**. Pas de commande OpenCode pour cette phase — les composants de layout et le theme sont trop structurants pour être délégués.
>
> En revanche, injecter ce bloc en début de **chaque** session OpenCode frontend pour les sprints suivants :

```
Contexte projet ARK — Design System (F-01) :
- Theme MUI : src/theme/index.ts — source de vérité. Ne jamais redéfinir les couleurs en dur.
- Tailwind CSS interdit — MUI + sx prop uniquement.
- Composants partagés disponibles : StatusChip, ConfirmDialog, EmptyState, PageHeader, LoadingSkeleton
  → import depuis '@/components/shared'
- Layout : AppShell (Sidebar 240px indigo + zone content), PageContainer (padding 24px)
  → import depuis '@/components/layout'
- Pages d'erreur disponibles : NotFoundPage (route `*`), ErrorBoundary (wrapper global main.tsx)
  → Ne pas recréer ces composants dans les features suivantes — les réutiliser
- Routing : patron liste/new/:id/edit — pages indépendantes, jamais de modales CRUD
- Tokens de référence : primary.main=#1A237E, secondary.main=#007FFF, background.default=#F8FAFC

Pour chaque page générée :
  1. Utiliser <PageContainer> comme wrapper
  2. Utiliser <PageHeader> pour le titre + action principale
  3. Utiliser <LoadingSkeleton> pendant le chargement (jamais de spinner)
  4. Utiliser <EmptyState> si la liste est vide
  5. Utiliser <ConfirmDialog> avant toute suppression
  6. Utiliser <StatusChip> pour les valeurs criticality / lifecycle / isActive
```
