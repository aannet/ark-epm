# ARK — Feature Spec FS-06-FRONT : Applications (Frontend)

_Version 1.1 — Mars 2026_

> **Changelog v1.0 :** Création initiale — module Applications frontend, le plus riche du produit. Intègre le pattern PNS-02 (Side Drawer), les filtres par tags et cycle de vie, et le composant `DimensionTagInput` en première implémentation réelle.
>
> **Changelog v1.1 :** Ajout des champs `description` et `comment` conformément à NFR-GOV-005. Le champ `comment` est affiché uniquement dans la page détail (onglet Général), jamais dans le Side Drawer ni les vues liste. **Design system :** Drawer toujours read-only (exception PNS-02-APP validée). Description Markdown différé P2 (voir F-999 Item 11).

---

## En-tête

| Champ | Valeur |
|---|---|
| **ID** | FS-06-FRONT |
| **Titre** | Applications — Pages React (Liste / Détail / New / Edit) |
| **Priorité** | P1 |
| **Statut** | ✅ `done` |
| **Dépend de** | **FS-06-BACK** (gate bloquante), FS-01, F-02, **F-03** (DimensionTagInput) |
| **Spec mère** | FS-06 Applications v1.0 |
| **Estimé** | 1.5 jour |
| **Version** | 1.1 |

> ✅ FS-06-BACK est `done` — toutes les gates sont cochées. Frontend est pleinement fonctionnel et livré anticipé en Sprint 2.

---

## 1. Objectif & Périmètre

**Ce que cette spec fait :**

Implémenter les pages React pour la gestion des Applications : liste paginée avec filtres, drawer de consultation rapide (PNS-02), détail complet, création et modification. Ce module est le **patron de référence pour les modules complexes** (formulaires riches, filtres avancés, tags dimensionnels).

Le frontend implémente :
- Liste paginée avec tri côté client et filtres côté serveur (tags + cycle de vie)
- Side Drawer read-only avec navigation vers détail/édition (PNS-02)
- Page détail avec affichage des relations (domaine, provider, owner)
- Formulaires de création/modification avec `DimensionTagInput` (première implémentation réelle F-03)
- Gestion des erreurs 409 DEPENDENCY_CONFLICT avec affichage des dépendances

**Hors périmètre :**
- Backend API — couvert par `FS-06-BACK`
- Graph de dépendances visuel — couvert par FS-09
- Import Excel — couvert par FS-10
- Gestion avancée des relations N:N (édition inline des capacités/data objects/IT components) — couvert par les modules respectifs

---

## 2. User Stories

### 2.1 Liste des Applications

**US-01 — Consultation de la liste**

En tant qu'utilisateur connecté,
Afin de consulter la liste des applications,
Je dois visualiser un tableau reprenant la liste paginée des applications.

Critères d'acceptation :
- [ ] La liste est paginée (20 items par défaut)
- [ ] Je peux trier le tableau ASC/DESC en cliquant sur les colonnes du header
- [ ] Une colonne Tags affiche les tags avec comportements F-03 (max 3 chips + badge +X)
- [ ] En cliquant sur une ligne (hors nom), j'ouvre un drawer en lecture seule
- [ ] Une colonne Actions affiche les pictos crayon (édition) et corbeille (suppression)

**US-02 — Suppression d'une application**

En tant qu'utilisateur connecté,
Afin de supprimer une application,
Je clique sur l'icône poubelle qui me demande confirmation via une popin.

Critères d'acceptation :
- [ ] Un test est fait pour vérifier si l'application a des objets liés
- [ ] Si des dépendances existent, un message d'erreur détaillé apparaît dans la popin
- [ ] Si aucune relation et confirmation, l'application est supprimée de la base
- [ ] Après suppression, retour à la liste avec alerte de succès

### 2.2 Zone de Filtres

**US-03 — Filtrage avancé**

En tant qu'utilisateur connecté,
Afin de ne visualiser que ce qui m'intéresse,
J'accède à une zone de filtres me proposant :
- Un filtre par tag (niveau 1/niveau 2/niveau 3 via DimensionTagInput en mode filtre)
- Un filtre par cycle de vie (liste déroulante)

Critères d'acceptation :
- [ ] Les filtres sont appliqués côté serveur
- [ ] Les filtres peuvent être combinés (AND)
- [ ] Un bouton "Réinitialiser" remet les filtres à zéro

### 2.3 Drawer (PNS-02)

**US-04 — Consultation rapide via Drawer**

En tant qu'utilisateur,
Je veux cliquer sur le corps d'une ligne pour ouvrir un Side Drawer,
Afin de consulter les métadonnées de l'application sans perdre ma position dans la liste.

Critères d'acceptation :
- [ ] Clic sur Description, Tags, Cycle de vie, Date ou Actions → ouvre le drawer
- [ ] Clic sur le nom de l'application → navigation directe vers `/applications/:id`
- [ ] Drawer s'affiche depuis la droite (400px)
- [ ] Drawer affiche : nom, **description**, domaine, provider, owner, criticité, cycle de vie, tags, dates
- [ ] Le champ **comment** n'est PAS affiché dans le drawer (conformément à NFR-GOV-005 — visible uniquement en page détail)
- [ ] Footer du drawer avec 2 boutons : "Modifier" (contained) et "Voir la fiche complète" (outlined)
- [ ] Bouton "Modifier" grisé si l'utilisateur n'a pas la permission `applications:write`

### 2.4 Détail

**US-05 — Page détail complète**

En tant qu'utilisateur connecté,
Afin de consulter le détail des informations d'une application,
J'accède à une page dédiée en lecture seule.

