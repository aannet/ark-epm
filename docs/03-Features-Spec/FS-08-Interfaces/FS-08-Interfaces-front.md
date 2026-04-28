# ARK — Feature Spec FS-08-FRONT : Interfaces (Frontend)

_Version 0.1 — Avril 2026_

> **Changelog v0.1 :** Création initiale — module Interfaces frontend conforme template v0.1 et pattern PNS-02 (Side Drawer read-only). Liste avec représentation Source → [Middleware] → Cible, filtres serveur (sourceApp, middlewareApp, targetApp, type, criticality), CriticalityChip réutilisé depuis FS-07, StatusChip générique pour le type d'interface, MUI Select avec labels FR pour les enums. Formulaire avec validation client-side RM-IF-01 (auto-liaison interdite). Suppression libre (pas de DEPENDENCY_CONFLICT). Dépend de l'amendment T-042 (champ middlewareAppId).

---

## En-tête

| Champ | Valeur |
|---|---|
| **ID** | FS-08-FRONT |
| **Titre** | Interfaces — Pages React (Liste / Détail / New / Edit) |
| **Priorité** | P1 |
| **Statut** | `stable` *(T-042 done + T-040 done + T-043 done)* |
| **Dépend de** | **FS-08-BACK** (gate bloquante ✅ done), **T-042** (amendment middlewareAppId), FS-01, F-02, F-03 |
| **Spec mère** | FS-08 Interfaces — Sprint 4 |
| **Estimé** | 1.0 jour |
| **Version** | 0.1 |

> ⚠️ Cette spec reste à `draft` tant que **T-042** (amendment FS-08-BACK pour le champ `middlewareAppId`) n'est pas au statut `done`.

> **Note T-042 — Amendment pré-requis :** Avant de lancer la session OpenCode frontend, l'amendment backend doit ajouter :
> - `middlewareAppId` (UUID nullable FK → `applications`) sur la table `interfaces`
> - `middlewareApp: { id: string; name: string } | null` dans `InterfaceResponse` et `InterfaceListItem`
> - Query param `middlewareAppId` sur `GET /api/v1/interfaces`
> - `middlewareAppId` dans `CreateInterfaceDto` et `UpdateInterfaceDto` (optionnel)
> - Relation Prisma `InterfaceMiddlewareApp` (même patron que `sourceApp`/`targetApp`)
> - `openapi.yaml` mis à jour (NFR-GOV-001)

---

## 1. Objectif & Périmètre ⚠️

**Ce que cette spec fait :**

Implémenter les pages React pour la gestion des Interfaces applicatives. Une Interface représente un flux de données unidirectionnel entre une Application source et une Application cible, avec un composant de médiation optionnel (ESB, API Gateway, middleware). Le frontend expose une liste avec filtres serveur et drawer de consultation rapide read-only (PNS-02), une page détail complète, et des formulaires de création et modification avec validation du flux source→cible.

Le frontend implémente :
- **Liste avec drawer PNS-02** : clic corps de ligne → drawer read-only 400px ; clic sur noms d'applications → navigation directe
- **Représentation Source → [Middleware] → Cible** dans toutes les vues
- **Filtres serveur** : sourceApp, middlewareApp, targetApp, type, criticality
- **Formulaire** avec sélecteurs Autocomplete (GET /applications) pour source, cible et middleware, MUI Select FR pour les enums, DimensionTagInput pour les tags
- **Validation client-side RM-IF-01** : sourceApp ≠ targetApp avant toute soumission
- **CriticalityChip** réutilisé depuis `@/components/business-capabilities/`
- **StatusChip** générique pour l'affichage du type d'interface
- **Suppression libre** : pas de `DEPENDENCY_CONFLICT`, dialog de confirmation simple

**Hors périmètre :**
- Backend API — couvert par `FS-08-BACK`
- Amendment middlewareAppId — couvert par **T-042**
- Contrôle côté Application (`_count.sourceInterfaces + _count.targetInterfaces`) — couvert par **T-039**
- Endpoint `/graph` agrégé — couvert par `FS-09-BACK` / `FS-09-FRONT`
- Monitoring temps réel des métriques d'interface — P2
- Import Excel — `FS-10`

---

## 2. User Stories

### US-01 — Consultation Rapide (PNS-02)

En tant qu'Architecte Entreprise,
Je veux cliquer sur une ligne de la liste des interfaces pour ouvrir un volet latéral,
Afin de consulter les détails du flux sans perdre ma position dans la liste ni mes filtres actifs.

Critères d'acceptation :
- Clic sur n'importe quelle cellule (hors colonnes Source / Middleware / Cible / Actions) → ouvre le drawer read-only 400px
- Le drawer affiche : nom, source→[middleware]→cible, type, frequency, criticality, technicalContact, errorRate, description, comment, tags
- Footer drawer : bouton "Modifier" (disabled si `!interfaces:write`) + bouton "Voir la fiche complète"
- Clic Escape ou bouton close → ferme le drawer, liste préservée (scroll, filtres)

### US-02 — Navigation directe vers Application

En tant qu'Architecte Entreprise,
Je veux cliquer sur le nom d'une application (source, middleware, cible) pour naviguer directement vers sa fiche,
Afin d'explorer le contexte du flux sans passer par la page détail de l'interface.

Critères d'acceptation :
- Nom de l'application source affiché comme lien → `navigate('/applications/:sourceAppId')`
- Nom du middleware affiché comme lien (si présent) → `navigate('/applications/:middlewareAppId')`
- Nom de l'application cible affiché comme lien → `navigate('/applications/:targetAppId')`
- Le clic sur ces liens **ne déclenche pas** l'ouverture du drawer (`stopPropagation`)

### US-03 — Page Détail

En tant qu'Architecte Entreprise,
Je veux accéder à la fiche complète d'une interface,
Afin de consulter l'ensemble des métadonnées du flux dans une page dédiée.

Critères d'acceptation :
- Page `/interfaces/:id` affiche tous les champs : nom, source→[middleware]→cible, type, frequency, criticality, technicalContact, errorRate, description, comment, tags, createdAt, updatedAt
- Bouton "Modifier" visible si `interfaces:write`
- Bouton "Retour" → `/interfaces`
- Breadcrumb PNS-11 : Accueil / Interfaces / [nom ou "Interface sans nom"]
- `404` → `navigate('/interfaces')`

### US-04 — Création d'interface

En tant qu'Architecte Entreprise,
Je veux créer une interface entre deux applications,
Afin de documenter un flux de données dans le référentiel ARK.

Critères d'acceptation :
- Champs obligatoires : Application source, Application cible, Type
- Validation client-side : source ≠ cible avant soumission (erreur inline)
- Post-création : navigation vers `/interfaces/:id` + snackbar succès
- `422 SELF_REFERENCE` backend : erreur inline sous le champ Application cible
- `400` : erreur inline sur le champ concerné
- Bouton "Enregistrer" désactivé pendant `isLoading`

### US-05 — Modification d'interface

En tant qu'Architecte Entreprise,
Je veux modifier une interface existante,
Afin de mettre à jour les métadonnées d'un flux après évolution de l'architecture.

Critères d'acceptation :
- Formulaire pré-rempli avec les valeurs actuelles
- Même validation que la création (source ≠ cible)
- Post-modification : retour sur `/interfaces/:id` + snackbar succès
- `404` → `navigate('/interfaces')`

