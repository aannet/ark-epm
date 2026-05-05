# FS-12-FRONT — Dashboard d'Accueil — Frontend

_Version 0.1 — 2026-05-06_

## En-tête

| Champ | Valeur |
|---|---|
| **ID** | FS-12-FRONT |
| **Titre** | Dashboard d'Accueil — Frontend |
| **Priorité** | P1 |
| **Statut** | `draft` *(devient `stable` uniquement après que FS-12-BACK est `done`)* |
| **Dépend de** | **FS-12-BACK** (gate bloquante), FS-01, F-02 |
| **Spec mère** | FS-12 Dashboard d'Accueil |
| **Estimé** | 2j |
| **Version** | 0.1 |

> ⚠️ Cette spec reste à `draft` tant que `FS-12-BACK` n'est pas au statut `done` et que toutes ses gates (G-01 à G-11) ne sont pas cochées.

> ⚠️ **Correction architecture** : les user stories FS-12 mentionnent "AuthContext". Le frontend ARK-EPM utilise un **store** in-memory (`frontend/src/store/auth.ts`), pas React Context. Cette spec se réfère au store exclusivement.

---

## 1. Objectif & Périmètre

**Ce que cette spec fait :**

- Amende `types/auth.ts` (type `UserResponse`) pour ajouter `domainIds: string[]` et `domains: DomainRef[]`
- Amende `store/auth.ts` pour exposer `getDomainIds()` et `getDomains()` helpers
- Amende `App.tsx` pour charger `/auth/me` au montage et stocker les nouveaux champs dans le store
- Crée la page `HomePage` à la route `/` (remplace le redirect actuel vers `/applications`)
- Crée le hook `useHomeSummary()` React Query sur `GET /api/v1/home/summary`
- Crée les composants de la page : `WelcomeBanner`, `KpiTile`, `IncompleteAppsSection`, `ProviderExpirySection`, `LifecycleDistributionSection`, `DataQualitySection`
- Crée les pages utilisateur (`UserListPage`, `UserNewPage`, `UserEditPage`) avec champ multi-select domaines (US-HOME-09)
- Ajoute les clés i18n `home.*` et `users.*` dans `fr.json`

**Hors périmètre :**

- Backend — couvert par FS-12-BACK
- Sélecteur de domaine manuel dans le dashboard — P2
- Comportement responsive mobile — P2
- Droits différenciés par domaine (`role` dans `user_domain_scope`) — P2
- Lien "Voir les fiches incomplètes" depuis la zone Data Quality — P2 (dépend filtre complétude FS-06-FRONT)

---

## 2. User Stories

Voir `FS-12-dashboard-userstories.md` — toutes les US sont P1.

Résumé des US implémentées dans cette spec :

- **US-HOME-01** : 4 tuiles KPI du patrimoine (Zone 1)
- **US-HOME-02** : Navigation cliquable depuis les tuiles KPI
- **US-HOME-03** : Liste des fiches applicatives incomplètes (Zone 2 gauche)
- **US-HOME-04** : Liste des contrats fournisseurs expirant < 90j (Zone 2 droite)
- **US-HOME-05** : Bar chart lifecycle via LinearProgress MUI (Zone 3)
- **US-HOME-06** : Gauge data quality via LinearProgress MUI (Zone 4)
- **US-HOME-07** : WelcomeBanner contextualisé (prénom + périmètre domaine)
- **US-HOME-08** : EmptyState global si périmètre sans application
- **US-HOME-09** : Multi-select domaines dans la gestion des utilisateurs

---

## 3. Référence Contrat API

Le contrat API complet est défini dans **FS-12-BACK §3**. Ne pas le redéfinir ici.

| Méthode | Route | Résumé | Permission |
|---|---|---|---|
| `GET` | `/api/v1/home/summary` | BFF agrégé dashboard | `applications:read` |
| `GET` | `/api/v1/auth/me` | Profil enrichi (domainIds, domains) | — |
| `GET` | `/api/v1/domains` | Liste domaines (pour multi-select US-HOME-09) | `domains:read` |
| `GET` | `/api/v1/users` | Liste users (pour UserListPage) | `users:read` |
| `PATCH` | `/api/v1/users/:id` | Amendment domainIds | `users:write` |
| `POST` | `/api/v1/users` | Création avec domainIds | `users:write` |