Critères d'acceptation :
- [ ] La page affiche toutes les informations de l'application
- [ ] Les relations (domaine, provider, owner) sont affichées avec leur nom
- [ ] Les tags sont affichés via TagChipList sans limite (mode drawer)
- [ ] Un bouton "Modifier" permet d'accéder à la page d'édition
- [ ] Un bouton "Retour" permet de revenir à la liste

### 2.5 Création et Édition

**US-06 — Créer une nouvelle application**

En tant qu'utilisateur connecté,
Afin de créer une nouvelle application,
J'accède à une page formulaire me permettant de saisir tous les champs obligatoires ou non.

Critères d'acceptation :
- [ ] Le formulaire contient : nom (obligatoire), description, domaine (sélecteur), provider (sélecteur), owner (sélecteur), criticité (radio/select), cycle de vie (select), tags (DimensionTagInput)
- [ ] Les champs ne sont enregistrés qu'à la soumission du formulaire
- [ ] Validation inline : nom obligatoire, nom unique
- [ ] Après création, navigation vers la page détail avec alerte de succès

**US-07 — Modifier une application**

En tant qu'utilisateur connecté,
Afin de modifier l'intégralité des champs d'une application,
J'accède à une page formulaire qui me permet de sauvegarder mes modifications uniquement à la soumission.

Critères d'acceptation :
- [ ] Tous les champs sont pré-remplis avec les valeurs actuelles
- [ ] Les tags affichent la réalité des données (pas de déduplication en mode édition)
- [ ] Validation inline identique à la création
- [ ] Après modification, navigation vers la page détail avec alerte de succès

---

## 3. Référence Contrat API

Le contrat API complet est défini dans **FS-06-BACK §3**. Ne pas le redéfinir ici.

| Méthode | Route | Résumé | Permission |
|---------|-------|--------|------------|
| `GET` | `/api/v1/applications` | Liste paginée | `applications:read` |
| `POST` | `/api/v1/applications` | Créer | `applications:write` |
| `GET` | `/api/v1/applications/:id` | Détail | `applications:read` |
| `PATCH` | `/api/v1/applications/:id` | Modifier | `applications:write` |
| `DELETE` | `/api/v1/applications/:id` | Supprimer | `applications:write` |
| `GET` | `/api/v1/applications/:id/dependencies` | Vérifier dépendances | `applications:read` |

Codes HTTP à gérer côté frontend :

| Code | Signification | Action frontend |
|------|--------------|-----------------|
| `200` / `201` | Succès | Navigate + Alert success (voir §3 zones `alerts`) |
| `400` | Validation | Erreur **inline** sur le champ concerné |
| `401` | Non authentifié | Intercepteur Axios → `/login?reason=session_expired` |
| `403` | Permission insuffisante | Intercepteur Axios → `/403` |
| `404` | Ressource introuvable | `navigate('/applications')` |
| `409` `CONFLICT` | Nom dupliqué | Erreur **inline** `t('applications.form.nameDuplicate')` |
| `409` `DEPENDENCY_CONFLICT` | Suppression bloquée | Message formaté dans `ConfirmDialog` via `format409Message()` |
| `5xx` | Erreur serveur | Alert **error** `t('applications.alert.errors.serverError')` |

---

## 4. Layout Contract

### 4.1 `ApplicationsListPage`

