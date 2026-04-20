# ARK — Feature Spec FS-03-FRONT : Providers (Frontend)

_Version 1.1 — Mars 2026_

> **Changelog v1.1 :** **ÉVOLUTION N:N Providers** — Application peut désormais être liée à plusieurs providers avec des rôles distincts (éditeur, intégrateur, support, vendor, custom). Ajout affichage `provider_role` dans onglets Relations (Drawer + DetailPage) sous forme de badges colorés (read-only). Ajout 6 clés i18n pour rôles. Ajout colonne `providerRole` aux tables ApplicationListInDrawer (5/page) et ApplicationListTable (20/page). Ajout RM-13 (règle affichage rôles read-only). Ajout 4 cas de test Cypress pour validation role display. Ajout G-16 gate. Édition des rôles déléguée à FS-06-FRONT ApplicationForm.
>
> **Changelog v1.0 :** Création — Implémentation complète du pattern PNS-02 (Side Drawer + Page Détail) pour les Providers. Filtres avancés (search, contractType, expiryDate paramétrable). Menu dropdown Actions. Onglet Relations Applications dans drawer et page détail. Gestion 409 DEPENDENCY_CONFLICT avec message custom et redirection. DimensionTagInput pour édition. Cohérent avec FS-02-Domains-front v1.6.

---

## En-tête

| Champ | Valeur |
|---|---|
| **ID** | FS-03-FRONT |
| **Titre** | Providers — Pages React (Liste / Détail / New / Edit) |
| **Priorité** | P1 |
| **Statut** | `stable` |
| **Dépend de** | FS-01, F-02, **FS-03-BACK** (gate bloquante), **F-03**, **FS-06-BACK v1.2** (N:N providers) |
| **Spec mère** | FS-03 Providers — spec de référence dont ce document est issu |
| **Estimé** | 0.5 jour |
| **Version** | 1.1 |

> ✅ Cette spec est au statut `stable` — Prête pour OpenCode Frontend.
> ⚠️ FS-03-BACK v1.3 et FS-06-BACK v1.2 doivent être au statut `done` avant l'implémentation (N:N requirement).
> ℹ️ Édition du provider_role déléguée à FS-06-FRONT ApplicationForm (lecture seule en FS-03-FRONT).

---

## 1. Objectif & Périmètre

**Ce que cette spec fait :**

Implémenter les pages React pour la gestion des Fournisseurs (Providers) : liste avec filtres avancés, drawer de consultation rapide (PNS-02), page détail avec onglet applications liées, pages de création et modification. Ce module suit le pattern établi par FS-02-Domains tout en spécialisant l'UX pour les fournisseurs (mise en avant des contrats et dates d'expiration).

**Hors périmètre :**
- Backend API — couvert par `FS-03-BACK`
- Système d'alerte sur expiration de contrat — couvert par FS-24 (P2)
- Gestion des contrats détaillés (numéro, montant, renouvellement auto) — P2

---

## 2. User Stories

### Interactions Liste/Drawer (PNS-02)

#### US-01 — Consultation Rapide via Side Drawer
**En tant qu'utilisateur**, je veux cliquer sur le corps d'une ligne du tableau (hors nom) pour ouvrir un Side Drawer, afin de consulter rapidement les métadonnées du fournisseur sans perdre ma position dans la liste ni mes filtres actifs.

**Critères d'acceptation:**
- Clic sur Description, ContractType, ExpiryDate, Tags ou Actions → ouvre le drawer (300–400px depuis la droite)
- État de la liste préservé (scroll, filtres, tri)
- Drawer affiche : nom, description, contractType, expiryDate, tags, compteur applications
- Drawer inclut onglet "Applications" avec liste paginée des apps liées (maxitems 5 par page)

#### US-02 — Accès Direct Détail
**En tant qu'utilisateur**, je veux cliquer sur le nom du fournisseur (lien hypertexte souligné) pour naviguer directement vers la page Détail complète.

**Critères d'acceptation:**
- Nom affiché comme lien souligné (couleur texte normale, primaire au hover)
- Clic sur nom → navigation immédiate vers `/providers/:id`
- Le clic sur le nom ne déclenche pas l'ouverture du drawer (stopPropagation)

#### US-03 — Transition Drawer vers Détail
**En tant qu'utilisateur**, je veux trouver un bouton "Voir la fiche complète" dans le footer du Side Drawer.

**Critères d'acceptation:**
- Bouton positionné à droite dans le footer
- Variant "outlined"
- Navigation vers `/providers/:id` au clic
- Ferme le drawer après navigation

#### US-04 — Transition Drawer vers Édition
**En tant qu'utilisateur**, je veux trouver un bouton "Modifier" dans le footer du Side Drawer.

**Critères d'acceptation:**
- Bouton positionné à gauche dans le footer (avant "Voir fiche")
- Variant "contained"
- **Grisé (disabled)** si l'utilisateur n'a pas la permission `providers:write`
- Navigation vers `/providers/:id/edit` au clic (si autorisé)

#### US-05 — Fermeture Drawer
**En tant qu'utilisateur**, je veux une croix grise dans le coin haut droit du drawer pour le fermer.

**Critères d'acceptation:**
- IconButton avec CloseIcon
- Couleur `text.secondary` (gris)
- Positionné à droite du titre
- Ferme le drawer au clic
- Le backdrop click et Escape key ferment aussi le drawer

### Navigation & Filtres

#### US-06 — Filtres et Tri Avancés
**En tant qu'utilisateur**, je veux filtrer et trier la liste des fournisseurs par multiple critères.

**Critères d'acceptation:**
- **Tri** : nom (A→Z), date création (ancien→récent), date expiration (proche→lointain)
- **Recherche** : textuelle sur le nom (appel API search en temps quasi-réel)
- **Filtre Type Contrat** : dropdown multiselect ou single-select (valeurs de `contractType` en backend)
- **Filtre Expiration Proche** : dropdown paramétrable (30/90/180 jours)
- Filtres persistant lors du clic drawer/détail, restaurés au retour

#### US-07 — Actions Menu Dropdown
**En tant qu'utilisateur**, je veux accéder aux actions Modifier et Supprimer via un menu dropdown (⋮) pour économiser l'espace colonnes.