Codes HTTP à gérer :

| Code | Signification | Action frontend |
|---|---|---|
| `200` | Résumé retourné (toujours 200, même partiel) | Afficher avec champs null → `—` |
| `401` | Non authentifié | Intercepteur Axios → `/login` |
| `403` | Permission insuffisante | Intercepteur Axios → `/403` |

---

## 4. Amendment Auth Store

### 4.1 `types/auth.ts`

```typescript
// NOUVEAU type
export interface DomainRef {
  id: string;
  name: string;
}

// UserResponse — 2 nouveaux champs en fin d'interface
export interface UserResponse {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  isActive: boolean;
  role: Role | null;
  createdAt: string;
  domainIds: string[];          // NOUVEAU — [] = portée globale
  domains: DomainRef[];         // NOUVEAU — même longueur que domainIds
}
```

### 4.2 `store/auth.ts`

Deux nouvelles fonctions helper à ajouter et exporter :

```typescript
export const getDomainIds = (): string[] => {
  return _user?.domainIds ?? [];
};

export const getDomains = (): DomainRef[] => {
  return _user?.domains ?? [];
};
```

`setAuth()` et les fonctions existantes restent inchangées dans leur signature.

### 4.3 `App.tsx` — Chargement `/auth/me` au montage

Amender le `useEffect` existant qui appelle `initializeAuth()` (no-op actuel) pour enrichir le store avec les nouveaux champs (`domainIds`, `domains`) dès que l'utilisateur est authentifié :

```typescript
// App.tsx — useEffect amendé
useEffect(() => {
  initializeAuth();
  const token = getToken();
  if (token) {
    getMe()                         // api/auth.ts — déjà existant
      .then((profile) => {
        setAuth(token, profile);    // UserResponse enrichie avec domainIds[]
      })
      .catch(() => {
        // Token invalide — l'intercepteur Axios gèrera la redirection
      });
  }
}, []);
```

> `setAuth()` accepte `UserResponse` — les nouveaux champs `domainIds` et `domains` sont portés automatiquement par l'interface après l'amendment de `UserResponse`.

---

## 5. Layout Contract

### 5.1 `HomePage`