```yaml
page: ApplicationsListPage
route: /applications
auth_required: true
permission_required: applications:read

layout:
  shell: AppShell
  container: PageContainer
  container_props:
    maxWidth: xl

zones:
  header:
    component: PageHeader
    props:
      title: t('applications.list.title')
      subtitle: t('applications.list.subtitle')
      action:
        condition: hasPermission('applications:write')
        label: t('applications.list.addButton')
        onClick: navigate('/applications/new')
        icon: AddIcon

  alerts:
    - trigger: location.state?.alert
      component: ArkAlert
      position: sous PageHeader, au-dessus des filtres
      auto_dismiss: 5000ms
      on_mount: window.history.replaceState({}, '')

  filters:
    component: ApplicationFilters
    props:
      lifecycleStatusOptions: ['draft', 'in_progress', 'production', 'deprecated', 'retired']
      availableDimensions: ['Geography', 'Brand', 'LegalEntity']
      onFiltersChange: (filters) => void
      onReset: () => void
    layout:
      display: flex row wrap
      gap: 2
    fields:
      - field: lifecycleStatus
        component: Select
        props:
          label: t('applications.filters.lifecycleStatus')
          options: lifecycleStatusOptions
          clearable: true
      - field: tags
        component: DimensionTagInput
        props:
          dimensionId: "uuid-geography"
          dimensionName: "Geography"
          mode: "filter"
          multiple: true
      - field: resetButton
        component: Button
        props:
          variant: text
          label: t('common.actions.reset')
          onClick: onReset

  body:
    component: MUI Table avec TableSortLabel
    loading_state: LoadingSkeleton
    empty_state: EmptyState
    empty_state_props:
      title: t('applications.list.emptyState.title')
      description: t('applications.list.emptyState.description')
      action:
        condition: hasPermission('applications:write')
        label: t('applications.list.emptyState.cta')
        onClick: navigate('/applications/new')
    row_click:
      action: open ApplicationDrawer (toutes cellules sauf 'name')
      handler: setSelectedApplicationId(row.id)
      condition: clic hors cellule name
      preserve_state: [filters, scroll_position, pagination]
    columns:
      - field: name
        header: t('applications.list.columns.name')
        sortable: true
        component: Link (react-router-dom)
        component_props:
          to: '/applications/${row.id}'
          underline: always
          color: inherit
          hover_color: primary
        onClick: navigate('/applications/${row.id}')
        behavior: stopPropagation pour éviter d'ouvrir le drawer
      - field: domain
        header: t('applications.list.columns.domain')
        sortable: true
        accessor: row.domain?.name
      - field: provider
        header: t('applications.list.columns.provider')
        sortable: true
        accessor: row.provider?.name
      - field: lifecycleStatus
        header: t('applications.list.columns.lifecycleStatus')
        sortable: true
        component: StatusChip
        component_props:
          status: row.lifecycleStatus
      - field: tags
        header: t('applications.list.columns.tags')
        sortable: false
        component: TagChipList
        component_props:
          tags: deduplicateByDepth(row.tags)
          maxVisible: 3
          size: small
      - field: createdAt
        header: t('applications.list.columns.createdAt')
        sortable: true
        format: date locale FR
      - field: actions
        header: t('applications.list.columns.actions')
        condition: hasPermission('applications:write')
        row_actions:
          - type: edit
            icon: EditIcon
            aria_label: t('common.actions.edit')
            onClick: navigate('/applications/${row.id}/edit')
          - type: delete
            icon: DeleteIcon
            aria_label: t('common.actions.delete')
            onClick: open confirm-delete dialog

  drawer:
    component: ApplicationDrawer
    trigger: clic sur corps de ligne (hors cellule name)
    props:
      applicationId: string | null
      open: boolean
      onClose: () => void
    behavior:
      - GET /api/v1/applications/:id via useApplication() hook
      - GET /api/v1/applications/:id/dependencies pour afficher les compteurs
      - Affichage skeleton pendant chargement
      - Fermeture: bouton X (gris), backdrop click, Escape key
    layout:
      width: 400px
      anchor: right
      variant: temporary
    sections:
      header:
        layout: flex row, justify-content: space-between
        elements:
          - title: Typography h6 (nom de l'application), word-break: break-word
          - close_button:
              icon: CloseIcon
              color: text.secondary (gris)
              aria-label: t('applications.drawer.close')
              onClick: close drawer
      content:
        - Informations: Nom, Description, Domaine (lien), Provider (lien), Owner, Criticité, Cycle de vie
        - Tags: Chips via TagChipList mode drawer (maxVisible: 10 + "Voir plus")
        - Métadonnées: Créé le, Modifié le
      footer:
        layout: flex row, justify-content: flex-end, gap: 2
        buttons:
          - label: t('applications.drawer.edit')
            variant: contained
            onClick: navigate('/applications/${applicationId}/edit')
            state:
              - disabled: !hasPermission('applications:write')
          - label: t('applications.drawer.viewFullDetails')
            variant: outlined
            onClick: navigate('/applications/${applicationId}')
    permissions:
      - Tous les utilisateurs: drawer accessible (read-only)
      - Bouton Edit grisé si pas de permission applications:write

  sort_state:
    default_field: name
    default_order: asc
    scope: client-side

  dialogs:
    - id: confirm-delete
      component: ConfirmDialog
      trigger: delete IconButton click
      props:
        title: t('applications.delete.confirmTitle')
        message: t('applications.delete.confirmMessage', { name: row.name })
        confirmLabel: t('common.actions.delete')
        severity: error
      on_confirm_pre_check: GET /api/v1/applications/:id/dependencies
      on_confirm:
        condition: !dependencies.hasDependencies
        action: DELETE /api/v1/applications/:id
      on_success:
        navigate: navigate('/applications')
        alert: { severity: 'success', message: t('applications.alert.deleted') }
      on_409_DEPENDENCY_CONFLICT:
        message: format409Message(t, dependencies.counts)
        confirm_button: masqué ou désactivé
      on_5xx:
        alert: severity=error message=t('applications.alert.errors.serverError')
```

---

### 4.2 `ApplicationDetailPage`

```yaml
page: ApplicationDetailPage
route: /applications/:id
auth_required: true
permission_required: applications:read

on_load:
  action: GET /api/v1/applications/:id
  on_404: navigate('/applications')

layout:
  shell: AppShell
  container: PageContainer
  container_props:
    maxWidth: md

zones:
  header:
    component: PageHeader
    props:
      title: application.name
      action:
        condition: hasPermission('applications:write')
        label: t('applications.detail.editButton')
        onClick: navigate('/applications/${application.id}/edit')
        icon: EditIcon

  alerts:
    - trigger: location.state?.alert
      component: ArkAlert
      position: sous PageHeader
      auto_dismiss: 5000ms
      on_mount: window.history.replaceState({}, '')

  body:
    loading_state: LoadingSkeleton
    sections:
      - title: t('applications.detail.section.general')
        fields:
          - label: t('applications.list.columns.name')
            value: application.name
          - label: t('applications.list.columns.description')
            value: application.description ?? t('applications.detail.noDescription')
          - label: t('applications.detail.criticality')
            value: application.criticality ?? t('applications.detail.noValue')
            component: StatusChip
          - label: t('applications.list.columns.lifecycleStatus')
            value: application.lifecycleStatus ?? t('applications.detail.noValue')
            component: StatusChip
          - label: t('applications.detail.comment')
            value: application.comment ?? t('applications.detail.noComment')
      - title: t('applications.detail.section.relations')
        fields:
          - label: t('applications.list.columns.domain')
            value: application.domain?.name ?? t('applications.detail.noValue')
            link: application.domain ? '/domains/${application.domain.id}' : null
          - label: t('applications.list.columns.provider')
            value: application.provider?.name ?? t('applications.detail.noValue')
            link: application.provider ? '/providers/${application.provider.id}' : null
          - label: t('applications.detail.owner')
            value: application.owner ? '${owner.firstName} ${owner.lastName}' : t('applications.detail.noValue')
      - title: t('applications.detail.section.tags')
        fields:
          - label: t('applications.list.columns.tags')
            component: TagChipList
            component_props:
              tags: deduplicateByDepth(application.tags)
              maxVisible: undefined
              size: small
      - title: t('applications.detail.section.metadata')
        fields:
          - label: t('applications.list.columns.createdAt')
            value: application.createdAt formaté date locale FR
          - label: t('applications.detail.updatedAt')
            value: application.updatedAt formaté date locale FR

  footer:
    - component: MUI Button
      props:
        variant: outlined
        label: t('applications.detail.backButton')
        onClick: navigate('/applications')
```