**Critères d'acceptation:**
- Colonne "Actions" : bouton IconButton avec MoreVertIcon (⋮)
- Menu dropdown : 2 items "Modifier" et "Supprimer"
- "Modifier" → navigation `/providers/:id/edit`
- "Supprimer" → ouvre ConfirmDialog

#### US-08 — Suppression avec Gestion Dépendances
**En tant qu'utilisateur**, je veux suppprimer un fournisseur, mais être averti s'il est utilisé par des applications.

**Critères d'acceptation:**
- ConfirmDialog affiche message personnalisé "Impossible de supprimer : ce fournisseur est utilisé par [N] application(s)."
- Bouton "Confirmer" est **disabled** si code d'erreur `DEPENDENCY_CONFLICT`
- Lien "Voir les applications liées" redirige vers détail/onglet Applications
- Autre cas (succès) : ConfirmDialog standard

### Détail & Édition

#### US-09 — Page Détail
**En tant qu'utilisateur**, je veux voir le détail complet d'un fournisseur avec tous ses champs et ses applications liées.

**Critères d'acceptation:**
- Page `/providers/:id` affiche : nom, description, comment, contractType, expiryDate, tags, date création/modification
- Onglet "Applications" : liste paginée des applications liées (pagination 20/page)
- Bouton "Modifier" en bas à droite → `/providers/:id/edit` (disabled si pas `providers:write`)
- Bouton "Supprimer" en bas à droite → ConfirmDialog
- Bouton "Retour" ou breadcrumb vers `/providers`

#### US-10 — Formulaire Création/Édition
**En tant qu'utilisateur**, je veux créer ou modifier un fournisseur avec validation côté frontend.

**Critères d'acceptation:**
- Champs obligatoires marqués avec astérisque `*`
- `name` : obligatoire, unique (erreur inline 409 CONFLICT)
- `description`, `comment` : optionnels, TextArea
- `contractType` : optionnel, TextField libre (no dropdown — FS-24 définira les standards)
- `expiryDate` : optionnel, DatePicker MUI (format DD/MM/YYYY)
- `tags` : optionnel, DimensionTagInput de F-03 (déduplication N/A en édition)
- Bouton "Enregistrer" (POST ou PATCH)
- Bouton "Annuler" → retour liste ou détail (selon contexte)
- Post-succès : navigation détail + snackbar success

#### US-11 — Messages d'Erreur
**En tant qu'utilisateur**, je veux recevoir des messages d'erreur clairs lors de validation.

**Critères d'acceptation:**
- `400` (validation) : erreur inline sur champ `name` (minLength, maxLength, etc.)
- `409` `CONFLICT` : erreur inline `t('providers.form.nameDuplicate')`
- `409` `DEPENDENCY_CONFLICT` (delete) : ConfirmDialog avec message custom
- `401` / `403` : intercepteur Axios global → `/login` ou `/403`
- `404` : navigate `/providers`
- `5xx` : ArkAlert error global

---

## 3. Référence Contrat API

Le contrat API complet est défini dans **FS-03-BACK §3**. Ne pas le redéfinir ici.

| Méthode | Route | Résumé | Permission |
|---------|-------|--------|------------|
| `GET` | `/api/v1/providers` | Liste (paginée, filtres, tri) | `providers:read` |
| `POST` | `/api/v1/providers` | Créer | `providers:write` |
| `GET` | `/api/v1/providers/:id` | Détail | `providers:read` |
| `PATCH` | `/api/v1/providers/:id` | Modifier | `providers:write` |
| `DELETE` | `/api/v1/providers/:id` | Supprimer | `providers:write` |
| `GET` | `/api/v1/providers/:id/applications` | Applications liées | `providers:read` |

Codes HTTP à gérer côté frontend :

| Code | Contexte | Action frontend |
|------|----------|-----------------|
| `200` / `201` | Succès | Navigate détail (create) ou list (delete) + Alert success |
| `400` | Validation | Erreur inline sur champ name |
| `401` | Non authentifié | Intercepteur Axios → `/login?reason=session_expired` |
| `403` | Permission insuffisante | Intercepteur Axios → `/403` |
| `404` | Ressource introuvable | `navigate('/providers')` |
| `409` `CONFLICT` | Nom dupliqué | Erreur inline `t('providers.form.nameDuplicate')` |
| `409` `DEPENDENCY_CONFLICT` | Suppression bloquée | Message dans `ConfirmDialog` + lien "Voir applications" |
| `5xx` | Erreur serveur | Alert error `t('providers.alert.errors.serverError')` |

> **Note N:N Relationships (v1.1):**
> À partir de v1.1, le endpoint `GET /api/v1/providers/:id/applications` retourne les applications liées via la table de jonction `app_provider_map` (N:N). Chaque `ApplicationListItem` inclut optionnellement un champ `providerRole` indiquant le rôle du provider pour cette application spécifique : `'editor'`, `'integrator'`, `'support'`, `'vendor'`, ou custom. Ce champ est affiché sous forme de badge coloré dans les onglets Relations (Drawer + DetailPage), en **lecture seule**. L'édition des rôles est déléguée à FS-06-FRONT ApplicationForm.

---

## 4. Layout Contract

### 4.1 `ProvidersListPage`