```yaml
page: HomePage
route: /
auth_required: true
permission_required: null   # Accessible à tout user authentifié

layout:
  shell: AppShell
  container: PageContainer
  container_props:
    maxWidth: xl

zones:
  welcome_banner:
    component: WelcomeBanner
    position: au-dessus de toutes les zones
    data_source: getUser() + getDomains() du store — AUCUN appel API
    rendering:
      1 domaine:   Typography variant="h5" — "Bonjour [firstName] — [domainName]"
      N>1 domaines: "Bonjour [firstName] — [N] domaines"
      0 domaines:  "Bonjour [firstName] — Tous les domaines"
      firstName null: utiliser email ou t('home.welcome.defaultName')

  zone1:
    name: KPIs Portfolio
    layout: full width
    component: wrapper Grid container spacing=2
    children:
      - KpiTile (x4, Grid item xs=12 sm=6 md=3)
    tiles:
      - id: apps
        value: summary?.kpis?.appsCount ?? null
        label: t('home.kpis.apps.label')
        onClick: navigate('/applications')
      - id: missionCritical
        value: summary?.kpis?.missionCriticalPercent → formater "X%"
        subtext: t('home.kpis.missionCritical.subtext', { count: kpis.missionCriticalDenominator })
        label: t('home.kpis.missionCritical.label')
        onClick: navigate('/applications')
      - id: interfaces
        value: summary?.kpis?.interfacesCount ?? null
        label: t('home.kpis.interfaces.label')
        onClick: navigate('/interfaces')
      - id: coveredBCs
        value: summary?.kpis?.coveredCapabilitiesCount ?? null
        label: t('home.kpis.coveredCapabilities.label')
        onClick: navigate('/business-capabilities')
    loading_state: LoadingSkeleton (4 rectangles de hauteur 100px)
    null_display: "—" + Tooltip t('home.errors.unavailable')

  zone2:
    name: À traiter
    layout: full width
    structure: Grid container spacing=2

    left (xs=12 md=6):
      component: IncompleteAppsSection
      visibility: hasPermission('applications:read') — masquée sinon
      data: summary?.incompleteApps
      rendering:
        null → section entière masquée (erreur partielle BFF)
        [] → EmptyState inline t('home.todo.incomplete.empty')
        items → liste max 5, MuiLink vers /applications/:id + chips manquants
      missing_field_chips:
        owner:       Chip label=t('home.todo.incomplete.missingOwner')
        criticality: Chip label=t('home.todo.incomplete.missingCriticality')
        lifecycle:   Chip label=t('home.todo.incomplete.missingLifecycle')

    right (xs=12 md=6):
      component: ProviderExpirySection
      visibility: hasPermission('providers:read') — masquée sinon
      data: summary?.expiringProviders
      rendering:
        null → section entière masquée
        [] → EmptyState inline t('home.todo.contracts.empty')
        items → liste max 5, MuiLink vers /providers/:id + ExpiryBadge
      expiry_badge_logic:
        daysUntilExpiry <= 30: Chip color="error"  label=t('home.todo.contracts.expiresSoon', {days})
        daysUntilExpiry <= 90: Chip color="warning" label=t('home.todo.contracts.expiresInDays', {days})
      footer: MuiLink → navigate('/providers') text=t('home.todo.contracts.viewAll')

  empty_state_global:
    condition: summary?.kpis?.appsCount === 0
    scope: remplace zones 2, 3, 4 (zone 1 reste visible avec ses zéros)
    rendering:
      EmptyState composant (existant dans @/components/shared)
        title: t('home.empty.title')
        description: t('home.empty.description')
      CTAs conditionnels sous EmptyState (Box sx={{ display: 'flex', gap: 2, mt: 2 }}):
        - Button visible si hasPermission('admin:import')
          label: t('home.empty.ctaImport') → navigate('/admin/import')
        - Button visible si hasPermission('applications:write')
          label: t('home.empty.ctaCreate') → navigate('/applications/new')
      Si aucun CTA visible (user lecture seule) → EmptyState sans bouton
    note: Gérer les CTAs directement dans HomePage (pas d'amendment du composant partagé EmptyState)

  zones_3_4_container:
    condition: summary?.kpis?.appsCount > 0 (ou summary non chargé — afficher avec skeleton)
    layout: Grid container spacing=2

    zone3 (xs=12 md=8):
      component: LifecycleDistributionSection
      data: summary?.lifecycleDistribution
      rendering:
        null → section entière masquée (erreur partielle)
        data → 5 LinearProgress MUI dans l'ordre [draft, in_progress, production, deprecated, retired]
      per_bar:
        Box sx={{ mb: 1.5 }} :
          label: t('home.lifecycle.statuses.[status]')
          LinearProgress: variant="determinate" value=(count/total*100) color="primary"
          text: Typography variant="body2" → "X apps (Y%)"
        zero_app_bar: visible, value=0 (pas masquée)
      empty_state: si total=0 → t('home.lifecycle.empty')
      loading_state: LoadingSkeleton (5 lignes)

    zone4 (xs=12 md=4):
      component: DataQualitySection
      data: summary?.dataQuality
      rendering:
        null → section entière masquée
        totalCount=0 → afficher "—" (pas de gauge)
        data → LinearProgress + texte + InfoIcon avec Tooltip
      gauge:
        LinearProgress:
          variant: "determinate"
          value: scorePercent
          color_logic:
            scorePercent < 50:  color="error"
            50 ≤ scorePercent < 80: color="warning"
            scorePercent ≥ 80: color="success"
        text: Typography → t('home.quality.score', {complete, total, percent})
        info_icon: IconButton + InfoOutlinedIcon + Tooltip t('home.quality.tooltip')
      loading_state: LoadingSkeleton (1 ligne + 1 rectangle)
```

---

## 6. Composants à Générer

### 6.1 Structure de fichiers