### US-06 — Suppression d'interface

En tant qu'Architecte Entreprise,
Je veux supprimer une interface obsolète,
Afin de maintenir la cohérence du référentiel ARK.

Critères d'acceptation :
- ConfirmDialog standard (pas de blocage DEPENDENCY_CONFLICT — suppression libre)
- Dialog : message "Êtes-vous sûr de vouloir supprimer cette interface de '{{source}}' vers '{{target}}' ?"
- Confirmation → `DELETE /interfaces/:id` → `204` → navigate('/interfaces') + snackbar succès
- Cancel → dialog fermé, interface toujours présente

### US-07 — Filtres et tri

En tant qu'Architecte Entreprise,
Je veux filtrer et trier la liste des interfaces par plusieurs critères,
Afin de retrouver rapidement les flux impliquant une application ou d'un certain type.

Critères d'acceptation :
- Filtre **Application source** : Autocomplete → `?sourceAppId=<uuid>`
- Filtre **Composant de médiation** : Autocomplete → `?middlewareAppId=<uuid>`
- Filtre **Application cible** : Autocomplete → `?targetAppId=<uuid>`
- Filtre **Type** : Select enum FR → `?type=REST`
- Filtre **Criticité** : Select enum FR → `?criticality=HIGH`
- Tous les filtres sont cumulables (AND) et envoyés côté serveur
- Bouton "Réinitialiser" remet tous les filtres à vide

---

## 3. Référence Contrat API

> Le contrat API complet est défini dans **FS-08-BACK §3**. Ne pas le redéfinir ici.
> La session OpenCode frontend doit recevoir FS-08-BACK §3 en contexte additionnel (voir commande §11).
> **T-042** enrichit ce contrat avec `middlewareAppId` / `middlewareApp` — injecter l'amendment dans le contexte de session.

Endpoints disponibles après validation de FS-08-BACK + T-042 :

| Méthode | Route | Résumé | Permission |
|---------|-------|--------|------------|
| `GET` | `/api/v1/interfaces` | Liste filtrée | `interfaces:read` |
| `POST` | `/api/v1/interfaces` | Créer | `interfaces:write` |
| `GET` | `/api/v1/interfaces/:id` | Détail | `interfaces:read` |
| `PATCH` | `/api/v1/interfaces/:id` | Modifier | `interfaces:write` |
| `DELETE` | `/api/v1/interfaces/:id` | Supprimer | `interfaces:write` |

**Query params GET /interfaces (incluant T-042) :**

| Param | Type | Filtre |
|---|---|---|
| `sourceAppId` | UUID | Application source |
| `middlewareAppId` | UUID | Composant de médiation (T-042) |
| `targetAppId` | UUID | Application cible |
| `type` | enum InterfaceType | Type d'interface |
| `criticality` | enum CriticalityLevel | Criticité |

Codes HTTP à gérer côté frontend :

| Code | Signification | Action frontend |
|------|--------------|-----------------|
| `200` / `201` | Succès | Snackbar + navigation selon contexte |
| `400` | Validation échouée | Erreur inline sur le champ concerné |
| `401` | Non authentifié | Intercepteur Axios → `/login?reason=session_expired` |
| `403` | Permission insuffisante | Intercepteur Axios → `/403` |
| `404` `INTERFACE_NOT_FOUND` | Interface introuvable | `navigate('/interfaces')` |
| `404` `APPLICATION_NOT_FOUND` | App source/cible inconnue | Erreur inline sur le champ concerné |
| `422` `SELF_REFERENCE` | Auto-liaison (source == cible) | Erreur inline sous champ Application cible |

> **Pas de `409 DEPENDENCY_CONFLICT`** — la table `interfaces` n'est référencée par aucune FK. La suppression est libre (RM-IF-04).

---

## 4. Layout Contract ⚠️

---

### 4.1 `InterfaceListPage`