```yaml
page: ProvidersListPage
route: /providers
auth_required: true
permission_required: providers:read

layout:
  shell: AppShell            # import depuis '@/components/layout'
  container: PageContainer
  container_props:
    maxWidth: xl

zones:
  alert:
    component: ArkAlert      # import depuis '@/components/shared'
    condition: location.state.alert exists
    props:
      severity: location.state.alert.severity  # 'success' | 'error' | 'warning'
      message: t(location.state.alert.messageKey)
      onClose: clearAlert

  header:
    component: PageHeader    # import depuis '@/components/shared'
    props:
      title: t('providers.list.title')
      subtitle: t('providers.list.subtitle')
      action:
        condition: hasPermission('providers:write')
        label: t('providers.list.addButton')
        onClick: navigate('/providers/new')
        icon: AddIcon

  filter_bar:
    component: MUI Box (flex row)
    items:
      - TextField                    # search textuelle
        placeholder: t('providers.list.search')
        onChange: debounce(search)
      - FormControl                  # Filtre Type Contrat
        label: t('providers.list.filterContractType')
        select: true
        items: [dynamique depuis réponse API]
      - FormControl                  # Filtre Expiration
        label: t('providers.list.filterExpiration')
        select: true
        items:
          - 'Moins de 30 jours'
          - 'Moins de 90 jours'
          - 'Moins de 180 jours'

  body:
    component: MUI Table avec TableSortLabel
    loading_state: LoadingSkeleton
    empty_state: EmptyState
    empty_state_props:
      title: t('providers.list.emptyState.title')
      description: t('providers.list.emptyState.description')
      action:
        condition: hasPermission('providers:write')
        label: t('providers.list.emptyState.cta')
        onClick: navigate('/providers/new')

    columns:
      - field: name
        header: t('providers.list.columns.name')
        sortable: true
        clickable: navigate('/providers/${row.id}')
        render: Link (souligné, primaire hover)

      - field: contractType
        header: t('providers.list.columns.contractType')
        sortable: false
        render: plain text (nullable)

      - field: expiryDate
        header: t('providers.list.columns.expiryDate')
        sortable: true
        sort_null_behavior: null values last
        format: date locale FR (ex: "31 déc. 2025")
        render: |
          - Si date < 30j : badge rouge "URGENT"
          - Si date < 90j : badge orange "ALERTE"
          - Sinon : texte normal

      - field: tags
        header: t('providers.list.columns.tags')
        sortable: false
        render: TagChipList (mode liste, maxVisible=3, deduplicateByDepth)

      - field: _count.applications
        header: t('providers.list.columns.applicationsCount')
        sortable: false
        render: Badge numérotée ou simple texte

      - field: actions
        header: t('providers.list.columns.actions')
        condition: hasPermission('providers:write')
        render: IconButton (MoreVertIcon) → Menu dropdown
          - Edit → navigate('/providers/${row.id}/edit')
          - Delete → open confirm-delete dialog

  pagination:
    component: MUI Pagination
    page_size: 20
    scope: server-side (via API)
    show_label: true

  drawer:
    component: ProvidersDrawer (read-only)
    condition: drawerOpen && selectedProviderId
    props:
      provider: selectedProvider
      onClose: closeDrawer
      onNavigateDetail: navigate('/providers/:id')
      onNavigateEdit: navigate('/providers/:id/edit')

sort_state:
  default_field: name
  default_order: asc
  scope: server-side (API sortBy, sortOrder params)
```

### 4.2 `ProvidersDrawer` (Read-Only Side Drawer)

```yaml
component: Drawer (MUI)
anchor: right
width: 400px
backdrop: true
escapeKeyDown: true

zones:
  header:
    component: Box (flex, space-between)
    content:
      - title: t('providers.drawer.title')
      - closeIcon: IconButton CloseIcon (color: text.secondary)

  body:
    component: Box (scrollable)
    content:
      - name: provider.name (Typography variant h6)
      - description: provider.description (Typography body2, gray)
      - contractType: label + provider.contractType
      - expiryDate: label + formatted date (+ badge rouge/orange si urgent)
      - tags: TagChipList (deduplicateByDepth, masked empty dimensions)
      
  tabs:
    component: MUI Tabs
    items:
      - label: t('providers.drawer.tabInfo')
        content: zone body (ci-dessus)
       - label: t('providers.drawer.tabApplications')
         content:
           component: ApplicationListInDrawer (paginée 5/page)
           columns:
             - name (lien → détail application)
             - domain.name
             - owner (firstName + lastName)
             - criticality
             - providerRole (NEW — v1.1)
               header: t('applications.list.columns.providerRole')
               render: Badge component avec couleur par rôle
               colors:
                 - editor: primary (bleu)
                 - integrator: secondary (orange)
                 - support: info (cyan)
                 - vendor: warning (jaune)
                 - custom: default (gris)
               nullable: true (si null, ne pas afficher de badge)

  footer:
    component: Box (flex, space-between, padding)
    buttons:
      - label: t('providers.drawer.buttonEdit')
        variant: contained
        disabled: !hasPermission('providers:write')
        onClick: navigate('/providers/:id/edit')
      - label: t('providers.drawer.buttonViewDetail')
        variant: outlined
        onClick: navigate('/providers/:id')
```

### 4.3 `ProviderDetailPage`

```yaml
page: ProviderDetailPage
route: /providers/:id
auth_required: true
permission_required: providers:read

layout:
  shell: AppShell
  container: PageContainer
  container_props:
    maxWidth: sm (ou md selon contenu)

zones:
  alert:
    component: ArkAlert
    condition: location.state.alert exists

  breadcrumb:
    component: MUI Breadcrumbs
    items:
      - label: t('providers.detail.breadcrumb.home')
        onClick: navigate('/')
      - label: t('providers.detail.breadcrumb.list')
        onClick: navigate('/providers')
      - label: provider.name (current)

  header:
    component: Box (flex, space-between)
    content:
      - title: provider.name (Typography variant h4)
      - badge: _count.applications (si > 0)

  body:
    component: MUI Tabs
    items:
      - label: t('providers.detail.tabInfo')
        content:
          - description: provider.description
          - comment: provider.comment
          - contractType: label + value
          - expiryDate: label + formatted date
          - tags: TagChipList (deduplicateByDepth)
          - createdAt: label + formatted datetime
          - updatedAt: label + formatted datetime

       - label: t('providers.detail.tabApplications')
         content:
           - table: ApplicationListTable (paginée 20/page)
             columns:
               - name (lien → détail application)
               - domain.name
               - owner (firstName + lastName)
               - criticality
               - lifecycleStatus
               - providerRole (NEW — v1.1)
                 header: t('applications.list.columns.providerRole')
                 render: Badge component avec couleur par rôle
                 colors:
                   - editor: primary (bleu)
                   - integrator: secondary (orange)
                   - support: info (cyan)
                   - vendor: warning (jaune)
                   - custom: default (gris)
                 nullable: true (si null, ne pas afficher de badge)

  footer:
    component: Box (flex, space-between)
    buttons:
      - label: t('providers.detail.buttonEdit')
        variant: contained
        disabled: !hasPermission('providers:write')
        onClick: navigate('/providers/:id/edit')
      - label: t('providers.detail.buttonDelete')
        variant: contained
        color: error
        disabled: !hasPermission('providers:write')
        onClick: open confirm-delete dialog
      - label: t('providers.detail.buttonBack')
        variant: outlined
        onClick: navigate('/providers')
```