```
frontend/src/
├── pages/
│   ├── home/
│   │   └── HomePage.tsx                         (page principale)
│   └── users/
│       ├── UserListPage.tsx
│       ├── UserNewPage.tsx
│       └── UserEditPage.tsx
├── components/
│   └── home/
│       ├── WelcomeBanner.tsx
│       ├── KpiTile.tsx
│       ├── IncompleteAppsSection.tsx
│       ├── ProviderExpirySection.tsx
│       ├── LifecycleDistributionSection.tsx
│       └── DataQualitySection.tsx
├── api/
│   └── home.ts                                  (useHomeSummary hook React Query)
└── types/
    └── home.ts                                  (HomeSummaryResponse + sous-types)
```

### 6.2 Types TypeScript (`types/home.ts`)

```typescript
export interface KpisSummary {
  appsCount: number | null;
  missionCriticalPercent: number | null;
  missionCriticalDenominator: number | null;
  interfacesCount: number | null;
  coveredCapabilitiesCount: number | null;
}

export interface IncompleteApp {
  id: string;
  name: string;
  missingFields: ('owner' | 'criticality' | 'lifecycle')[];
  createdAt: string;
}

export interface ExpiringProvider {
  id: string;
  name: string;
  expiryDate: string;
  daysUntilExpiry: number;
}

export interface LifecycleDistribution {
  draft: number;
  in_progress: number;
  production: number;
  deprecated: number;
  retired: number;
  total: number;
}

export interface DataQualitySummary {
  completeCount: number;
  totalCount: number;
  scorePercent: number | null;
}

export interface HomeSummaryResponse {
  kpis: KpisSummary | null;
  incompleteApps: IncompleteApp[] | null;
  expiringProviders: ExpiringProvider[] | null;
  lifecycleDistribution: LifecycleDistribution | null;
  dataQuality: DataQualitySummary | null;
}
```

### 6.3 Hook React Query (`api/home.ts`)

```typescript
export function useHomeSummary() {
  return useQuery({
    queryKey: ['home', 'summary'],
    queryFn: async () => {
      const response = await client.get<HomeSummaryResponse>('/home/summary');
      return response.data;
    },
    staleTime: 5 * 60 * 1000,   // 5 min — dashboard pas temps-réel
  });
}
```

### 6.4 `KpiTile` (nouveau composant)

Le composant `KpiCard` existant n'est pas cliquable. `KpiTile` est un nouveau composant spécifique au dashboard :

```typescript
interface KpiTileProps {
  label: string;
  value: number | string | null;
  subtext?: string;
  onClick: () => void;
}

// Rendu :
// Paper sx={{ cursor: 'pointer', '&:hover': { elevation: 4, borderColor: 'primary.main' } }}
// onClick={onClick}
// Valeur null → afficher "—" + Tooltip t('home.errors.unavailable')
```

### 6.5 `WelcomeBanner`

Données du store uniquement — aucun appel API :

```typescript
const user = getUser();
const domains = getDomains();
const domainCount = getDomainIds().length;

let contextText: string;
if (domainCount === 0) {
  contextText = t('home.welcome.globalScope');
} else if (domainCount === 1) {
  contextText = domains[0].name;
} else {
  contextText = t('home.welcome.nDomains', { count: domainCount });
}

const firstName = user?.firstName || user?.email || t('home.welcome.defaultName');
// Render: <Typography variant="h5">{t('home.welcome.greeting', { name: firstName })} — {contextText}</Typography>
```

### 6.6 `LifecycleDistributionSection`

Ordre fixe des statuts, barre toujours visible même à 0 :

```typescript
const LIFECYCLE_ORDER = ['draft', 'in_progress', 'production', 'deprecated', 'retired'] as const;

// Pour chaque statut :
// <Box sx={{ mb: 1.5 }}>
//   <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
//     <Typography variant="body2">{t(`home.lifecycle.statuses.${status}`)}</Typography>
//     <Typography variant="body2" color="text.secondary">{count} apps ({percent}%)</Typography>
//   </Box>
//   <LinearProgress variant="determinate" value={total > 0 ? Math.round((count/total)*100) : 0} color="primary" />
// </Box>
```

### 6.7 US-HOME-09 — Pages Utilisateurs (`UserNewPage`, `UserEditPage`)