```yaml
page: InterfaceListPage
route: /interfaces
auth_required: true
permission_required: interfaces:read

layout:
  shell: AppShell
  container: PageContainer
  container_props:
    maxWidth: xl

zones:
  header:
    component: PageHeader
    props:
      title: t('interfaces.list.title')
      subtitle: t('interfaces.list.subtitle')
      action:
        condition: hasPermission('interfaces:write')
        label: t('interfaces.list.addButton')
        onClick: navigate('/interfaces/new')
        icon: AddIcon

  filter_bar:
    component: Box (flex row, gap 2, mb 2, flexWrap: wrap)
    items:
      - component: Autocomplete
        props:
          options: GET /api/v1/applications (limit=200)
          getOptionLabel: option.name
          label: t('interfaces.list.filters.sourceApp')
          size: small
          sx: { minWidth: 200 }
          onChange: setFilterSourceAppId(option?.id ?? null)

      - component: Autocomplete
        props:
          options: GET /api/v1/applications (limit=200)
          getOptionLabel: option.name
          label: t('interfaces.list.filters.middlewareApp')
          size: small
          sx: { minWidth: 200 }
          onChange: setFilterMiddlewareAppId(option?.id ?? null)
          note: "(T-042 — disponible après amendment middlewareAppId)"

      - component: Autocomplete
        props:
          options: GET /api/v1/applications (limit=200)
          getOptionLabel: option.name
          label: t('interfaces.list.filters.targetApp')
          size: small
          sx: { minWidth: 200 }
          onChange: setFilterTargetAppId(option?.id ?? null)

      - component: FormControl (Select)
        props:
          label: t('interfaces.list.filters.type')
          size: small
          sx: { minWidth: 160 }
          value: filterType
          onChange: setFilterType
          items:
            - value: '' → t('common.filters.all')
            - value: 'REST' → t('interfaces.type.REST')
            - value: 'SOAP' → t('interfaces.type.SOAP')
            - value: 'FTP' → t('interfaces.type.FTP')
            - value: 'SFTP' → t('interfaces.type.SFTP')
            - value: 'DATABASE' → t('interfaces.type.DATABASE')
            - value: 'MESSAGE_QUEUE' → t('interfaces.type.MESSAGE_QUEUE')
            - value: 'BATCH_FILE' → t('interfaces.type.BATCH_FILE')
            - value: 'EVENT_STREAM' → t('interfaces.type.EVENT_STREAM')
            - value: 'GRAPHQL' → t('interfaces.type.GRAPHQL')
            - value: 'GRPC' → t('interfaces.type.GRPC')
            - value: 'OTHER' → t('interfaces.type.OTHER')

      - component: FormControl (Select)
        props:
          label: t('interfaces.list.filters.criticality')
          size: small
          sx: { minWidth: 140 }
          value: filterCriticality
          onChange: setFilterCriticality
          items:
            - value: '' → t('common.filters.all')
            - value: 'LOW' → t('interfaces.criticality.LOW')
            - value: 'MEDIUM' → t('interfaces.criticality.MEDIUM')
            - value: 'HIGH' → t('interfaces.criticality.HIGH')
            - value: 'CRITICAL' → t('interfaces.criticality.CRITICAL')

      - component: Button
        props:
          variant: outlined
          size: small
          onClick: resetFilters
          label: t('common.filters.reset')

  body:
    component: MUI Table avec TableSortLabel
    loading_state: LoadingSkeleton
    empty_state: EmptyState
    empty_state_props:
      title: t('interfaces.list.emptyState.title')
      description: t('interfaces.list.emptyState.description')
      action:
        condition: hasPermission('interfaces:write')
        label: t('interfaces.list.emptyState.cta')
        onClick: navigate('/interfaces/new')
    columns:
      - field: sourceApp
        header: t('interfaces.list.columns.source')
        sortable: true
        sort_null_behavior: null values last
        render: |
          <Link
            component="button"
            onClick={(e) => { e.stopPropagation(); navigate(`/applications/${row.sourceApp.id}`); }}
            underline="hover"
          >
            {row.sourceApp.name}
          </Link>

      - field: middlewareApp
        header: t('interfaces.list.columns.middleware')
        sortable: false
        render: |
          {row.middlewareApp ? (
            <Link
              component="button"
              onClick={(e) => { e.stopPropagation(); navigate(`/applications/${row.middlewareApp.id}`); }}
              underline="hover"
            >
              {row.middlewareApp.name}
            </Link>
          ) : (
            <Typography variant="body2" color="text.disabled">—</Typography>
          )}

      - field: targetApp
        header: t('interfaces.list.columns.target')
        sortable: true
        sort_null_behavior: null values last
        render: |
          <Link
            component="button"
            onClick={(e) => { e.stopPropagation(); navigate(`/applications/${row.targetApp.id}`); }}
            underline="hover"
          >
            {row.targetApp.name}
          </Link>

      - field: type
        header: t('interfaces.list.columns.type')
        sortable: true
        render: |
          <StatusChip
            label={t(`interfaces.type.${row.type}`)}
            color="default"
            size="small"
          />

      - field: criticality
        header: t('interfaces.list.columns.criticality')
        sortable: true
        sort_null_behavior: null values last
        render: |
          {row.criticality ? (
            <CriticalityChip level={row.criticality} size="small" />
          ) : (
            <Typography variant="body2" color="text.disabled">—</Typography>
          )}

      - field: frequency
        header: t('interfaces.list.columns.frequency')
        sortable: true
        sort_null_behavior: null values last
        render: |
          {row.frequency ? t(`interfaces.frequency.${row.frequency}`) : '—'}

      - field: actions
        header: t('interfaces.list.columns.actions')
        condition: hasPermission('interfaces:write')
        render: |
          <RowActionsMenu
            onView={() => navigate(`/interfaces/${row.id}`)}
            onEdit={() => navigate(`/interfaces/${row.id}/edit`)}
            onDelete={() => openConfirmDelete(row)}
          />

  row_click:
    trigger: clic sur td (hors colonnes sourceApp, middlewareApp, targetApp, actions)
    action: openDrawer(row.id)

  sort_state:
    default_field: sourceApp
    default_order: asc
    scope: client-side

  drawer:
    component: InterfaceDrawer
    condition: drawerOpen && selectedInterfaceId
    props:
      interfaceId: selectedInterfaceId
      onClose: closeDrawer
      onEdit: navigate(`/interfaces/${selectedInterfaceId}/edit`)
      onViewDetail: navigate(`/interfaces/${selectedInterfaceId}`)

  dialogs:
    - id: confirm-delete
      component: ConfirmDialog
      trigger: RowActionsMenu delete click
      props:
        title: t('interfaces.delete.confirmTitle')
        message: t('interfaces.delete.confirmMessage', { source: row.sourceApp.name, target: row.targetApp.name })
        confirmLabel: t('common.actions.delete')
        severity: error
      on_confirm: DELETE /api/v1/interfaces/:id
      on_success: navigate('/interfaces') + snackbar t('interfaces.snackbar.deleted')
      # Pas de on_409_DEPENDENCY_CONFLICT — suppression libre

  snackbars:
    - trigger: delete success
      message: t('interfaces.snackbar.deleted')
      severity: success
```

---

### 4.2 `InterfaceDrawer` — Side Panel Read-Only (PNS-02)

```yaml
component: InterfaceDrawer
trigger: clic corps de ligne table (hors colonnes source/middleware/cible/actions)
width: 400px
anchor: right
read_only: true (PNS-02)

on_load:
  action: GET /api/v1/interfaces/:id
  loading_state: LoadingSkeleton dans le body du drawer

zones:
  header:
    component: Box (flex, justifyContent: space-between, alignItems: center, p: 2)
    content:
      - Typography variant="h6": |
          {interface.name ?? t('interfaces.drawer.unnamedInterface')}
      - IconButton: CloseIcon (onClick: onClose)

  subtitle:
    component: Box (px: 2, pb: 1)
    content: |
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
        <Link onClick={() => navigate(`/applications/${interface.sourceAppId}`)}>
          {interface.sourceApp.name}
        </Link>
        <ArrowForwardIcon fontSize="small" color="action" />
        {interface.middlewareApp && (
          <>
            <Link onClick={() => navigate(`/applications/${interface.middlewareApp.id}`)}>
              {interface.middlewareApp.name}
            </Link>
            <ArrowForwardIcon fontSize="small" color="action" />
          </>
        )}
        <Link onClick={() => navigate(`/applications/${interface.targetAppId}`)}>
          {interface.targetApp.name}
        </Link>
      </Box>

  body:
    component: Box (sx: { flex: 1, overflow: 'auto', p: 2 })
    fields:
      - label: t('interfaces.drawer.type')
        value: |
          <StatusChip label={t(`interfaces.type.${interface.type}`)} size="small" color="default" />

      - label: t('interfaces.drawer.criticality')
        value: |
          {interface.criticality
            ? <CriticalityChip level={interface.criticality} size="small" />
            : t('interfaces.detail.noValue')}

      - label: t('interfaces.drawer.frequency')
        value: |
          {interface.frequency
            ? t(`interfaces.frequency.${interface.frequency}`)
            : t('interfaces.detail.noValue')}

      - label: t('interfaces.drawer.technicalContact')
        value: interface.technicalContact ?? t('interfaces.detail.noValue')

      - label: t('interfaces.drawer.errorRate')
        value: |
          {interface.errorRate !== null
            ? `${interface.errorRate} %`
            : t('interfaces.detail.noValue')}

      - label: t('interfaces.drawer.description')
        value: interface.description ?? t('interfaces.detail.noValue')
        render: Typography variant="body2" color="text.secondary"

      - label: t('interfaces.drawer.comment')
        value: interface.comment ?? t('interfaces.detail.noValue')
        render: Typography variant="body2" color="text.secondary"

      - label: t('interfaces.drawer.tags')
        value: |
          <TagChipList tags={interface.tags} entityType="interfaces" />

  footer:
    component: Box (sx: { p: 2, borderTop: 1, borderColor: 'divider', display: 'flex', gap: 1, justifyContent: 'flex-end' })
    buttons:
      - component: Button
        props:
          variant: outlined
          disabled: !hasPermission('interfaces:write')
          label: t('interfaces.drawer.editButton')
          onClick: onEdit

      - component: Button
        props:
          variant: text
          label: t('interfaces.drawer.viewFullButton')
          onClick: onViewDetail
```

---

### 4.3 `InterfaceDetailPage`