---

### 4.3 `ApplicationNewPage`

```yaml
page: ApplicationNewPage
route: /applications/new
auth_required: true
permission_required: applications:write

layout:
  shell: AppShell
  container: PageContainer
  container_props:
    maxWidth: sm

zones:
  header:
    component: PageHeader
    props:
      title: t('applications.form.createTitle')
      action: null

  alerts:
    - trigger: submitError state (local)
      component: ArkAlert
      severity: error
      position: sous PageHeader, au-dessus du formulaire
      auto_dismiss: false
      message: resolveAlertMessage(t, status, code)

  body:
    component: ApplicationForm
    props:
      initialValues: 
        name: ''
        description: ''
        comment: ''
        domainId: null
        providerId: null
        ownerId: null
        criticality: null
        lifecycleStatus: null
        tags: []
      isLoading: false
      onCancel: navigate('/applications')
      onSubmit: POST /api/v1/applications
      availableOptions:
        domains: [] # Chargés via GET /api/v1/domains
        providers: [] # Chargés via GET /api/v1/providers
        users: [] # Chargés via GET /api/v1/users (filtered)
        criticalities: ['low', 'medium', 'high', 'mission-critical']
        lifecycleStatuses: ['draft', 'in_progress', 'production', 'deprecated', 'retired']
      availableDimensions: ['Geography', 'Brand', 'LegalEntity']

  on_submit_success:
    - POST /api/v1/applications → get applicationId
    - PUT /tags/entity/application/{applicationId} with collected tags
    - navigate('/applications/${applicationId}', { state: { alert: { severity: 'success', message: t('applications.alert.created') } } })

  on_submit_409_CONFLICT:
    action: erreur inline sur le champ name
    message: t('applications.form.nameDuplicate')

  on_submit_400:
    action: erreur inline sur le champ name
    message: t('applications.form.nameRequired')

  on_submit_5xx:
    action: afficher ArkAlert error au-dessus du formulaire (état local)
    message: t('applications.alert.errors.serverError')
```

---

### 4.4 `ApplicationEditPage`

```yaml
page: ApplicationEditPage
route: /applications/:id/edit
auth_required: true
permission_required: applications:write

on_load:
  action: GET /api/v1/applications/:id
  on_404: navigate('/applications')

layout:
  shell: AppShell
  container: PageContainer
  container_props:
    maxWidth: sm

zones:
  header:
    component: PageHeader
    props:
      title: t('applications.form.editTitle')
      action: null

  alerts:
    - trigger: submitError state (local)
      component: ArkAlert
      severity: error
      position: sous PageHeader, au-dessus du formulaire
      auto_dismiss: false
      message: resolveAlertMessage(t, status, code)

  body:
    loading_state: LoadingSkeleton
    component: ApplicationForm
    props:
      initialValues:
        name: application.name
        description: application.description ?? ''
        comment: application.comment ?? ''
        domainId: application.domainId
        providerId: application.providerId
        ownerId: application.ownerId
        criticality: application.criticality
        lifecycleStatus: application.lifecycleStatus
        tags: application.tags # tags bruts — pas de déduplication
      isLoading: false
      onCancel: navigate('/applications/${id}')
      onSubmit: PATCH /api/v1/applications/:id
      availableOptions:
        domains: [] # Chargés via GET /api/v1/domains
        providers: [] # Chargés via GET /api/v1/providers
        users: [] # Chargés via GET /api/v1/users
        criticalities: ['low', 'medium', 'high', 'mission-critical']
        lifecycleStatuses: ['draft', 'in_progress', 'production', 'deprecated', 'retired']
      availableDimensions: ['Geography', 'Brand', 'LegalEntity']
    # Note DimensionTagInput (mode édition) :
    # deduplicateByDepth() N'EST PAS appliquée ici — l'utilisateur voit la réalité des données.

  on_submit_success:
    - PATCH /api/v1/applications/:id
    - PUT /tags/entity/application/{id} with collected tags
    - navigate('/applications/${id}', { state: { alert: { severity: 'success', message: t('applications.alert.updated') } } })

  on_submit_409_CONFLICT:
    action: erreur inline sur le champ name
    message: t('applications.form.nameDuplicate')

  on_submit_5xx:
    action: afficher ArkAlert error au-dessus du formulaire (état local)
    message: t('applications.alert.errors.serverError')
```

---

## 5. Composants à Générer

### Structure de fichiers

```
frontend/src/
├── pages/
│   └── applications/
│       ├── ApplicationsListPage.tsx
│       ├── ApplicationNewPage.tsx
│       ├── ApplicationDetailPage.tsx
│       └── ApplicationEditPage.tsx
├── components/
│   ├── applications/
│   │   ├── ApplicationForm.tsx
│   │   ├── ApplicationDrawer.tsx      # PNS-02 Side Drawer read-only
│   │   ├── ApplicationFilters.tsx     # Zone de filtres
│   │   └── index.ts
│   └── shared/
│       └── ArkAlert.tsx               # Si non existant (cf FS-02)
├── utils/
│   └── application.utils.ts           # format409Message() + resolveAlertMessage()
└── types/
    └── application.ts
```

**Composants F-03 consommés (déjà générés par F-03, NE PAS régénérer) :**