Le champ multi-select domaines réutilise le hook `useDomains()` existant (`api/domains.ts`) :

```typescript
// Dans UserForm.tsx (composant de formulaire partagé entre New et Edit)
const { data: domainsData } = useDomains({ limit: 100 });
const domainOptions = domainsData?.data ?? [];

<Autocomplete
  multiple
  options={domainOptions}
  getOptionLabel={(option) => option.name}
  value={domainOptions.filter((d) => formValues.domainIds.includes(d.id))}
  onChange={(_, newValue) => setFormValues({ ...formValues, domainIds: newValue.map((d) => d.id) })}
  renderInput={(params) => (
    <TextField
      {...params}
      label={t('users.form.domainsLabel')}
      variant="outlined"
      helperText={t('users.form.domainsHelper')}
    />
  )}
/>
```

La sauvegarde passe `domainIds: string[]` dans le body de `POST /users` ou `PATCH /users/:id`. `domainIds: []` = portée globale.

---

## 7. Clés i18n à ajouter dans `fr.json`

```json
"home": {
  "page": { "title": "Tableau de bord" },
  "welcome": {
    "greeting": "Bonjour {{name}}",
    "globalScope": "Tous les domaines",
    "nDomains": "{{count}} domaines",
    "defaultName": "Utilisateur"
  },
  "kpis": {
    "apps":              { "label": "Applications" },
    "missionCritical":   { "label": "Mission Critical", "subtext": "sur {{count}} apps renseignées" },
    "interfaces":        { "label": "Interfaces" },
    "coveredCapabilities": { "label": "Capacités couvertes" }
  },
  "errors": { "unavailable": "Donnée temporairement indisponible" },
  "todo": {
    "incomplete": {
      "title": "Fiches incomplètes",
      "empty": "Toutes les fiches sont complètes",
      "missingOwner": "Responsable",
      "missingCriticality": "Criticité",
      "missingLifecycle": "Cycle de vie"
    },
    "contracts": {
      "title": "Contrats expirant bientôt",
      "empty": "Aucun contrat n'expire dans les 90 prochains jours",
      "expiresSoon": "Expire dans {{days}} j",
      "expiresInDays": "Expire dans {{days}} j",
      "viewAll": "Voir tous les fournisseurs"
    }
  },
  "lifecycle": {
    "title": "Distribution cycle de vie",
    "empty": "Aucune application dans ce périmètre",
    "statuses": {
      "draft": "Brouillon",
      "in_progress": "En cours",
      "production": "Production",
      "deprecated": "Déprécié",
      "retired": "Retiré"
    }
  },
  "quality": {
    "title": "Qualité des données",
    "score": "{{complete}} / {{total}} applications complètes ({{percent}}%)",
    "tooltip": "Score calculé sur les applications de votre périmètre ayant un responsable, une criticité et un statut de cycle de vie renseignés"
  },
  "empty": {
    "title": "Aucune application dans votre périmètre",
    "description": "Commencez par importer ou créer des applications pour activer le tableau de bord.",
    "ctaImport": "Importer des données",
    "ctaCreate": "Créer une application"
  }
},

"users": {
  "list": {
    "title": "Utilisateurs",
    "subtitle": "Gestion des comptes utilisateurs",
    "addButton": "Ajouter un utilisateur",
    "columns": {
      "name": "Nom", "email": "Email", "role": "Rôle",
      "domains": "Domaines", "status": "Statut", "createdAt": "Créé le", "actions": "Actions"
    },
    "emptyState": { "title": "Aucun utilisateur", "description": "Créez votre premier utilisateur.", "cta": "Créer un utilisateur" }
  },
  "form": {
    "createTitle": "Nouvel utilisateur",
    "editTitle": "Modifier l'utilisateur",
    "emailLabel": "Email",
    "firstNameLabel": "Prénom",
    "lastNameLabel": "Nom",
    "passwordLabel": "Mot de passe",
    "roleLabel": "Rôle",
    "domainsLabel": "Domaines assignés",
    "domainsHelper": "Laisser vide pour un accès global à tous les domaines",
    "isActiveLabel": "Compte actif",
    "saveButton": "Enregistrer",
    "cancelButton": "Annuler"
  }
}
```