```yaml
page: InterfaceDetailPage
route: /interfaces/:id
auth_required: true
permission_required: interfaces:read

on_load:
  action: GET /api/v1/interfaces/:id
  on_404: navigate('/interfaces')

layout:
  shell: AppShell
  container: PageContainer
  container_props:
    maxWidth: md

zones:
  breadcrumb:
    component: AppBreadcrumbs
    items:
      - label: t('interfaces.detail.breadcrumb.home')
        onClick: navigate('/')
      - label: t('interfaces.detail.breadcrumb.list')
        onClick: navigate('/interfaces')
      - label: |
          {interface.name ?? `${interface.sourceApp.name} → ${interface.targetApp.name}`}

  header:
    component: PageHeader
    props:
      title: |
        {interface.name ?? `${interface.sourceApp.name} → ${interface.targetApp.name}`}
      subtitle: |
        {`${interface.sourceApp.name}${interface.middlewareApp ? ` → ${interface.middlewareApp.name}` : ''} → ${interface.targetApp.name}`}
      action:
        condition: hasPermission('interfaces:write')
        label: t('interfaces.detail.editButton')
        onClick: navigate('/interfaces/${interface.id}/edit')
        icon: EditIcon

  body:
    loading_state: LoadingSkeleton
    component: Paper (elevation=0, border, p: 3)
    fields:
      - label: t('interfaces.drawer.type')
        value: |
          <StatusChip label={t(`interfaces.type.${interface.type}`)} size="small" />

      - label: t('interfaces.drawer.criticality')
        value: |
          {interface.criticality ? <CriticalityChip level={interface.criticality} /> : '—'}

      - label: t('interfaces.drawer.frequency')
        value: |
          {interface.frequency ? t(`interfaces.frequency.${interface.frequency}`) : '—'}

      - label: t('interfaces.form.sourceAppLabel')
        value: |
          <Link onClick={() => navigate(`/applications/${interface.sourceAppId}`)}>
            {interface.sourceApp.name}
          </Link>

      - label: t('interfaces.form.middlewareAppLabel')
        value: |
          {interface.middlewareApp ? (
            <Link onClick={() => navigate(`/applications/${interface.middlewareApp.id}`)}>
              {interface.middlewareApp.name}
            </Link>
          ) : t('interfaces.detail.noValue')}

      - label: t('interfaces.form.targetAppLabel')
        value: |
          <Link onClick={() => navigate(`/applications/${interface.targetAppId}`)}>
            {interface.targetApp.name}
          </Link>

      - label: t('interfaces.drawer.technicalContact')
        value: interface.technicalContact ?? t('interfaces.detail.noValue')

      - label: t('interfaces.drawer.errorRate')
        value: |
          {interface.errorRate !== null ? `${interface.errorRate} %` : t('interfaces.detail.noValue')}

      - label: t('interfaces.form.descriptionLabel')
        value: interface.description ?? t('interfaces.detail.noValue')

      - label: t('interfaces.form.commentLabel')
        value: interface.comment ?? t('interfaces.detail.noValue')

      - label: t('interfaces.drawer.tags')
        value: <TagChipList tags={interface.tags} entityType="interfaces" />

      - label: t('interfaces.detail.createdAt')
        value: interface.createdAt (format date locale FR)

      - label: t('interfaces.detail.updatedAt')
        value: interface.updatedAt (format date locale FR)

  footer:
    component: Box (sx: { display: 'flex', gap: 2, mt: 3 })
    buttons:
      - component: Button
        props:
          variant: outlined
          label: t('interfaces.detail.backButton')
          onClick: navigate('/interfaces')
```

---

### 4.4 `InterfaceNewPage`

```yaml
page: InterfaceNewPage
route: /interfaces/new
auth_required: true
permission_required: interfaces:write

layout:
  shell: AppShell
  container: PageContainer
  container_props:
    maxWidth: sm

zones:
  breadcrumb:
    component: AppBreadcrumbs
    items:
      - label: t('interfaces.form.breadcrumb.home')
        onClick: navigate('/')
      - label: t('interfaces.form.breadcrumb.list')
        onClick: navigate('/interfaces')
      - label: t('interfaces.form.breadcrumb.new')

  header:
    component: PageHeader
    props:
      title: t('interfaces.form.createTitle')
      action: null

  body:
    component: InterfaceForm
    props:
      initialValues:
        sourceAppId: null
        targetAppId: null
        middlewareAppId: null
        name: ''
        type: ''
        frequency: null
        criticality: null
        technicalContact: ''
        errorRate: null
        description: ''
        comment: ''
        tagPaths: []
      isLoading: false
      error: null
      onCancel: navigate('/interfaces')
      onSubmit: POST /api/v1/interfaces

  on_submit_success:
    action: navigate('/interfaces/${createdEntity.id}')
    snackbar: t('interfaces.snackbar.created') severity=success

  on_submit_422_SELF_REFERENCE:
    action: erreur inline sous champ targetApp
    message: t('interfaces.form.selfReference')

  on_submit_404_APPLICATION_NOT_FOUND:
    action: erreur inline sous le champ sourceApp ou targetApp selon la réponse
    message: t('interfaces.form.applicationNotFound')

  on_submit_400:
    action: erreur inline sur champ type si absent

  form_rules:
    - save_button_disabled_while: isLoading === true
    - client_validation_before_submit: sourceAppId !== targetAppId (RM-IF-01)
```

---

### 4.5 `InterfaceEditPage`

```yaml
page: InterfaceEditPage
route: /interfaces/:id/edit
auth_required: true
permission_required: interfaces:write

on_load:
  action: GET /api/v1/interfaces/:id
  on_404: navigate('/interfaces')

layout:
  shell: AppShell
  container: PageContainer
  container_props:
    maxWidth: sm

zones:
  breadcrumb:
    component: AppBreadcrumbs
    items:
      - label: t('interfaces.form.breadcrumb.home')
        onClick: navigate('/')
      - label: t('interfaces.form.breadcrumb.list')
        onClick: navigate('/interfaces')
      - label: |
          {interface.name ?? `${interface.sourceApp.name} → ${interface.targetApp.name}`}
        onClick: navigate('/interfaces/${id}')
      - label: t('interfaces.form.breadcrumb.edit')

  header:
    component: PageHeader
    props:
      title: t('interfaces.form.editTitle')
      action: null

  body:
    loading_state: LoadingSkeleton
    component: InterfaceForm
    props:
      initialValues:
        sourceAppId: interface.sourceAppId
        targetAppId: interface.targetAppId
        middlewareAppId: interface.middlewareApp?.id ?? null
        name: interface.name ?? ''
        type: interface.type
        frequency: interface.frequency ?? null
        criticality: interface.criticality ?? null
        technicalContact: interface.technicalContact ?? ''
        errorRate: interface.errorRate ?? null
        description: interface.description ?? ''
        comment: interface.comment ?? ''
        tagPaths: interface.tags.map(t => t.path)
      isLoading: false
      error: null
      onCancel: navigate('/interfaces/${id}')
      onSubmit: PATCH /api/v1/interfaces/:id

  on_submit_success:
    action: navigate('/interfaces/${id}')
    snackbar: t('interfaces.snackbar.updated') severity=success

  on_submit_422_SELF_REFERENCE:
    action: erreur inline sous champ targetApp
    message: t('interfaces.form.selfReference')

  on_submit_404_APPLICATION_NOT_FOUND:
    action: erreur inline sous le champ sourceApp ou targetApp

  form_rules:
    - save_button_disabled_while: isLoading === true
    - client_validation_before_submit: sourceAppId !== targetAppId (RM-IF-01)
```