```
frontend/src/components/tags/
├── DimensionTagInput.tsx          ← édition et filtrage
├── DimensionTagInput.utils.ts     ← contient deduplicateByDepth()
├── TagChipList.tsx                ← lecture seule
└── index.ts                       ← export { DimensionTagInput, TagChipList }
```

### ApplicationForm Props

```typescript
interface ApplicationFormProps {
  initialValues?: Partial<ApplicationFormValues>;
  onSubmit: (values: ApplicationFormValues) => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
  error: string | null;
  availableOptions: {
    domains: Array<{ id: string; name: string }>;
    providers: Array<{ id: string; name: string }>;
    users: Array<{ id: string; firstName: string; lastName: string }>;
    criticalities: string[];
    lifecycleStatuses: string[];
  };
  availableDimensions?: string[];
}

interface ApplicationFormValues {
  name: string;
  description: string;
  comment: string;
  domainId: string | null;
  providerId: string | null;
  ownerId: string | null;
  criticality: string | null;
  lifecycleStatus: string | null;
  tags: TagValueResponse[];
}

interface ApplicationResponse {
  id: string;
  name: string;
  description: string | null;
  comment: string | null;
  domain: { id: string; name: string } | null;
  provider: { id: string; name: string } | null;
  owner: { id: string; firstName: string; lastName: string; email: string } | null;
  criticality: string | null;
  lifecycleStatus: string | null;
  createdAt: string;
  updatedAt: string;
  tags: EntityTagResponse[];
}
```

### ApplicationFilters Props

```typescript
interface ApplicationFiltersProps {
  lifecycleStatusOptions: string[];
  availableDimensions: string[];
  filters: {
    lifecycleStatus: string | null;
    tagValueIds: string[];
  };
  onFiltersChange: (filters: ApplicationFiltersState) => void;
  onReset: () => void;
}
```

### ApplicationDrawer Props

```typescript
interface ApplicationDrawerProps {
  applicationId: string | null;
  open: boolean;
  onClose: () => void;
}
```

---

## 5.1 DimensionTagInput Integration (F-03)

**Mode Formulaire (création/édition) :**

```typescript
// In ApplicationForm.tsx
import { DimensionTagInput } from '@/components/tags';

// Usage — Geography dimension (mode édition, pas de déduplication)
<DimensionTagInput
  dimensionId="uuid-geography"
  dimensionName="Geography"
  dimensionColor="#2196F3"
  entityType="application"
  entityId={applicationId}    // undefined en mode création
  value={values.tags.filter(t => t.dimensionName === 'Geography')}
  onChange={(tags) => setFieldValue('tags', [
    ...values.tags.filter(t => t.dimensionName !== 'Geography'),
    ...tags
  ])}
  multiple={true}
/>
```

**Mode Filtre (liste) :**

```typescript
// In ApplicationFilters.tsx
<DimensionTagInput
  dimensionId="uuid-geography"
  dimensionName="Geography"
  dimensionColor="#2196F3"
  mode="filter"  // Pas d'entityId en mode filtre
  value={filters.tags.filter(t => t.dimensionName === 'Geography')}
  onChange={(tags) => setFilters({ ...filters, tags: [...] })}
  multiple={true}
/>
```

---

## 6. Clés i18n — Section `applications` dans `fr.json`

```json
{
  "applications": {
    "list": {
      "title": "Applications",
      "subtitle": "Inventaire des applications métier",
      "addButton": "Ajouter une application",
      "columns": {
        "name": "Nom",
        "domain": "Domaine",
        "provider": "Fournisseur",
        "lifecycleStatus": "Cycle de vie",
        "tags": "Tags",
        "createdAt": "Créé le",
        "actions": "Actions"
      },
      "emptyState": {
        "title": "Aucune application créée",
        "description": "Commencez par créer votre première application.",
        "cta": "Créer votre première application"
      }
    },
    "filters": {
      "title": "Filtres",
      "lifecycleStatus": "Cycle de vie",
      "tags": "Tags",
      "reset": "Réinitialiser"
    },
    "detail": {
      "noDescription": "—",
      "noComment": "Aucun commentaire",
      "noValue": "Non défini",
      "editButton": "Modifier",
      "backButton": "Retour à la liste",
      "section": {
        "general": "Informations générales",
        "relations": "Relations",
        "tags": "Tags",
        "metadata": "Métadonnées"
      },
      "criticality": "Criticité",
      "owner": "Responsable",
      "comment": "Commentaire interne",
      "updatedAt": "Modifié le"
    },
    "form": {
      "createTitle": "Nouvelle application",
      "editTitle": "Modifier l'application",
      "nameLabel": "Nom",
      "descriptionLabel": "Description",
      "commentLabel": "Commentaire interne",
      "domainLabel": "Domaine",
      "providerLabel": "Fournisseur",
      "ownerLabel": "Responsable",
      "criticalityLabel": "Criticité",
      "lifecycleStatusLabel": "Cycle de vie",
      "tagsLabel": "Tags",
      "saveButton": "Enregistrer",
      "cancelButton": "Annuler",
      "nameRequired": "Le nom est obligatoire",
      "nameDuplicate": "Ce nom d'application est déjà utilisé"
    },
    "drawer": {
      "close": "Fermer",
      "edit": "Modifier",
      "viewFullDetails": "Voir la fiche complète"
    },
    "delete": {
      "confirmTitle": "Supprimer l'application",
      "confirmMessage": "Êtes-vous sûr de vouloir supprimer l'application \"{{name}}\" ?",
      "blockedMessage": "Cette application est utilisée par : {{capabilities}} capacité(s), {{dataObjects}} objet(s) de données, {{itComponents}} composant(s) IT, {{sourceInterfaces}} interface(s) source, {{targetInterfaces}} interface(s) cible. Elle ne peut pas être supprimée."
    },
    "alert": {
      "created": "Application créée avec succès",
      "updated": "Application mise à jour avec succès",
      "deleted": "Application supprimée avec succès",
      "errors": {
        "serverError": "Une erreur serveur est survenue. Veuillez réessayer.",
        "notFound": "Cette application n'existe plus.",
        "unknown": "Une erreur inattendue est survenue."
      }
    },
    "criticality": {
      "low": "Faible",
      "medium": "Moyenne",
      "high": "Élevée",
      "mission-critical": "Critique"
    },
    "lifecycle": {
      "draft": "Brouillon",
      "in_progress": "En développement",
      "production": "En production",
      "deprecated": "Dépréciée",
      "retired": "Retirée"
    }
  }
}
```