---

## 8. Règles Métier Frontend

- **RM-01 — WelcomeBanner depuis le store uniquement :** `WelcomeBanner` ne déclenche aucun appel API. Il lit `getUser()` et `getDomains()` du store. Si les données ne sont pas encore chargées (bref instant entre mount et résolution de `getMe()`), le banner affiche un état réduit.

- **RM-02 — useHomeSummary staleTime = 5 min :** Le dashboard n'est pas temps-réel. Évite des refetch trop fréquents si l'utilisateur navigue et revient.

- **RM-03 — Champ null = section dégradée, pas d'erreur globale :** Si `summary.kpis` est null, les 4 tuiles affichent `"—"` avec Tooltip. Les autres zones fonctionnent normalement.

- **RM-04 — Section masquée si null, EmptyState inline si tableau vide :**
  - Tableau vide `[]` → EmptyState inline dans la section
  - `null` (erreur BFF) → section entière masquée (aucun affichage)
  - Pas de permission → section masquée via `hasPermission()`

- **RM-05 — EmptyState global (appsCount = 0) :** Condition : `summary?.kpis?.appsCount === 0`. Zones 2, 3, 4 remplacées par EmptyState global. Zone 1 reste visible. Si `kpis` est `null` (erreur) → condition = false, zones affichées normalement avec `—`.

- **RM-06 — KpiTile navigation :** `navigate()` (react-router) au clic. Pas de `window.location.href`. Curseur pointer + élévation légère au hover.

- **RM-07 — RBAC zones :**
  - Zone 2 gauche (fiches incomplètes) : masquée si `!hasPermission('applications:read')`
  - Zone 2 droite (contrats) : masquée si `!hasPermission('providers:read')`
  - Zones 1, 3, 4 : visibles pour tout user authentifié

- **RM-08 — Aucun amendement du composant `EmptyState` partagé :** Les CTAs conditionnels de US-HOME-08 sont gérés directement dans `HomePage` (Box avec 2 boutons sous `EmptyState`). Préserve la rétrocompatibilité du composant partagé.

- **RM-09 — missionCriticalPercent formaté :** Afficher `"X%"` arrondi à l'entier. Le sous-texte (subtext) affiche le dénominateur via la clé `home.kpis.missionCritical.subtext`. Si `missionCriticalPercent = null` → afficher `"—"`.

---

## 9. Câblage App.tsx — Manuel

> À réaliser **manuellement** avant de lancer la session OpenCode.

```typescript
// 1. Importer les nouvelles pages
import HomePage from '@/pages/home/HomePage';
import UserListPage from '@/pages/users/UserListPage';
import UserNewPage from '@/pages/users/UserNewPage';
import UserEditPage from '@/pages/users/UserEditPage';

// 2. Remplacer le redirect index route
// AVANT: <Route index element={<Navigate to="/applications" replace />} />
// APRÈS:
<Route index element={<HomePage />} />

// 3. Remplacer la route /users placeholder
// AVANT:
// <Route element={<PrivateRoute permission="users:write" />}>
//   <Route path="/users" element={<div />} />
// </Route>
//
// APRÈS:
<Route path="users" element={<Outlet />}>
  <Route element={<PrivateRoute permission="users:read" />}>
    <Route index element={<UserListPage />} />
    <Route path=":id" element={<UserEditPage />} />
  </Route>
  <Route element={<PrivateRoute permission="users:write" />}>
    <Route path="new" element={<UserNewPage />} />
  </Route>
</Route>
```

---

## 10. Session Gate — Frontend

> Prérequis à valider **avant** de lancer la session OpenCode.