---

## 5. Composants à Générer

### Structure de fichiers

```
frontend/src/
├── pages/
│   └── interfaces/
│       ├── InterfaceListPage.tsx
│       ├── InterfaceDetailPage.tsx
│       ├── InterfaceNewPage.tsx
│       └── InterfaceEditPage.tsx
├── components/
│   └── interfaces/
│       ├── InterfaceDrawer.tsx        ← side panel PNS-02 read-only
│       └── InterfaceForm.tsx          ← formulaire new/edit
├── api/
│   └── interfaces.ts                  ← hooks React Query (useInterfaces, useInterface, useCreateInterface, useUpdateInterface, useDeleteInterface)
├── utils/
│   └── interfaces.utils.ts            ← helpers (formatInterfaceTitle, formatErrorRate)
└── types/
    └── interface.ts                   ← types TypeScript
```

> **Note `CriticalityChip`** : Ce composant est actuellement dans `frontend/src/components/business-capabilities/CriticalityChip.tsx`. Importer depuis ce chemin ou déplacer vers `@/components/shared/` selon la décision architecture. Documenter la décision dans le code avec un commentaire `// AGENT-DECISION`.

> **Note `RowActionsMenu`** : Composant partagé disponible depuis T-029 dans `@/components/shared/RowActionsMenu.tsx`.

> **Note `AppBreadcrumbs`** : Composant partagé disponible depuis T-018 dans `@/components/shared/AppBreadcrumbs.tsx`.

### Types TypeScript

```typescript
// src/types/interface.ts

export type InterfaceType =
  | 'REST' | 'SOAP' | 'FTP' | 'SFTP' | 'DATABASE'
  | 'MESSAGE_QUEUE' | 'BATCH_FILE' | 'EVENT_STREAM'
  | 'GRAPHQL' | 'GRPC' | 'OTHER';

export type InterfaceFrequency =
  | 'REALTIME' | 'NEAR_REALTIME' | 'HOURLY' | 'DAILY'
  | 'WEEKLY' | 'MONTHLY' | 'ON_DEMAND';

export type CriticalityLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface InterfaceAppRef {
  id: string;
  name: string;
}

export interface InterfaceListItem {
  id: string;
  name: string | null;
  sourceApp: InterfaceAppRef;
  targetApp: InterfaceAppRef;
  middlewareApp: InterfaceAppRef | null;  // T-042
  type: InterfaceType;
  frequency: InterfaceFrequency | null;
  criticality: CriticalityLevel | null;
  errorRate: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface InterfaceResponse {
  id: string;
  name: string | null;
  description: string | null;
  comment: string | null;
  sourceAppId: string;
  sourceApp: InterfaceAppRef;
  targetAppId: string;
  targetApp: InterfaceAppRef;
  middlewareAppId: string | null;         // T-042
  middlewareApp: InterfaceAppRef | null;  // T-042
  type: InterfaceType;
  frequency: InterfaceFrequency | null;
  criticality: CriticalityLevel | null;
  technicalContact: string | null;
  errorRate: number | null;
  tags: EntityTagResponse[];
  createdAt: string;
  updatedAt: string;
}

export interface InterfaceFormValues {
  sourceAppId: string | null;
  targetAppId: string | null;
  middlewareAppId: string | null;  // T-042
  name: string;
  type: InterfaceType | '';
  frequency: InterfaceFrequency | null;
  criticality: CriticalityLevel | null;
  technicalContact: string;
  errorRate: number | null;
  description: string;
  comment: string;
  tagPaths: string[];
}

export interface InterfaceFormProps {
  initialValues: Partial<InterfaceFormValues>;
  onSubmit: (values: InterfaceFormValues) => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
  error: string | null;
}

export interface EntityTagResponse {
  path: string;
  label: string;
}
```

### Hooks React Query

```typescript
// src/api/interfaces.ts — structure attendue

useInterfaces(filters: InterfaceFilters)    // GET /interfaces avec query params
useInterface(id: string)                    // GET /interfaces/:id
useCreateInterface()                        // POST /interfaces → mutate
useUpdateInterface(id: string)              // PATCH /interfaces/:id → mutate
useDeleteInterface()                        // DELETE /interfaces/:id → mutate

interface InterfaceFilters {
  sourceAppId?: string;
  middlewareAppId?: string;   // T-042
  targetAppId?: string;
  type?: InterfaceType;
  criticality?: CriticalityLevel;
}
```

---

## 6. Clés i18n — Section `interfaces` à ajouter dans `fr.json` ⚠️

> À ajouter **manuellement** dans `src/i18n/locales/fr.json` avant de lancer la session OpenCode.

```json
"interfaces": {
  "list": {
    "title": "Interfaces applicatives",
    "subtitle": "Flux de données entre applications",
    "addButton": "Nouvelle interface",
    "columns": {
      "source": "Application source",
      "middleware": "Composant de médiation",
      "target": "Application cible",
      "type": "Type",
      "criticality": "Criticité",
      "frequency": "Fréquence",
      "actions": "Actions"
    },
    "filters": {
      "sourceApp": "Application source",
      "middlewareApp": "Composant de médiation",
      "targetApp": "Application cible",
      "type": "Type d'interface",
      "criticality": "Criticité"
    },
    "emptyState": {
      "title": "Aucune interface créée",
      "description": "Commencez par documenter vos premiers flux entre applications.",
      "cta": "Créer une interface"
    }
  },
  "detail": {
    "noValue": "—",
    "editButton": "Modifier",
    "backButton": "Retour",
    "createdAt": "Créé le",
    "updatedAt": "Modifié le",
    "breadcrumb": {
      "home": "Accueil",
      "list": "Interfaces"
    }
  },
  "drawer": {
    "unnamedInterface": "Interface sans nom",
    "type": "Type",
    "criticality": "Criticité",
    "frequency": "Fréquence",
    "technicalContact": "Contact technique",
    "errorRate": "Taux d'erreur",
    "description": "Description",
    "comment": "Commentaire",
    "tags": "Tags",
    "editButton": "Modifier",
    "viewFullButton": "Voir la fiche complète"
  },
  "form": {
    "createTitle": "Nouvelle interface",
    "editTitle": "Modifier l'interface",
    "sourceAppLabel": "Application source",
    "sourceAppRequired": "L'application source est obligatoire",
    "targetAppLabel": "Application cible",
    "targetAppRequired": "L'application cible est obligatoire",
    "middlewareAppLabel": "Composant de médiation",
    "middlewareAppPlaceholder": "ESB, API Gateway... (optionnel)",
    "nameLabel": "Nom",
    "namePlaceholder": "ex : CRM → ERP commandes (optionnel)",
    "typeLabel": "Type d'interface",
    "typeRequired": "Le type est obligatoire",
    "frequencyLabel": "Fréquence",
    "criticalityLabel": "Criticité",
    "technicalContactLabel": "Contact technique",
    "technicalContactPlaceholder": "Nom, email ou alias (texte libre)",
    "errorRateLabel": "Taux d'erreur (%)",
    "errorRatePlaceholder": "0 – 100",
    "descriptionLabel": "Description",
    "commentLabel": "Commentaire",
    "tagsLabel": "Tags dimensionnels",
    "saveButton": "Enregistrer",
    "cancelButton": "Annuler",
    "selfReference": "L'application source et l'application cible doivent être différentes",
    "applicationNotFound": "Application introuvable",
    "breadcrumb": {
      "home": "Accueil",
      "list": "Interfaces",
      "new": "Nouvelle interface",
      "edit": "Modifier"
    }
  },
  "type": {
    "REST": "REST",
    "SOAP": "SOAP",
    "FTP": "FTP",
    "SFTP": "SFTP",
    "DATABASE": "Base de données",
    "MESSAGE_QUEUE": "File de messages",
    "BATCH_FILE": "Fichier batch",
    "EVENT_STREAM": "Flux d'événements",
    "GRAPHQL": "GraphQL",
    "GRPC": "gRPC",
    "OTHER": "Autre"
  },
  "frequency": {
    "REALTIME": "Temps réel",
    "NEAR_REALTIME": "Quasi temps réel",
    "HOURLY": "Horaire",
    "DAILY": "Quotidien",
    "WEEKLY": "Hebdomadaire",
    "MONTHLY": "Mensuel",
    "ON_DEMAND": "À la demande"
  },
  "criticality": {
    "LOW": "Faible",
    "MEDIUM": "Moyenne",
    "HIGH": "Haute",
    "CRITICAL": "Critique"
  },
  "delete": {
    "confirmTitle": "Supprimer l'interface",
    "confirmMessage": "Êtes-vous sûr de vouloir supprimer l'interface de \"{{source}}\" vers \"{{target}}\" ?"
  },
  "snackbar": {
    "created": "Interface créée avec succès",
    "updated": "Interface mise à jour avec succès",
    "deleted": "Interface supprimée avec succès"
  }
}
```