---

## 7. Règles Métier Frontend

- **RM-06 — Masquage conditionnel des actions d'écriture :**

  ```typescript
  const canWrite = hasPermission('applications:write');
  ```

- **RM-07 — Formatage des messages 409 DEPENDENCY_CONFLICT :**

  ```typescript
  export function format409Message(
    t: TFunction, 
    counts: { 
      capabilities: number; 
      dataObjects: number; 
      itComponents: number; 
      sourceInterfaces: number; 
      targetInterfaces: number;
    }
  ): string {
    return t('applications.delete.blockedMessage', {
      capabilities: counts.capabilities,
      dataObjects: counts.dataObjects,
      itComponents: counts.itComponents,
      sourceInterfaces: counts.sourceInterfaces,
      targetInterfaces: counts.targetInterfaces
    });
  }
  ```

- **RM-08 — Tri des colonnes côté client :**

  ```typescript
  type SortField = 'name' | 'domain' | 'provider' | 'lifecycleStatus' | 'createdAt';
  type SortOrder = 'asc' | 'desc';
  ```

  Valeurs `null` sur `domain`, `provider` classées **en dernier** quelle que soit la direction.

- **RM-09 — Résolution des messages d'erreur par code HTTP :**

  ```typescript
  export function resolveAlertMessage(t: TFunction, status: number, code?: string): string {
    if (status === 404) return t('applications.alert.errors.notFound');
    if (status >= 500) return t('applications.alert.errors.serverError');
    return t('applications.alert.errors.unknown');
  }
  ```

- **RM-10 — Comportement post-suppression :**

  Après `DELETE` réussi → toujours `navigate('/applications', { state: { alert: ... } })`.

- **RM-11 — Cycle de vie des alertes :**

  | Type | Déclencheur | Transport | Auto-dismiss | Comportement |
  |------|-------------|-----------|--------------|--------------|
  | Success (create) | POST 201 | navigation state | 5000ms | Affiché sur `ApplicationDetailPage` |
  | Success (update) | PATCH 200 | navigation state | 5000ms | Affiché sur `ApplicationDetailPage` |
  | Success (delete) | DELETE 204 | navigation state | 5000ms | Affiché sur `ApplicationsListPage` |
  | Error (5xx) | any 5xx | useState local | aucun | Affiché sur la page courante |
  | Error (409 DEPENDENCY_CONFLICT) | DELETE 409 | dans ConfirmDialog | aucun | Remplace le message du dialog |
  | Inline (400 / 409 CONFLICT) | POST/PATCH 4xx | prop `error` du form | aucun | Sous le champ concerné |

- **RM-12 — Séparation lecture / édition des tags (F-03 RM-11) :**

  - **Mode lecture** (`ApplicationsListPage`, `ApplicationDetailPage`, `ApplicationDrawer`) → `TagChipList` — `deduplicateByDepth()` appliquée **en interne**.
  - **Mode édition** (`ApplicationForm` via `DimensionTagInput`) → `deduplicateByDepth()` **non appliquée**. L'utilisateur voit la réalité des données stockées.

- **RM-13 — Pré-vérification des dépendances avant suppression :**

  Avant d'afficher la `ConfirmDialog`, appeler `GET /api/v1/applications/:id/dependencies` pour :
  - Afficher un message informatif si des dépendances existent
  - Désactiver le bouton "Supprimer" si `hasDependencies === true`

---

## 8. Câblage App.tsx — Manuel

```typescript
// Lecture : token requis
<Route path="/applications" element={<PrivateRoute />}>
  <Route index element={<ApplicationsListPage />} />
  <Route path=":id" element={<ApplicationDetailPage />} />
</Route>

// Écriture : token + permission applications:write
<Route path="/applications" element={<PrivateRoute permission="applications:write" />}>
  <Route path="new" element={<ApplicationNewPage />} />
  <Route path=":id/edit" element={<ApplicationEditPage />} />
</Route>
```

---

## 9. Session Gate — Frontend

- [ ] **FS-06-BACK au statut `done`** — gates G-01 à G-10 toutes cochées
- [ ] **F-03 au statut `done`** — `DimensionTagInput`, `TagChipList` et API tags disponibles
- [ ] **`TagChipList` exporté depuis `@/components/tags`** (F-03)
- [ ] **`deduplicateByDepth()` exportée depuis `@/components/tags/DimensionTagInput.utils`** (F-03)
- [ ] **API testée manuellement** — `GET /api/v1/applications/:id` retourne `depth` et `dimensionColor` dans les tags
- [ ] **Endpoint dependencies testé** — `GET /api/v1/applications/:id/dependencies` retourne les compteurs
- [ ] **F-02 au statut `done`** — `useTranslation()` disponible
- [ ] **Clés `applications.*` ajoutées dans `fr.json`** — y compris `applications.filters.*`, `applications.criticality.*`, `applications.lifecycle.*`
- [ ] **`hasPermission()` exporté depuis `@/store/auth`** (FS-01)
- [ ] **Câblage `App.tsx` réalisé manuellement**
- [ ] **`cy.loginAsReadOnly()`** créé dans `cypress/support/commands.ts`
- [ ] **Cypress opérationnel**
- [ ] **Layout Contract §4 relu** — zones `drawer` et `filters` précisées
- [ ] **FS-06-FRONT passé au statut `stable`** avant de lancer OpenCode