- [ ] **FS-12-BACK au statut `done`** — gates G-01 à G-11 toutes cochées
- [ ] **`GET /api/v1/home/summary` testé manuellement** — réponse conforme à `HomeSummaryResponse`
- [ ] **`GET /api/v1/auth/me` retourne `domainIds[]` et `domains[]`** — validé
- [ ] **F-02 au statut `done`** — `useTranslation()` disponible
- [ ] **Clés `home.*` et `users.*` ajoutées dans `fr.json`** (§7 de cette spec)
- [ ] **`getDomainIds()` et `getDomains()` exportés depuis `@/store/auth`** (§4 de cette spec)
- [ ] **`UserResponse` type amendé dans `types/auth.ts`** (§4 de cette spec)
- [ ] **`App.tsx` useEffect amendé pour appeler `getMe()` au montage** (§4.3 de cette spec)
- [ ] **Câblage `App.tsx` réalisé manuellement** (§9 de cette spec)
- [ ] **`PageHeader`, `EmptyState`, `LoadingSkeleton` disponibles dans `@/components/shared`** — vérifier
- [ ] **`useDomains()` disponible dans `@/api/domains`** — vérifier (pour US-HOME-09)
- [ ] **`hasPermission()` exporté depuis `@/store/auth`** — vérifier

---

## 11. Tests — Playwright

### Tests fonctionnels (à écrire en session QA séparée — T-106)

- `[Playwright]` `GET /` → WelcomeBanner visible avec prénom utilisateur
- `[Playwright]` `GET /` → 4 tuiles KPI affichées avec valeurs ou `—`
- `[Playwright]` Clic tuile Applications → navigate `/applications`
- `[Playwright]` Clic tuile Interfaces → navigate `/interfaces`
- `[Playwright]` Clic tuile Capacités → navigate `/business-capabilities`
- `[Playwright]` Zone incomplètes visible si `applications:read`
- `[Playwright]` Zone incomplètes masquée si pas `applications:read`
- `[Playwright]` Zone contrats visible si `providers:read`
- `[Playwright]` `lifecycleDistribution` → 5 LinearProgress affichés
- `[Playwright]` `dataQuality.scorePercent < 50` → LinearProgress color error
- `[Playwright]` `dataQuality.scorePercent >= 80` → LinearProgress color success
- `[Playwright]` `appsCount = 0` → EmptyState global visible, zones 2/3/4 absentes
- `[Playwright]` User admin — champ "Domaines assignés" visible dans le formulaire
- `[Playwright]` WelcomeBanner : user sans domaine → "Tous les domaines"
- `[Playwright]` WelcomeBanner : user avec 1 domaine → nom du domaine affiché

### Tests Sécurité — Manuel ❌

- `[Manuel]` `GET /` sans token → redirect `/login`
- `[Manuel]` `GET /` avec token → dashboard visible (pas de `/403`)

---

## 12. Commande OpenCode — Frontend

```
Contexte projet ARK — Session Frontend FS-12-FRONT :

Stack : React 18 + Vite + TypeScript strict + MUI v9 + react-i18next + TanStack React Query
Règles MUI obligatoires :
- MUI v9 UNIQUEMENT — pas de Tailwind, pas de styled-components
- Styling : sx prop uniquement — jamais de styled()
- Inputs : variant="outlined" systématiquement sur tous les TextField
- Aucune librairie graphique supplémentaire — LinearProgress MUI uniquement pour les charts

Auth store :
- IMPORTANT : le projet utilise un store in-memory (store/auth.ts), PAS React Context
- getDomainIds(), getDomains(), getUser(), hasPermission() importés depuis @/store/auth
- NE PAS créer de React Context ou de hook useContext

i18n :
- Toute string visible via t('clé') — JAMAIS de string en dur dans les composants
- Hook : const { t } = useTranslation()
- Fichier source : src/i18n/locales/fr.json — clés home.* et users.* déjà présentes

RBAC frontend :
- hasPermission() importé depuis @/store/auth
- Zone 2 gauche masquée si !hasPermission('applications:read')
- Zone 2 droite masquée si !hasPermission('providers:read')
- Boutons CTAs EmptyState conditionnels selon permissions

Composants partagés OBLIGATOIRES — ne jamais réinventer :
  import { PageHeader, EmptyState, LoadingSkeleton } from '@/components/shared'
  import { AppShell, PageContainer } from '@/components/layout'
  NE PAS amender EmptyState — gérer les CTAs directement dans HomePage

Routing : react-router-dom v6, navigate() de useNavigate()
Câblage App.tsx : déjà réalisé manuellement — ne pas générer
JWT : token en mémoire uniquement — jamais sessionStorage / localStorage

Architecture HomePage :
  HomePage → useHomeSummary() hook React Query → GET /api/v1/home/summary
  WelcomeBanner → données du store uniquement (0 appel API)
  KpiTile → nouveau composant clickable (NE PAS amender KpiCard existant)

US-HOME-09 : UserNewPage + UserEditPage + UserListPage dans pages/users/
  Multi-select domaines via Autocomplete MUI (multiple) + useDomains() hook existant

Implémente la feature "Dashboard Frontend" (FS-12-FRONT).
Génère : amendment types/auth.ts, amendment store/auth.ts, amendment App.tsx useEffect,
HomePage, 6 composants home/, useHomeSummary hook, types/home.ts,
UserListPage + UserNewPage + UserEditPage.
Ne génère PAS le câblage App.tsx routes — déjà fait manuellement.
Ne génère PAS les tests marqués [Manuel].
Ne génère PAS de tests Playwright (session QA séparée — T-106).
Ne fais aucune hypothèse non documentée. Si un point est ambigu, pose une question avant de coder.

[COLLER LE CONTENU COMPLET DE FS-12-FRONT.md ICI]
[COLLER LE CONTENU DE FS-12-BACK §3 (Contrat API) ICI]
```