> **Note criticality keys :** Les clés `interfaces.criticality.*` sont redondantes avec `businessCapabilities.criticality.*`. Si `CriticalityChip` est migré vers `shared/` et paramétré via i18n, une seule section suffit. En attendant cette migration, définir les deux sections pour être auto-portant.

---

## 7. Règles Métier Frontend ⚠️

- **RM-IF-01 — Validation auto-liaison (client-side) :**

  Avant toute soumission, vérifier que `sourceAppId !== targetAppId`. Si égaux, afficher une erreur inline sous le champ `targetApp` sans appel API.

  ```typescript
  // Dans InterfaceForm.tsx
  const handleSubmit = async (values: InterfaceFormValues) => {
    if (values.sourceAppId && values.targetAppId && values.sourceAppId === values.targetAppId) {
      setFieldError('targetAppId', t('interfaces.form.selfReference'));
      return;
    }
    await onSubmit(values);
  };
  ```

  Si le backend retourne malgré tout `422 SELF_REFERENCE`, afficher la même erreur inline (double protection).

- **RM-IF-02 — Filtres server-side :**

  Tous les filtres (sourceAppId, middlewareAppId, targetAppId, type, criticality) sont envoyés comme query params à l'API. Pas de filtrage client-side sur la liste principale. Chaque changement de filtre déclenche un nouvel appel API.

  ```typescript
  // Paramètres envoyés uniquement si non-nuls
  const filters: InterfaceFilters = {
    ...(sourceAppId && { sourceAppId }),
    ...(middlewareAppId && { middlewareAppId }),
    ...(targetAppId && { targetAppId }),
    ...(type && { type }),
    ...(criticality && { criticality }),
  };
  ```

- **RM-IF-03 — Masquage conditionnel des actions d'écriture :**

  ```typescript
  const canWrite = hasPermission('interfaces:write'); // import depuis @/store/auth
  ```

  Bouton "Nouvelle interface" masqué si `!canWrite`. Colonne "Actions" masquée si `!canWrite`. Bouton "Modifier" dans drawer/détail disabled si `!canWrite`.

- **RM-IF-04 — Suppression libre (pas de DEPENDENCY_CONFLICT) :**

  `ConfirmDialog` standard sans gestion de `409`. Si le backend retourne une erreur inattendue, afficher une snackbar d'erreur générique. **Ne pas désactiver le bouton Confirmer** (contrairement au pattern Data Objects).

  > **Note :** L'amendment T-039 (contrôle `_count.sourceInterfaces + _count.targetInterfaces` côté FS-06-BACK avant suppression d'une Application) est indépendant de cette feature. La suppression d'une **interface** reste libre — c'est la suppression d'une **application liée à des interfaces** qui sera bloquée (T-039).

- **RM-IF-05 — Affichage du taux d'erreur :**

  ```typescript
  // Afficher avec suffixe "%", arrondi à 2 décimales
  const displayErrorRate = (rate: number | null): string => {
    if (rate === null) return t('interfaces.detail.noValue');
    return `${Number(rate).toFixed(2)} %`;
  };
  ```

- **RM-IF-06 — Représentation Source → [Middleware] → Cible :**

  La chaîne source→[middleware]→cible est le "titre" naturel d'une interface (le champ `name` est optionnel). Utiliser cette représentation comme fallback dans les titres de pages, labels de breadcrumb et sous-titres.

  ```typescript
  // src/utils/interfaces.utils.ts
  export function formatInterfaceTitle(iface: {
    name: string | null;
    sourceApp: { name: string };
    middlewareApp: { name: string } | null;
    targetApp: { name: string };
  }): string {
    if (iface.name) return iface.name;
    const parts = [iface.sourceApp.name];
    if (iface.middlewareApp) parts.push(iface.middlewareApp.name);
    parts.push(iface.targetApp.name);
    return parts.join(' → ');
  }
  ```

- **RM-IF-07 — CriticalityChip :**

  Réutiliser `CriticalityChip` depuis `@/components/business-capabilities/CriticalityChip.tsx`.
  Ajouter le commentaire `// AGENT-DECISION: front — CriticalityChip importé depuis business-capabilities/ en attendant migration vers shared/ (post-MVP)`.

- **RM-IF-08 — Tri des colonnes côté client :**

  ```typescript
  type SortField = 'sourceApp' | 'targetApp' | 'type' | 'criticality' | 'frequency' | 'createdAt';
  type SortOrder = 'asc' | 'desc';
  ```

  Valeurs `null` classées **en dernier** quelle que soit la direction de tri.

- **RM-IF-09 — Sélecteurs Application (source, cible, middleware) :**

  Les trois Autocomplete chargent `GET /api/v1/applications?limit=200`. Aucune exclusion client-side n'est requise (la validation source ≠ cible est gérée par RM-IF-01). Si le projet a plus de 200 applications, basculer vers un Autocomplete avec recherche server-side.

---

## 8. Câblage App.tsx — Manuel ⚠️

> À réaliser **manuellement** avant de lancer la session OpenCode.
> OpenCode ne génère pas ce fichier. Patron de référence : `FS-07-FRONT §8`.

```typescript
// App.tsx — routes Interfaces à ajouter

// Lecture : token requis
<Route path="/interfaces" element={<PrivateRoute />}>
  <Route index element={<InterfaceListPage />} />
  <Route path=":id" element={<InterfaceDetailPage />} />
</Route>

// Écriture : token + permission interfaces:write
<Route path="/interfaces" element={<PrivateRoute permission="interfaces:write" />}>
  <Route path="new" element={<InterfaceNewPage />} />
  <Route path=":id/edit" element={<InterfaceEditPage />} />
</Route>
```