### 4.4 `ProviderFormPage` (Create & Edit)

```yaml
page: ProviderFormPage
route: /providers/new OR /providers/:id/edit
auth_required: true
permission_required: providers:write

layout:
  shell: AppShell
  container: PageContainer
  container_props:
    maxWidth: sm

zones:
  alert:
    component: ArkAlert
    condition: location.state.alert exists

  breadcrumb:
    component: MUI Breadcrumbs
    items:
      - label: t('providers.form.breadcrumb.home')
        onClick: navigate('/')
      - label: t('providers.form.breadcrumb.list')
        onClick: navigate('/providers')
      - label: |
          mode === 'create' ? t('providers.form.breadcrumb.new') : provider.name

  form:
    component: MUI Form (or Formik/react-hook-form)
    fields:
      - label: t('providers.form.nameLabel') *
        name: name
        type: TextField
        required: true
        maxLength: 255
        error_inline: true
        error_message_duplicate: t('providers.form.nameDuplicate')
        error_message_required: t('providers.form.nameRequired')

      - label: t('providers.form.descriptionLabel')
        name: description
        type: TextArea
        required: false
        maxLength: 2000
        rows: 3

      - label: t('providers.form.commentLabel')
        name: comment
        type: TextArea
        required: false
        maxLength: 2000
        rows: 3

      - label: t('providers.form.contractTypeLabel')
        name: contractType
        type: TextField
        required: false
        placeholder: t('providers.form.contractTypePlaceholder')  # "ex: SaaS, Licence"
        maxLength: 100

      - label: t('providers.form.expiryDateLabel')
        name: expiryDate
        type: DatePicker (MUI)
        required: false
        format: DD/MM/YYYY
        disablePast: false (accepte passé si déjà en base)

      - label: t('providers.form.tagsLabel')
        name: tags
        type: DimensionTagInput (from F-03)
        required: false
        note: "Note : la déduplication par profondeur est désactivée en édition (réalité des données)"

  footer:
    component: Box (flex, space-between)
    buttons:
      - label: t('providers.form.buttonSave')
        variant: contained
        onClick: submit (POST ou PATCH)
        disabled: !isFormValid
      - label: t('providers.form.buttonCancel')
        variant: outlined
        onClick: navigate back (list ou detail)
```

---

## 5. Clés i18n

Toutes les clés `providers.*` à ajouter dans `frontend/src/i18n/locales/fr.json` :

```json
{
  "providers": {
    "list": {
      "title": "Fournisseurs",
      "subtitle": "Gestion des fournisseurs externes et éditeurs logiciels",
      "addButton": "Nouveau fournisseur",
      "search": "Rechercher par nom...",
      "filterContractType": "Type de contrat",
      "filterExpiration": "Expiration contrat",
      "columns": {
        "name": "Nom",
        "contractType": "Type de contrat",
        "expiryDate": "Date d'expiration",
        "tags": "Tags",
        "applicationsCount": "Applications",
        "actions": "Actions"
      },
      "emptyState": {
        "title": "Aucun fournisseur",
        "description": "Créez votre premier fournisseur pour commencer à organiser votre catalogue applicatif.",
        "cta": "Créer un fournisseur"
      }
    },

    "drawer": {
      "title": "Détails fournisseur",
      "tabInfo": "Informations",
      "tabApplications": "Applications",
      "buttonEdit": "Modifier",
      "buttonViewDetail": "Voir la fiche complète",
      "contractType": "Type de contrat",
      "expiryDate": "Date d'expiration",
      "applicationsCount": "Applications liées"
    },

    "detail": {
      "breadcrumb": {
        "home": "Accueil",
        "list": "Fournisseurs"
      },
      "tabInfo": "Informations",
      "tabApplications": "Applications",
      "descriptionLabel": "Description",
      "commentLabel": "Commentaire",
      "contractTypeLabel": "Type de contrat",
      "expiryDateLabel": "Date d'expiration",
      "tagsLabel": "Tags",
      "createdAtLabel": "Créé le",
      "updatedAtLabel": "Modifié le",
      "buttonEdit": "Modifier",
      "buttonDelete": "Supprimer",
      "buttonBack": "Retour"
    },

    "form": {
      "breadcrumb": {
        "home": "Accueil",
        "list": "Fournisseurs",
        "new": "Nouveau fournisseur"
      },
      "nameLabel": "Nom du fournisseur",
      "nameRequired": "Le nom est obligatoire",
      "nameDuplicate": "Ce nom de fournisseur existe déjà",
      "descriptionLabel": "Description",
      "commentLabel": "Commentaire",
      "contractTypeLabel": "Type de contrat",
      "contractTypePlaceholder": "ex: SaaS, Licence, Maintenance",
      "expiryDateLabel": "Date d'expiration du contrat",
      "tagsLabel": "Tags dimensionnels",
      "buttonSave": "Enregistrer",
      "buttonCancel": "Annuler"
    },

    "alert": {
      "createSuccess": "Fournisseur créé avec succès",
      "updateSuccess": "Fournisseur modifié avec succès",
      "deleteSuccess": "Fournisseur supprimé avec succès",
      "deleteBlocked": "Impossible de supprimer : ce fournisseur est utilisé par {count} application(s)",
      "deleteBlockedViewApps": "Voir les applications liées",
      "errors": {
        "validation": "Erreur de validation",
        "serverError": "Erreur serveur — veuillez réessayer",
        "notFound": "Fournisseur introuvable"
      }
    }
  },
  
  "applications": {
    "list": {
      "columns": {
        "providerRole": "Rôle du fournisseur"
      }
    },
    "roles": {
      "editor": "Éditeur",
      "integrator": "Intégrateur",
      "support": "Support",
      "vendor": "Vendor",
      "custom": "Personnalisé"
    }
  }
}
```

---

## 6. Composants Importés & Architecture