---

## 10. Tests Cypress — E2E Browser

### Parcours nominaux

- [ ] `[Cypress]` `ApplicationsListPage` affiche la liste paginée après login
- [ ] `[Cypress]` `ApplicationsListPage` affiche `EmptyState` si aucune application
- [ ] `[Cypress]` Tri par défaut sur `name` ascendant
- [ ] `[Cypress]` Clic sur en-tête "Nom" inverse le tri
- [ ] `[Cypress]` Clic sur en-tête "Domaine" trie par domaine
- [ ] `[Cypress]` Clic sur une ligne (hors nom) → ouvre `ApplicationDrawer`
- [ ] `[Cypress]` Clic sur le nom → navigation vers `/applications/:id`
- [ ] `[Cypress]` `ApplicationDrawer` affiche nom, domaine, provider, tags (read-only)
- [ ] `[Cypress]` `ApplicationDrawer` affiche skeleton pendant chargement
- [ ] `[Cypress]` Clic bouton "Voir la fiche complète" dans drawer → navigate vers `/applications/:id`
- [ ] `[Cypress]` Clic bouton X ou backdrop → drawer fermé, reste sur liste
- [ ] `[Cypress]` `ApplicationDetailPage` affiche toutes les sections (général, relations, tags, métadonnées)
- [ ] `[Cypress]` `ApplicationDetailPage` — liens vers domaine et provider fonctionnels
- [ ] `[Cypress]` Créer une application → redirect vers `/applications/<new-id>` + Alert success
- [ ] `[Cypress]` Alert success disparaît automatiquement après 5 secondes
- [ ] `[Cypress]` Cancel sur `ApplicationNewPage` → redirect vers `/applications`
- [ ] `[Cypress]` Modifier une application → redirect vers `/applications/:id` + Alert success
- [ ] `[Cypress]` Cancel sur `ApplicationEditPage` → redirect vers `/applications/:id`
- [ ] `[Cypress]` Supprimer une application sans dépendances → redirect vers `/applications` + Alert success
- [ ] `[Cypress]` Cancel suppression → dialog fermé, application toujours présente

### Filtres

- [ ] `[Cypress]` Filtre par cycle de vie → liste filtrée côté serveur
- [ ] `[Cypress]` Filtre par tags → liste filtrée
- [ ] `[Cypress]` Combinaison filtres → liste filtrée avec AND
- [ ] `[Cypress]` Bouton "Réinitialiser" → tous les filtres remis à zéro

### Tags — rendu et déduplication (F-03)

- [ ] `[Cypress]` `ApplicationsListPage` — application avec 5 tags → colonne affiche 3 chips + badge "+2"
- [ ] `[Cypress]` `ApplicationsListPage` — tags ancêtre + descendant → seul le descendant affiché (déduplication)
- [ ] `[Cypress]` `ApplicationDetailPage` — tags ancêtre + descendant → seul le descendant affiché
- [ ] `[Cypress]` `ApplicationDrawer` — dimension sans tags → section absente
- [ ] `[Cypress]` `ApplicationNewPage` — `DimensionTagInput` permet d'ajouter des tags
- [ ] `[Cypress]` `ApplicationEditPage` — `DimensionTagInput` affiche les deux chips (pas de déduplication)

### Parcours d'erreur

- [ ] `[Cypress]` Créer avec nom dupliqué → erreur inline sous le champ "Nom"
- [ ] `[Cypress]` Créer sans nom → erreur inline sous le champ "Nom"
- [ ] `[Cypress]` Modifier avec nom dupliqué → erreur inline
- [ ] `[Cypress]` Supprimer application avec dépendances → message formaté dans `ConfirmDialog` + bouton désactivé
- [ ] `[Cypress]` Erreur 500 simulée → Alert error visible au-dessus du formulaire
- [ ] `[Cypress]` `ApplicationEditPage` UUID inexistant → redirect vers `/applications`
- [ ] `[Cypress]` `ApplicationDetailPage` UUID inexistant → redirect vers `/applications`

### Droits UI

- [ ] `[Cypress]` Sans `applications:write` sur ListPage → bouton "Ajouter" absent
- [ ] `[Cypress]` Sans `applications:write` sur ListPage → colonne "Actions" absente
- [ ] `[Cypress]` Sans `applications:write` sur ListPage → drawer accessible mais bouton "Modifier" grisé
- [ ] `[Cypress]` Sans `applications:write` sur DetailPage → bouton "Modifier" absent
- [ ] `[Manuel]` Sans `applications:write` → `/applications/new` redirige vers `/403`
- [ ] `[Manuel]` Sans `applications:write` → `/applications/:id/edit` redirige vers `/403`

---

## 11. Commande OpenCode — Frontend