> **Sidebar AppShell :** Ajouter l'entrée Interfaces dans la liste de navigation : label `t('interfaces.list.title')`, icon `CompareArrowsIcon` (ou `SwapHorizIcon`), href `/interfaces`.

---

## 9. Session Gate — Frontend ⚠️

> Prérequis à valider **avant** de lancer la session OpenCode et de passer cette spec à `stable`.

- [ ] **FS-08-BACK au statut `done`** — gates G-01 à G-11 toutes cochées ✅
- [ ] **T-042 amendment `middlewareAppId` au statut `done`** — `middlewareApp` présent dans les réponses API, filtre `middlewareAppId` accepté
- [ ] **API testée manuellement** — `GET /interfaces` retourne `middlewareApp` (nullable), filtre `middlewareAppId` fonctionne
- [ ] **F-02 au statut `done`** — `useTranslation()` disponible ✅
- [ ] **F-03 au statut `done`** — `DimensionTagInput` et `TagChipList` disponibles ✅
- [ ] **Clés `interfaces.*` ajoutées dans `fr.json`** (§6 de cette spec)
- [ ] **`hasPermission()` exporté depuis `@/store/auth`** (FS-01) ✅
- [ ] **Câblage `App.tsx` réalisé manuellement** (§8 de cette spec)
- [ ] **Entrée Sidebar Interfaces ajoutée manuellement** dans `AppShell`
- [ ] **`CriticalityChip` accessible** depuis `@/components/business-capabilities/CriticalityChip.tsx` ✅
- [ ] **`RowActionsMenu` accessible** depuis `@/components/shared/RowActionsMenu.tsx` ✅
- [ ] **`AppBreadcrumbs` accessible** depuis `@/components/shared/AppBreadcrumbs.tsx` ✅
- [ ] **Layout Contract §4 relu** — un bloc par page, aucun composant F-01 manquant
- [ ] **FS-08-FRONT passé au statut `stable`** avant de lancer OpenCode

---

## 10. Tests Playwright — E2E UI ⚠️

> À remplir exhaustivement dans la session QA dédiée (agent `qa`).
> OpenCode frontend ne génère PAS les tests Playwright UI — délégué à l'agent QA.

### Parcours nominaux

- [ ] `[Playwright]` `InterfaceListPage` affiche la liste après login (colonnes source, middleware, cible, type, criticité, fréquence)
- [ ] `[Playwright]` `InterfaceListPage` affiche `EmptyState` si aucune interface
- [ ] `[Playwright]` Clic sur corps de ligne (hors colonnes app) → drawer s'ouvre avec les détails
- [ ] `[Playwright]` Drawer affiche la chaîne source→[middleware]→cible avec liens cliquables
- [ ] `[Playwright]` Clic sur lien application source dans la liste → navigate vers `/applications/:id`
- [ ] `[Playwright]` Clic sur lien application cible dans la liste → navigate vers `/applications/:id`
- [ ] `[Playwright]` Clic Escape → drawer fermé, liste inchangée
- [ ] `[Playwright]` Filtre sourceApp → liste filtrée côté serveur
- [ ] `[Playwright]` Filtre middlewareApp → liste filtrée côté serveur (T-042)
- [ ] `[Playwright]` Filtre type → liste filtrée côté serveur
- [ ] `[Playwright]` Filtre criticality → liste filtrée côté serveur
- [ ] `[Playwright]` Bouton Réinitialiser → tous les filtres vidés
- [ ] `[Playwright]` `InterfaceDetailPage` affiche tous les champs (y compris middleware si présent)
- [ ] `[Playwright]` Créer une interface valide → redirect `/interfaces/:id` + snackbar succès
- [ ] `[Playwright]` Créer sans sourceApp → bouton Enregistrer disabled ou erreur inline
- [ ] `[Playwright]` Créer sans targetApp → erreur inline
- [ ] `[Playwright]` Créer sans type → erreur inline
- [ ] `[Playwright]` Créer avec sourceApp == targetApp → erreur inline (RM-IF-01)
- [ ] `[Playwright]` Modifier une interface → retour détail + snackbar succès
- [ ] `[Playwright]` Supprimer une interface → dialog confirmation → succès → disparaît de la liste + snackbar

### Parcours d'erreur

- [ ] `[Playwright]` `422 SELF_REFERENCE` backend → erreur inline sous targetApp
- [ ] `[Playwright]` `InterfaceEditPage` UUID inexistant → redirect `/interfaces`
- [ ] `[Playwright]` `InterfaceDetailPage` UUID inexistant → redirect `/interfaces`

### Droits UI

- [ ] `[Playwright]` Sans `interfaces:write` → bouton "Nouvelle interface" absent
- [ ] `[Playwright]` Sans `interfaces:write` → colonne "Actions" absente dans la liste
- [ ] `[Playwright]` Sans `interfaces:write` → bouton "Modifier" disabled dans drawer + détail
- [ ] `[Manuel]` Sans `interfaces:write` → `/interfaces/new` redirige vers `/403`
- [ ] `[Manuel]` Sans `interfaces:write` → `/interfaces/:id/edit` redirige vers `/403`

---

## 11. Commande OpenCode — Frontend ⚠️

> Copier-coller intégralement en début de session OpenCode.
> Ajouter le contenu de FS-08-BACK §3 (Contrat API) + amendment T-042 à la suite.