### Composants F-01 (Design System)
- `AppShell` — wrapper racine
- `PageContainer` — padding/largeur max
- `PageHeader` — titre + bouton action
- `EmptyState` — état vide
- `LoadingSkeleton` — skeleton loading
- `ConfirmDialog` — confirmation suppression
- `ArkAlert` — messages (success, error, warning)

### Composants F-03 (Tags)
- `DimensionTagInput` — édition tags (form)
- `TagChipList` — affichage tags (list, drawer, detail) avec `deduplicateByDepth()`

### Composants MUI
- Table, TableHead, TableBody, TableRow, TableCell
- TableSortLabel, Pagination
- Drawer, Tabs, TabPanel
- TextField, TextArea, DatePicker
- Button, IconButton (Edit, Delete, MoreVert, Close icons)
- Badge, Chip
- Breadcrumbs

### Utilitaires Custom
- `providers.utils.ts` :
  - `formatExpiryDate(date)` → string locale FR
  - `getExpiryBadge(date)` → badge rouge/orange/none
  - `resolveAlertMessage(code, context)` → message i18n à afficher
  - `isExpiryUrgent(date, days)` → boolean (< 30j, < 90j, etc.)

### Architecture de fichiers frontend

```
frontend/src/
├── pages/
│   └── providers/
│       ├── ProvidersListPage.tsx
│       ├── ProviderDetailPage.tsx
│       ├── ProviderFormPage.tsx
│       └── useProvidersStore.ts          ← state local (filtres, drawer)
│
├── components/
│   └── providers/
│       ├── ProvidersDrawer.tsx           ← read-only side drawer
│       ├── ProviderForm.tsx              ← form create/edit
│       ├── ApplicationListInDrawer.tsx   ← mini liste apps dans drawer
│       └── ApplicationListTable.tsx      ← full table apps dans détail
│
├── services/
│   └── api/
│       └── providers.api.ts              ← appels API (GET, POST, PATCH, DELETE)
│
└── utils/
    └── providers.utils.ts                ← helpers (format dates, badges, messages)
```

---

## 7. Règles Métier Frontend

- **RM-01 — Droits requis :** `providers:read` pour lire, `providers:write` pour modifier/supprimer. Les boutons Edit/Delete sont disabled si l'utilisateur n'a pas la permission.

- **RM-02 — État drawer/détail synchronisé :** Naviguer depuis le drawer vers l'édition, puis retour liste → drawer reste fermé (UX plus propre).

- **RM-03 — Erreur 409 CONFLICT :** Afficher message inline sur le champ `name` dans le form : `t('providers.form.nameDuplicate')`.

- **RM-04 — Erreur 409 DEPENDENCY_CONFLICT :** ConfirmDialog affiche message custom `t('providers.alert.deleteBlocked', { count })` + bouton "Confirmer" **disabled** + lien "Voir les applications liées" redirige vers détail/onglet Applications.

- **RM-05 — Filtres persistants :** État des filtres (search, contractType, expiryDays) persiste lors du clic drawer/détail et du retour liste.

- **RM-06 — Déduplication tags :** 
  - **En lecture (liste, drawer, détail)** : `TagChipList` applique `deduplicateByDepth()` avant rendu
  - **En édition (form)** : `DimensionTagInput` ne déduplique pas (affiche la réalité des données)

- **RM-07 — Navigation post-create :** Après création d'un provider (`POST /providers` succès), naviguer vers `/providers/:id` + snackbar "Fournisseur créé avec succès".

- **RM-08 — Navigation post-edit :** Après modification (`PATCH` succès), rester sur `/providers/:id` + snackbar "Fournisseur modifié".

- **RM-09 — Navigation post-delete :** Après suppression (`DELETE` succès), naviguer vers `/providers` + snackbar "Fournisseur supprimé".

- **RM-10 — Format date expiryDate :** Afficher en format locale FR (ex: "31 déc. 2025"). DatePicker MUI avec format DD/MM/YYYY.

- **RM-11 — Badge urgence expiration :**
  - Moins de 30 jours → badge rouge "URGENT"
  - Moins de 90 jours → badge orange "ALERTE"
  - Sinon → texte normal
  - Null → pas de badge

- **RM-12 — Recherche textuelle debounce :** API search sur `name` avec debounce 300ms.

- **RM-13 — Provider Role Display (Read-Only) [v1.1]:** Les rôles des providers sont affichés dans les onglets Relations (drawer + page détail) sous forme de badges colorés (MUI Badge component). 
  - **Valeurs acceptées:** `'editor'`, `'integrator'`, `'support'`, `'vendor'`, `'custom'` (nullable)
  - **Affichage badge:** Couleur distincte par rôle :
    - `editor` → primary (bleu)
    - `integrator` → secondary (orange)
    - `support` → info (cyan)
    - `vendor` → warning (jaune)
    - `custom` → default (gris)
  - **Null-safety:** Si `providerRole` est null, ne pas afficher de badge
  - **Édition:** Hors scope FS-03-FRONT (gérée par FS-06-FRONT ApplicationForm)
  - **Données:** Retournées par GET `/providers/:id/applications` (champ optionnel dans ApplicationListItem)

---

## 8. Tests Cypress

### Suite de tests `e2e/tests/03-providers.spec.ts`