---

## 13. Checklist de Validation Frontend

- [ ] Route `/` affiche `HomePage` (plus de redirect vers `/applications`)
- [ ] `WelcomeBanner` affiche le prénom de l'utilisateur
- [ ] `WelcomeBanner` affiche "Tous les domaines" si 0 domaine assigné
- [ ] `WelcomeBanner` affiche le nom du domaine si 1 domaine assigné
- [ ] 4 tuiles KPI affichées, cliquables avec navigation correcte
- [ ] Tuile avec valeur null → `"—"` avec Tooltip
- [ ] Zone 2 gauche masquée si pas `applications:read`
- [ ] Zone 2 droite masquée si pas `providers:read`
- [ ] `incompleteApps: null` → section gauche masquée (pas d'EmptyState)
- [ ] `incompleteApps: []` → EmptyState inline dans la section gauche
- [ ] 5 LinearProgress dans la zone lifecycle, toujours affichés (0 si absent)
- [ ] DataQuality LinearProgress change de couleur selon le score (error/warning/success)
- [ ] DataQuality `totalCount=0` → afficher `"—"` (pas de gauge)
- [ ] EmptyState global si `appsCount = 0` — zones 2/3/4 remplacées, zone 1 visible
- [ ] CTAs EmptyState conditionnels selon permissions
- [ ] US-HOME-09 : Autocomplete multiple domaines dans formulaire utilisateur
- [ ] `domainIds` et `domains` présents dans le store après montage App.tsx
- [ ] `getDomainIds()` et `getDomains()` exportés depuis `store/auth.ts`
- [ ] `UserResponse` type inclut `domainIds` et `domains`
- [ ] Aucune string en dur dans les composants
- [ ] Aucune erreur TypeScript strict
- [ ] `Ctrl+F5` navigateur après déploiement (cache CSS/JS)

---

## 14. Revue de Dette Technique

### Gates TD

| # | Vérification | Commande / Action |
|---|---|---|
| TD-1 | Aucun `TODO / FIXME / HACK` non tracé | `git grep -n "TODO\|FIXME\|HACK" -- '*.tsx'` |
| TD-2 | Items F-999 activés par cette feature | Relire F-999 §2 |
| TD-3 | AGENTS.md : aucun pattern nouveau non documenté | Relire AGENTS.md |
| TD-4 | ARK-NFR.md : NFR impactés mis à jour | ARK-NFR.md |

### Résultat de la Revue

| Champ | Valeur |
|---|---|
| **Sprint** | S5 |
| **Date de revue** | *(à renseigner post-impl)* |
| **Items F-999 fermés** | *(à renseigner)* |
| **Items F-999 ouverts** | *(à renseigner)* |
| **NFR mis à jour** | *(à renseigner)* |
| **Statut gates TD** | *(à renseigner)* |

---

_FS-12-FRONT v0.1 — draft — 2026-05-06_