```
Contexte projet ARK — Session Frontend FS-08-FRONT :

Stack : React 18 + Vite + TypeScript strict + MUI v9 + react-i18next
Règles MUI obligatoires :
- MUI v9 UNIQUEMENT — pas de Tailwind, pas de styled-components
- Styling : sx prop uniquement — jamais de styled()
- Inputs : variant="outlined" systématiquement sur tous les TextField
- Pas de MUI X DataGrid — utiliser MUI Table + TableSortLabel

i18n :
- Toute string visible via t('clé') — JAMAIS de string en dur dans les composants
- Hook : const { t } = useTranslation()
- Fichier source : src/i18n/locales/fr.json — clés interfaces.* déjà présentes
- Enums traduits via t('interfaces.type.REST'), t('interfaces.frequency.DAILY'), etc.

RBAC frontend :
- hasPermission() importé depuis @/store/auth
- Vérifier avant TOUT rendu d'action d'écriture (bouton, icône, colonne)
- Jamais d'action d'écriture affichée inconditionnellement

Composants F-01 OBLIGATOIRES — ne jamais réinventer :
  import { PageHeader, ConfirmDialog, EmptyState, LoadingSkeleton, StatusChip, AppBreadcrumbs, RowActionsMenu } from '@/components/shared'
  import { AppShell, PageContainer } from '@/components/layout'

  - AppShell      : wrapper racine — toujours présent
  - PageContainer : wrapper de contenu (maxWidth selon page)
  - PageHeader    : TOUT titre de page + action principale — jamais Box+Typography custom
  - ConfirmDialog : suppression — pas de DEPENDENCY_CONFLICT (suppression libre)
  - EmptyState    : liste vide — jamais de Typography inline
  - LoadingSkeleton : état de chargement — jamais de CircularProgress spinner
  - AppBreadcrumbs : breadcrumb PNS-11 sur toutes les pages
  - RowActionsMenu : actions par ligne (Voir / Modifier / Supprimer)
  - StatusChip    : affichage du type d'interface (label FR via i18n, color="default")

Composant CriticalityChip (FS-07) :
  import { CriticalityChip } from '@/components/business-capabilities/CriticalityChip'
  // AGENT-DECISION: front — importé depuis business-capabilities/ en attendant migration vers shared/
  Utiliser pour afficher la criticality (LOW/MEDIUM/HIGH/CRITICAL) avec coloration sémantique.

Composants F-03 OBLIGATOIRES :
  import { DimensionTagInput, TagChipList } from '@/components/tags'
  - DimensionTagInput : édition tags en formulaire (champ tagPaths)
  - TagChipList      : affichage tags (drawer, détail) avec deduplicateByDepth()

JWT : token en mémoire uniquement — jamais sessionStorage / localStorage
Routing : react-router-dom v6, navigate() depuis useNavigate()
Câblage App.tsx : déjà réalisé manuellement — ne pas générer

Spécificités FS-08-FRONT :
- PNS-02 Drawer : clic corps de ligne (hors colonnes sourceApp / middlewareApp / targetApp / actions) → InterfaceDrawer read-only
- Clic sur noms d'application (source/middleware/cible) dans la liste → navigate vers /applications/:id + stopPropagation (ne déclenche PAS le drawer)
- Représentation "source → [middleware] → cible" : formatInterfaceTitle() dans interfaces.utils.ts
- RM-IF-01 : valider sourceAppId !== targetAppId côté client AVANT toute soumission (erreur inline sous champ targetApp)
- Filtres serveur : sourceAppId + middlewareAppId + targetAppId + type + criticality — tous via query params API
- Sélecteurs Application : Autocomplete MUI avec GET /api/v1/applications?limit=200
- Enums formulaire : MUI Select avec labels FR depuis i18n (t('interfaces.type.REST'), etc.)
- Suppression libre : ConfirmDialog simple — PAS de gestion DEPENDENCY_CONFLICT
- CriticalityLevel enum : LOW / MEDIUM / HIGH / CRITICAL
- InterfaceType enum : REST / SOAP / FTP / SFTP / DATABASE / MESSAGE_QUEUE / BATCH_FILE / EVENT_STREAM / GRAPHQL / GRPC / OTHER
- InterfaceFrequency enum : REALTIME / NEAR_REALTIME / HOURLY / DAILY / WEEKLY / MONTHLY / ON_DEMAND
- Taux d'erreur : NumberField 0–100, affiché avec suffixe "%"
- technicalContact : TextField texte libre (pas de validation, pas d'Autocomplete users)

Pattern de référence frontend : module Data Objects (FS-05-FRONT) pour le drawer PNS-02 et les filtres avancés.

Respecte impérativement le Layout Contract §4 de cette spec :
- Composant F-01 exact par zone
- Clé i18n exacte par label
- Condition RBAC exacte par action

Implémente la feature "Interfaces" frontend (FS-08-FRONT).
Génère : 4 pages React, InterfaceDrawer, InterfaceForm, interfaces.ts (API hooks), interfaces.utils.ts, interface.ts (types), tests Playwright nominaux.
Ne génère PAS le câblage App.tsx — déjà fait manuellement.
Ne génère PAS les tests marqués [Manuel].
Ne fais aucune hypothèse non documentée. Si un point est ambigu, pose une question avant de coder.

[COLLER LE CONTENU COMPLET DE FS-08-Interfaces-front.md ICI]
[COLLER LE CONTENU DE FS-08-BACK §3 (Contrat API OpenAPI) ICI]
[COLLER L'AMENDMENT T-042 (middlewareAppId) : migration Prisma + DTOs + filtre GET ICI]
```

---

## 12. Checklist de Validation Frontend

> À compléter après génération OpenCode, avant de passer FS-08-FRONT à `done`.

- [ ] Les 4 routes `/interfaces/*` fonctionnent depuis App.tsx
- [ ] `PageHeader` utilisé sur toutes les pages — aucun Box+Typography en remplacement
- [ ] `AppBreadcrumbs` présent sur toutes les pages (PNS-11)
- [ ] `ConfirmDialog` utilisé pour la suppression — aucun dialog inline
- [ ] `EmptyState` affiché sur liste vide
- [ ] `LoadingSkeleton` affiché pendant les appels API
- [ ] Bouton "Nouvelle interface" masqué si `!interfaces:write`
- [ ] Colonne "Actions" masquée si `!interfaces:write`
- [ ] Bouton "Modifier" disabled dans drawer si `!interfaces:write`
- [ ] Drawer PNS-02 : clic corps de ligne ouvre le drawer
- [ ] Clic sur noms d'applications (source/middleware/cible) → navigate sans ouvrir drawer
- [ ] Chaîne source→[middleware]→cible correctement affichée (middleware optionnel)
- [ ] RM-IF-01 : saisir même app en source et cible → erreur inline avant soumission
- [ ] Filtres serveur fonctionnels (sourceApp, middlewareApp, targetApp, type, criticality)
- [ ] Bouton Réinitialiser vide tous les filtres
- [ ] Tri des colonnes fonctionnel — nulls en dernier
- [ ] Enums affichés avec labels FR (via `t('interfaces.type.*')` et `t('interfaces.frequency.*')`)
- [ ] `CriticalityChip` affiché pour la criticality nullable (absent si `null`)
- [ ] `StatusChip` affiché pour le type d'interface
- [ ] `DimensionTagInput` fonctionnel dans le formulaire
- [ ] `TagChipList` affiché dans drawer et page détail
- [ ] Taux d'erreur affiché avec suffixe "%"
- [ ] Snackbar succès après create / update / delete
- [ ] Aucune string en dur dans les composants
- [ ] Aucune erreur TypeScript strict (`npm run build` → 0 error)
- [ ] Tests Playwright nominaux passent

---

## 13. Revue de Dette Technique *(gate de fin de sprint — obligatoire)* ⚠️

### Gates TD

| # | Vérification | Commande / Action |
|---|---|---|
| TD-1 | Aucun `TODO / FIXME / HACK` non tracé dans le code livré | `git grep -n "TODO\|FIXME\|HACK" -- '*.tsx'` |
| TD-2 | Items F-999 activés par cette feature : statut mis à jour | Relire F-999 §2 — Item 24 (T-039 amendment FS-06) |
| TD-3 | CriticalityChip toujours dans `business-capabilities/` — créer Item F-999 pour migration vers `shared/` si applicable | Jugement |
| TD-4 | AGENTS.md : aucun pattern nouveau non documenté introduit | Relire AGENTS.md |
| TD-5 | ARK-NFR.md : NFR impactés mis à jour | ARK-NFR.md |
| TD-6 | Nouvelles décisions transverses → nouvel Item F-999 créé si applicable | Jugement |

### Résultat de la Revue

| Champ | Valeur |
|---|---|
| **Sprint** | Sprint 4 |
| **Date de revue** | *(à renseigner après session)* |
| **Items F-999 fermés** | *(à renseigner)* |
| **Items F-999 ouverts** | *(à renseigner)* |
| **Nouveaux items F-999 créés** | *(à renseigner)* |
| **NFR mis à jour** | *(à renseigner)* |
| **TODOs résiduels tracés** | *(à renseigner)* |
| **Statut gates TD** | *(à renseigner)* |

---

_FS-08-FRONT v0.1 — Projet ARK — Sprint 4_