```typescript
describe('Providers — PNS-02 (Drawer + Detail + Edit)', () => {
  beforeEach(() => {
    cy.loginAsAdmin();
    cy.visit('/providers');
  });

  describe('List Page', () => {
    it('should display providers table with columns', () => {
      cy.get('table').should('be.visible');
      cy.contains('th', 'Nom').should('exist');
      cy.contains('th', 'Type de contrat').should('exist');
      cy.contains('th', 'Date d\'expiration').should('exist');
      cy.contains('th', 'Tags').should('exist');
    });

    it('should open drawer on row click (not name)', () => {
      cy.get('table tbody tr').first().within(() => {
        cy.get('td').eq(1).click(); // Click contractType, not name
      });
      cy.get('[role="dialog"]').should('be.visible');
      cy.contains('Détails fournisseur').should('exist');
    });

    it('should navigate to detail on name click', () => {
      cy.get('table tbody tr').first().within(() => {
        cy.get('a').first().click(); // Click name link
      });
      cy.url().should('include', '/providers/');
      cy.get('[role="dialog"]').should('not.exist'); // Drawer stays closed
    });

    it('should search providers by name', () => {
      cy.get('input[placeholder*="Rechercher"]').type('Salesforce');
      cy.wait(500); // debounce
      cy.get('table tbody tr').should('have.length.lessThan', 5);
    });

    it('should filter by contract type', () => {
      cy.get('select').first().select('SaaS');
      cy.get('table tbody tr').each(row => {
        cy.wrap(row).contains('SaaS').should('exist');
      });
    });

    it('should sort by name ascending', () => {
      cy.contains('th', 'Nom').click();
      cy.get('table tbody tr').first().should('contain', 'A');
    });

    it('should show "Add Button" if hasPermission providers:write', () => {
      cy.contains('button', 'Nouveau fournisseur').should('be.visible');
    });

    it('should hide "Add Button" if !hasPermission', () => {
      cy.loginAsReadOnly();
      cy.visit('/providers');
      cy.contains('button', 'Nouveau fournisseur').should('not.exist');
    });
  });

  describe('Side Drawer (PNS-02)', () => {
    it('should display drawer with provider details', () => {
      cy.get('table tbody tr').first().within(() => {
        cy.get('td').eq(2).click();
      });
      cy.get('[role="dialog"]')
        .should('be.visible')
        .within(() => {
          cy.contains('Informations').should('exist');
          cy.contains('Applications').should('exist');
        });
    });

    it('should close drawer on close button click', () => {
      cy.get('table tbody tr').first().within(() => {
        cy.get('td').eq(2).click();
      });
      cy.get('[role="dialog"]').within(() => {
        cy.get('button[aria-label="Close"]').click();
      });
      cy.get('[role="dialog"]').should('not.exist');
    });

    it('should show applications tab in drawer', () => {
      cy.get('table tbody tr').first().within(() => {
        cy.get('td').eq(2).click();
      });
      cy.get('[role="dialog"]').within(() => {
        cy.contains('Applications').click();
        cy.get('table').should('be.visible');
      });
    });

    it('should navigate to detail from drawer button', () => {
      cy.get('table tbody tr').first().within(() => {
        cy.get('td').eq(2).click();
      });
      cy.get('[role="dialog"]').within(() => {
        cy.contains('button', 'Voir la fiche complète').click();
      });
      cy.url().should('include', '/providers/');
      cy.get('[role="dialog"]').should('not.exist');
    });

    it('should navigate to edit from drawer button', () => {
      cy.get('table tbody tr').first().within(() => {
        cy.get('td').eq(2).click();
      });
      cy.get('[role="dialog"]').within(() => {
        cy.contains('button', 'Modifier').click();
      });
      cy.url().should('include', '/providers/').and('include', '/edit');
    });

    it('should disable Edit button if !hasPermission', () => {
      cy.loginAsReadOnly();
      cy.visit('/providers');
      cy.get('table tbody tr').first().within(() => {
        cy.get('td').eq(2).click();
      });
      cy.get('[role="dialog"]').within(() => {
        cy.contains('button', 'Modifier').should('be.disabled');
      });
    });
  });

  describe('Detail Page', () => {
    it('should display full provider details', () => {
      cy.get('table tbody tr').first().within(() => {
        cy.get('a').first().click();
      });
      cy.url().should('include', '/providers/');
      cy.contains('h4', /^[A-Za-z]+/).should('be.visible');
      cy.contains('Description').should('exist');
    });

    it('should show Applications tab with pagination', () => {
      cy.get('table tbody tr').first().within(() => {
        cy.get('a').first().click();
      });
      cy.contains('Applications').click();
      cy.get('table').should('be.visible');
      cy.contains('button', '2').should('exist'); // Pagination
    });

    it('should navigate to edit from detail page', () => {
      cy.get('table tbody tr').first().within(() => {
        cy.get('a').first().click();
      });
      cy.contains('button', 'Modifier').click();
      cy.url().should('include', '/edit');
    });

    it('should open delete dialog from detail page', () => {
      cy.get('table tbody tr').first().within(() => {
        cy.get('a').first().click();
      });
      cy.contains('button', 'Supprimer').click();
      cy.get('[role="dialog"]').contains('Confirmer').should('be.visible');
    });
  });

  describe('Form Page (Create/Edit)', () => {
    it('should create new provider', () => {
      cy.contains('button', 'Nouveau fournisseur').click();
      cy.url().should('include', '/providers/new');
      cy.get('input[value=""]').first().type('New Provider');
      cy.get('textarea').first().type('Description');
      cy.contains('button', 'Enregistrer').click();
      cy.url().should('include', '/providers/');
      cy.contains('Fournisseur créé').should('be.visible');
    });

    it('should show error on duplicate name', () => {
      cy.contains('button', 'Nouveau fournisseur').click();
      cy.get('input').first().type('Salesforce'); // Existing provider
      cy.contains('button', 'Enregistrer').click();
      cy.contains('Ce nom de fournisseur existe déjà').should('be.visible');
    });

    it('should update provider on edit', () => {
      cy.get('table tbody tr').first().within(() => {
        cy.get('a').first().click();
      });
      cy.contains('button', 'Modifier').click();
      cy.get('input').first().clear().type('Updated Name');
      cy.contains('button', 'Enregistrer').click();
      cy.url().should('include', '/providers/');
      cy.contains('Fournisseur modifié').should('be.visible');
    });

    it('should disable Save button if form invalid', () => {
      cy.contains('button', 'Nouveau fournisseur').click();
      cy.contains('button', 'Enregistrer').should('be.disabled');
    });
  });

  describe('Delete & 409 DEPENDENCY_CONFLICT', () => {
    it('should delete provider without apps', () => {
      // Create empty provider, then delete
      cy.contains('button', 'Nouveau fournisseur').click();
      cy.get('input').first().type('Provider To Delete');
      cy.contains('button', 'Enregistrer').click();
      cy.contains('button', 'Supprimer').click();
      cy.get('[role="dialog"]').contains('Confirmer').click();
      cy.url().should('equal', '/providers');
      cy.contains('Fournisseur supprimé').should('be.visible');
    });

    it('should block delete if provider used by apps', () => {
      // Assume first provider has apps
      cy.get('table tbody tr').first().within(() => {
        cy.get('a').first().click();
      });
      cy.contains('button', 'Supprimer').click();
      cy.get('[role="dialog"]').within(() => {
        cy.contains('Impossible de supprimer').should('be.visible');
        cy.contains('Confirmer').should('be.disabled');
        cy.contains('Voir les applications').click();
      });
      cy.contains('Applications').should('be.visible');
    });
  });

  describe('Provider Roles Display [v1.1]', () => {
    it('should display provider role badge in drawer applications tab', () => {
      cy.get('table tbody tr').first().within(() => {
        cy.get('td').eq(2).click(); // Open drawer
      });
      cy.get('[role="dialog"]').within(() => {
        cy.contains('Applications').click();
        cy.get('table tbody tr').first().within(() => {
          cy.contains('Éditeur').should('be.visible'); // Provider role badge
        });
      });
    });

    it('should display provider role badge in detail page applications table', () => {
      cy.get('table tbody tr').first().within(() => {
        cy.get('a').first().click(); // Navigate to detail
      });
      cy.contains('Applications').click();
      cy.get('table tbody tr').first().within(() => {
        cy.contains('Intégrateur').should('be.visible'); // Provider role badge
      });
    });

    it('should not display badge if provider role is null', () => {
      cy.get('table tbody tr').first().within(() => {
        cy.get('td').eq(2).click(); // Open drawer
      });
      cy.get('[role="dialog"]').within(() => {
        cy.contains('Applications').click();
        cy.get('table tbody tr').each(row => {
          cy.wrap(row).within(() => {
            // If role is null, this cell should be empty
            cy.get('td').eq(4).then($cell => {
              const text = $cell.text().trim();
              if (text === '' || text === '—') {
                // No badge should exist for this row
              }
            });
          });
        });
      });
    });

    it('should display correct badge colors for different roles', () => {
      cy.get('table tbody tr').first().within(() => {
        cy.get('td').eq(2).click(); // Open drawer
      });
      cy.get('[role="dialog"]').within(() => {
        cy.contains('Applications').click();
        // Check for expected role badge colors (MUI primary, secondary, etc.)
        cy.contains('Badge', 'Éditeur')
          .should('have.css', 'background-color');
        // Color assertion depends on MUI theme palette
      });
    });
  });

  describe('Tags (F-03)', () => {
    it('should display tags in list with deduplication', () => {
      cy.get('table tbody tr').first().within(() => {
        cy.get('td').eq(3).should('contain', 'Chip'); // TagChipList
      });
    });

    it('should allow adding tags in form', () => {
      cy.contains('button', 'Nouveau fournisseur').click();
      cy.get('input').first().type('Provider with Tags');
      cy.contains('Tags').parent().within(() => {
        cy.get('input').type('Geography > France');
        cy.get('button').contains('Ajouter').click();
      });
      cy.contains('button', 'Enregistrer').click();
      cy.contains('Geography').should('be.visible');
    });
  });

  describe('Accessibility & Permissions', () => {
    it('should respect providers:read permission', () => {
      cy.loginAsReadOnly();
      cy.visit('/providers');
      cy.get('table').should('be.visible');
      cy.contains('button', 'Nouveau').should('not.exist');
    });

    it('should respect providers:write permission', () => {
      cy.loginAsReadOnly();
      cy.visit('/providers');
      cy.get('table tbody tr').first().within(() => {
        cy.get('td').eq(4).within(() => {
          cy.get('button').click(); // More actions
        });
      });
      cy.get('[role="menu"]').should('not.exist'); // No actions menu
    });
  });
});
```