```
Contexte projet ARK — Session Frontend FS-06-FRONT :

Stack : React 18 + Vite + TypeScript strict + MUI v5 + react-i18next
Règles MUI obligatoires :
- MUI v5 UNIQUEMENT — pas de Tailwind, pas de styled-components
- Styling : sx prop uniquement — jamais de styled()
- Inputs : variant="outlined" systématiquement
- Pas de MUI X DataGrid — MUI Table + TableSortLabel

i18n :
- Toute string visible via t('clé') — JAMAIS de string en dur
- Clés applications.* présentes dans fr.json — incluant applications.filters.*, applications.criticality.*, applications.lifecycle.*

RBAC :
- hasPermission() importé depuis @/store/auth
- Vérifier avant TOUT rendu d'action d'écriture

Composants F-01 OBLIGATOIRES :
  import { PageHeader, ConfirmDialog, EmptyState, LoadingSkeleton, StatusChip } from '@/components/shared'
  import { AppShell, PageContainer } from '@/components/layout'

Composants F-03 OBLIGATOIRES (déjà générés — NE PAS régénérer) :
  import { DimensionTagInput, TagChipList } from '@/components/tags'
  import { deduplicateByDepth } from '@/components/tags/DimensionTagInput.utils'

  Règle d'usage CRITIQUE (RM-12) :
  - DimensionTagInput  → formulaires et filtres — PAS de deduplicateByDepth()
  - TagChipList        → vues lecture uniquement — deduplicateByDepth() appliquée EN INTERNE
  - TagChipList mode liste   : maxVisible=3, size="small"
  - TagChipList mode drawer  : maxVisible=undefined (tous les chips)

Nouveaux composants à générer :
  src/components/applications/ApplicationForm.tsx
  src/components/applications/ApplicationDrawer.tsx    # PNS-02
  src/components/applications/ApplicationFilters.tsx   # Zone de filtres
  src/utils/application.utils.ts                       # format409Message avec compteurs multiples

Gestion des alertes (RM-11) :
  Success → navigate state
  Error 5xx → useState local, pas d'auto-dismiss
  Inline (400, 409 CONFLICT) → prop error du form

Pattern PNS-02 (Side Drawer) :
  - Clic sur corps de ligne (hors nom) → ouvre drawer
  - Clic sur nom → navigation directe
  - Drawer 400px, anchor right, read-only
  - Footer avec "Modifier" (disabled si !applications:write) + "Voir fiche complète"

Pré-vérification suppression (RM-13) :
  - Avant d'ouvrir ConfirmDialog, appeler GET /api/v1/applications/:id/dependencies
  - Si hasDependencies === true, afficher message détaillé et désactiver le bouton Confirmer

JWT : token en mémoire uniquement
Routing : react-router-dom v6
Câblage App.tsx : déjà réalisé manuellement — ne pas le générer

Génère : 4 pages React, ApplicationForm, ApplicationDrawer, ApplicationFilters, application.utils.ts, application.ts, tests Cypress §10.
Ne génère PAS le câblage App.tsx.
Ne génère PAS les composants tags (DimensionTagInput, TagChipList) — déjà présents via F-03.
Ne génère PAS les tests marqués [Manuel].
Ne fais aucune hypothèse non documentée. Si un point est ambigu, pose une question avant de coder.

[COLLER LE CONTENU COMPLET DE FS-06-FRONT.md ICI]
[COLLER LE CONTENU DE FS-06-BACK §3 (Contrat API OpenAPI) ICI]
```

---

## 12. Checklist de Validation Frontend

- [ ] Les 4 routes `/applications/*` fonctionnent depuis App.tsx
- [ ] `PageHeader` utilisé sur toutes les pages
- [ ] Zone de filtres fonctionnelle (lifecycle + tags)
- [ ] `ConfirmDialog` utilisé pour la suppression avec pré-vérification des dépendances
- [ ] `EmptyState` affiché sur liste vide
- [ ] `LoadingSkeleton` affiché pendant les appels API
- [ ] `ApplicationDrawer` (PNS-02) fonctionnel — clic ligne, navigation nom, footer avec boutons
- [ ] Drawer accessible pour tous, bouton "Modifier" grisé si pas permission
- [ ] Déduplication active sur TagChipList (liste, détail, drawer)
- [ ] Pas de déduplication sur DimensionTagInput (formulaires)
- [ ] Bouton "Ajouter" masqué si pas `applications:write`
- [ ] Colonne "Actions" masquée si pas `applications:write`
- [ ] Bouton "Modifier" masqué sur détail si pas `applications:write`
- [ ] Tri des colonnes fonctionnel — nulls en dernier
- [ ] Alert success après create / update / delete avec auto-dismiss 5s
- [ ] Message 409 DEPENDENCY_CONFLICT formaté avec les compteurs
- [ ] Aucune string en dur dans les composants
- [ ] Aucune erreur TypeScript strict
- [ ] Tests Cypress nominaux passent

---

## 13. Revue de Dette Technique

### Gates TD

| # | Vérification | Commande / Action |
|---|---|---|
| TD-1 | Aucun `TODO / FIXME / HACK` non tracé | `git grep -n "TODO\|FIXME\|HACK" -- '*.tsx'` |
| TD-2 | Items F-999 activés : statut mis à jour | Relire F-999 §2 |
| TD-3 | Checklist F-999 §4 : cases cochées | F-999 §4 |
| TD-4 | AGENTS.md : aucun pattern nouveau non documenté | Relire AGENTS.md |
| TD-5 | ARK-NFR.md : NFR impactés mis à jour | ARK-NFR.md |
| TD-6 | Nouvelles décisions transverses → nouvel Item F-999 | Jugement |

### Résultat de la Revue

| Champ | Valeur |
|---|---|
| **Sprint** | Sprint 3 |
| **Date de revue** | *(à compléter)* |
| **Items F-999 fermés** | *(à compléter)* |
| **Items F-999 ouverts** | *(à compléter)* |
| **Nouveaux items F-999 créés** | *(à compléter)* |
| **NFR mis à jour** | *(à compléter)* |
| **TODOs résiduels tracés** | *(à compléter)* |
| **Statut gates TD** | *(à compléter)* |

---

_FS-06-FRONT v1.0 — ARK_