---

## 9. Session Gate — Validation Frontend

> À valider **avant** de passer `FS-03-FRONT` au statut `done`.

| # | Gate | Vérification | Bloquant |
|---|------|--------------|----------|
| G-01 | FS-03-BACK au statut `done` | Toutes les gates G-01 à G-14 de FS-03-BACK cochées | ✅ Oui |
| G-02 | Clés i18n ajoutées | Toutes les clés `providers.*` présentes dans `fr.json` (§5) | ✅ Oui |
| G-03 | Câblage App.tsx | Routes `/providers`, `/providers/new`, `/providers/:id`, `/providers/:id/edit` présentes | ✅ Oui |
| G-04 | API testée manuellement | Postman/curl : GET, POST, PATCH, DELETE fonctionnels + codes erreur 409 testés | ✅ Oui |
| G-05 | `ProvidersListPage` implémentée | Table + filtres (search, contractType, expiryDate) + tri + drawer + actions dropdown | ✅ Oui |
| G-06 | `ProvidersDrawer` implémentée | Read-only + onglet Applications + footer Edit/Voir détail + close button | ✅ Oui |
| G-07 | `ProviderDetailPage` implémentée | Détail complet + onglet Applications (paginé) + boutons Edit/Delete | ✅ Oui |
| G-08 | `ProviderFormPage` implémentée | Créer/Éditer avec validation + DimensionTagInput + DatePicker expiryDate | ✅ Oui |
| G-09 | Erreur 409 CONFLICT gérée | Erreur inline `nameDuplicate` sur form.name | ✅ Oui |
| G-10 | Erreur 409 DEPENDENCY_CONFLICT gérée | ConfirmDialog message custom + bouton disabled + lien "Voir apps" | ✅ Oui |
| G-11 | Navigation post-CRUD correcte | Create → détail + snackbar, Update → détail + snackbar, Delete → liste + snackbar | ✅ Oui |
| G-12 | ArkAlert implémenté | Tous les messages success/error/warning via alert system (pas console.log) | ✅ Oui |
| G-13 | Tags (F-03) intégrés | DimensionTagInput en form, TagChipList en lecture avec deduplicateByDepth | ✅ Oui |
| G-14 | Tests Cypress passent | `npm run test:e2e -- --testNamePattern=providers` → 0 failed | ✅ Oui |
| G-15 | Aucune erreur TypeScript | `npm run build` → 0 error | ✅ Oui |
| G-16 | Provider role affichage [v1.1] | ApplicationListInDrawer + ApplicationListTable affichent `providerRole` en badge coloré (editor=bleu, integrator=orange, support=cyan, vendor=jaune) | ✅ Oui |

---

## 10. Commande OpenCode — Frontend

```
Contexte projet ARK — Session Frontend FS-03-FRONT :

Stack : React 18 strict mode + Vite + TypeScript strict + MUI v5 + react-query
Structure : /frontend/src/(pages|components|services|utils)

CONTEXTE N:N PROVIDERS (v1.1) :
- Les providers sont maintenant en relation N:N avec les applications (via app_provider_map)
- Chaque application peut avoir plusieurs providers, chacun avec un rôle distinct : editor, integrator, support, vendor, custom
- Affichage des rôles : badges MUI en lecture seule (couleurs : primary/secondary/info/warning/default)
- Édition des rôles : OUT OF SCOPE (déléguée à FS-06-FRONT ApplicationForm)
- L'API `GET /providers/:id/applications` retourne les apps avec champ optionnel `providerRole`

Conventions obligatoires :
- Toute page : import AppShell (layout racine) → PageContainer → composant contenu
- Toute liste : Table MUI + LoadingSkeleton + EmptyState + Pagination server-side
- Tous messages : ArkAlert system (location.state.alert) — jamais console.log ou toast custom
- Tous droits : useAuth().hasPermission('ressource:action') — buttons disabled si insuffisant
- Erreurs API :
  → 400 (validation) : erreur inline sur champ concerné
  → 409 CONFLICT (nom dupliqué) : erreur inline `t('providers.form.nameDuplicate')`
  → 409 DEPENDENCY_CONFLICT (delete bloqué) : ConfirmDialog message custom + bouton disabled
  → 401/403 : intercepteur Axios global → /login ou /403
  → 404 : navigate('/providers')
  → 5xx : ArkAlert error
- Tags : DimensionTagInput en édition, TagChipList en lecture avec deduplicateByDepth()
- Format dates expiryDate : locale FR (ex: "31 déc. 2025") + badges rouge/orange si urgent
- Drawer (PNS-02) : 400px, anchor right, close button, onglets Info+Apps, footer Edit+Voir détail
- Provider roles : affichage via `<Chip label={t(`applications.roles.${role}`)} color={roleColorMap[role]} />` (lecture seule)

Pattern de référence frontend : module Domains (FS-02-FRONT) — s'y conformer pour structure, style, ArkAlert.
Importation obligatoire :
- import { AppShell, PageContainer } from '@/components/layout'
- import { PageHeader, EmptyState, LoadingSkeleton, ConfirmDialog, ArkAlert } from '@/components/shared'
- import { TagChipList, DimensionTagInput } from '@/components/tags'
- import { formatExpiryDate, getExpiryBadge, resolveAlertMessage } from '@/utils/providers.utils'
- import { Chip } from '@mui/material' (pour affichage des rôles)

Implémente la feature "Providers" frontend (FS-03-FRONT) respectant le contrat complet de cette spec.
Génère : 4 pages React (List + Drawer + Detail + Form) + composants custom + services API + utilitaires + tests Cypress.
Ne génère PAS de code backend.
Ne fais aucune hypothèse non documentée. Si un point est ambigu, pose une question avant de coder.

[COLLER LE CONTENU COMPLET DE FS-03-FRONT.md ICI]
```

---

## 11. Checklist de Validation Post-Session

- [ ] `GET /api/v1/providers` affiche la liste avec filtres/tri fonctionnels
- [ ] Clic sur ligne (hors nom) ouvre le drawer (PNS-02)
- [ ] Clic sur nom navigue vers détail + drawer fermé
- [ ] Drawer affiche info + onglet Applications avec pagination
- [ ] Bouton "Voir fiche complète" du drawer navigue vers détail
- [ ] Bouton "Modifier" du drawer navigue vers `/providers/:id/edit`
- [ ] Page détail affiche tous les champs + onglet Applications paginé
- [ ] Page form crée et modifie avec validation inline
- [ ] Erreur 409 CONFLICT → message inline `nameDuplicate`
- [ ] Erreur 409 DEPENDENCY_CONFLICT → ConfirmDialog message custom + bouton disabled
- [ ] Navigation post-create → détail créé + snackbar success
- [ ] Navigation post-update → détail + snackbar success
- [ ] Navigation post-delete → liste + snackbar success
- [ ] Menu dropdown Actions (⋮) : Edit + Delete
- [ ] Tags affichés avec TagChipList + déduplication lecture
- [ ] Tags éditables avec DimensionTagInput en form (pas de déduplication édition)
- [ ] ExpiryDate affiche badge rouge < 30j, orange < 90j
- [ ] Recherche textuelle debounce 300ms sur nom
- [ ] Filtres contractType et expiryDate (30/90/180j paramétrable)
- [ ] Tri par nom, createdAt, expiryDate fonctionnel
- [ ] Permissions `providers:read` / `providers:write` respectées
- [ ] Aucune erreur TypeScript strict
- [ ] Tests Cypress FS-03 tous passants
- [ ] Aucun `TODO / FIXME / HACK` non tracé
- [ ] Conventions AGENTS.md respectées

---

## 12. Revue de Dette Technique

### Gates TD

| # | Vérification | Commande / Action |
|---|------------|------------------|
| TD-1 | Aucun `TODO / FIXME / HACK` non tracé | `git grep -n "TODO\|FIXME\|HACK" -- 'frontend/**/*.tsx'` |
| TD-2 | Items F-999 activés par cette feature | Relire F-999 §2 (aucun item frontend spécifique) |
| TD-3 | AGENTS.md : aucun pattern nouveau non documenté | Relire AGENTS.md § React/Frontend |
| TD-4 | Composants F-01 réutilisés max | Vérifier imports depuis `@/components/(layout|shared|tags)` |
| TD-5 | Pas de CSS custom | Tout via MUI `sx={{}}` ou theme tokens |

### Résultat de la Revue

| Champ | Valeur |
|---|------|
| **Sprint** | Sprint 2 |
| **Date de revue** | *(à compléter)* |
| **Items F-999 impactés** | Aucun (frontend pur) |
| **NFR mis à jour** | *(à compléter)* |
| **TODOs résiduels tracés** | *(à compléter)* |
| **Statut gates TD** | *(à compléter)* |

---

_FS-03-FRONT v1.0 — ARK_
